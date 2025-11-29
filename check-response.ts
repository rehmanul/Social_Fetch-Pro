import * as fs from "fs";

const html = fs.readFileSync("tiktok-direct-response.html", "utf-8");

console.log("File size:", html.length);
console.log("Has tiktok:", html.includes("tiktok"));
console.log("Has SIGI_STATE:", html.includes("SIGI_STATE"));
console.log("Has __UNIVERSAL_DATA_FOR_REHYDRATION__:", html.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__"));
console.log("Has ItemModule:", html.includes("ItemModule"));
console.log("Has <script>:", html.includes("<script>"));
console.log("Has <script:", html.includes("<script"));

// Find the script tag with ID
const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"/);
console.log("Script tag match:", scriptMatch ? "FOUND" : "NOT FOUND");

// Search for any script with that ID attribute
const scriptIdMatch = html.match(/id="__UNIVERSAL_DATA_FOR_REHYDRATION__"/);
console.log("ID attribute match:", scriptIdMatch ? "FOUND" : "NOT FOUND");
