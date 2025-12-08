const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = 4000;

const { initializeDatabase } = require("./db/db.connect");
const Comment = require("./models/model.comment");
const Tag = require("./models/model.tag");
const SalesAgent = require("./models/model.salesAgent");
const Lead = require("./models/model.lead");

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Database
initializeDatabase().then(() => {
 // seedData(); // Call this once to populate your DB when starting the server
 app.listen(PORT, () => {
  console.log(` Server started on port ${PORT}`);
  console.log(`Backend API running at http://localhost:${PORT}`);
 });
});

// ------------------
// Seed Functions
// ------------------
async function seedAgentData() {
  try {
    await SalesAgent.deleteMany({});
    const jsonData = fs.readFileSync("salesAgent.json", "utf-8");
    const salesAgentData = JSON.parse(jsonData);
    await SalesAgent.insertMany(salesAgentData);
    console.log("Seeding Agent data is successful");
  } catch (error) {
    console.error("Error seeding the Agent data:", error);
  } finally {
    console.log("--- Agent Data Seeding Complete ---");
  }
}

async function seedLeadData() {
  try {
    await Lead.deleteMany({});
    const jsonData = fs.readFileSync("lead.json", "utf-8");
    const leadData = JSON.parse(jsonData);
    await Lead.insertMany(leadData);
    console.log("Seeding Lead data is successful");
  } catch (error) {
    console.error("Error seeding the Lead data:", error);
  } finally {
    console.log("--- Lead Data Seeding Complete ---");
  }
}

async function seedCommentData() {
  try {
    await Comment.deleteMany({});
    const jsonData = fs.readFileSync("comment.json", "utf-8");
    const commentData = JSON.parse(jsonData);
    await Comment.insertMany(commentData);
    console.log("Seeding Comment data is successful");
  } catch (error) {
    console.error("Error seeding the Comment data:", error);
  } finally {
    console.log("--- Comment Data Seeding Complete ---");
  }
}

async function seedTagData() {
  try {
    await Tag.deleteMany({});
    const jsonData = fs.readFileSync("tag.json", "utf-8");
    const tagData = JSON.parse(jsonData);
    await Tag.insertMany(tagData);
    console.log("Seeding Tag data is successful");
  } catch (error) {
    console.error("Error seeding the Tag data:", error);
  } finally {
    console.log("--- Tag Data Seeding Complete ---");
  }
}

// Uncomment to seed all data once
// seedAgentData();
// seedLeadData();
// seedTagData();
// seedCommentData();

// ------------------
// API Endpoints
// ------------------

// Health Check
app.get("/", (req, res) => {
  res.send("Anvaya CRM API is running!");
});

// Get all sales agents
app.get("/agents", async (req, res) => {
  try {
    const agents = await SalesAgent.find();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales agents." });
  }
});

// Get all leads (with optional filters)
app.get("/leads", async (req, res) => {
  try {
    const { salesAgent, status, tags, source } = req.query;
    const filter = {};
    if (salesAgent) filter.salesAgent = salesAgent;
    if (status) filter.status = status;
    if (tags) filter.tags = { $in: tags.split(",") };
    if (source) filter.source = source;

    const leads = await Lead.find(filter).populate("salesAgent", "name email");
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads." });
  }
});

// Get comments for a lead
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ lead: id }).populate("author", "name");
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// Add a comment to a lead
app.post("/leads/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { commentText, author } = req.body;
    const comment = new Comment({ lead: id, author, commentText });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ------------------
