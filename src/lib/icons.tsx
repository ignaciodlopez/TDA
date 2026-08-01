interface Props {
  path: string;
  size?: number;
  className?: string;
}

/** Mismos trazos que src/components/common/Icon.astro (feather-icons), para islas de React. */
export function ReactIcon({ path, size = 18, className = '' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />',
  pin: '<path d="M12 21s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z" /><circle cx="12" cy="8" r="3" />',
  sliders:
    '<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />',
  map: '<polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" />',
  list: '<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />',
  broadcast:
    '<path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.5 16.4a6 6 0 0 1 7 0" /><circle cx="12" cy="20" r="1" />',
  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />',
  tv: '<rect x="2" y="7" width="20" height="14" rx="2" /><polyline points="17 2 12 7 7 2" />',
} as const;
