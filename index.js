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
  app.listen(PORT, () => {
    console.log(`\n🚀 Server started on http://localhost:${PORT}`);
  });
});

// ------------------
// Seeding Functions
// ------------------

async function seedAgentData() {
  try {
    await SalesAgent.deleteMany({});
    const json = fs.readFileSync("salesAgent.json", "utf-8");
    await SalesAgent.insertMany(JSON.parse(json));
    console.log("✔ Agents Seeded");
  } catch (error) {
    console.error("❌ Error seeding agents:", error);
  }
}

async function seedLeadData() {
  try {
    await Lead.deleteMany({});
    const json = fs.readFileSync("lead.json", "utf-8");
    await Lead.insertMany(JSON.parse(json));
    console.log("✔ Leads Seeded");
  } catch (error) {
    console.error("❌ Error seeding leads:", error);
  }
}

async function seedCommentData() {
  try {
    await Comment.deleteMany({});
    const json = fs.readFileSync("comment.json", "utf-8");
    await Comment.insertMany(JSON.parse(json));
    console.log("✔ Comments Seeded");
  } catch (error) {
    console.error("❌ Error seeding comments:", error);
  }
}

async function seedTagData() {
  try {
    await Tag.deleteMany({});
    const json = fs.readFileSync("tag.json", "utf-8");
    await Tag.insertMany(JSON.parse(json));
    console.log("✔ Tags Seeded");
  } catch (error) {
    console.error("❌ Error seeding tags:", error);
  }
}

// ------------------
// API Endpoints
// ------------------

// Health Check
app.get("/", (req, res) => {
  res.send("Anvaya CRM API is running!");
});


// =======================================================
//                   SALES AGENT ROUTES
// =======================================================

// Get all agents
app.get("/agents", async (req, res) => {
  try {
    const agents = await SalesAgent.find();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales agents" });
  }
});

// =======================================================
//                      LEAD ROUTES
// =======================================================

// Create Lead
app.post("/leads", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    const populated = await Lead.findById(lead._id).populate("salesAgent", "name email");
    res.status(201).json(populated);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all leads (with filters)
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
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Get single lead
app.get("/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate("salesAgent", "name email");

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    res.json(lead);

  } catch (error) {
    res.status(400).json({ error: "Invalid Lead ID" });
  }
});

// Update lead
app.put("/leads/:id", async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("salesAgent", "name email");

    if (!updated) return res.status(404).json({ error: "Lead not found" });

    res.json(updated);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete lead
app.delete("/leads/:id", async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);

    if (!deletedLead) return res.status(404).json({ error: "Lead not found" });

    res.json({ message: "Lead deleted successfully" });

  } catch (error) {
    res.status(400).json({ error: "Invalid Lead ID" });
  }
});

// =======================================================
//                     COMMENT ROUTES
// =======================================================

// Get comments for a lead
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ lead: req.params.id })
      .populate("author", "name");
    res.json(comments);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add comment to a lead
app.post("/leads/:id/comments", async (req, res) => {
  try {
    const { commentText, author } = req.body;

    const comment = new Comment({
      lead: req.params.id,
      author,
      commentText
    });

    await comment.save();
    res.status(201).json(comment);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// =======================================================
//                     TAG ROUTES
// =======================================================

// Get all tags
app.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

