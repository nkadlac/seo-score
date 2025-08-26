import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LandingPageProps {
  onStartQuiz: () => void;
}

export default function LandingPage({ onStartQuiz }: LandingPageProps) {
  const handleStartQuiz = () => {
    trackEvent(AnalyticsEvents.QUIZ_START);
    onStartQuiz();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              How Many <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">$10k+ Premium Coating Jobs</span> Are You Missing?
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Get Your Pipeline Readiness Score in 90 Seconds
            </p>
            
            {/* Trust Elements */}
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 mb-12 text-base md:text-lg text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>847+ contractors improved their lead flow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Average 3x lead increase in 60 days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>No spam, just results</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="mb-6">
              <Button
                onClick={handleStartQuiz}
                size="lg"
                className="text-xl md:text-2xl px-12 py-6 h-auto bg-blue-600 hover:bg-blue-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 rounded-xl"
              >
                Start My Free Assessment
              </Button>
            </div>
            
            <p className="text-gray-500 text-lg">
              Takes 90 seconds • Instant results • No credit card required
            </p>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Instant Score</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Get your lead generation readiness score based on 5 key factors premium contractors use</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Top 3 Moves</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Prioritized action plan to fix your biggest pipeline gaps in order of impact</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Revenue Forecast</h3>
              <p className="text-gray-600 text-lg leading-relaxed">See your potential 60 and 90-day pipeline based on your readiness score</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}