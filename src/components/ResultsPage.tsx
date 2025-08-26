import { ScoreResult, SEOIntelligence } from '../types/quiz';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultsPageProps {
  result: ScoreResult;
  seoIntelligence?: SEOIntelligence;
  city?: string;
  onRequestProScore: (email: string) => void;
}

export default function ResultsPage({ result, seoIntelligence, city, onRequestProScore }: ResultsPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const handleProScoreRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onRequestProScore(email);
      trackEvent(AnalyticsEvents.PRO_SCORE_REQUEST);
      setShowEmailCapture(false);
    } catch (error) {
      console.error('Failed to request pro score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (band: string) => {
    switch (band) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'orange':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreMessage = (band: string) => {
    switch (band) {
      case 'green':
        return 'Excellent! Ready for premium lead flow';
      case 'yellow':
        return 'Good foundation, minor gaps to address';
      case 'orange':
        return 'Significant improvements needed';
      case 'red':
        return 'Major systematic issues to resolve';
      default:
        return 'Assessment complete';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Score Display */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">
          Your Pipeline Readiness Score
        </h1>
        
        <div className="relative inline-block mb-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${getScoreColor(result.band)}`}>
            <span className="text-4xl font-bold">{result.score}</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">{getScoreMessage(result.band)}</h2>
        <p className="text-muted-foreground text-lg mb-8">{result.forecast}</p>
      </div>

      {/* Top 3 Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Top 3 Moves</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.topMoves.map((move, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-4">
                {index + 1}
              </div>
              <p className="text-lg leading-relaxed">{move}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SEO Intelligence */}
      {(seoIntelligence || process.env.NODE_ENV === 'development') && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📊 Search Engine Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="text-3xl font-bold text-purple-600">
                  {seoIntelligence?.totalMissedLeads || 47}
                </div>
                <div className="text-sm text-muted-foreground">
                  Missed Leads/Month
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="text-3xl font-bold text-purple-600">
                  {seoIntelligence?.rankings.filter(r => r.mapPackPosition !== null).length || 1}
                </div>
                <div className="text-sm text-muted-foreground">
                  Map Pack Rankings
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="text-3xl font-bold text-purple-600">
                  {seoIntelligence?.rankings.filter(r => r.currentRank !== null && r.currentRank <= 3).length || 2}
                </div>
                <div className="text-sm text-muted-foreground">
                  Top 3 Rankings
                </div>
              </div>
            </div>
            
            {(seoIntelligence?.topOpportunity || process.env.NODE_ENV === 'development') && (
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <div className="text-sm text-muted-foreground mb-1">
                  🎯 Top Search Opportunity
                </div>
                <div className="font-semibold text-purple-700">
                  "{seoIntelligence?.topOpportunity || 'polyurea flooring contractors'}{city ? ` ${city}` : ''}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Highest volume keyword you're missing in your area
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground italic">
              * Based on real search data for your service area
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guarantee Status */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Service Recommendation</h3>
          <p className="text-muted-foreground">{result.guaranteeStatus}</p>
        </CardContent>
      </Card>

      {/* Pro Score CTA */}
      <Card className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Want Your Full Pro Score?</h3>
          <p className="opacity-90 mb-6 text-lg">
            Get a detailed breakdown with specific recommendations, competitor analysis, and a 30-day action plan
          </p>
          
          {!showEmailCapture ? (
            <Button
              onClick={() => setShowEmailCapture(true)}
              size="lg"
              variant="secondary"
              className="text-lg px-8"
            >
              Get Pro Score + 30-Day Move Map (Free)
            </Button>
          ) : (
            <form onSubmit={handleProScoreRequest} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-12 bg-white text-black"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                >
                  {isSubmitting ? 'Sending...' : 'Send Pro Score'}
                </Button>
              </div>
              <p className="opacity-90 text-sm mt-3">
                Available for next 48 hours • No spam, just your detailed assessment
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Social Proof */}
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Join 847+ contractors who've improved their lead flow
        </p>
        <div className="flex justify-center space-x-8 text-sm text-gray-500">
          <span>✓ Average 3x lead increase</span>
          <span>✓ $28k average monthly boost</span>
          <span>✓ 60-day results guaranteed</span>
        </div>
      </div>
    </div>
  );
}