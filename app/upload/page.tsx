"use client";

import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(
    "https://docs.google.com/spreadsheets/d/1MXeQjif3Wt9h812YbgSnJhVJrZYb5xca-t81iFy7e5g/edit?gid=0#gid=0"
  );
  const [sheetName, setSheetName] = useState<string | null>("Sheet1");
  const [columnName, setColumnName] = useState<string | null>("A");
  const [userPrompt, setUserPrompt] = useState<string | null>(
    "fetch the images urls from the google sheet and then upload the images to google drive"
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!file) {
    //   alert("Please select a file.");
    //   return;
    // }

    // const formData = new FormData();
    // formData.append("file", file);

    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        body: JSON.stringify({
          spreadsheetUrl: spreadsheetUrl,
          sheetName: sheetName,
          columnName: columnName,
          userPrompt: userPrompt,
        }),
      });

      const result = await res.json();
      console.log("File uploaded:", result);
      alert(JSON.stringify(result));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="file" onChange={handleFileChange} />
      <button type="submit">Upload</button>
    </form>
  );
}
