const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 MongoDB — reads from env variable on Render, falls back to local
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sandsmm22_db_user:sakshi3009@cluster0.ncpv7te.mongodb.net/eventDB";
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected ✅"))
    .catch(err => console.log("MongoDB Error:", err));

// =======================
// 📦 SCHEMAS
// =======================

const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Admin = mongoose.model("Admin", adminSchema);

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: String,
    location: String,
    description: String,
    category: { type: String, default: "General" },
    capacity: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.model("Event", eventSchema);

const registerSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    userName: String,
    userEmail: String,
    registeredAt: { type: Date, default: Date.now }
});
const Register = mongoose.model("Register", registerSchema);

// =======================
// 🔐 AUTH ROUTES
// =======================

app.get("/create-admin", async (req, res) => {
    try {
        const existing = await Admin.findOne({ username: "admin" });
        if (existing) return res.send("Admin already exists ✅");
        const hashed = await bcrypt.hash("admin123", 10);
        const admin = new Admin({ username: "admin", password: hashed });
        await admin.save();
        res.send("Admin created ✅");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});

// =======================
// 📌 EVENT ROUTES
// =======================

app.post("/events", async (req, res) => {
    try {
        const event = new Event({
            name: req.body.name,
            date: req.body.date,
            location: req.body.location,
            description: req.body.description,
            category: req.body.category || "General",
            capacity: req.body.capacity || 100
        });
        await event.save();
        res.json(event);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/events", async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }
        if (category && category !== "All") query.category = category;

        const events = await Event.find(query).sort({ createdAt: -1 });
        const eventsWithCount = await Promise.all(events.map(async (ev) => {
            const count = await Register.countDocuments({ eventId: ev._id });
            return { ...ev.toObject(), registrationCount: count };
        }));
        res.json(eventsWithCount);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/events/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        const registrationCount = await Register.countDocuments({ eventId: event._id });
        res.json({ ...event.toObject(), registrationCount });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.put("/events/:id", async (req, res) => {
    try {
        const updated = await Event.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                date: req.body.date,
                location: req.body.location,
                description: req.body.description,
                category: req.body.category,
                capacity: req.body.capacity
            },
            { new: true }
        );
        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.delete("/events/:id", async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        await Register.deleteMany({ eventId: req.params.id });
        res.json({ message: "Event deleted ✅" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// =======================
// 👥 REGISTRATION ROUTES
// =======================

app.post("/register", async (req, res) => {
    try {
        const { eventId, userName, userEmail } = req.body;
        const existing = await Register.findOne({ eventId, userEmail });
        if (existing) return res.status(400).json({ message: "Already registered with this email" });
        const reg = new Register({ eventId, userName, userEmail });
        await reg.save();
        res.json(reg);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/registrations/:eventId", async (req, res) => {
    try {
        const regs = await Register.find({ eventId: req.params.eventId }).sort({ registeredAt: -1 });
        res.json(regs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/registrations", async (req, res) => {
    try {
        const data = await Register.find().sort({ registeredAt: -1 });
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/stats", async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const today = new Date().toISOString().split("T")[0];
        const upcomingEvents = await Event.countDocuments({ date: { $gte: today } });
        const totalRegistrations = await Register.countDocuments();
        res.json({ totalEvents, upcomingEvents, totalRegistrations });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get("/", (req, res) => res.send("🚀 EventHub Backend Running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));