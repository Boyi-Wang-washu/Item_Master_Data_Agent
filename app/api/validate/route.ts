import { NextRequest, NextResponse } from "next/server";
import { validateItemMaster } from "@/lib/itemMasterValidation";

export async function POST(req: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");

    // Validate file exists and is a File/Blob
    if (!file || !(file instanceof File || file instanceof Blob)) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer, then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call validation engine
    const result = await validateItemMaster(buffer);

    // Return validation result as JSON
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // Handle internal errors
    console.error("Error validating item master:", err);
    
    const errorResponse: { error: string; details?: string } = {
      error: "Internal server error",
    };

    // Add details in development mode
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      errorResponse.details = err.message;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

