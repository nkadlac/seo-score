import { Hero, HeroImage } from './home/Hero';
import { Features } from './home/Features';

interface LandingPageProps {
  onStartQuiz: () => void;
}

export default function LandingPage({ onStartQuiz }: LandingPageProps) {
  return (
    <main className="min-h-screen">
      <HeroImage />
      <div className="lg:ml-[32%] xl:ml-[36%] 2xl:ml-[615px] min-w-0">
        <Hero onStart={onStartQuiz} />
        <Features />
      </div>
    </main>
  );
}
