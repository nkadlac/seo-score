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
  const w: any = typeof window !== 'undefined' ? window : undefined;

  // Prefer Fathom event goals by name
  if (w?.fathom?.trackEvent) {
    try {
      if (typeof value === 'number') {
        w.fathom.trackEvent(String(event), { value });
      } else {
        w.fathom.trackEvent(String(event));
      }
      return;
    } catch {
      // Swallow and fall back to dev logging
    }
  }

  // Dev logging fallback
  if (import.meta.env?.DEV) {
    console.log(`Analytics Event (dev): ${event}`, value ? { value } : '');
  }
};
