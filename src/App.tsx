import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SettingsProvider } from './context/SettingsContext';

import TextToImage from './pages/TextToImage';
import ImageToImage from './pages/ImageToImage';
import VideoGeneration from './pages/VideoGeneration';
import Tools from './pages/Tools';
import History from './pages/History';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/images/generations" replace />} />
                <Route path="/images/generations" element={<TextToImage />} />
                <Route path="/images/compositions" element={<ImageToImage />} />
                <Route path="/videos/generations" element={<VideoGeneration />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </Router>
    </SettingsProvider>
  );
}

export default App;
