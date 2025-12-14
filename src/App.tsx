import { useState, useEffect, useRef, useCallback } from 'react';
import { ArticleCard } from './components/ArticleCard';
import { Header } from './components/Header';
import { Loading } from './components/Loading';
import type { Article } from './types';
import { fetchRandomArticles, searchArticles } from './services/wikipedia';



function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Load articles
  const loadArticles = useCallback(async (isSearch: boolean = false, query?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const newArticles = isSearch && query 
        ? await searchArticles(query)
        : await fetchRandomArticles(20);
      
      if (newArticles.length === 0) {
        setError('No articles found.');
        setLoading(false);
        return;
      }
      
      setArticles(newArticles);
      hasScrolled.current = false; 
      
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const initialLoad = useRef(false);

  // Initial load
  useEffect(() => {
    // If we've already loaded, don't do it again
    if (initialLoad.current) return;
    
    initialLoad.current = true;
    loadArticles();
  }, []); 

  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || activeCategory !== null || articles.length === 0) {
      return;
    }
    
    setIsLoadingMore(true);
    
    try {
      const more = await fetchRandomArticles(10);
      setArticles(prev => [...prev, ...more]);
    } catch (err) {
      // Silent error 
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, activeCategory, articles.length]);

  // Scroll detection for infinite loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
  if (!hasScrolled.current && container.scrollTop > 0) {
    hasScrolled.current = true;
  }

  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  if (
    hasScrolled.current &&
    distanceFromBottom < 1500 &&
    !isLoadingMore &&
    activeCategory === null
  ) {
    loadMoreArticles();
  }
};


    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreArticles, isLoadingMore, activeCategory]);

  // Handlers
  const handleSearch = (query: string) => {
    setActiveCategory(null);
    loadArticles(true, query);
  };

  const handleRandomize = () => {
    setActiveCategory(null);
    loadArticles(false);
  };

  

  // Loading state
  if (loading && articles.length === 0) {
    return <Loading />;
  }

  // Error state
  if (error && articles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="border border-white/10 rounded-lg p-6 text-center max-w-md">
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={() => loadArticles()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      <Header onSearch={handleSearch} onRandomize={handleRandomize} />
      
      

      {/* Articles Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {articles.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <p className="text-white/50">No articles to display</p>
          </div>
        ) : (
          <>
            {articles.map((article, index) => (
              <section
                key={`${article.id}-${index}`}
                className="h-screen snap-start snap-always"
              >
                <ArticleCard article={article} />
              </section>
            ))}
            
            {/* Loading indicator at bottom */}
            {activeCategory === null && (
              <div className="h-screen flex items-center justify-center">
                {isLoadingMore ? (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-red-500 mb-4"></div>
                    <p className="text-white/70">Loading more articles...</p>
                  </div>
                ) : (
                  <p className="text-white/50">Scroll down for more</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;