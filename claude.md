# Pipeline 100 Readiness Check™ - Claude Code Project

## Project Overview

**Goal**: Build a lead magnet web application for Floorplay Agency that assesses flooring contractors' lead generation readiness and captures qualified leads.

**URL**: `pipeline.floorplay.agency` (separate from main site)
**Timeline**: 3-week MVP, then iterate

## Business Context

**Target Audience**: Premium flooring contractors ($20-50k/month revenue) in Milwaukee, Madison, Green Bay
**Services They Offer**: Polyurea, Polyaspartic, Decorative Concrete, Epoxy ($5k-15k average job)
**Our Goal**: Generate leads for Floorplay's $4k/month Growth Package marketing service

## Technical Stack

```
Frontend: React + TypeScript + Vite
UI Components: shadcn/ui (professional B2B design system)
Styling: Tailwind CSS with CSS custom properties
Forms: React Hook Form + Zod validation
Deployment: Vercel
Analytics: Fathom Analytics
CRM: Close.com (webhook integration)
Email: Kit.com (automation sequences)
```

## Architecture

### Core Components
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx         # Professional button variants
│   │   ├── card.tsx           # Clean card components
│   │   ├── input.tsx          # Form input styling
│   │   ├── label.tsx          # Accessible form labels
│   │   ├── progress.tsx       # Progress bar visualization
│   │   ├── radio-group.tsx    # Radio button groups
│   │   └── checkbox.tsx       # Checkbox components
│   ├── QuizStep.tsx           # Interactive quiz questions with shadcn/ui
│   ├── ProgressBar.tsx        # Visual progress indicator
│   ├── ResultsPage.tsx        # Score display with professional cards
│   └── LandingPage.tsx        # Entry point with hero copy and CTAs
├── lib/
│   └── utils.ts               # shadcn/ui utility functions (cn, etc.)
├── utils/
│   ├── scoring.ts             # Client-side scoring algorithm
│   ├── cityData.ts            # Pre-loaded city/suburb data
│   └── analytics.ts           # Fathom event tracking
├── types/
│   └── quiz.ts                # TypeScript interfaces
└── api/
    ├── close-webhook.ts       # Close.com lead creation
    └── kit-webhook.ts         # Kit.com email automation
```

## User Flow

1. **Landing Page** → Professional shadcn/ui cards, trust elements, "Start 90-second Check" CTA
2. **7-Question Quiz** → Interactive cards with radio buttons, checkboxes, typeahead city search
3. **Instant Results** → Clean score visualization, color-coded bands, top 3 recommendations in cards
4. **Lead Capture** → Professional form with shadcn/ui inputs for "Pro Score + 30-Day Move Map"
5. **Follow-up Sequence** → Kit.com automation based on score band

## Quiz Questions & Scoring Logic

### Questions (7 total, ~90 seconds)
1. **Business + City** (text input with typeahead)
2. **Priority Services** (checkboxes: Polyurea, Decorative, Epoxy)  
3. **Service Radius** for $8k+ jobs (radio: 15-20mi / ~30mi / 45mi+)
4. **Response Speed** (radio: ≤15min / ≤1hr / same day / varies)
5. **SMS Capabilities** (radio: text-back & autoresponder / one / neither)
6. **Premium Pages** (radio: all services have pages / some / none)
7. **Review Velocity** last 60 days (radio: 0-3 / 4-7 / 8+ / not sure)

### Scoring Algorithm (100 points total)
```typescript
const calculateScore = (answers: QuizAnswers): ScoreResult => {
  let score = 0;
  
  // Speed-to-Lead (30 points)
  if (answers.responseTime <= 15) score += 30;
  else if (answers.responseTime <= 60) score += 20;
  else if (answers.responseTime <= 1440) score += 10;
  
  // SMS Capabilities bonus
  if (answers.smsCapability === 'both') score += 5;
  
  // Review Velocity (20 points)
  if (answers.reviewCount >= 8) score += 20;
  else if (answers.reviewCount >= 4) score += 15;
  else if (answers.reviewCount >= 1) score += 10;
  
  // Premium Pages (20 points)  
  if (answers.premiumPages === 'all') score += 20;
  else if (answers.premiumPages === 'some') score += 12;
  
  // Service Zone Fit (20 points)
  const serviceCount = answers.services.length;
  const radiusMultiplier = answers.radius >= 30 ? 1.2 : 1.0;
  score += Math.min(20, serviceCount * 7 * radiusMultiplier);
  
  // GBP Presence (10 points) - estimated from business name
  score += 6; // provisional, manual verification for Pro Score
  
  return {
    score: Math.round(score),
    band: getScoreBand(score),
    forecast: getForecast(score),
    guaranteeStatus: getGuaranteeStatus(answers)
  };
};

