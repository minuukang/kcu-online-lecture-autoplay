import { BrowserContext } from "playwright";
import { normalizeTitle } from "../utils/normalize";

const url = "https://www.axissoft.co.kr/solution_test_starplayer.php";
const MAX_RETRY_COUNT = 3;
export async function checkSupportVideo(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForLoadState("load");
  try {
    let retry = 0;
    while (true) {
      const playerFrame = await (await page.$("#playerIframe"))?.contentFrame();
      if (!playerFrame) {
        throw new Error("#playerIframe is not installed in page");
      }
      await playerFrame.locator("#player-container video").waitFor();
      try {
        await Promise.race([
          playerFrame.locator(".btn_pause").waitFor(),
          (async () => {
            await playerFrame.locator(".basic_controls .btn_play").click();
            await playerFrame
              .locator('.control_text_status:has-text("재생 중")')
              .waitFor({ timeout: 3000 });
          })(),
        ]);
        await page.close();
        break;
      } catch (err) {
        console.error(err);
        if (++retry < MAX_RETRY_COUNT) {
          throw new Error("video install wrong...");
        }
        await page.reload();
      }
    }
    return true;
  } catch (err) {
    const playerFrame = await (await page.$("#playerIframe"))?.contentFrame();
    if (!playerFrame) {
      throw new Error("#playerIframe is not installed in page");
    }
    const errorMessage = await (
      await playerFrame.locator("#player-container table").elementHandle()
    )?.textContent();
    throw new Error(normalizeTitle(errorMessage) || "video install error");
  }
}
