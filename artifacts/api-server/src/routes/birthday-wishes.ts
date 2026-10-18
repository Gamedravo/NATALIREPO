import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import {
  SendBirthdayWishBody,
  SendBirthdayWishResponse,
  UnlockBirthdayWishBody,
  UnlockBirthdayWishResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const PASSCODE = "1604";
const WINDOW_MS = 15 * 60 * 1000;
const ACCESS_COOKIE = "natali_wish_access";
const failedUnlocks = new Map<string, { count: number; expiresAt: number }>();
const submissions = new Map<string, { count: number; expiresAt: number }>();

function ipKey(ip: string | undefined) {
  return ip || "unknown";
}

function isRateLimited(
  bucket: Map<string, { count: number; expiresAt: number }>,
  key: string,
  limit: number,
) {
  const now = Date.now();
  for (const [entryKey, entry] of bucket) {
    if (entry.expiresAt <= now) bucket.delete(entryKey);
  }

  const current = bucket.get(key);
  if (!current || current.expiresAt <= now) {
    bucket.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }
  if (current.count >= limit) return true;
  current.count += 1;
  return false;
}

router.post("/birthday-wishes/unlock", (req, res): void => {
  const parsed = UnlockBirthdayWishBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter the four-digit birthday code." });
    return;
  }

  const key = ipKey(req.ip);
  if (failedUnlocks.get(key)?.count && failedUnlocks.get(key)!.count >= 8) {
    res.status(429).json({ error: "Please wait a little before trying again." });
    return;
  }

  if (parsed.data.passcode !== PASSCODE) {
    isRateLimited(failedUnlocks, key, 8);
    res.status(401).json({ error: "That code did not open the envelope." });
    return;
  }
  failedUnlocks.delete(key);

  if (!process.env.SESSION_SECRET) {
    req.log.error("Wish form unlock unavailable: session signing secret is not configured");
    res.status(503).json({ error: "The wish box is taking a tiny break. Please try later." });
    return;
  }

  res.cookie(ACCESS_COOKIE, "yes", {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: 20 * 60 * 1000,
  });
  res.json(UnlockBirthdayWishResponse.parse({ unlocked: true }));
});

router.post("/birthday-wishes", async (req, res): Promise<void> => {
  const parsed = SendBirthdayWishBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please add a short birthday wish before sending." });
    return;
  }
  if (req.signedCookies?.[ACCESS_COOKIE] !== "yes") {
    res.status(401).json({ error: "Open the wish box with its birthday code first." });
    return;
  }

  const key = ipKey(req.ip);
  if (isRateLimited(submissions, key, 5)) {
    res.status(429).json({ error: "The wish box is taking a breather. Please try again later." });
    return;
  }

  // Honeypot submissions receive the same response as real submissions but never send email.
  if (parsed.data.website?.trim()) {
    res.json(SendBirthdayWishResponse.parse({ sent: true }));
    return;
  }

  const message = parsed.data.message.trim().replace(/\r/g, "");
  if (!message) {
    res.status(400).json({ error: "Please add a short birthday wish before sending." });
    return;
  }
  const name = parsed.data.name?.trim().replace(/[\r\n\0]/g, " ").slice(0, 60) || "Someone special";

  try {
    const connectors = new ReplitConnectors();
    const profileResponse = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/profile",
      { method: "GET" },
    );
    if (!profileResponse.ok) {
      req.log.error({ status: profileResponse.status }, "Could not read connected Gmail profile for birthday wish");
      res.status(503).json({ error: "I could not reach my wish inbox just now. Please try again later." });
      return;
    }

    const profile: unknown = await profileResponse.json();
    const emailAddress =
      typeof profile === "object" && profile !== null && "emailAddress" in profile &&
      typeof profile.emailAddress === "string"
        ? profile.emailAddress
        : "";
    if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      req.log.error("Connected Gmail profile did not include a usable email address");
      res.status(503).json({ error: "I could not reach my wish inbox just now. Please try again later." });
      return;
    }

    const mailText = [
      "A birthday wish for Princess Natali!",
      "",
      `From: ${name}`,
      "",
      message,
    ].join("\r\n");
    const rawMessage = [
      `To: ${emailAddress}`,
      `From: ${emailAddress}`,
      "Subject: A birthday wish for Princess Natali",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      mailText,
    ].join("\r\n");
    const sendResponse = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: Buffer.from(rawMessage, "utf8").toString("base64url") }),
      },
    );

    if (!sendResponse.ok) {
      req.log.error({ status: sendResponse.status }, "Gmail did not accept birthday wish email");
      res.status(503).json({ error: "Your wish could not be delivered just now. Please try again later." });
      return;
    }

    res.json(SendBirthdayWishResponse.parse({ sent: true }));
  } catch (error) {
    req.log.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Birthday wish email delivery failed",
    );
    res.status(503).json({ error: "Your wish could not be delivered just now. Please try again later." });
  }
});

export default router;
