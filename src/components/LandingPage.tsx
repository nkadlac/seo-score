import { Hero, HeroImage } from './home/Hero';
import { Features } from './home/Features';

interface LandingPageProps {
  onStartQuiz: () => void;
}

export default function LandingPage({ onStartQuiz }: LandingPageProps) {
  return (
    <main className="lg:grid lg:grid-cols-[minmax(260px,32%)_1fr] xl:grid-cols-[minmax(320px,36%)_1fr] 2xl:grid-cols-[615px_1fr] min-h-screen">
      <HeroImage />
      <div className="min-w-0">
        <Hero onStart={onStartQuiz} />
        <Features />
      </div>
    </main>
  );
}
