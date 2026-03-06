import { NextResponse } from "next/server";
import { appendRegistration, appendWaitlist, getAllAvailability } from "@/lib/sheets";
import { Resend } from "resend";

export const maxDuration = 30;

const resend = new Resend(process.env.RESEND_API_KEY);

const MEMBER_CLUB = "Järvenpään Jousiampujat";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function canSendEmail(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!key && !key.includes("REPLACE_ME");
}

function validateBody(body: unknown): { valid: true; data: {
  name: string; age: string; club: string; category: string; email: string;
  waitlist?: boolean; preferredCategory?: string;
}} | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const age = typeof b.age === "string" ? b.age.trim() : "";
  const club = typeof b.club === "string" ? b.club.trim() : "";
  const category = typeof b.category === "string" ? b.category.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const waitlist = typeof b.waitlist === "boolean" ? b.waitlist : false;
  const preferredCategory = typeof b.preferredCategory === "string" ? b.preferredCategory.trim() : undefined;

  if (!name || name.length > 100) return { valid: false, error: "Invalid name" };
  if (!age || age.length > 10) return { valid: false, error: "Invalid age" };
  if (!club || club.length > 100) return { valid: false, error: "Invalid club" };
  if (!category || category.length > 20) return { valid: false, error: "Invalid category" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: "Invalid email" };

  return { valid: true, data: { name, age, club, category, email, waitlist, preferredCategory } };
}

export async function POST(req: Request) {
  const raw = await req.json();
  const result = validateBody(raw);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const body = result.data;

  // Waitlist path
  if (body.waitlist && body.preferredCategory) {
    await appendWaitlist({
      name: body.name,
      preferredCategory: body.preferredCategory,
      email: body.email,
    });

    if (canSendEmail()) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: body.email,
        subject: "Jonotuslistalle lisätty - Kevät Flint 26",
        html: `<p>Hei ${esc(body.name)},</p><p>Sinut on lisätty jonotuslistalle luokkaan <strong>${esc(body.preferredCategory)}</strong>. Otamme sinuun yhteyttä, jos paikka vapautuu.</p><p>Terveisin,<br>Järvenpään Jousiampujat</p>`,
      });

      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: process.env.ORGANIZER_EMAIL!,
        subject: `Jonotuslista: ${esc(body.name)} - ${esc(body.preferredCategory)}`,
        html: `<p>Nimi: ${esc(body.name)}<br>Toivottu luokka: ${esc(body.preferredCategory)}<br>Email: ${esc(body.email)}</p>`,
      });
    }

    return NextResponse.json({ success: true, waitlisted: true });
  }

  // Normal registration path — single Sheets call for both availability and pricing
  const categories = await getAllAvailability();
  const catInfo = categories[body.category];

  if (!catInfo || !catInfo.available) {
    return NextResponse.json({ error: "full", category: body.category }, { status: 409 });
  }

  const isMember = body.club.toLowerCase().includes(MEMBER_CLUB.toLowerCase());
  const price = isMember ? catInfo.memberPrice : catInfo.price;

  await appendRegistration({
    name: body.name,
    age: body.age,
    club: body.club,
    category: body.category,
    email: body.email,
    price,
  });

  if (canSendEmail()) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: body.email,
      subject: "Ilmoittautuminen vastaanotettu - Kevät Flint 26",
      html: `<h2>Ilmoittautuminen vastaanotettu!</h2>
<p>Hei ${esc(body.name)},</p>
<p>Ilmoittautumisesi Kevät Flint 26 -kilpailuun on vastaanotettu. Tässä yhteenveto:</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Nimi:</td><td>${esc(body.name)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Ikä:</td><td>${esc(body.age)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Seura:</td><td>${esc(body.club)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Luokka:</td><td>${esc(body.category)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hinta:</td><td>${price} €</td></tr>
</table>
<p><strong>Maksuohjeet:</strong></p>
<ul>
  <li>Summa: ${price} €</li>
  <li>Pankkitili: FI00 0000 0000 0000 00</li>
  <li>Saaja: Järvenpään Jousiampujat</li>
  <li>Viite: ${esc(body.name)} ${esc(body.category)}</li>
  <li>Eräpäivä: 5.4.2026</li>
</ul>
<p><strong>Kilpailupaikka:</strong> Jokihalli, Kuusitie 36, Järvenpää</p>
<p><strong>Aikataulu 12.4.2026:</strong></p>
<ul>
  <li>Ilmoittautuminen: 9:00</li>
  <li>Kilpailu alkaa: 10:00</li>
  <li>Palkintojenjako: 15:00</li>
</ul>
<p>Terveisin,<br>Järvenpään Jousiampujat</p>`,
    });

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.ORGANIZER_EMAIL!,
      subject: `Uusi ilmoittautuminen: ${esc(body.name)} - ${esc(body.category)}`,
      html: `<p>Nimi: ${esc(body.name)}<br>Ikä: ${esc(body.age)}<br>Seura: ${esc(body.club)}<br>Luokka: ${esc(body.category)}<br>Hinta: ${price} €<br>Email: ${esc(body.email)}</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