const getScoreBand = (score: number): ScoreBand => {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow'; 
  if (score >= 55) return 'orange';
  return 'red';
};
```

### Score Bands & Forecasts
- **85-100 (Green)**: "60-day: 18-25 leads, 90-day: $45k-65k pipeline"
- **70-84 (Yellow)**: "60-day: 12-18 leads, 90-day: $28k-45k pipeline"  
- **55-69 (Orange)**: "60-day: 6-12 leads, 90-day: $15k-28k pipeline"
- **<55 (Red)**: "60-day: 2-6 leads, 90-day: $5k-15k pipeline"

## Top 3 Moves Logic

Priority order (impact × speed):
1. **Turn on missed-call text-back + SMS autoresponder** (if response time >15min or SMS ≠ both)
2. **Ship Polyurea/Decorative/Epoxy pages** (if premium pages ≠ all)
3. **Run 40-review sprint with job-type tags** (if reviews ≤7)
4. **Publish 6 city pages** (if radius limited or single service)
5. **GBP cleanup** (categories/services/posts/Q&A/photos)
6. **Add financing CTA + trust blocks**
7. **Turn on tracking** (call numbers, UTMs, source tracking)

Always return exactly 3 moves, breaking ties by "owner time required" (ascending).

## Integration Requirements

### Close.com Webhook
```typescript
interface CloseWebhookPayload {
  contact: {
    name: string;
    emails: [{ email: string; type: 'office' }];
    phones?: [{ phone: string; type: 'office' }];
  };
  custom: {
    business_city: string;
    priority_services: string[];
    service_radius: number;
    response_speed: string;
    sms_capability: string;
    premium_pages: string;
    review_velocity: string;
    pipeline_score: number;
    score_band: string;
    top_moves: string[];
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  tags: string[];
}
```

### Kit.com Integration
```typescript
interface KitWebhookPayload {
  email: string;
  tags: [
    'pipeline-100-lead',
    `score-${scoreBand}`,
    `services-${services.join('-')}`,
    `zone-${serviceRadius}`
  ];
  fields: {
    score: number;
    city: string;
    business_name: string;
    top_move_1: string;
    guarantee_status: string;
  };
}
```

## City Data Structure

Pre-load major metro areas for service radius suggestions:

```typescript
interface CityData {
  [metro: string]: {
    primary: string;
    suburbs: string[];
    population: number;
    serviceRadius: number;
    coordinates?: [number, number];
  };
}

const cityData: CityData = {
  milwaukee: {
    primary: "Milwaukee",
    suburbs: ["Wauwatosa", "West Allis", "Brookfield", "New Berlin", "Franklin", "Oak Creek"],
    population: 590157,
    serviceRadius: 25
  },
  madison: {
    primary: "Madison", 
    suburbs: ["Middleton", "Fitchburg", "Verona", "Sun Prairie", "Waunakee", "McFarland"],
    population: 269840,
    serviceRadius: 20
  }
  // ... more metros
};
```

## Analytics Events

Track key conversion points with Fathom:

```typescript
enum AnalyticsEvents {
  QUIZ_START = 'quiz_start',
  QUIZ_COMPLETE = 'quiz_complete', 
  RESULT_VIEW = 'result_view',
  PRO_SCORE_REQUEST = 'pro_score_request',
  CALENDAR_VIEW = 'calendar_view',
  CALENDAR_BOOK = 'calendar_book'
}
```

## Environment Variables

```bash
# API Keys
CLOSE_API_KEY=your_close_api_key
KIT_API_KEY=your_kit_api_key

# Webhook URLs  
CLOSE_WEBHOOK_URL=https://api.close.com/api/v1/lead/
KIT_WEBHOOK_URL=https://api.kit.com/v3/subscribers

# Analytics
FATHOM_SITE_ID=your_fathom_site_id

# Deployment
VERCEL_URL=pipeline.floorplay.agency
```

## Development Phases

### Phase 1: Core MVP (Week 1) ✅ COMPLETED
- [x] Landing page with hero copy and trust elements (shadcn/ui cards and buttons)
- [x] 7-question quiz with progress tracking (interactive cards, radio groups, checkboxes)
- [x] Client-side scoring algorithm with visual results
- [x] Results page with professional score display and top 3 moves cards
- [x] Professional lead capture form with shadcn/ui inputs
- [x] shadcn/ui design system integration for B2B credibility

### Phase 2: Integrations (Week 2)  
- [ ] Close.com webhook for lead creation
- [ ] Kit.com webhook for email automation
- [ ] Fathom analytics event tracking
- [ ] UTM parameter capture and attribution
- [x] City suggestions based on location input (typeahead with shadcn/ui)

### Phase 3: Polish (Week 3)
- [x] Mobile optimization and responsive design (shadcn/ui responsive components)
- [x] Form validation and error handling (React Hook Form integration)
- [x] Loading states and smooth transitions (shadcn/ui animations)
- [ ] A/B testing infrastructure setup
- [ ] Performance optimization (<2s load time)

## Success Metrics

**Technical KPIs:**
- Quiz completion rate >70%
- Mobile performance score >90 (Lighthouse)
- Time to interactive <2 seconds
- Form abandonment rate <15%

**Business KPIs:**
- Email capture rate >40% of quiz completers
- Pro Score request rate >25% of results viewers  
- Cost per qualified lead <$50
- Demo booking rate >15% for scores 70+

## Copy & Messaging Framework

**Landing Page Headlines:**
- Primary: "How Many $10k+ Premium Coating Jobs Are You Missing?"
- Secondary: "Get Your Pipeline Readiness Score in 90 Seconds"
- CTA: "Start My Free Assessment"

**Results Page Copy:**
- Score interpretation with clear next steps
- Urgency: "Pro Score available for next 48 hours"
- Social proof: "Join 847+ contractors who've improved their lead flow"

**Email Follow-up Sequence:**
1. Instant Score + Top 3 Moves (immediate)
2. Pro Score + 30-Day Move Map (24 hours)  
3. Case study: "$28k month transformation" (3 days)
4. Urgency: "Cohort closes Friday" (5 days)
5. Final: "Alternative resources" (7 days)

## Manual Processes (Phase 2+)

**Pro Score Enrichment** (15-20 minutes per lead):
1. GBP audit: categories, posts, photos, Q&A, reviews
2. Website audit: premium pages, trust elements, conversion paths
3. Competitor snapshot: review counts, recent activity
4. Refined forecast: tighter ranges based on manual findings
5. Expanded recommendations: Top 5 moves with owner time estimates

**Follow-up Operations:**
- Territory exclusivity tracking (one premium contractor per zone)
- Cohort deadline management
- $500 territory hold offers for qualified prospects

---

## Getting Started with Claude Code ✅ COMPLETED

1. ✅ **Initialize Project**: React + TypeScript project with Vite
2. ✅ **Install Dependencies**: Tailwind, shadcn/ui, React Hook Form, Zod, date-fns
3. ✅ **Set Up Environment**: Environment variables configured (.env.example provided)
4. ✅ **Build Core Components**: Professional QuizStep, ResultsPage, LandingPage with shadcn/ui
5. ✅ **Test Locally**: Scoring algorithm implemented and tested locally
6. ✅ **Professional UI**: shadcn/ui design system for B2B credibility and trust

## Current Status: Phase 1 Complete - MVP Ready! 🎉

The Pipeline 100 Readiness Check is now a professional, production-ready lead generation tool with:
- **Professional B2B Design**: shadcn/ui components build contractor trust
- **Complete Quiz Flow**: 7 interactive questions with proper validation
- **Instant Scoring**: Real-time algorithm with visual results
- **Mobile Optimized**: Responsive design for contractors on-the-go
- **Accessible**: WCAG-compliant components with keyboard navigation

**Next Steps**: Phase 2 integrations (Close.com, Kit.com, Fathom Analytics) and Phase 3 performance optimization.

This document should be your north star for building the Pipeline 100 Readiness Check. Focus on the MVP user experience first, then layer in integrations and optimizations.