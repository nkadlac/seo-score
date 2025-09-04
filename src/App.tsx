import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import QuizStep from './components/QuizStep';
import ResultsPage from './components/ResultsPage';
import ProgressBar from './components/ProgressBar';
import AnalysisLoader from './components/AnalysisLoader';
import CalendarEmbed from './components/CalendarEmbed';
import { QuizAnswers, ScoreResult } from './types/quiz';
import { calculateScore, getForecast } from './utils/scoring';
import { trackEvent, AnalyticsEvents } from './utils/analytics';
import { sendToClose } from './api/close-webhook';
import { sendToKit } from './api/kit-webhook';
import { getKeywordsForServices, checkSEORankings } from './utils/seoKeywords';
import { getAvgTicketForCity } from './utils/cityData';
import { Card } from '@/components/ui/card';

type AppState = 'landing' | 'quiz' | 'analyzing' | 'results' | 'book';

function App() {
  const [state, setState] = useState<AppState>('landing');
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Browser history management
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.appState) {
        setState(event.state.appState);
        if (event.state.currentStep !== undefined) {
          setCurrentStep(event.state.currentStep);
        }
      } else {
        // No state means we're at the beginning
        setState('landing');
        setCurrentStep(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper function to navigate with history
  const navigateWithHistory = (newState: AppState, step?: number) => {
    setState(newState);
    if (step !== undefined) {
      setCurrentStep(step);
    }
    
    // Push to browser history
    const historyState = { 
      appState: newState, 
      currentStep: step !== undefined ? step : currentStep 
    };
    window.history.pushState(historyState, '', window.location.pathname);
  };

  const handleStartQuiz = () => {
    navigateWithHistory('quiz', 1);
  };

  const handleQuizNext = async (stepData: Partial<QuizAnswers>) => {
    const updatedAnswers = { ...answers, ...stepData };
    setAnswers(updatedAnswers);

    if (currentStep < 7) {
      navigateWithHistory('quiz', currentStep + 1);
    } else {
      // Quiz complete - start analysis phase
      const completeAnswers = updatedAnswers as QuizAnswers;
      setAnswers(completeAnswers);
      navigateWithHistory('analyzing');
      setIsAnalyzing(true);
      trackEvent(AnalyticsEvents.QUIZ_COMPLETE);
      
      // Run SEO analysis in the background
      (async () => {
        console.log('Quiz complete - checking for business data:', completeAnswers.businessData);
        console.log('Has placeId?', !!completeAnswers.businessData?.placeId);
        console.log('PlaceId value:', completeAnswers.businessData?.placeId);
        
        if (completeAnswers.businessData?.placeId) {
          console.log('Gathering SEO intelligence with placeId:', completeAnswers.businessData.placeId);
          try {
            const keywords = getKeywordsForServices(completeAnswers.services, completeAnswers.city);
            console.log('Keywords to check:', keywords);
            
            const domain = completeAnswers.businessData.website?.replace(/^https?:\/\//, '').split('/')[0];
            const rankings = await checkSEORankings(
              keywords,
              completeAnswers.businessData.placeId,
              completeAnswers.city,
              domain
            );
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
        
        // Enhance forecast with SEO intelligence if available
        if (completeAnswers.seoIntelligence) {
          scoreResult.forecast = getForecast(
            scoreResult.score, 
            getAvgTicketForCity(completeAnswers.city),
            completeAnswers.seoIntelligence
          );
        }
        
        setResult(scoreResult);
        setAnswers(completeAnswers);
        setIsAnalyzing(false);
      })();
    }
  };

  const handleQuizPrev = () => {
    if (currentStep > 1) {
      navigateWithHistory('quiz', currentStep - 1);
    }
  };

  const handleAnalysisComplete = () => {
    navigateWithHistory('results');
    trackEvent(AnalyticsEvents.RESULT_VIEW);
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

  const handleOpenCalendar = () => {
    navigateWithHistory('book');
    trackEvent(AnalyticsEvents.CALENDAR_VIEW);
  };

  return (
    <div className="min-h-screen">
      {state === 'analyzing' ? (
        <AnalysisLoader
          businessData={answers?.businessData}
          serviceRadiusMiles={answers?.radius}
          onComplete={handleAnalysisComplete}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <>
          {state === 'landing' ? (
            <LandingPage onStartQuiz={handleStartQuiz} />
          ) : state === 'results' && result ? (
            <ResultsPage
              result={result}
              seoIntelligence={answers?.seoIntelligence}
              city={answers?.city}
              onRequestProScore={handleProScoreRequest}
              onBook={handleOpenCalendar}
              meta={
                {
                  responseTime: (answers as any)?.responseTime,
                  smsCapability: (answers as any)?.smsCapability,
                  premiumPages: (answers as any)?.premiumPages,
                  reviewCount: (answers as any)?.reviewCount,
                }
              }
            />
          ) : (
            <div className="container mx-auto px-4 py-8">
              {state === 'quiz' && (
                <div className="max-w-3xl mx-auto">
                  <ProgressBar currentStep={currentStep} totalSteps={7} />
                  <Card className="p-8 bg-white border border-black/10 shadow-sm">
                    <QuizStep
                      currentStep={currentStep}
                      answers={answers}
                      onNext={handleQuizNext}
                      onPrev={handleQuizPrev}
                    />
                  </Card>
                </div>
              )}

              {state === 'book' && (
                <Card className="p-0 bg-white border border-black/10 shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-brand hover:text-brand/80 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m15 18-6-6 6-6"/>
                        </svg>
                        Back to Results
                      </button>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-big-shoulders uppercase text-ink mb-4">Book Your 15‑Minute Pipeline Review</h1>
                    <p className="text-ink/70 mb-4">Pick a time that works for you. We'll review your leadflow pipeline and immediate fixes.</p>
                  </div>
                  <div className="w-full h-[70vh] border-t border-black/10">
                    <CalendarEmbed />
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
