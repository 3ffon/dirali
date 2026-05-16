const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const whatsapp = require('./whatsapp');
const { Apartment, Answer, Image } = require('../models');
const questions = require('../questions.json');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const uploadsDir = path.join(__dirname, '..', 'uploads');

const allQuestions = questions.categories.flatMap(cat =>
  cat.questions.map(q => ({ ...q, category: cat.id }))
);

const SYSTEM_PROMPT = `You are an assistant that extracts apartment listing data from WhatsApp messages between a user and a real estate broker. The messages are in Hebrew.

You need to extract two things:

1. Basic apartment fields:
{
  "address": "Full address (street + number + city)",
  "neighborhood": "Neighborhood name if mentioned",
  "asking_price": number in ILS (plain number, e.g. 2500000),
  "notes": "Summary of key details not covered by questions below"
}

2. Answers to specific questions. For each question you can find an answer to in the messages, provide an entry. Here are all the questions (by ID):

${allQuestions.map(q => `- "${q.id}" (${q.answer_type}): ${q.question_he}`).join('\n')}

For answer_type:
- "text": answer as a string
- "number": answer as a number
- "boolean": true or false
- "boolean_with_notes": { "value": true/false, "notes": "explanation" }
- "multi_select": array of selected options (e.g. ["צפון", "מערב"])
- "rating_1_5": number 1-5
- "checkbox": true if confirmed

Return ONLY valid JSON in this format:
{
  "apartment": {
    "address": "...",
    "neighborhood": "...",
    "asking_price": ...,
    "notes": "..."
  },
  "answers": {
    "question_id": value,
    "another_question_id": { "value": true, "notes": "..." },
    ...
  }
}

Rules:
- Only extract information explicitly stated or clearly implied in the messages
- Do not invent or guess data
- Skip questions that have no answer in the messages
- For boolean_with_notes, include notes only if there's relevant detail
- Return valid JSON only, no markdown fences or explanation`;

async function parseMessages(messages, brokerId) {
  const content = [];
  const imageBuffers = [];

  for (const msg of messages) {
    if (msg.body) {
      content.push({
        type: 'text',
        text: `[${msg.fromMe ? 'Me' : 'Broker'}]: ${msg.body}`,
      });
    }

    if (msg.hasMedia) {
      try {
        const media = await whatsapp.downloadMedia(msg.id);
        if (media && media.mimetype.startsWith('image/')) {
          imageBuffers.push({ data: media.data, mimetype: media.mimetype });
        }
      } catch (err) {
        console.log('[Parser] Could not download media for', msg.id, err.message);
      }
    }
  }

  if (content.length === 0) {
    throw new Error('No content to parse');
  }

  console.log(`[Parser] Sending ${content.length} content blocks to Claude (${imageBuffers.length} images)`);
  console.log('System prompt:', SYSTEM_PROMPT);
  console.log('User content:', JSON.stringify(content, null, 2));
  
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text = response.content[0].text;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error('Failed to parse LLM response as JSON');
  }

  console.log('[Parser] Claude extracted:', JSON.stringify(parsed, null, 2));

  const apartment = await Apartment.create({
    address: parsed.apartment?.address || 'כתובת לא ידועה',
    neighborhood: parsed.apartment?.neighborhood || null,
    asking_price: parsed.apartment?.asking_price || null,
    notes: parsed.apartment?.notes || null,
    broker_id: brokerId,
  });

  if (parsed.answers) {
    const answerRecords = [];
    for (const [questionId, rawValue] of Object.entries(parsed.answers)) {
      let value, notes;
      if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        value = JSON.stringify(rawValue.value ?? rawValue);
        notes = rawValue.notes || null;
      } else {
        value = JSON.stringify(rawValue);
        notes = null;
      }
      answerRecords.push({
        apartment_id: apartment.id,
        question_id: questionId,
        value,
        notes,
      });
    }
    if (answerRecords.length > 0) {
      await Answer.bulkCreate(answerRecords);
      console.log(`[Parser] Created ${answerRecords.length} answers`);
    }
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const img of imageBuffers) {
    const ext = img.mimetype === 'image/png' ? '.png' : '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(img.data, 'base64'));
    await Image.create({
      apartment_id: apartment.id,
      filename,
      original_name: `whatsapp_image${ext}`,
      mime_type: img.mimetype,
    });
  }

  if (imageBuffers.length > 0) {
    console.log(`[Parser] Saved ${imageBuffers.length} images`);
  }

  return apartment;
}

module.exports = { parseMessages };
