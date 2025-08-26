export enum AnalyticsEvents {
  QUIZ_START = 'quiz_start',
  QUIZ_COMPLETE = 'quiz_complete', 
  RESULT_VIEW = 'result_view',
  PRO_SCORE_REQUEST = 'pro_score_request',
  CALENDAR_VIEW = 'calendar_view',
  CALENDAR_BOOK = 'calendar_book'
}

declare global {
  interface Window {
    fathom?: {
      trackGoal: (code: string, cents?: number) => void;
    };
  }
}

export const trackEvent = (event: AnalyticsEvents, value?: number) => {
  if (typeof window !== 'undefined' && window.fathom) {
    window.fathom.trackGoal(event, value);
  }
  
  // Fallback to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Analytics Event: ${event}`, value ? { value } : '');
  }
};