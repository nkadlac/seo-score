import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
    </div>
  );
}