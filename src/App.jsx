import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';
import { ApiKeyPage } from './components/ApiKeyPage';

const App = () => {
  const isGithubPages = window.location.hostname === 'whole-earth.github.io';
  const hasApiKey = localStorage.getItem('openaiApiKey') || import.meta.env.VITE_OPENAI_API_KEY;

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/" 
            element={
              isGithubPages && !hasApiKey ? 
                <ApiKeyPage /> : 
                <Navigate to="/search" />
            } 
          />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
