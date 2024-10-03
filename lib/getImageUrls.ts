import { Nango } from "@nangohq/node";

export async function getImageUrls(
  spreadsheetUrl: string,
  sheetName: string,
  columnName: string
) {
  try {
    if (!spreadsheetUrl || !sheetName || !columnName) {
      return {
        error:
          "Missing required parameters: spreadsheetUrl, sheetName, or columnName.",
      };
    }

    const urlPattern =
      /^(https?:\/\/)?(www\.)?docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    if (!urlPattern.test(spreadsheetUrl)) {
      return {
        error:
          "Invalid spreadsheetUrl format. Please provide a valid Google Sheets URL.",
      };
    }

    if (typeof sheetName !== "string" || sheetName.trim() === "") {
      return { error: "Invalid sheetName. It should be a non-empty string." };
    }

    if (typeof columnName !== "string" || columnName.trim() === "") {
      return { error: "Invalid columnName. It should be a non-empty string." };
    }

    const nango = new Nango({
      host: "https://ng.orom.club",
      secretKey: process.env.NANGO_SECRET_KEY!,
    });

    const regex = /\/d\/([a-zA-Z0-9-_]+)/;
    const match = spreadsheetUrl.match(regex);
    const spreadsheetId = match ? match[1] : null;

    if (!spreadsheetId) {
      return {
        error: "Failed to extract Spreadsheet ID from the provided URL.",
      };
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${columnName}:${columnName}`;

    const res = await nango.get({
      endpoint: url,
      providerConfigKey: "google-sheet",
      connectionId: "test-connection-id",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res || !res.data || !Array.isArray(res.data.values)) {
      return { error: "Failed to retrieve data from Google Sheets." };
    }

    const imageUrlsArray = res.data.values.slice(1).flat();

    if (imageUrlsArray.length === 0) {
      return { success: "No image links found in the specified column." };
    }

    return {
      success: "Image links fetched successfully.",
      imageUrlsArray: imageUrlsArray,
    };
  } catch (error) {
    console.error("ERROR", error);
    return {
      error:
        "An unexpected error occurred. Please check the input data or API configuration.",
      details: error,
    };
  }
}
