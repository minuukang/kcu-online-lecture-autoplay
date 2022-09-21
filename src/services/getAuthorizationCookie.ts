import fetch, { Headers } from "node-fetch";
import cookie from "cookie";

const authencationCookieName = "kcu";

export async function getAuthenicationCookie({
  id,
  password,
}: {
  id: string;
  password: string;
}) {
  const response = await fetch(
    "https://www.kcu.ac/Login/Login_Check.asp?returnURL=",
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Referer: "https://www.kcu.ac/login/login.asp?loginType=05",
      },
      body: `Run=&UserID=${encodeURIComponent(
        id
      )}&Password=${encodeURIComponent(password)}&LoginUserID_SAVE=Y`,
      method: "POST",
    }
  );
  const resHeaders = new Headers(response.headers);
  const cookies = cookie.parse(resHeaders.get("Set-Cookie") || "");
  if (!cookies[authencationCookieName]) {
    return null;
  }
  return {
    name: authencationCookieName,
    value: cookies[authencationCookieName],
    domain: "www.kcu.ac",
    path: "/",
  };
}
