export interface Article {
  id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  url: string;
  extract: string;
}

export interface UserInteraction {
  articleId: string;
  liked: boolean;
  viewed: boolean;
}