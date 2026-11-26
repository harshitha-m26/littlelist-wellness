require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Task = require("./models/Task");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "tasks.json");
let mongoReady = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readLocal() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function writeLocal(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}
async function getTasks() {
  return mongoReady ? await Task.find().sort({ createdAt: -1 }) : readLocal();
}

app.get("/api/status", (req, res) => {
  res.json({ ok: true, database: mongoReady ? "MongoDB connected" : "Local JSON storage" });
});

app.get("/api/tasks", async (req, res) => {
  try { res.json(await getTasks()); }
  catch (err) { res.status(500).json({ message: "Could not load tasks." }); }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description = "", priority = "Medium", dueDate = "", category = "Personal" } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required." });
    const data = { title: title.trim(), description, priority, dueDate, category, completed: false };
    let task;
    if (mongoReady) task = await Task.create(data);
    else {
      task = { ...data, _id: Date.now().toString(), createdAt: new Date().toISOString() };
      const tasks = readLocal(); tasks.unshift(task); writeLocal(tasks);
    }
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: "Could not add task." }); }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    let task;
    if (mongoReady) task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    else {
      const tasks = readLocal();
      const i = tasks.findIndex(t => t._id === req.params.id);
      if (i < 0) return res.status(404).json({ message: "Task not found." });
      tasks[i] = { ...tasks[i], ...req.body, updatedAt: new Date().toISOString() };
      writeLocal(tasks); task = tasks[i];
    }
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (err) { res.status(500).json({ message: "Could not update task." }); }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (mongoReady) {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found." });
    } else {
      const tasks = readLocal();
      const updated = tasks.filter(t => t._id !== req.params.id);
      if (updated.length === tasks.length) return res.status(404).json({ message: "Task not found." });
      writeLocal(updated);
    }
    res.json({ message: "Task deleted." });
  } catch (err) { res.status(500).json({ message: "Could not delete task." }); }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      mongoReady = true;
      console.log("Connected to MongoDB.");
    } catch (err) {
      console.error("MongoDB connection failed; using local JSON storage instead.");
    }
  } else {
    console.log("MONGODB_URI not set; using local JSON storage.");
  }
  app.listen(PORT, () => console.log(`LittleList is running at http://localhost:${PORT}`));
}
start();