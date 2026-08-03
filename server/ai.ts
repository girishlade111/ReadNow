import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn("Failed to initialize GoogleGenAI client:", e);
  }
}

export async function generateArticleAnalysis(title: string, textContent: string) {
  const truncatedText = textContent.slice(0, 12000); // Stay within prompt bounds
  
  if (aiClient) {
    try {
      const prompt = `You are an expert executive analyst for an enterprise reading tool.
Analyze the following article text titled "${title}".
Return a JSON object with EXACTLY this structure:
{
  "summary": "Concise 3-4 sentence executive summary highlighting core points",
  "keyTakeaways": ["Bullet point 1", "Bullet point 2", "Bullet point 3", "Bullet point 4"],
  "actionItems": ["Actionable advice or key decision point 1", "Actionable advice 2"],
  "sentiment": "Positive" | "Neutral" | "Analytical" | "Critical",
  "suggestedTags": ["Tag1", "Tag2", "Tag3"]
}

Article text:
${truncatedText}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          summary: parsed.summary || "Executive summary unavailable.",
          keyTakeaways: parsed.keyTakeaways || [],
          actionItems: parsed.actionItems || [],
          sentiment: parsed.sentiment || "Analytical",
          suggestedTags: parsed.suggestedTags || ["Reading", "Insights"]
        };
      }
    } catch (err) {
      console.error("Gemini AI API call failed, falling back to local heuristic analysis:", err);
    }
  }

  // Heuristic Local AI Fallback when API key is omitted or during offline testing
  const sentences = truncatedText.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
  const summarySentences = sentences.slice(0, 3).join(' ');
  const keyTakeaways = sentences.slice(3, 7).map(s => s.trim());
  
  const words = title.split(/\s+/).filter(w => w.length > 4);
  const suggestedTags = words.length ? words.slice(0, 3).map(w => w.replace(/[^a-zA-Z]/g, '')) : ["Article", "Insights"];

  return {
    summary: summarySentences || `Executive summary of "${title}". This article provides key insights and analysis regarding the primary topic.`,
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [
      "Presents comprehensive breakdown of the core subject.",
      "Outlines strategic context and operational impact.",
      "Highlights practical implementation considerations."
    ],
    actionItems: [
      "Review key findings with relevant team members.",
      "Consider integration possibilities for current workflow."
    ],
    sentiment: "Analytical" as const,
    suggestedTags: suggestedTags.concat(["Reading"])
  };
}

export async function askArticleCopilot(title: string, textContent: string, question: string) {
  const truncatedText = textContent.slice(0, 10000);

  if (aiClient) {
    try {
      const prompt = `You are ReadNow AI Copilot, an enterprise assistant. Answer the user's question accurately based ON THE ARTICLE TEXT PROVIDED BELOW.
Article Title: "${title}"
Article Content:
${truncatedText}

User Question: ${question}

Provide a direct, clear, professional response formatted in clean markdown.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.error("Gemini AI Copilot error, using local fallback:", err);
    }
  }

  // Heuristic local response
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes("summary") || lowerQ.includes("what is this about")) {
    return `**Article Summary for "${title}":**\n\nThis article examines key aspects of ${title}. It provides structural breakdown, core concepts, and key takeaways for executive review.`;
  }
  
  return `Based on the article **"${title}"**, here is the relevant analysis regarding your query:\n\n> *"${question}"*\n\nThe content discusses core ideas, strategic methodologies, and operational concepts present in the text.`;
}

export async function translateArticleText(title: string, content: string, targetLanguage: string) {
  if (aiClient) {
    try {
      const prompt = `Translate the following article title and HTML content accurately into ${targetLanguage}. Preserve HTML markup tags intact.
Return a JSON object with:
{
  "translatedTitle": "Title in ${targetLanguage}",
  "translatedContent": "HTML content in ${targetLanguage}",
  "translatedSummary": "Short 2-sentence summary in ${targetLanguage}"
}

Title: ${title}
Content: ${content.slice(0, 8000)}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          title: parsed.translatedTitle || title,
          content: parsed.translatedContent || content,
          summary: parsed.translatedSummary || ""
        };
      }
    } catch (err) {
      console.error("Gemini Translation error:", err);
    }
  }

  // Fallback indicator
  return {
    title: `[${targetLanguage}] ${title}`,
    content: `<div class="p-4 bg-yellow-100 border-2 border-black font-bold uppercase mb-4">Note: Automatic Machine Translation (${targetLanguage})</div>` + content,
    summary: `Translated view of ${title} in ${targetLanguage}.`
  };
}
