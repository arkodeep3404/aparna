"use client";

import Nango from "@nangohq/frontend";
import { Button } from "@/components/ui/button";

export default function Home() {
  async function gSheetAuth() {
    const nango = new Nango({
      host: "https://ng.orom.club",
      publicKey: "2361e13d-7489-407b-9b5d-af9a2d59cf9d",
    });

    nango
      .auth("google-sheet", "test-connection-id")
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async function gDriveAuth() {
    const nango = new Nango({
      host: "https://ng.orom.club",
      publicKey: "2361e13d-7489-407b-9b5d-af9a2d59cf9d",
    });

    nango
      .auth("google-drive", "test-connection-id")
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="m-10 flex gap-5">
      <Button onClick={gSheetAuth}>Google Sheet Auth</Button>
      <Button onClick={gDriveAuth}>Google Drive Auth</Button>
    </div>
  );
}
