import { google } from "googleapis";
import type { Registration } from "@/types";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function checkAvailability(
  category: string
): Promise<boolean> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Seats!A:C",
  });
  const row = res.data.values?.find((r) => r[0] === category);
  if (!row) return false;
  return parseInt(row[2]) < parseInt(row[1]);
}

export async function getAllAvailability(): Promise<
  Record<string, { max: number; registered: number; available: boolean }>
> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Seats!A:C",
  });
  const result: Record<
    string,
    { max: number; registered: number; available: boolean }
  > = {};
  for (const row of res.data.values?.slice(1) ?? []) {
    const max = parseInt(row[1]) || 0;
    const registered = parseInt(row[2]) || 0;
    result[row[0]] = { max, registered, available: registered < max };
  }
  return result;
}

export async function appendRegistration(data: Registration): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Registrations!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          data.name,
          data.birthYear,
          data.club,
          data.category,
          data.email,
        ],
      ],
    },
  });
}

export async function appendWaitlist(data: {
  name: string;
  preferredCategory: string;
  email: string;
}): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Waitlist!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [new Date().toISOString(), data.name, data.preferredCategory, data.email],
      ],
    },
  });
}
