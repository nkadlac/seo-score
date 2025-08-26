import { useState } from 'react';
import LandingPage from './components/LandingPage';
import QuizStep from './components/QuizStep';
import ResultsPage from './components/ResultsPage';
import ProgressBar from './components/ProgressBar';
import { QuizAnswers, ScoreResult } from './types/quiz';
import { calculateScore } from './utils/scoring';
import { trackEvent, AnalyticsEvents } from './utils/analytics';
import { sendToClose } from './api/close-webhook';
import { sendToKit } from './api/kit-webhook';
import { getKeywordsForServices, checkSEORankings } from './utils/seoKeywords';
import { Card } from '@/components/ui/card';

type AppState = 'landing' | 'quiz' | 'results';

function App() {
  const [state, setState] = useState<AppState>('landing');
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);

  const handleStartQuiz = () => {
    setState('quiz');
    setCurrentStep(1);
  };

  const handleQuizNext = async (stepData: Partial<QuizAnswers>) => {
    const updatedAnswers = { ...answers, ...stepData };
    setAnswers(updatedAnswers);

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz complete - calculate score and SEO intelligence
      const completeAnswers = updatedAnswers as QuizAnswers;
      
      // Get SEO intelligence if we have business data
      if (completeAnswers.businessData?.placeId) {
        console.log('Gathering SEO intelligence...');
        try {
          const keywords = getKeywordsForServices(completeAnswers.services, completeAnswers.city);
          console.log('Keywords to check:', keywords);
          
          const rankings = await checkSEORankings(keywords, completeAnswers.businessData.placeId, completeAnswers.city);
          console.log('SEO rankings:', rankings);
          
          const totalMissedLeads = rankings.reduce((sum, ranking) => sum + ranking.missedLeadsPerMonth, 0);
          const topOpportunity = rankings
            .sort((a, b) => b.missedLeadsPerMonth - a.missedLeadsPerMonth)[0]?.keyword || '';
          
          completeAnswers.seoIntelligence = {
            rankings,
            totalMissedLeads,
            topOpportunity
          };
          
          console.log('SEO intelligence captured:', completeAnswers.seoIntelligence);
        } catch (error) {
          console.error('Failed to gather SEO intelligence:', error);
        }
      }
      
      const scoreResult = calculateScore(completeAnswers);
      setResult(scoreResult);
      setAnswers(completeAnswers); // Make sure SEO data is stored
      setState('results');
      trackEvent(AnalyticsEvents.QUIZ_COMPLETE);
      trackEvent(AnalyticsEvents.RESULT_VIEW);
    }
  };

  const handleQuizPrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProScoreRequest = async (email: string) => {
    if (!result) return;
    
    try {
      // Send data to both Close.com and Kit.com
      await Promise.all([
        sendToClose(answers as QuizAnswers, result, email),
        sendToKit(answers as QuizAnswers, result, email)
      ]);
      
      // In a real app, show success message or redirect
      alert('Pro Score requested! Check your email in the next few minutes.');
    } catch (error) {
      console.error('Failed to request Pro Score:', error);
      alert('Something went wrong. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {state === 'landing' && (
          <LandingPage onStartQuiz={handleStartQuiz} />
        )}
        
        {state === 'quiz' && (
          <div className="max-w-4xl mx-auto">
            <ProgressBar currentStep={currentStep} totalSteps={7} />
            <Card className="p-8">
              <QuizStep
                currentStep={currentStep}
                answers={answers}
                onNext={handleQuizNext}
                onPrev={handleQuizPrev}
              />
            </Card>
          </div>
        )}
        
        {state === 'results' && result && (
          <Card className="p-8">
            <ResultsPage
              result={result}
              seoIntelligence={answers?.seoIntelligence}
              city={answers?.city}
              onRequestProScore={handleProScoreRequest}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;