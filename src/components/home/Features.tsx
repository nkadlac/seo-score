import { FeatureCard } from './FeatureCard'

const instantScoreIcon = "/module-score.png"
const topMovesIcon = "/module-moves.png"
const revenueIcon = "/module-forecast.png"

const features = [
  {
    icon: instantScoreIcon,
    title: 'Instant Score',
    description: '90-second readiness assessment for premium flooring contractors',
  },
  {
    icon: topMovesIcon,
    title: 'Top 3 Moves',
    description: 'Your personalized 30-day action plan to double lead flow',
  },
  {
    icon: revenueIcon,
    title: 'Revenue Forecast',
    description: 'See your exact 60-day lead and pipeline potential',
  },
]

export function Features() {
  return (
    <section aria-labelledby="features-title" className="bg-paper py-14">
      <div className="pl-8 lg:pl-20 lg:ml-0">
        <h2 id="features-title" className="sr-only">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </div>
    </section>
  )
}

