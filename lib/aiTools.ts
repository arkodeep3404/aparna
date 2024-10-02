import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getImageUrls } from "@/lib/getImageUrls";
import { uploadImages } from "@/lib/uploadImages";

export const getImageUrlsTool = tool(
  async ({ spreadsheetUrl, sheetName, columnName }) => {
    return await getImageUrls(spreadsheetUrl, sheetName, columnName);
  },
  {
    name: "Get-Image-Urls-Tool",
    description: "Use this tool to get image urls array from a google sheet",
    schema: z.object({
      spreadsheetUrl: z.string().describe("the url of the google sheet"),
      sheetName: z.string().describe("the sheet name of the google sheet"),
      columnName: z
        .string()
        .describe("the column name containing the image urls"),
    }),
  }
);

export const uploadImagesTool = tool(
  async ({ imageUrlsArray }) => {
    return await uploadImages(imageUrlsArray);
  },
  {
    name: "Upload-Images-Tool",
    description: "Use this tool to upload images to google drive",
    schema: z.object({
      imageUrlsArray: z
        .array(z.string())
        .describe("array containing urls of the images to be uploaded"),
    }),
  }
);
