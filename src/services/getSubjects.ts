import { BrowserContext } from "playwright";

export function getSubjects(context: BrowserContext) {
  return {
    async *[Symbol.asyncIterator]() {
      const page = await context.newPage();
      await page.goto(
        `https://www.kcu.ac/2009/mycampus/student/subject/subject_list.asp`
      );
      const subjects = await page.$$(
        ".table_head_blue tbody tr td:first-child a"
      );
      for (const subjectEnterButton of subjects) {
        await subjectEnterButton.click();
        const popup = await page.waitForEvent("popup");
        await popup.waitForNavigation();
        const frame = await (
          await popup.$("frame[name=mainFrame]")
        )?.contentFrame();
        if (!frame) {
          throw new Error(`MainFrame is not exists at page (${popup.url()})`);
        }
        await frame.click(".go-lec-menu");
        await frame.waitForNavigation();
        yield {
          title: (await subjectEnterButton.textContent())?.trim(),
          page: frame,
        };
        await popup.close();
      }
    },
  };
}
