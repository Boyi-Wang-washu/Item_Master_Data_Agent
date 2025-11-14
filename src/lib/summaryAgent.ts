import type { ValidationResult, ValidationIssue } from "@/lib/itemMasterValidation";

// ============================================================================
// Internal Types
// ============================================================================

interface LlmSummaryPayload {
  stats: ValidationResult["stats"];
  sampleIssues: Array<{
    rule_id: string;
    severity: string;
    site?: string;
    item_number: string;
    item_description?: string;
    message: string;
  }>;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generates an executive summary of validation results using DeepSeek LLM.
 * 
 * @param result - The ValidationResult from the validation engine
 * @returns A promise that resolves to an executive summary string in English
 */
export async function generateValidationSummary(
  result: ValidationResult
): Promise<string> {
  // Check for API key (primary: DEEPSEEK_API_KEY, fallback: OPENAI_API_KEY)
  const apiKey =
    process.env.DEEPSEEK_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  
  if (!apiKey.trim()) {
    return "AI summary is not available because the AI provider API key is not configured on the server.";
  }

  try {
    // Build sample issues (first 30 or fewer)
    const sampleIssues = result.issues
      .slice(0, 30)
      .map((issue: ValidationIssue) => ({
        rule_id: issue.rule_id,
        severity: issue.severity,
        site: issue.site,
        item_number: issue.item_number,
        item_description: issue.item_description,
        message: issue.message,
      }));

    // Build payload for LLM
    const payloadForModel: LlmSummaryPayload = {
      stats: result.stats,
      sampleIssues,
    };

    // Prepare API request
    const body = {
      model: "deepseek-chat",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a senior finance and data governance expert. You explain data quality findings in clear, concise business language suitable for CFOs and operations leaders.",
        },
        {
          role: "user",
          content: "Here is a JSON object describing data quality results for an Item Master validation. Summarize the key risks and findings in 2-4 short paragraphs, focusing on financial impact, process risk, and recommended next steps.\n\n" +
                   JSON.stringify(payloadForModel, null, 2),
        },
      ],
    };

    // Call LLM provider API
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `LLM provider API error (${response.status}):`,
        errorText
      );
      return "Unable to generate AI summary due to an error calling the LLM. Please review the detailed issues table instead.";
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("LLM provider API returned empty content:", data);
      return "Unable to generate AI summary due to an error calling the LLM. Please review the detailed issues table instead.";
    }

    return content;
  } catch (error) {
    console.error("Error generating validation summary:", error);
    return "Unable to generate AI summary due to an error calling the LLM. Please review the detailed issues table instead.";
  }
}

