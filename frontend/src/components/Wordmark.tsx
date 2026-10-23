type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={className ? `wordmark ${className}` : "wordmark"}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 2.5 29.5 16 16 29.5 2.5 16 16 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M16 9.2 22.8 16 16 22.8 9.2 16 16 9.2Z" fill="#ff2b3a" />
      </svg>
      zenDoc
    </span>
  );
}
