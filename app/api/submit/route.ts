import { NextResponse } from "next/server";
import { checkAvailability, appendRegistration, appendWaitlist } from "@/lib/sheets";
import { Resend } from "resend";
import type { SubmitRequest } from "@/types";

export const maxDuration = 30;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body: SubmitRequest = await req.json();

  // Waitlist path
  if (body.waitlist && body.preferredCategory) {
    await appendWaitlist({
      name: body.name,
      preferredCategory: body.preferredCategory,
      email: body.email,
    });

    if (process.env.RESEND_API_KEY) {
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

  await appendRegistration({
    name: body.name,
    birthYear: body.birthYear,
    club: body.club,
    category: body.category,
    email: body.email,
  });

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: body.email,
      subject: "Ilmoittautuminen vastaanotettu - Kevät Flint 26",
      html: `<p>Hei ${body.name},</p><p>Ilmoittautumisesi luokkaan <strong>${body.category}</strong> on vastaanotettu!</p><p>Muista maksaa osallistumismaksu viimeistään 5.4.2026.</p><p>Terveisin,<br>Järvenpään Jousiampujat</p>`,
    });

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.ORGANIZER_EMAIL!,
      subject: `Uusi ilmoittautuminen: ${body.name} - ${body.category}`,
      html: `<p>Nimi: ${body.name}<br>Syntymävuosi: ${body.birthYear}<br>Seura: ${body.club}<br>Luokka: ${body.category}<br>Email: ${body.email}</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
