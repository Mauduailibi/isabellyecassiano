/** Divisor delicado com ramos simétricos. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 240 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <path d="M4 12h86" />
        <path d="M236 12h-86" />
        <path d="M90 12c6-7 14-9 20-5M90 12c6 7 14 9 20 5" />
        <path d="M150 12c-6-7-14-9-20-5M150 12c-6 7-14 9-20 5" />
        <path d="M70 12c4-4 9-5 12-3M70 12c4 4 9 5 12 3" opacity=".7" />
        <path d="M170 12c-4-4-9-5-12-3M170 12c-4 4-9 5-12 3" opacity=".7" />
      </g>
      <path
        d="M120 5.5c1.6-2.2 5.4-1.6 5.4 1.6 0 3-3.4 5-5.4 7-2-2-5.4-4-5.4-7 0-3.2 3.8-3.8 5.4-1.6z"
        fill="currentColor"
        opacity=".85"
        transform="translate(0 3)"
      />
    </svg>
  )
}
