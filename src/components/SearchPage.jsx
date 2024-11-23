// src/components/SearchPage.jsx
import React, { useState, useEffect } from 'react';
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

const EXAMPLE_QUERIES_DATA = {
  'Cars in Kendrick Lamar album covers': {
    mainTopicImages: [
      {
        url: "https://media.pitchfork.com/photos/5ee8d6d997d2833d05bf2dbc/master/w_1280%2Cc_limit/good%2520kid%2520maad%2520city.jpg",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxK1dR8NT8jRJwOuhJwIqp8KCF7JrV8F8RLA&usqp=CAU",
        source: "Pitchfork",
        title: "Good Kid Maad City Album Cover",
        width: 1280,
        height: 1280
      }
    ],
    related_topics: [
      {
        title: "West Coast Car Culture in Hip-Hop",
        description: "Exploration of how LA car culture influenced Kendrick's visual storytelling",
        images: [{
          url: "https://www.rollingstone.com/wp-content/uploads/2022/05/mr-morale.jpg",
          thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5F8FG6J2Y2J2Y2J2Y2J2Y2J2Y2J2Y2J2Y2J2Y2J2Y&s",
          source: "Rolling Stone",
          title: "Kendrick Lamar Album Art",
          width: 1500,
          height: 1500
        }]
      }
      // Add other related topics with images
    ]
  },
  'Kenny Scharf Cars': {
    mainTopicImages: [
      {
        url: "https://www.kennyscharf.com/wp-content/uploads/2019/07/Kenny-Scharf-Car-Art.jpg",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8S8&s",
        source: "Kenny Scharf Official",
        title: "Kenny Scharf Car Installation",
        width: 1200,
        height: 800
      }
    ],
    related_topics: [
      // Similar structure for related topics
    ]
  },
  'OTIS music video Maybach': {
    mainTopicImages: [
      {
        url: "https://www.carscoops.com/wp-content/uploads/2011/08/Maybach-57-Watch-The-Throne-0.jpg",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9T9&s",
        source: "Carscoops",
        title: "Maybach Watch The Throne",
        width: 1920,
        height: 1080
      }
    ],
    related_topics: [
      // Similar structure for related topics
    ]
  }
};

export const SearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const navigate = useNavigate();
  const { getCachedResult, cacheResult } = useLocalDB();

  React.useEffect(() => {
    const cacheExampleQueries = async () => {
      for (const query of EXAMPLE_QUERIES) {
        const cached = await getCachedResult(query);
        if (!cached) {
          try {
            const themes = EXAMPLE_QUERIES_DATA[query] || await fetchRelatedThemes(query);
            await cacheResult(query, themes);
          } catch (error) {
            console.error(`Error caching example query "${query}":`, error);
          }
        }
      }
    };

    cacheExampleQueries();
  }, []);

  const handleQuery = async (query) => {
    const apiKey = localStorage.getItem('openaiApiKey') || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('No API key found in localStorage or environment variables');
      navigate('/'); // Redirect to API key page
      return;
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center">
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="w-[200px] my-[10px] object-contain"
      />
      <div className="max-w-2xl w-full px-6">
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
    </div>
  );
};