import { Card, CardContent } from '@/components/ui/card'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-paper border-none shadow-none">
      <CardContent className="p-6 space-y-3">
        <img
          src={icon}
          alt=""
          loading="lazy"
          width={132}
          height={132}
          className="w-[132px] h-[132px] object-contain"
        />
        <h3 className="text-[20px] font-work-sans font-bold text-ink tracking-[-0.4px] leading-[1.3]">
          {title}
        </h3>
        <p className="text-[18px] font-work-sans font-normal text-ink tracking-[-0.36px] leading-[1.3]">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

