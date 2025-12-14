import { useState } from 'react';
import type { Article } from '../types';
import { api } from '../services/api';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) {
      await api.unlikeArticle(article.id);
      setLiked(false);
    } else {
      await api.saveArticle(article);      
      await api.likeArticle(article.id);  
      setLiked(true);
    }
  };

  const handleReadMore = async () => {
    await api.saveArticle(article);        
    await api.viewArticle(article.id);     
    window.open(article.url, '_blank');
  };

  return (
     <div className="h-full flex items-center justify-center px-8">
      <div className="max-w-3xl w-full space-y-6">

        {/* IMAGE */}
        {article.thumbnail && (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full max-h-[400px] object-cover rounded-lg"
            loading="lazy"
          />
        )}

        <h2 className="text-3xl font-semibold leading-tight text-white">
          {article.title}
        </h2>

        <p className="text-white/80 leading-relaxed line-clamp-6">
          {article.extract}
        </p>

        <div className="flex items-center gap-6 pt-4">
          <button onClick={handleReadMore}>Read article</button>
          <button onClick={handleLike}>
            {liked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};