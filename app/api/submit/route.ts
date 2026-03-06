import { NextResponse } from "next/server";
import { checkAvailability, appendRegistration, appendWaitlist, getAllAvailability } from "@/lib/sheets";
import { Resend } from "resend";
import type { SubmitRequest } from "@/types";

export const maxDuration = 30;

const resend = new Resend(process.env.RESEND_API_KEY);

const MEMBER_CLUB = "Järvenpään Jousiampujat";

export async function POST(req: Request) {
  const body: SubmitRequest = await req.json();

  // Waitlist path
  if (body.waitlist && body.preferredCategory) {
    await appendWaitlist({
      name: body.name,
      preferredCategory: body.preferredCategory,
      email: body.email,
    });

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("REPLACE_ME")) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: body.email,
        subject: "Jonotuslistalle lisätty - Kevät Flint 26",
        html: `<p>Hei ${body.name},</p><p>Sinut on lisätty jonotuslistalle luokkaan <strong>${body.preferredCategory}</strong>. Otamme sinuun yhteyttä, jos paikka vapautuu.</p><p>Terveisin,<br>Järvenpään Jousiampujat</p>`,
      });

      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: process.env.ORGANIZER_EMAIL!,
        subject: `Jonotuslista: ${body.name} - ${body.preferredCategory}`,
        html: `<p>Nimi: ${body.name}<br>Toivottu luokka: ${body.preferredCategory}<br>Email: ${body.email}</p>`,
      });
    }

    return NextResponse.json({ success: true, waitlisted: true });
  }

  // Normal registration path
  const available = await checkAvailability(body.category);
  if (!available) {
    return NextResponse.json({ error: "full", category: body.category }, { status: 409 });
  }

  // Determine price based on club membership
  const categories = await getAllAvailability();
  const catInfo = categories[body.category];
  const isMember = body.club.toLowerCase().includes(MEMBER_CLUB.toLowerCase());
  const price = catInfo ? (isMember ? catInfo.memberPrice : catInfo.price) : 0;

  await appendRegistration({
    name: body.name,
    age: body.age,
    club: body.club,
    category: body.category,
    email: body.email,
    price,
  });

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("REPLACE_ME")) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: body.email,
      subject: "Ilmoittautuminen vastaanotettu - Kevät Flint 26",
      html: `<h2>Ilmoittautuminen vastaanotettu!</h2>
<p>Hei ${body.name},</p>
<p>Ilmoittautumisesi Kevät Flint 26 -kilpailuun on vastaanotettu. Tässä yhteenveto:</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Nimi:</td><td>${body.name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Ikä:</td><td>${body.age}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Seura:</td><td>${body.club}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Luokka:</td><td>${body.category}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Hinta:</td><td>${price} €</td></tr>
</table>
<p><strong>Maksuohjeet:</strong></p>
<ul>
  <li>Summa: ${price} €</li>
  <li>Pankkitili: FI00 0000 0000 0000 00</li>
  <li>Saaja: Järvenpään Jousiampujat</li>
  <li>Viite: ${body.name} ${body.category}</li>
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
      subject: `Uusi ilmoittautuminen: ${body.name} - ${body.category}`,
      html: `<p>Nimi: ${body.name}<br>Ikä: ${body.age}<br>Seura: ${body.club}<br>Luokka: ${body.category}<br>Hinta: ${price} €<br>Email: ${body.email}</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
