import { NextRequest, NextResponse } from "next/server";
import type { ValidationResult } from "@/lib/itemMasterValidation";
import { generateValidationSummary } from "@/lib/summaryAgent";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    if (!json) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = json as ValidationResult;

    const summaryText = await generateValidationSummary(result);

    return NextResponse.json(
      { summary: summaryText },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error generating AI summary:", err);
    return NextResponse.json(
      { error: "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}

