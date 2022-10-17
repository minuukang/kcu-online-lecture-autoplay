import { BrowserContext, Frame } from "playwright";

export function getLectures(context: BrowserContext, page: Frame) {
  return {
    async *[Symbol.asyncIterator]() {
      const rows = page
        .locator(".list_table tbody tr")
        .filter({ has: page.locator(".btn-lec-play-stu") });
      const rowCount = await rows.count();
      for (let i = 0; i < rowCount; i++) {
        const row = await rows.nth(i);
        const title = await row.locator("> td:nth-child(3)").textContent();
        const enterButton = row.locator(".btn-lec-play-stu");
        const enterButtonText = (await enterButton.textContent())?.trim();
        if (enterButtonText === "수강하기") {
          await enterButton.click();
          const videoPage = await context.waitForEvent("page", (page) =>
            page.url().startsWith("https://vod.kcu.or.kr")
          );
          if (!videoPage) {
            throw new Error(`video page is not exists`);
          }
          await videoPage.waitForLoadState("load");
          // await videoPage.exposeFunction("onConsole", console.log);
          yield { title, success: false as const, page: videoPage };
          await videoPage.close();
        } else {
          yield { title, success: true as const };
        }
      }
    },
  };
}
