import "dotenv/config";
import playwright from "playwright";
import { applyLecture } from "./services/applyLecture";
import { checkSupportVideo } from "./services/checkSupportVideo";
import { getAuthenicationCookie } from "./services/getAuthorizationCookie";
import { getLectures } from "./services/getLectures";
import { getSubjects } from "./services/getSubjects";
import { normalizeTitle } from "./utils/normalize";

type Env = {
  id: string;
  password: string;
  headless: boolean;
  executablePath?: string;
};

const env = {
  id: process.env.KCU_ID,
  password: process.env.KCU_PASSWORD,
  headless: process.env.HEADLESS === "1",
  executablePath: process.env.EXECUTABLE_BROWSER_PATH,
};

if (!env.id || !env.password) {
  console.error(env);
  throw new Error(".env is not valid.");
} else {
  handler(env as Env);
}

async function handler(env: Env) {
  const browser = await playwright.chromium.launch({
    headless: env.headless,
    executablePath: env.executablePath,
  });
  const context = await browser.newContext();

  try {
    // Check video support
    await checkSupportVideo(context);

    const tokenCookie = await getAuthenicationCookie(env);
    if (!tokenCookie) {
      throw new Error("authenticate error");
    }
    await context.addCookies([tokenCookie]);

    let checkSuccess = false;
    while (checkSuccess === false) {
      checkSuccess = true;
      for await (const { page, title } of getSubjects(context)) {
        console.log(`📚 ${normalizeTitle(title)}`);
        for await (const lecture of getLectures(context, page)) {
          console.log(
            `\t${lecture.success ? "✔️" : "❌"} ${normalizeTitle(
              lecture.title
            )}`
          );
          if (!lecture.success) {
            checkSuccess = false;
            await applyLecture(lecture.page);
          }
        }
      }
      if (checkSuccess === false) {
        console.log("한번만 더 체크할게요!");
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      throw err;
    }
  } finally {
    await browser.close();
  }
}
