// src/components/SearchPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { useLocalDB } from '../hooks/useLocalDB';
import { fetchRelatedThemes } from '../api';
import { ArrowRight } from 'lucide-react';

const EXAMPLE_QUERIES = [
  'Cars in Kendrick Lamar album covers',
  'Kenny Scharf Cars',
  'OTIS music video Maybach'
];

export const SearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const navigate = useNavigate();
  const { getCachedResult, cacheResult } = useLocalDB();

  const handleQuery = async (query) => {
    setLoading(true);
    try {
      const cachedResult = await getCachedResult(query);
      if (cachedResult) {
        navigate('/results', { 
          state: { currentTopic: query, relatedTopics: cachedResult }
        });
        return;
      }

      const themes = await fetchRelatedThemes(query);
      await cacheResult(query, themes);
      
      navigate('/results', {
        state: { currentTopic: query, relatedTopics: themes }
      });
    } catch (error) {
      console.error('Error handling query:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="search-bar">
        <div className="relative">
          <input 
            type="text" 
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Enter a topic..."
            className="w-full p-3 rounded-lg border border-input pr-12" 
          />
          {inputQuery && (
            <Button
              onClick={() => handleQuery(inputQuery)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              size="sm"
              disabled={loading}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {EXAMPLE_QUERIES.map((query) => (
            <Button 
              key={query}
              onClick={() => handleQuery(query)}
              disabled={loading}
            >
              {query}
            </Button>
          ))}
        </div>
      </div>
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
};