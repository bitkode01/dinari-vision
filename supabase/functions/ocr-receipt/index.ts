import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("Image data is required");
    }

    // Use OCR.space free API
    const formData = new FormData();
    formData.append("base64Image", imageBase64);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: "K87899142388957", // Free API key
      },
      body: formData,
    });

    const ocrResult = await ocrResponse.json();

    if (ocrResult.OCRExitCode !== 1) {
      throw new Error(ocrResult.ErrorMessage || "OCR processing failed");
    }

    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || "";

    // Extract amount from text
    // Look for patterns like: Rp 50.000, IDR 50000, 50,000, etc.
    const amountPatterns = [
      /(?:Rp\.?\s*|IDR\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
      /(?:total|amount|jumlah|bayar)[\s:]*(?:Rp\.?\s*|IDR\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
    ];

    let detectedAmount = null;
    for (const pattern of amountPatterns) {
      const matches = [...extractedText.matchAll(pattern)];
      if (matches.length > 0) {
        // Get the largest number (likely to be the total)
        const amounts = matches.map((match) => {
          const numStr = match[1] || match[0];
          return parseFloat(numStr.replace(/[.,]/g, ""));
        });
        detectedAmount = Math.max(...amounts);
        break;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        detectedAmount,
        rawOcrResult: ocrResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("OCR Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
