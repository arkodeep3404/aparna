"use client";

import Nango from "@nangohq/frontend";

export default function Home() {
  async function auth() {
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
    <div>
      <button onClick={auth}>click me</button>
    </div>
  );
}
