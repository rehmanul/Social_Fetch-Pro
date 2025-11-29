import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import axios from "axios";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env.local") });

const combinedCookie = `sessionid=${process.env.TIKTOK_SESSION_ID}; ${process.env.TIKTOK_COOKIE}`;
const response = await axios.get("https://www.tiktok.com/@clipsexclusive_", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Cookie: combinedCookie,
  },
  timeout: 20000,
  validateStatus: () => true,
});

const $ = cheerio.load(response.data);
const universalRaw = $("script#__UNIVERSAL_DATA_FOR_REHYDRATION__").first().html();
const payload = JSON.parse(universalRaw);

// Check webapp.user-detail
const userDetail = payload.__DEFAULT_SCOPE__["webapp.user-detail"];
if (userDetail) {
  console.log("webapp.user-detail keys:", Object.keys(userDetail));
  if (userDetail.itemList) {
    console.log("itemList length:", userDetail.itemList.length);
    if (userDetail.itemList.length > 0) {
      console.log("\nFirst video:");
      console.log(JSON.stringify(userDetail.itemList[0], null, 2).substring(0, 1000));
    }
  }
}
