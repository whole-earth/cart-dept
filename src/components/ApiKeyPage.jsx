// src/components/ApiKeyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";

export const ApiKeyPage = () => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedOpenaiKey = localStorage.getItem('openaiApiKey');
    const storedSerperKey = localStorage.getItem('serperApiKey');
    if (storedOpenaiKey) setOpenaiKey(storedOpenaiKey);
    if (storedSerperKey) setSerperKey(storedSerperKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!openaiKey) {
      alert('OpenAI API key is required');
      return;
    }
    localStorage.setItem('openaiApiKey', openaiKey);
    if (serperKey) localStorage.setItem('serperApiKey', serperKey);
    navigate('/search');
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <img 
        src="/cart-dept/logo.png" 
        alt="Logo" 
        className="w-[200px] md:h-[200px] my-[10px] object-contain"
      />
      <div className="max-w-md w-full px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              OpenAI API Key (required)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Serper API Key (optional)
            </label>
            <input
              type="password"
              value={serperKey}
              onChange={(e) => setSerperKey(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <Button type="submit" className="w-full">
            Save Keys
          </Button>
        </form>
      </div>
    </div>
  );
};