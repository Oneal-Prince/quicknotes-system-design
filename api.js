const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusElement = document.getElementById("status");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const notesList = document.getElementById("notes-list");

let notes = [];
let nextLocalId = -1;
let requestInProgress = false;

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type ? `status ${type}` : "status";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json; charset=UTF-8" } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function setBusy(isBusy) {
  requestInProgress = isBusy;
  loadButton.disabled = isBusy;
  submitButton.disabled = isBusy;
  titleInput.disabled = isBusy;
  bodyInput.disabled = isBusy;
  notesList.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
}

function renderNotes(list) {
  notesList.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No notes to show. Load notes or create your first note.";
    notesList.appendChild(empty);
    return;
  }

  list.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-card";

    const heading = document.createElement("h3");
    heading.textContent = note.title || "Untitled note";

    const body = document.createElement("p");
    body.textContent = note.body || "No note content.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete note: ${note.title || "Untitled note"}`);
    deleteButton.addEventListener("click", () => deleteNote(note.id));

    item.append(heading, body, deleteButton);
    notesList.appendChild(item);
  });
}

async function loadNotes() {
  if (requestInProgress) return;
  setBusy(true);
  setStatus("Loading notes...", "loading");

  try {
    const data = await request(`${API_URL}?_limit=10`);
    notes = Array.isArray(data) ? data : [];
    renderNotes(notes);
    setStatus(
      notes.length ? `Successfully loaded ${notes.length} notes.` : "No notes found.",
      "success"
    );
  } catch (error) {
    setStatus(`Could not load notes. ${error.message}`, "error");
    console.error("GET notes error:", error);
  } finally {
    setBusy(false);
  }
}

async function createNote(title, body) {
  if (requestInProgress) return;

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    setStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }
  if (cleanTitle.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Creating note...", "loading");

  try {
    const created = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({
        title: cleanTitle,
        body: body.trim(),
        userId: 1
      })
    });

    // JSONPlaceholder simulates POST and does not persist the new record.
    // Use a local ID so the new note appears in this browser session.
    const localNote = {
      ...created,
      id: nextLocalId--,
      title: cleanTitle,
      body: body.trim()
    };
    notes = [localNote, ...notes];
    renderNotes(notes);
    noteForm.reset();
    setStatus("Note created in this demo session. JSONPlaceholder does not persist POST data.", "success");
  } catch (error) {
    setStatus(`Could not create the note. ${error.message}`, "error");
    console.error("POST note error:", error);
  } finally {
    setBusy(false);
  }
}

async function deleteNote(id) {
  if (requestInProgress) return;
  setBusy(true);
  setStatus("Deleting note...", "loading");

  try {
    await request(`${API_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    // Reflect the simulated DELETE in the UI because JSONPlaceholder
    // returns success without permanently changing its server data.
    notes = notes.filter((note) => note.id !== id);
    renderNotes(notes);
    setStatus("Note removed from this demo session.", "success");
  } catch (error) {
    setStatus(`Could not delete the note. ${error.message}`, "error");
    console.error("DELETE note error:", error);
  } finally {
    setBusy(false);
  }
}

loadButton.addEventListener("click", loadNotes);

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNote(titleInput.value, bodyInput.value);
});

renderNotes(notes);
