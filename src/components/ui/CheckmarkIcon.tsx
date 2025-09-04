interface CheckmarkIconProps {
  className?: string;
}

export function CheckmarkIcon({ className = "w-5 h-3.5" }: CheckmarkIconProps) {
  return (
    <svg
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.5 11L2.5 6L1 7.5L7.5 14L19 2.5L17.5 1L7.5 11Z"
        fill="currentColor"
      />
    </svg>
  );
}