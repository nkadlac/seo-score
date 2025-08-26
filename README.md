# Pipeline 100 Readiness Check™

A lead qualification web app for Floorplay Agency that assesses premium flooring contractors' lead generation readiness and captures qualified prospects.

## For Developers
See `claude.md` for complete project context, business requirements, and technical specifications.

## For Claude Code
This project includes a comprehensive claude.md with all context needed for development.


**Live URL**: [pipeline.floorplay.agency](https://pipeline.floorplay.agency)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Setup below)

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Setup

Required environment variables:

```bash
# API Integration
CLOSE_API_KEY=your_close_com_api_key
KIT_API_KEY=your_kit_com_api_key

# Analytics
FATHOM_SITE_ID=your_fathom_site_id

# Optional: Development
NODE_ENV=development
```

### Getting API Keys

1. **Close.com API**: Settings → API Keys → Create new key
2. **Kit.com API**: Account → API → Generate personal access token  
3. **Fathom Analytics**: Settings → Sites → [Your Site] → Site ID

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (Button, Card, Input, etc.)
│   ├── LandingPage.tsx  # Entry point with hero copy
│   ├── QuizStep.tsx     # Individual quiz questions
│   ├── ResultsPage.tsx  # Score display and CTAs
│   └── ProgressBar.tsx  # Visual progress tracking
├── lib/                 # Utilities
│   └── utils.ts         # shadcn/ui utility functions (cn, etc.)
├── utils/               # Business logic
│   ├── scoring.ts       # Lead qualification algorithm
│   ├── cityData.ts      # Metro area data for suggestions
│   └── analytics.ts     # Fathom event tracking
├── types/
│   └── quiz.ts          # TypeScript interfaces
└── api/                 # Integration endpoints
    ├── close-webhook.ts # CRM lead creation
    └── kit-webhook.ts   # Email automation trigger
```

## Business Context

**Target Users**: Premium flooring contractors ($20-50k/month revenue) seeking systematic lead generation
**Goal**: Qualify prospects for Floorplay's $4k/month marketing services
**Lead Flow**: Quiz → Instant Score → Pro Score Request → Sales Consultation

## Development

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (professional B2B design system)
- **Styling**: Tailwind CSS with CSS custom properties
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel
- **Analytics**: Fathom (privacy-focused)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm test             # Run test suite
```

### Key Features

- **Professional B2B Design**: shadcn/ui components for trustworthy contractor experience
- **7-Question Assessment**: Interactive cards with radio buttons, checkboxes, and typeahead
- **Real-time Scoring**: 100-point algorithm with instant visual results
- **Smart Recommendations**: Top 3 prioritized improvement suggestions in clean cards
- **Lead Capture**: Professional forms integrated with Close.com CRM and Kit.com email automation
- **Mobile-First**: Responsive design optimized for contractors using phones
- **Accessible**: WCAG-compliant components with proper keyboard navigation

## Scoring Algorithm

The quiz evaluates contractors across 5 key areas:
- **Speed-to-Lead** (30pts): Response time to inquiries
- **Review Velocity** (20pts): Recent review generation  
- **Premium Pages** (20pts): Service-specific landing pages
- **Service Zone Fit** (20pts): Geographic reach + service mix
- **GBP Presence** (10pts): Google Business Profile optimization

**Score Bands:**
- 85-100 (Green): Ready for premium lead flow
- 70-84 (Yellow): Good foundation, minor gaps
- 55-69 (Orange): Significant improvements needed
- <55 (Red): Major systematic issues

## Deployment

### Vercel (Recommended)
```bash
# Connect to Vercel
vercel login
vercel --prod

# Set environment variables in Vercel dashboard
# Deploy automatically on main branch push
```

### Custom Domain Setup
1. Point `pipeline.floorplay.agency` to Vercel
2. Configure SSL certificate
3. Update CORS settings for API endpoints

## Monitoring & Analytics

### Key Metrics Tracked
- Quiz completion rate (target: >70%)
- Email capture rate (target: >40%)  
- Pro Score requests (target: >25%)
- Mobile performance score (target: >90)

### Fathom Events
- `quiz_start`: User begins assessment
- `quiz_complete`: User finishes all questions
- `result_view`: Score page displayed
- `pro_score_request`: Email captured for follow-up
- `calendar_view`: Consultation booking page viewed

## Testing

```bash
# Run all tests
npm test

# Test specific scoring scenarios
npm run test:scoring

# E2E testing (Playwright)
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Quiz works on iOS Safari + Android Chrome
- [ ] All 7 questions validate properly
- [ ] Scoring algorithm produces expected results
- [ ] Lead data reaches Close.com and Kit.com
- [ ] Fathom events fire correctly
- [ ] Mobile performance <2s load time

## Documentation

- **`claude.md`**: Complete project context, business requirements, and technical specifications
- **Business Logic**: See `/docs/scoring-algorithm.md`
- **API Integration**: See `/docs/integrations.md`
- **Copy & Messaging**: See `/docs/copy-framework.md`

## Contributing

1. Read `claude.md` for full project context
2. Create feature branch: `git checkout -b feature/quiz-improvements`
3. Make changes with tests
4. Update relevant documentation
5. Submit PR with business impact description

## Support

**Technical Issues**: Check `/docs/troubleshooting.md`
**Business Questions**: Reference `claude.md` for context
**Deployment Issues**: Vercel dashboard logs

---

**Note**: This is a lead generation tool for B2B sales. All copy and functionality targets flooring contractors seeking marketing help, not homeowners seeking flooring services.