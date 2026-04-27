const API_URL = "http://localhost:5000";

// Load events
async function getEvents() {
    const res = await fetch(`${API_URL}/events`);
    const data = await res.json();

    const list = document.getElementById("eventList");
    list.innerHTML = "";

    data.forEach(event => {
        const li = document.createElement("li");

        li.innerHTML = `
      ${event.name}

      <button onclick="deleteEvent('${event._id}')">Delete</button>
      <button onclick="updateEvent('${event._id}')">Update</button>
      <button onclick="registerEvent('${event._id}')">Register</button>
    `;

        list.appendChild(li);
    });
}

// Create
async function addEvent() {
    const name = document.getElementById("eventName").value;
    const date = document.getElementById("eventDate").value;
    const location = document.getElementById("eventLocation").value;
    const description = document.getElementById("eventDescription").value;

    await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, location, description })
    });

    getEvents();
}

// Delete
async function deleteEvent(id) {
    await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE"
    });

    getEvents();
}

// Update
async function updateEvent(id) {
    const newName = prompt("Enter new event name:");

    await fetch(`${API_URL}/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
    });

    getEvents();
}

// Register
async function registerEvent(id) {
    const userName = prompt("Enter your name:");

    await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, userName })
    });

    alert("Registered successfully 🎉");
}

// Load on start
getEvents();