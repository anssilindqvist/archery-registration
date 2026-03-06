"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingHero() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen">
        {/* Left column — event info */}
        <div className="text-center lg:text-left space-y-8">
          <Image
            src="/seuralogo.gif"
            alt="Järvenpään Jousiampujat"
            width={150}
            height={150}
            className="mx-auto lg:mx-0"
            priority
          />
          <div className="space-y-2">
            <p className="text-emerald-300 text-lg font-medium tracking-wide uppercase">
              Järvenpään Jousiampujat
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Kevät Flint 26
            </h1>
          </div>

          <div className="space-y-1 text-emerald-100 text-lg">
            <p>12.4.2026</p>
            <p>Jokihalli, Kuusitie 36, Järvenpää</p>
          </div>

          <p className="text-emerald-200/80 text-base max-w-md mx-auto lg:mx-0">
            Tervetuloa ilmoittautumaan Kevät Flint 26 -jousiammuntakilpailuun!
            Ilmoittautuminen hoituu helposti keskustelemalla tekoälyavustajamme
            kanssa.
          </p>

          <Link
            href="/register"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-green-950 font-bold text-lg px-10 py-4 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Ilmoittaudu
          </Link>
        </div>

        {/* Right column — map & schedule */}
        <div className="space-y-8">
          {/* Google Maps embed */}
          <div className="rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://maps.google.com/maps?q=Jokihalli,+Kuusitie+36,+04480+J%C3%A4rvenp%C3%A4%C3%A4,+Suomi&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Jokihalli, Kuusitie 36, Järvenpää"
            />
          </div>

          {/* Schedule */}
          <div className="bg-green-800/40 rounded-xl p-6 border border-emerald-800/50">
            <h2 className="text-xl font-bold text-emerald-200 mb-4">
              Aikataulu
            </h2>
            <table className="w-full text-left text-emerald-100">
              <tbody>
                <tr className="border-b border-emerald-800/30">
                  <td className="py-2 pr-4 font-medium text-emerald-300">09:00</td>
                  <td className="py-2">Ilmoittautuminen ja sisäänkirjaus</td>
                </tr>
                <tr className="border-b border-emerald-800/30">
                  <td className="py-2 pr-4 font-medium text-emerald-300">10:00</td>
                  <td className="py-2">Kilpailu alkaa</td>
                </tr>
                <tr className="border-b border-emerald-800/30">
                  <td className="py-2 pr-4 font-medium text-emerald-300">12:00</td>
                  <td className="py-2">Lounastauko</td>
                </tr>
                <tr className="border-b border-emerald-800/30">
                  <td className="py-2 pr-4 font-medium text-emerald-300">13:00</td>
                  <td className="py-2">Kilpailu jatkuu</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-emerald-300">15:00</td>
                  <td className="py-2">Palkintojenjako</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
