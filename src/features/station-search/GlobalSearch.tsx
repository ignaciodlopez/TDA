import { useMemo, useRef, useState } from 'react';
import { searchPlaces } from '@/lib/data/geo';

interface Props {
  placeholder?: string;
}

export default function GlobalSearch({
  placeholder = 'Ingresá tu localidad, provincia o código postal',
}: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const results = useMemo(() => (query.trim().length >= 2 ? searchPlaces(query).slice(0, 8) : []), [query]);

  function resultHref(result: (typeof results)[number]): string {
    return result.type === 'locality'
      ? `/localidades/${result.value.slug}`
      : `/provincias/${result.value.slug}`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results.length > 0 && results[0]) {
      window.location.href = resultHref(results[0]);
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    }
  }

  function handleItemKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      itemRefs.current[index + 1]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else itemRefs.current[index - 1]?.focus();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.focus();
    }
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <label htmlFor="global-search-input" className="sr-only">
        Buscar localidad, provincia o código postal
      </label>
      <input
        id="global-search-input"
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-md border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-primary shadow-lg">
          {results.map((result, index) => (
            <li key={`${result.type}-${result.value.id}`}>
              <a
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={resultHref(result)}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-text-primary hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              >
                <span>{result.value.name}</span>
                <span className="text-xs text-text-secondary">
                  {result.type === 'locality' ? 'Localidad' : 'Provincia'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
