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
    range: "Seats!A:D",
  });
  const row = res.data.values?.find((r) => r[0] === category);
  if (!row) return false;
  // Columns: A=Code, B=Name, C=Max, D=Registered
  return parseInt(row[3]) < parseInt(row[2]);
}

export async function getAllAvailability(): Promise<
  Record<string, { name: string; max: number; registered: number; available: boolean; memberPrice: number; price: number }>
> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Seats!A:F",
  });
  const result: Record<
    string,
    { name: string; max: number; registered: number; available: boolean; memberPrice: number; price: number }
  > = {};
  // Columns: A=Code, B=Name, C=Max, D=Registered, E=Member Price, F=Price
  for (const row of res.data.values?.slice(1) ?? []) {
    const name = row[1] || row[0];
    const max = parseInt(row[2]) || 0;
    const registered = parseInt(row[3]) || 0;
    const memberPrice = parseInt(row[4]) || 0;
    const price = parseInt(row[5]) || 0;
    result[row[0]] = { name, max, registered, available: registered < max, memberPrice, price };
  }
  return result;
}

export async function appendRegistration(data: Registration): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Registrations!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          data.name,
          data.age,
          data.club,
          data.category,
          data.email,
          data.price,
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
