import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db/index.js";
import { todoTable } from "./db/schema.js";
import { ilike, eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Express
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from your frontend
  credentials: true
}));
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Database functions
const database = {
  getAll: async () => await db.select().from(todoTable),
  create: async (todo) => {
    const [result] = await db.insert(todoTable).values({ todo }).returning();
    return result;
  },
  delete: async (id) => await db.delete(todoTable).where(eq(todoTable.id, id)),
  deleteAll: async () => await db.delete(todoTable),
  search: async (query) =>
    await db
      .select()
      .from(todoTable)
      .where(ilike(todoTable.todo, `%${query}%`)),
};

// AI System Prompt
const SYSTEM_PROMPT = `
You are a Todo List Assistant. Follow these rules strictly:
1. Respond ONLY in valid JSON format.
2. Available actions: create, getAll, delete, search.
3. Example response: {"type":"action","function":"create","input":"Buy milk"}
`;

// Helper function to parse AI response
function parseAIResponse(text) {
  try {
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return { type: "error", message: "Invalid response from AI" };
  }
}

// API Endpoint for Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    // Generate AI response from Gemini
    const chat = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n:User  ${message}` }]
      }]
    });
    
    const responseText = await chat.response.text();
    console.log("Raw AI Response:", responseText);
    
    const aiResponse = parseAIResponse(responseText);
    console.log("Parsed AI Response:", aiResponse);
    
    if (aiResponse.type === "action") {
      switch (aiResponse.function) {
        case "create": {
          const newTodo = await database.create(aiResponse.input);
          return res.json({ message: `Todo created! ID: ${newTodo.id}` });
        }
        case "getAll": {
          const todos = await database.getAll();
          if (!todos.length) {
            return res.json({ message: "You have no todos.", todos: [] });
          }
          const formattedTodos = todos.map(todo => todo.todo).join(", ");
          return res.json({ message: formattedTodos, todos });
        }
        case "delete": {
          if (aiResponse.input.toLowerCase() === "all") {
            await database.deleteAll();
            return res.json({ message: "All todos deleted" });
          }
          let id = parseInt(aiResponse.input);
          if (isNaN(id)) {
            const results = await database.search(aiResponse.input);
            if (results.length === 1) {
              id = results[0].id;
            } else if (results.length > 1) {
              return res.status(400).json({ error: "Multiple todos found. Please specify by ID." });
            } else {
              return res.status(400).json({ error: "Todo not found." });
            }
          }
          await database.delete(id);
          return res.json({ message: `Todo with ID ${id} deleted` });
        }
        case "search": {
          const results = await database.search(aiResponse.input);
          if (!results.length) {
            return res.json({ message: "No matching todos found." });
          }
          const formattedResults = results.map(todo => todo.todo).join(", ");
          return res.json({ message: formattedResults, todos: results });
        }
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
    }
    
    res.json({ message: aiResponse.message || "Hi, I am Todo chatbot, Available actions: create, delete and search." });
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to fetch all todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await database.getAll();
    res.json({ todos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the Express app for Vercel serverless functions
export default app;