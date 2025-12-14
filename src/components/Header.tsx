import { useState } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onRandomize: () => void;
}

export const Header = ({ onSearch, onRandomize }: HeaderProps) => {
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
        <span className="text-sm font-semibold tracking-wide">
          WikiTok
        </span>

        <form onSubmit={submit} className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Wikipedia"
            className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
          />
        </form>

        <button
          onClick={onRandomize}
          className="text-sm px-3 py-1.5 border border-white/20 rounded-md hover:bg-white/10 transition"
        >
          Random
        </button>
      </div>
    </header>
    
  );
};
