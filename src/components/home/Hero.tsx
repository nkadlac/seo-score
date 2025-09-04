import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { trackEvent, AnalyticsEvents } from '@/utils/analytics'

const heroImage = '/hero-img.jpg'

interface HeroProps {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  const handleStart = () => {
    trackEvent(AnalyticsEvents.QUIZ_START)
    onStart()
  }

  return (
    <section aria-labelledby="hero-title" className="bg-white">
      <div className="pl-8 lg:pl-20 py-16 w-full">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-3">
            <p className="text-brand text-[24px] font-work-sans font-normal tracking-[-0.48px] leading-[1.3]">
              FOR PREMIUM FLOORING CONTRACTORS
            </p>
            <h1 id="hero-title" className="text-ink text-[42px] lg:text-[64px] font-big-shoulders font-extrabold uppercase leading-[1.1]">
              How Many $10k+ Premium Coating Jobs Are You Missing?
            </h1>
            <p className="text-ink text-[20px] lg:text-[28px] font-work-sans font-normal tracking-[-0.56px] leading-[1.3]">
              Get your Pipeline Readiness Score in 90 seconds. Clear, practical next steps to increase lead flow.
            </p>
          </div>

          <Button
            onClick={handleStart}
            aria-label="Start your free assessment"
            className="bg-brand hover:bg-brand/90 text-white h-auto p-0 rounded-none flex items-center w-fit focus-ring"
          >
            <div className="px-8 py-6 flex flex-col items-start gap-1">
              <span className="text-[26px] font-work-sans font-bold tracking-[-0.52px]">
                Start your free assessment
              </span>
              <span className="text-[#e7f2f1] text-[16px] font-work-sans font-normal tracking-[-0.32px]">
                And see what business you're missing out on.
              </span>
            </div>
            <div className="bg-ink h-[103px] w-[99px] flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function HeroImage() {
  return (
    <section aria-hidden="true" className="hidden lg:block relative">
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="h-screen w-full object-cover"
      />
      <div className="absolute inset-0 bg-blue-600/60" />
    </section>
  )}
