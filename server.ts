import express from "express";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/parse", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Basic validation
    new URL(url);
    
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parse with JSDOM
    const doc = new JSDOM(html, { url });
    
    // Use Readability
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    
    if (!article) {
      throw new Error("Could not parse article content");
    }
    
    res.json({ 
      success: true, 
      article: {
        url,
        title: article.title || "Untitled",
        byline: article.byline,
        dir: article.dir,
        content: article.content,
        textContent: article.textContent,
        length: article.length,
        excerpt: article.excerpt,
        siteName: article.siteName,
        publishedTime: article.publishedTime,
      } 
    });
  } catch (error: any) {
    console.error("Error parsing URL:", error);
    res.status(500).json({ error: error.message || "Failed to parse URL" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
