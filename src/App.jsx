import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchPage } from './components/SearchPage';
import { ResultsPage } from './components/ResultsPage';

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
