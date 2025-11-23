import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: API Key must be set in environment variables as per instructions.
// In a real build environment, this is injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSQLFromPrompt = async (
  userPrompt: string, 
  columns: string[],
  sampleRow: Record<string, any>
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash'; // Optimized for speed/logic

    // Construct the context for the model
    const schemaDescription = columns.join(', ');
    const sampleData = JSON.stringify(sampleRow);
    
    const systemInstruction = `
      You are a specialized SQL generation agent. 
      Your task is to translate natural language queries into valid SQL compatible with SQLite/AlaSQL.
      
      Table Information:
      - Table Name: ? (The data is passed as a parameter, so use '?' as the table name in the FROM clause, e.g. "SELECT * FROM ?")
      - Columns: ${schemaDescription}
      
      Sample Data Row: ${sampleData}

      Rules:
      1. Return ONLY the raw SQL string. Do not use Markdown backticks, do not add explanations.
      2. Always use '?' as the table name.
      3. Be case-insensitive with column matching if possible, but prefer exact matches from the provided list.
      4. If the user asks for a visualization (chart, graph), just return the SQL to get the data required for that visualization.
      5. Assume dynamic typing (numbers are numbers, strings are strings).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Low temperature for deterministic code generation
      }
    });

    let sql = response.text || '';
    
    // Cleanup any potential markdown leakage
    sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();
    
    return sql;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate SQL from prompt.");
  }
};