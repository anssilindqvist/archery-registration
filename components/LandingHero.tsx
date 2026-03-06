"use client";

import Link from "next/link";

export default function LandingHero() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-emerald-950 flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-2xl text-center space-y-8">
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

        <p className="text-emerald-200/80 text-base max-w-md mx-auto">
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
    </div>
  );
}
