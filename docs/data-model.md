# QuickNotes Data Model

## Entities and columns

### `users`
- `id`: INTEGER, primary key.
- `name`: VARCHAR(100), not null.
- `email`: VARCHAR(255), not null and unique.
- `password_hash`: VARCHAR(255), not null.
- `created_at`: TIMESTAMP, not null.

### `notes`
- `id`: INTEGER, primary key.
- `user_id`: INTEGER, not null, foreign key to `users.id`.
- `title`: VARCHAR(100), not null.
- `body`: TEXT, nullable.
- `created_at`: TIMESTAMP, not null.
- `updated_at`: TIMESTAMP, not null.

### `tags`
- `id`: INTEGER, primary key.
- `user_id`: INTEGER, not null, foreign key to `users.id`.
- `name`: VARCHAR(50), not null.

### `note_tags`
- `note_id`: INTEGER, primary key component and foreign key to `notes.id`.
- `tag_id`: INTEGER, primary key component and foreign key to `tags.id`.
- The composite primary key prevents associating the same tag with the same note more than once.

## Relationships

- **Users to notes is one-to-many:** one user can create many notes, while each note belongs to one user.
- **Users to tags is one-to-many:** one user can define many tags, while each tag belongs to one user.
- **Notes to tags is many-to-many:** a note can have multiple tags and a tag can be applied to multiple notes. The `note_tags` join table represents this relationship using two foreign keys and a composite primary key.

## SQLite CREATE TABLE statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL CHECK (length(title) <= 100),
    body TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags(tag_id);
```

## Example SQL queries

### 1. List all notes belonging to one user
```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### 2. JOIN notes to their tags
```sql
SELECT n.title, t.name AS tag
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 1
ORDER BY n.title;
```

### 3. Count notes per user, including users with no notes
```sql
SELECT u.id, u.name, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.name;
```

### 4. Find notes with no tags
```sql
SELECT n.id, n.title
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
WHERE nt.note_id IS NULL;
```

## Index justification

The index `idx_notes_user_created` helps the common query that retrieves a user's notes ordered by creation time. It can reduce scanning and sorting as the notes table grows. The `idx_note_tags_tag` index helps find notes associated with a particular tag.

## SQL or NoSQL?

I would choose a relational SQL database such as PostgreSQL for QuickNotes. Users, notes, tags, and note-tag associations have clear relationships and constraints, and SQL foreign keys help protect data integrity. JOINs support tag searches and reporting, while transactions help keep related changes consistent. NoSQL could be useful for highly variable document structures, but a relational model is a better fit for this application's structured data and many-to-many tagging.
