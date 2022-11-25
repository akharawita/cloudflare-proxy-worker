/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router } from "itty-router";
import { error, json, missing, text } from "itty-router-extras";
import { testnetProvider } from "./providers";
import { utils } from "ethers";
import { ThothKV } from "./kv";
import { priceFetcher, handleCors } from "./helper";

const router = Router();
const allowedOrigin = /[^\w](localhost:3000)$/;

router.get(
  "/:address/balance",
  async ({ params }: { params: { address: string } }) => {
    const { address } = params;
    try {
      const balance = await testnetProvider.getBalance(address);
      const amount = utils.formatEther(balance);

      const saveThoth = {
        balance: amount,
        updatedAt: new Date().toISOString(),
      };

      await ThothKV.saveThoth(address, saveThoth);

      return json({
        address,
        ...saveThoth,
      });
    } catch (e) {
      console.error(e);
      return error(500, `Can not found your ${address} balance!`);
      // throw new Error(`Can not found your ${address} balance!`);
    }
  }
);

router.get("/prices", async () => {
  const cached = await ThothKV.getTokenPrices();
  if (!cached) {
    console.log("Price feed no cached!");

    try {
      const prices = (await priceFetcher()) ?? [];
      const result = await ThothKV.saveTokenPrice(prices);
      return json(result);
    } catch (e) {
      console.log(e);
      return error(500, "Fetch price feed error");
    }
  }

  return json(cached);
});

router.get("/:address", async ({ params }: { params: { address: string } }) => {
  const { address } = params;
  try {
    const data = await ThothKV.getThoth(address);

    if (!data) {
      return error(400, "Invalid address");
    }

    return json(data);
  } catch (e) {
    console.error(e);
    return error(500, `Can not found your ${address} balance!`);
    // throw new Error(`Can not found your ${address} balance!`);
  }
});

// 404 for everything else
router.all("*", () => missing("Not Found."));
router.options("*", handleCors(allowedOrigin));

// attach the router "handle" to the event handler
addEventListener("fetch", (event) =>
  event.respondWith(router.handle(event.request))
);

addEventListener("scheduled", (event) => {
  event.waitUntil(handleScheduled(event));
});

// eslint-disable-next-line consistent-return
async function handleScheduled(event: ScheduledEvent) {
  switch (event.cron) {
    case "*/1 * * * *":
    case "*/2 * * * *": {
      console.log("con", event.cron);
      const prices = (await priceFetcher()) ?? [];
      const result = await ThothKV.saveTokenPrice(prices);
      console.log(JSON.stringify(prices));
      return result;
    }
    default:
      break;
  }
}
