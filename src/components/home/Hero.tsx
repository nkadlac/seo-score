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
      <div className="px-8 lg:pl-20 lg:pr-8 pt-28 pb-16 w-full">
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
            className="bg-brand hover:bg-brand/90 text-white h-auto p-0 rounded-none flex items-stretch w-full sm:w-fit focus-ring max-w-full"
          >
            <div className="px-4 sm:px-8 py-4 sm:py-6 pr-2 sm:pr-4 flex flex-col items-start gap-1 flex-1 min-w-0 max-w-[calc(100%-88px)] sm:max-w-[calc(100%-107px)]">
              <span className="text-[16px] sm:text-[26px] font-work-sans font-bold tracking-[-0.32px] sm:tracking-[-0.52px] leading-tight hyphens-auto break-words">
                Start your free assessment
              </span>
              <span className="text-[#e7f2f1] text-[13px] sm:text-[16px] font-work-sans font-normal tracking-[-0.26px] sm:tracking-[-0.32px] leading-tight hyphens-auto break-words">
                And see what business you're missing out on.
              </span>
            </div>
            <div className="bg-ink min-h-[80px] sm:min-h-[103px] w-[80px] sm:w-[99px] flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function HeroImage() {
  return (
    <section aria-hidden="true" className="hidden lg:block fixed top-0 left-0 w-[32%] xl:w-[36%] 2xl:w-[615px] h-screen z-10">
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-blue-600/60" />
    </section>
  )}
