import { multicall, testnetProvider } from "./providers";
import PriceFeedABI from "../abis/PriceFeedABI.json";
import flatten from "lodash/flatten";
import chunk from "lodash/chunk";
import { utils } from "ethers";
import { SavePriceListResults } from "./kv";

const priceFeedList = [
  // BNB/USD
  "0xC5A35FC58EFDC4B88DDCA51AcACd2E8F593504bE",
  // ETH/USD
  "0x7a023F0346a564F5e8942dae1342c2bB42909406",
  // BTC/USD
  "0x83968bCa5874D11e02fD80444cDDB431a1DbEc0f",
];

const priceCalls = (address: string) => {
  return [
    {
      address,
      name: "BASE",
    },
    {
      address,
      name: "latestAnswer",
    },
  ];
};
export const priceFetcher = async () => {
  try {
    const priceMulticallResults = await multicall.multicallv2({
      chainId: 56,
      abi: PriceFeedABI,
      calls: priceFeedList.flatMap(priceCalls),
    });

    return chunk(flatten(priceMulticallResults), 2).map(
      (value: Array<any>): Array<SavePriceListResults> => ({
        token: value[0],
        price: utils.formatUnits(value[1], 8),
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.log(error);
  }
};

function isString(s: any): s is string {
  return typeof s === "string" || s instanceof String;
}

export function isOriginAllowed(origin: string | null, allowedOrigin: any) {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true;
      }
    }
    return false;
  }
  if (isString(allowedOrigin)) {
    return origin === allowedOrigin;
  }
  if (origin && allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  }
  return !!allowedOrigin;
}

export const handleCors = (allowedOrigin: any) => (request: Request) => {
  const reqOrigin = request.headers.get("origin");
  const isAllowed = isOriginAllowed(reqOrigin, allowedOrigin);
  const methods = `GET, HEAD, OPTIONS`;
  const headers = `referer, origin, content-type`;
  if (isAllowed && reqOrigin) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": reqOrigin,
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": headers,
    };
    // Handle CORS pre-flight request.
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  console.info("Origin not allowed", reqOrigin);
  // Handle standard OPTIONS request.
  return new Response(null, {
    headers: {
      Allow: methods,
    },
  });
};
