---
assignee: unassigned
tags: []
priority: Medium
effort: S
implementationLink: ''
subtasks: []
history:
  - type: activity
    user: Guy
    date: '2026-05-24T22:35:33.239Z'
    comment: Created ticket.
  - type: agent_session
    sessionId: a11d77a5-2ded-4d92-9747-528ac7fed481
    startedAt: '2026-05-24T22:35:38.599Z'
    status: completed
    progress:
      - timestamp: '2026-05-24T22:35:49.330Z'
        message: Reading FLUX-1.md
        type: tool
        data:
          toolName: Read
          parameters:
            file_path: /Users/amittriffon/mazki/dira-li/.flux/FLUX-1.md
      - timestamp: '2026-05-24T22:35:52.425Z'
        message: Delegating
        type: tool
        data:
          toolName: Agent
          parameters:
            subagent_type: Explore
            description: Find apartment form page
            prompt: >-
              In /Users/amittriffon/mazki/dira-li, find the apartment form page
              that displays questions. I need to understand:

              1. Where the form page component is (likely in client/src/pages/)

              2. How questions are rendered (categories, filtering, structure)

              3. Where questions.json is and what its structure looks like


              Search breadth: medium. Report file paths, key component names,
              and how questions are organized.
      - timestamp: '2026-05-24T22:35:53.637Z'
        message: Delegating
        type: info
      - timestamp: '2026-05-24T22:35:53.898Z'
        message: Working
        type: tool
        data:
          toolName: Glob
          parameters:
            pattern: '**/client/src/pages/**'
      - timestamp: '2026-05-24T22:35:56.867Z'
        message: Reading ApartmentFormPage.jsx
        type: tool
        data:
          toolName: Read
          parameters:
            file_path: >-
              /Users/amittriffon/mazki/dira-li/client/src/pages/ApartmentFormPage.jsx
      - timestamp: '2026-05-24T22:35:57.420Z'
        message: Working
        type: tool
        data:
          toolName: Glob
          parameters:
            pattern: '**/client/src/**/*[Qq]uestion*'
      - timestamp: '2026-05-24T22:35:59.679Z'
        message: Reading QuestionField.jsx
        type: tool
        data:
          toolName: Read
          parameters:
            file_path: >-
              /Users/amittriffon/mazki/dira-li/client/src/components/QuestionField.jsx
      - timestamp: '2026-05-24T22:36:00.106Z'
        message: 'Running: find /Users/amittriffon/mazki/dira-li/client/src -...'
        type: tool
        data:
          toolName: Bash
          parameters:
            command: >-
              find /Users/amittriffon/mazki/dira-li/client/src -type f -name
              "*.jsx" -o -name "*.js" | grep -i api | head -20
      - timestamp: '2026-05-24T22:36:02.413Z'
        message: Reading api.js
        type: tool
        data:
          toolName: Read
          parameters:
            file_path: /Users/amittriffon/mazki/dira-li/client/src/api.js
      - timestamp: '2026-05-24T22:36:08.641Z'
        message: Reading
        type: info
      - timestamp: '2026-05-24T22:36:17.098Z'
        message: Working
        type: tool
        data:
          toolName: Glob
          parameters:
            pattern: .flux/**
            path: /Users/amittriffon/mazki/dira-li
      - timestamp: '2026-05-24T22:36:20.643Z'
        message: Reading ApartmentFormPage.jsx
        type: tool
        data:
          toolName: Read
          parameters:
            file_path: >-
              /Users/amittriffon/mazki/dira-li/client/src/pages/ApartmentFormPage.jsx
            limit: 50
      - timestamp: '2026-05-24T22:36:23.643Z'
        message: Reading
        type: info
      - timestamp: '2026-05-24T22:36:27.087Z'
        message: 'Running: mkdir -p /Users/amittriffon/mazki/dira-li/.flux'
        type: tool
        data:
          toolName: Bash
          parameters:
            command: mkdir -p /Users/amittriffon/mazki/dira-li/.flux
            description: Create .flux directory for ticket
      - timestamp: '2026-05-24T22:36:38.644Z'
        message: Running command
        type: info
      - timestamp: '2026-05-24T22:36:41.531Z'
        message: Writing FLUX-1.md
        type: tool
        data:
          toolName: Write
          parameters:
            file_path: /Users/amittriffon/mazki/dira-li/.flux/FLUX-1.md
            content: >
              ---

              id: FLUX-1

              title: Support a filter for questions

              status: Todo

              priority: Medium

              effort: S

              tags:
                - ui
                - form
              assignee: unassigned

              createdBy: Guy

              updatedBy: Agent

              history:
                - type: comment
                  user: Guy
                  date: '2026-05-24T22:35:33.239Z'
                  comment: Created ticket.
                - type: comment
                  user: Agent
                  date: '2026-05-25T13:42:18.331Z'
                  comment: >-
                    Groomed ticket. Small scope — single search input that filters the existing
                    questions list by Hebrew text match. No new dependencies needed.
                - type: status_change
                  from: Grooming
                  to: Todo
                  user: Agent
                  date: '2026-05-25T13:42:18.331Z'
              ---


              ## Problem / Motivation


              The apartment form page displays ~59 questions across 10
              categories. When revisiting a form to update a specific answer,
              users must scroll through the entire list to find the relevant
              question. A visible search bar lets users quickly locate and jump
              to the question they need.


              ## Implementation Plan


              1. **Add search state** in `ApartmentFormPage.jsx` — a
              `searchQuery` string state variable.


              2. **Render a search input** below the sub-header (the metadata
              section) but above the first category section. Style it as a
              sticky/fixed bar so it remains accessible while scrolling. Use a
              simple `<input type="search">` with Hebrew placeholder text (e.g.
              "חיפוש שאלה..."), RTL aligned.


              3. **Filter logic** — when `searchQuery` is non-empty, filter
              `questions.categories` to:
                 - Only show categories that have at least one matching question.
                 - Within each shown category, only render questions whose `question_he` text includes the search query (case-insensitive substring match).
                 - When query is empty, show all categories/questions as today.

              4. **UX details**:
                 - Include a clear (X) button inside the search input to reset the filter.
                 - No debounce needed — the list is small enough for immediate filtering.
                 - Keep the search bar always visible (not collapsed behind a toggle).

              5. **Styling** — add styles in `index.css` for the search input,
              matching the existing form design language (border-radius,
              padding, RTL direction).
      - timestamp: '2026-05-24T22:36:45.465Z'
        message: >-
          Groomed FLUX-1 and moved it to **Todo**. Summary:


          - **Priority:** Medium | **Effort:** S | **Tags:** ui, form

          - **Plan:** Add a search input below the metadata section in
          `ApartmentFormPage.jsx` that filters the question categories by
          substring match on `question_he`. Small scope — one state variable,
          one input, one filter over the existing categories loop. No new
          dependencies.
    user: Claude Code
    date: '2026-05-24T22:35:38.599Z'
    outcome: Claude Code session ended with code 0.
    endedAt: '2026-05-24T22:36:45.465Z'
  - type: agent_session
    sessionId: 1b8eb0c4-88a1-43f3-bcbe-5df70ef4641e
    startedAt: '2026-05-24T22:40:02.328Z'
    status: active
    progress: []
    user: Claude Code
    date: '2026-05-24T22:40:02.328Z'
id: FLUX-1
title: Support a filter for questions
status: Grooming
createdBy: Guy
updatedBy: Agent
tokenMetadata:
  inputTokens: 175098
  outputTokens: 1735
  costUSD: 0.341469
  costIsEstimated: false
  cacheReadTokens: 148304
  cacheCreationTokens: 26785
---
On the apartment form page, we have many possible questions  
add a search-bar, always visible on top, but under the sub-header, which filter for the correct questions based on the query
