import axios from 'axios';
import type { Article, UserInteraction } from '../types';

const API_BASE = '/api';

// for flask backend

export const api = {
  // Article interactions
  likeArticle: async (articleId: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/articles/${articleId}/like`);
    } catch (error) {
      console.error('Error liking article:', error);
    }
  },

  unlikeArticle: async (articleId: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE}/articles/${articleId}/like`);
    } catch (error) {
      console.error('Error unliking article:', error);
    }
  },

  viewArticle: async (articleId: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/articles/${articleId}/view`);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  },

  // get user's liked articles
  getLikedArticles: async (): Promise<Article[]> => {
    try {
      const response = await axios.get(`${API_BASE}/articles/liked`);
      return response.data.articles || [];
    } catch (error) {
      console.error('Error fetching liked articles:', error);
      return [];
    }
  },

  // get the user's viewing history
  getHistory: async (): Promise<Article[]> => {
    try {
      const response = await axios.get(`${API_BASE}/articles/history`);
      return response.data.articles || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  },

  // Save article to database
  saveArticle: async (article: Article): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/articles`, article);
    } catch (error) {
      console.error('Error saving article:', error);
    }
  }
};