import { Suspense } from "react";
import LandingHero from "@/components/LandingHero";

export default function Home() {
  return (
    <Suspense>
      <LandingHero />
    </Suspense>
  );
}
