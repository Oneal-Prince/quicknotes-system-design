# QuickNotes System Design

QuickNotes is a learning project that combines a small browser-based notes API client with REST API documentation, a relational data model, and a scalable system architecture proposal.

## Features

- Load up to 10 sample notes from JSONPlaceholder.
- Create notes through a simulated POST request.
- Delete notes through a simulated DELETE request.
- Validate required titles and the 100-character limit.
- Display loading, success, error, and empty states.
- Render user-provided content with `textContent` to reduce injection risk.

**Demo limitation:** JSONPlaceholder is a fake REST API. POST and DELETE requests return simulated success responses but do not permanently change server data. Changes shown by this client are local to the current browser session.

## How to run the API client

1. Clone or download this repository.
2. Open `index.html` in a browser, or serve the folder using a local development server.
3. Click **Load notes** to retrieve sample posts.
4. Use the form to create a note or the Delete button to remove one from the current demo session.
5. Make sure you have an internet connection so the browser can reach JSONPlaceholder.

No package installation or build step is required.

## Design documents

- [REST API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [System architecture](docs/architecture.md)

## What I learned

- How to use `fetch`, `async/await`, reusable request functions, and error handling for REST API calls.
- How to build accessible forms, validate input, and represent loading, success, error, and empty UI states.
- How primary keys, foreign keys, indexes, JOIN tables, and SQL relationships support a notes application.
- How caching, load balancing, read replicas, queues, and background workers help a system scale.
- How to document API contracts, estimate traffic, and describe architecture trade-offs.

## Technology

HTML5 · CSS3 · Vanilla JavaScript · JSONPlaceholder · Markdown · SQL (SQLite examples)
