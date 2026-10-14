# QuickNotes REST API Design

## Overview

Base URL: `/api/v1`

The API manages notes belonging to authenticated users. JSON is used for request and response bodies. The examples below describe the intended production API; the browser demo uses JSONPlaceholder.

## Endpoints

### 1. List the current user's notes
- **Method:** `GET`
- **Path:** `/api/v1/notes`
- **Description:** Returns the authenticated user's notes, optionally paginated.
- **Success:** `200 OK`
- **Example request:** `GET /api/v1/notes?limit=20&offset=0`
- **Example response:**
```json
{
  "data": [
    {
      "id": 42,
      "userId": 7,
      "title": "Portfolio ideas",
      "body": "Build a responsive project gallery.",
      "createdAt": "2026-10-01T09:00:00Z",
      "updatedAt": "2026-10-01T09:00:00Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "total": 1 }
}
```

### 2. Get one note
- **Method:** `GET`
- **Path:** `/api/v1/notes/{noteId}`
- **Description:** Returns one note owned by the authenticated user.
- **Success:** `200 OK`
- **Example response:**
```json
{
  "id": 42,
  "userId": 7,
  "title": "Portfolio ideas",
  "body": "Build a responsive project gallery.",
  "createdAt": "2026-10-01T09:00:00Z",
  "updatedAt": "2026-10-01T09:00:00Z"
}
```

### 3. Create a note
- **Method:** `POST`
- **Path:** `/api/v1/notes`
- **Description:** Creates a note for the authenticated user.
- **Success:** `201 Created`
- **Example request:**
```json
{
  "title": "Meeting notes",
  "body": "Prepare the project update."
}
```
- **Example response:**
```json
{
  "id": 43,
  "userId": 7,
  "title": "Meeting notes",
  "body": "Prepare the project update.",
  "createdAt": "2026-10-02T10:30:00Z",
  "updatedAt": "2026-10-02T10:30:00Z"
}
```

### 4. Update a note
- **Method:** `PUT`
- **Path:** `/api/v1/notes/{noteId}`
- **Description:** Replaces a note's editable fields.
- **Success:** `200 OK`
- **Example request:**
```json
{
  "title": "Updated meeting notes",
  "body": "Send the project update after lunch."
}
```

### 5. Delete a note
- **Method:** `DELETE`
- **Path:** `/api/v1/notes/{noteId}`
- **Description:** Deletes a note owned by the authenticated user.
- **Success:** `204 No Content`

### 6. Search notes
- **Method:** `GET`
- **Path:** `/api/v1/notes?search={term}`
- **Description:** Searches the authenticated user's notes by title or body.
- **Success:** `200 OK`
- **Example request:** `GET /api/v1/notes?search=meeting`

### 7. List notes with a tag
- **Method:** `GET`
- **Path:** `/api/v1/tags/{tagId}/notes`
- **Description:** Lists the current user's notes associated with a tag.
- **Success:** `200 OK`

## Error status codes

Errors use a consistent JSON structure.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required."
  }
}
```

- **400 Bad Request:** Invalid JSON, missing title, or a title longer than 100 characters.
- **401 Unauthorized:** No valid authentication credentials were supplied.
- **403 Forbidden:** The user is authenticated but is not allowed to perform the requested action.
- **404 Not Found:** The note or tag does not exist, or is not available to the current user.
- **500 Internal Server Error:** An unexpected server failure occurred.

## Validation and security

- A note title is required and must contain no more than 100 characters.
- The server derives `userId` from the authenticated session rather than trusting a client-supplied owner ID.
- All note operations enforce ownership checks.
- Requests use HTTPS in production.
