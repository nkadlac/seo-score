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
    
    const results = await Promise.allSettled([
      sendToClose(answers as QuizAnswers, result, email).catch(err => {
        console.error('Close.com integration failed:', err);
        return null;
      }),
      sendToKit(answers as QuizAnswers, result, email).catch(err => {
        console.error('Kit.com integration failed:', err);
        return null;
      })
    ]);
    
    // Check if at least one integration succeeded
    const successes = results.filter(result => result.status === 'fulfilled').length;
    
    if (successes === 0) {
      // Both failed, but we still want to show a positive message to the user
      console.error('Both integrations failed, but handling gracefully');
      // Don't throw - let the user think it worked and follow up manually
    } else {
      console.log(`Pro score request submitted successfully (${successes}/2 integrations)`);
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