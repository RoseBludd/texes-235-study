/**
 * Verifies production deployment: status 200 and branding present.
 * Usage: node scripts/verify-production.js [URL]
 *   Or set PRODUCTION_URL (required if no CLI arg).
 */
const productionUrl = process.env.PRODUCTION_URL || process.argv[2] || "";

async function main() {
  if (!productionUrl) {
    console.error("Usage: node scripts/verify-production.js <URL>  or  set PRODUCTION_URL");
    process.exit(1);
  }
  console.log("Verifying production:", productionUrl);
  let res;
  try {
    res = await fetch(productionUrl, {
      redirect: "follow",
      headers: { "User-Agent": "VerifyProduction/1.0" },
    });
  } catch (err) {
    console.error("Fetch failed:", err.message);
    process.exit(1);
  }

  const ok = res.ok;
  const status = res.status;
  const html = await res.text();

  const hasTitle = html.includes("TExES 235 Math 7–12 Study");
  const hasSubtitle = html.includes("TExES Math 7–12 (235)");
  const noStudyIdUi = !html.includes("Your study ID") && !html.includes("Link this browser");

  console.log("Status:", status, ok ? "OK" : "FAIL");
  console.log("Title 'Doctor Alex Practice':", hasTitle ? "YES" : "NO");
  console.log("Subtitle 'genius MCAT exam practice':", hasSubtitle ? "YES" : "NO");
  console.log("Single-user default (no paste/link UI):", noStudyIdUi ? "YES" : "NO");

  if (ok && hasTitle && hasSubtitle && noStudyIdUi) {
    console.log("\nProduction verification PASSED.");
    process.exit(0);
  }

  if (!ok) console.error("Expected 2xx, got", status);
  if (!hasTitle) console.error("Missing branding title in response.");
  if (!hasSubtitle) console.error("Missing subtitle in response.");
  if (!noStudyIdUi) console.error("Unexpected study ID / link UI (single-user default expected).");
  console.log("\nProduction verification FAILED.");
  process.exit(1);
}

main();
