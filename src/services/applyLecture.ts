import { Page } from "playwright";

declare global {
  interface Window {
    onConsole?: (_: { status?: string }) => void;
  }
}

export async function applyLecture(videoPage: Page) {
  while (true) {
    try {
      const mainFrame = videoPage.frame("mainFrame");
      if (!mainFrame) {
        throw new Error("main frame is not exists");
      }
      if ((await mainFrame.locator("#playerframe").count()) != 0) {
        await mainFrame
          .frameLocator("#playerframe")
          .locator("video")
          .evaluate(() => {
            return new Promise<void>((resolve, reject) => {
              const statusElement = document.querySelector(
                ".control_text_status"
              )!;
              let timeoutReject = 0;
              const statusMutation = new MutationObserver(() => {
                const status = statusElement.textContent?.trim();
                window.onConsole?.({ status: status });
                switch (status) {
                  case "정지": {
                    window.clearTimeout(timeoutReject);
                    resolve();
                    break;
                  }
                  case "준비": {
                    timeoutReject = window.setTimeout(() => reject(), 10000);
                    break;
                  }
                  case "열림": {
                    window.clearTimeout(timeoutReject);
                    document
                      .querySelector(".btn_play")
                      ?.dispatchEvent(new MouseEvent("click"));
                    progressStart();
                    break;
                  }
                }
              });
              statusMutation.observe(statusElement, {
                childList: true,
                subtree: true,
              });

              timeoutReject = window.setTimeout(() => reject(), 10000);

              function progressStart() {
                // Check currentTime from seek thumb style mutation
                let prevCurrentTime = 0;
                const currentTimeEl =
                  document.querySelector("#text_currentTime")!;
                const durationTimeEl = document.querySelector("#text_duration");
                const progressMutation = new MutationObserver(() => {
                  const currentTimeText = currentTimeEl.textContent!;
                  const currentTime = currentTimeText
                    .split(":")
                    .map(Number)
                    .reverse()
                    .reduce((result, value, index) => {
                      return result + value * Math.pow(60, index);
                    }, 0);
                  if (prevCurrentTime !== currentTime) {
                    console.log({
                      type: "timeupdate",
                      currentTime: currentTime,
                    });
                  }
                  if (
                    durationTimeEl?.textContent === currentTimeEl.textContent
                  ) {
                    resolve();
                  }
                  prevCurrentTime = currentTime;
                });
                document
                  .querySelector("#starplayer")
                  ?.addEventListener("ended", () => resolve());
                progressMutation.observe(document.querySelector(".btn_seek")!, {
                  attributes: true,
                });
              }
            });
          });
      }

      try {
        const [currentPage, totalPage] = await Promise.all([
          mainFrame.locator("#currentPage").textContent({ timeout: 1000 }),
          mainFrame.locator("#totalPage").textContent({ timeout: 1000 }),
        ]);
        if (
          currentPage &&
          totalPage &&
          currentPage.trim() === totalPage.trim()
        ) {
          break;
        }
      } catch {}

      do {
        try {
          await mainFrame.locator("#nextBtn").click();
          await mainFrame.waitForNavigation({ timeout: 3000 });
          break;
        } catch (err) {
          // console.error(err);
        }
      } while (1);
    } catch (e) {
      await videoPage.reload();
    }
  }
}
