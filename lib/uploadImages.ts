import { Nango } from "@nangohq/node";
import { v4 } from "uuid";

export async function uploadImages(imageUrls: string[]) {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return { error: "Image URLs array is empty or not an array" };
    }

    for (const url of imageUrls) {
      if (typeof url !== "string" || !isValidUrl(url)) {
        return { error: `Invalid URL detected: ${url}` };
      }
    }

    const nango = new Nango({
      host: "https://ng.orom.club",
      secretKey: process.env.NANGO_SECRET_KEY!,
    });

    for (const imageUrl of imageUrls) {
      try {
        const file = await fetch(imageUrl);

        if (!file.ok) {
          console.error(`Failed to fetch the file from URL: ${imageUrl}`);
          return { error: `Failed to fetch the file from URL: ${imageUrl}` };
        }

        const fileBuffer = await file.arrayBuffer();

        const res = await nango.post({
          endpoint: "/upload/drive/v3/files?uploadType=media",
          providerConfigKey: "google-drive",
          connectionId: "test-connection-id",
          data: fileBuffer,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!res.data.id) {
          console.error(`Failed to upload file from URL: ${imageUrl}`);
          return { error: `Failed to upload file from URL: ${imageUrl}` };
        }

        const rename = await nango.patch({
          endpoint: `/drive/v3/files/${res.data.id}`,
          providerConfigKey: "google-drive",
          connectionId: "test-connection-id",
          data: {
            name: v4(),
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`Successfully uploaded and renamed file:`, rename.data);
      } catch (error) {
        console.error(`Error processing image URL: ${imageUrl}`, error);
        return { error: `Error processing image URL: ${imageUrl}` };
      }
    }

    return { success: "All files uploaded successfully" };
  } catch (error) {
    console.error("ERROR", error);
    return { error: "Some error occurred. Please try again" };
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
