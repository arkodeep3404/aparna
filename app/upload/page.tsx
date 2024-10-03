"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1MXeQjif3Wt9h812YbgSnJhVJrZYb5xca-t81iFy7e5g/edit?gid=0#gid=0"
  );
  const [sheetName, setSheetName] = useState<string>("Sheet1");
  const [columnName, setColumnName] = useState<string>("A");
  const [userPrompt, setUserPrompt] = useState<string>(
    "fetch the images urls from the google sheet and then upload the images to google drive"
  );
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitted(true);

      const res = await axios.post("/api/manage", {
        spreadsheetUrl: spreadsheetUrl,
        sheetName: sheetName,
        columnName: columnName,
        userPrompt: userPrompt,
      });

      console.log("File uploaded:", res.data);
      alert(res.data.success);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error);
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <div className="m-10">
      <form className="flex flex-col gap-5" onSubmit={(e) => handleUpload(e)}>
        <Label className="font-bold" htmlFor="spreadsheetUrl">
          G Sheet Url
        </Label>
        <Input
          type="string"
          placeholder="G Sheet Url"
          value={spreadsheetUrl}
          onChange={(e) => setSpreadsheetUrl(e.target.value)}
          id="spreadsheetUrl"
          required
        />

        <Label className="font-bold" htmlFor="sheetName">
          G Sheet Name
        </Label>
        <Input
          type="string"
          placeholder="G Sheet Name"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          id="sheetName"
          required
        />

        <Label className="font-bold" htmlFor="columnName">
          Column Name
        </Label>
        <Input
          type="string"
          placeholder="Column Name"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          id="columnName"
          required
        />

        <Label className="font-bold" htmlFor="userPrompt">
          User Prompt
        </Label>
        <Input
          type="string"
          placeholder="User Prompt"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          id="userPrompt"
          required
        />

        <Button disabled={submitted} type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}
