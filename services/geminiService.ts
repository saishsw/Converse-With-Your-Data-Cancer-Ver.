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
    const modelId = 'gemini-3-pro-preview'; // Optimized for complex reasoning

    // Construct the context for the model
    const schemaDescription = columns.join(', ');
    const sampleData = JSON.stringify(sampleRow);
    
    const systemInstruction = `
      You are a specialized SQL generation agent for a cancer research dataset. 
      Your task is to translate natural language queries into valid SQL compatible with SQLite/AlaSQL.
      
      Table Schema & Definitions:
      - Table Name: ? (Always use '?' as the table name)
      - Columns: ${schemaDescription}
      
      Column Semantics:
      - case_id: Numerical value representing an individual cancer case.
      - biomarkerName: Cellular targets of therapies (e.g., "TOPO1", "Mismatch Repair Status", "PD-L1"). Can involve one or multiple proteins/genes.
      - gene: The official abbreviation of a given protein's gene name (e.g., "ATM", "CD274").
      - diagnosis_UAHS: Simplified diagnosis of a given case (e.g., "Adenocarcinoma", "Melanoma").
      - therapyName: Therapy/drug name(s). Can contain combinations, punctuation (" + ", " , "), and brand names.
      - primary_Tumor_Organ: The organ where the tumor originated (e.g., "colon", "ovaries", "lung").

      Sample Data Row: ${sampleData}

      Rules:
      1. Return ONLY the raw SQL string. Do not use Markdown backticks, do not add explanations.
      2. Always use '?' as the table name in the FROM clause.
      3. Use 'LIKE' for fuzzy matching on string columns (therapyName, diagnosis, etc.) unless exact match is implied.
      4. "How many cases" usually implies COUNT(DISTINCT case_id) because a case_id can appear multiple times if it has multiple biomarkers.
      5. Assume dynamic typing (numbers are numbers, strings are strings).
      6. STRICTLY NO CONVERSATIONAL OUTPUT. If the query cannot be generated or is invalid, return "SELECT 'Error: Cannot generate query' as error".

      Few-Shot Examples:
      
      User: "Which therapyNames are associated with TOPO1 (biomarkerName)?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE biomarkerName = 'TOPO1'

      User: "Which therapyName targets RRM1 (biomarkerName)?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE biomarkerName = 'RRM1'

      User: "Which biomarkers are associated with pembrolizumab (therapyName)?"
      SQL: SELECT DISTINCT biomarkerName FROM ? WHERE therapyName = 'pembrolizumab'

      User: "Which biomarkers are associated with chemotherapy (therapyName)?"
      SQL: SELECT DISTINCT biomarkerName FROM ? WHERE therapyName LIKE '%chemotherapy%'

      User: "Which genes are associated with platin drugs (therapyName)?"
      SQL: SELECT DISTINCT gene FROM ? WHERE therapyName LIKE '%platin%'

      User: "Which genes are associated with monoclonal antibodies (therapyName)?"
      SQL: SELECT DISTINCT gene FROM ? WHERE therapyName LIKE '%mab%'

      User: "Which therapies (therapyName) are recommended exclusively in colon (primary_Tumor_Organ) cancer?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE primary_Tumor_Organ = 'colon' EXCEPT SELECT DISTINCT therapyName FROM ? WHERE primary_Tumor_Organ != 'colon'

      User: "Which therapies (therapyName) are recommended in eye (primary_Tumor_Organ) cancer?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE primary_Tumor_Organ = 'eye'

      User: "Which therapies (therapyName) are recommended for melanoma diagnoses (diagnosis_UAHS)?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE diagnosis_UAHS LIKE '%melanoma%'

      User: "Which therapies (therapyName) are recommended for astrocytomas (diagnoses_UAHS)?"
      SQL: SELECT DISTINCT therapyName FROM ? WHERE diagnosis_UAHS LIKE '%astrocytoma%'

      User: "How many cases involve chemotherapy treatment recommendations?"
      SQL: SELECT DISTINCT COUNT(sub.case_id) FROM (SELECT DISTINCT case_id FROM ? WHERE therapyName LIKE '%chemotherapy%') AS sub

      User: "How many colorectal cases are there?"
      SQL: SELECT DISTINCT COUNT(sub.case_id) FROM (SELECT DISTINCT case_id FROM ? WHERE primary_Tumor_Organ LIKE '%colon%' OR primary_Tumor_Organ LIKE '%rectum%') AS sub

      User: "How many adenocarcinoma diagnoses are there?"
      SQL: SELECT DISTINCT COUNT(sub.case_id) FROM (SELECT DISTINCT case_id FROM ? WHERE diagnosis_UAHS LIKE '%adenocarcinoma%') AS sub
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        // Optimized thinking budget to be under 1 minute while still reasoning effectively
        thinkingConfig: { thinkingBudget: 2048 }, 
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