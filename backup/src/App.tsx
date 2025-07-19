import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import PlaceAnalysis from './components/PlaceAnalysis';
import KeywordRankCheck from './components/KeywordRankCheck';

function App() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'keyword'>('analysis');

  return (
    <div className="App">
      <Header />
      <div className="container">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'analysis' ? <PlaceAnalysis /> : <KeywordRankCheck />}
      </div>
    </div>
  );
}

export default App; 