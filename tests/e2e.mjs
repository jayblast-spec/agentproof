import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.AGENTPROOF_URL ?? "http://localhost:3417";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotDir = new URL("../test-results/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const results = [];

async function checkViewport(name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Test agents before they touch reality." }).waitFor();
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.screenshot({ path: `${screenshotDir}/home-${name}.png`, fullPage: true });

  await page.goto(`${baseUrl}/lab`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Agent test laboratory" }).waitFor();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(new URL("./fixtures/blocked-agent.zip", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
  await page.getByText(/Only declarative .json manifests are accepted/).waitFor();
  await fileInput.setInputFiles(new URL("./fixtures/invalid-agent.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
  await page.getByText(/Manifest rejected/).waitFor();
  await fileInput.setInputFiles(new URL("../examples/agent-manifest.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
  await page.waitForFunction(
    () => document.querySelector('input:not([type="file"])')?.value === "Ledger Finance Agent",
  );
  const runButton = page.getByRole("button", { name: /Run 10000 simulations/ });
  await runButton.click();
  await page.getByText("Readiness", { exact: true }).first().waitFor({ timeout: 30000 });
  await page.getByText("10,000", { exact: true }).waitFor();
  await page.getByTestId("evidence-mode").filter({ hasText: "synthetic evidence" }).waitFor();
  await page.getByTestId("endpoint-status").filter({ hasText: "Endpoint not contacted" }).waitFor();
  const score = await page.locator(".score-ring strong").innerText();
  const labOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${screenshotDir}/lab-result-${name}.png`, fullPage: true });

  await page.getByRole("button", { name: "New run" }).click();
  await page.getByRole("button", { name: "Live connector" }).click();
  await page.getByRole("button", { name: "Execute 100 live connector trials" }).click();
  await page.getByTestId("evidence-mode").filter({ hasText: "live execution evidence" }).waitFor({ timeout: 30000 });
  await page.getByTestId("endpoint-status").filter({ hasText: "Endpoint contacted" }).waitFor();
  const liveSignatureVerified = await page.getByText("Signature verified", { exact: true }).isVisible();
  const liveToolEffectsIntercepted = await page.getByText("Tool effects intercepted", { exact: true }).isVisible();
  const liveTrialCount = await page.getByText("100", { exact: true }).first().isVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${screenshotDir}/lab-live-${name}.png`, fullPage: true });

  await page.goto(`${baseUrl}/projects`, { waitUntil: "networkidle" });
  await page.getByText("Ledger Finance Agent", { exact: true }).first().waitFor();
  const savedRunVisible = await page.getByText("10,000 trials", { exact: false }).first().isVisible();
  await page.screenshot({ path: `${screenshotDir}/projects-${name}.png`, fullPage: true });

  await page.goto(`${baseUrl}/reports/sample`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reset report" }).click();
  await page.getByRole("heading", { name: "No test result loaded" }).waitFor();
  const resetClearedPreviousResult = !(await page.getByText("Atlas Support Agent", { exact: true }).isVisible().catch(() => false));

  await page.goto(`${baseUrl}/connectors`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Connect Agent Runner" }).waitFor();
  const connectorOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  let pairingSuccess = true;
  let jobQueued = true;
  if (name === "desktop") {
    const pairingKey = process.env.AGENTPROOF_PAIRING_KEY;
    if (!pairingKey) throw new Error("AGENTPROOF_PAIRING_KEY is required for connector UI verification.");
    await page.getByLabel("Runner name").fill(`Browser Runner ${Date.now()}`);
    await page.getByLabel("Pairing key").fill(pairingKey);
    await page.getByRole("button", { name: "Pair runner" }).click();
    await page.getByText("Runner paired", { exact: true }).waitFor({ timeout: 30000 });
    pairingSuccess = await page.getByRole("button", { name: "Download config" }).isVisible();
    await page.getByRole("button", { name: "Queue signed test job" }).click();
    await page.getByText("Job queued", { exact: true }).waitFor({ timeout: 30000 });
    jobQueued = true;
  }
  await page.screenshot({ path: `${screenshotDir}/connectors-${name}.png`, fullPage: true });

  results.push({
    viewport: name,
    homeOverflow,
    labOverflow,
    score,
    savedRunVisible,
    liveSignatureVerified,
    liveToolEffectsIntercepted,
    liveTrialCount,
    resetClearedPreviousResult,
    connectorOverflow,
    pairingSuccess,
    jobQueued,
    consoleErrors,
  });
  await context.close();
}

try {
  await checkViewport("desktop", { width: 1440, height: 1000 });
  await checkViewport("mobile", { width: 390, height: 844 });
  const failed = results.some(
    (result) =>
      result.homeOverflow ||
      result.labOverflow ||
      result.connectorOverflow ||
      !result.savedRunVisible ||
      !result.liveSignatureVerified ||
      !result.liveToolEffectsIntercepted ||
      !result.liveTrialCount ||
      !result.resetClearedPreviousResult ||
      !result.pairingSuccess ||
      !result.jobQueued ||
      result.consoleErrors.length > 0,
  );
  console.log(JSON.stringify({ passed: !failed, results }, null, 2));
  if (failed) process.exitCode = 1;
} finally {
  await browser.close();
}
