import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import PlaceAnalysis from './components/PlaceAnalysis';
import KeywordRankCheck from './components/KeywordRankCheck';

// 분석 결과 타입 정의
interface AnalysisResult {
  success: boolean;
  data?: {
    placeName: string;
    category: string;
    address: string;
    phone: string;
    businessHours: string;
    description: string;
    visitorReviews: number;
    blogReviews: number;
    hasReservationButton: boolean;
    hasInquiryButton: boolean;
    directions: string;
    cost: string;
    blogLink: string | null;
    instagramLink: string | null;
    availableTabs: string[];
    hasReservationTab: boolean;
    hasCouponTab: boolean;
    hasCouponArea: boolean;
    detailedInfo: { [key: string]: string };
    images: Array<{
      image: string;
      uploadDate: string;
      originalDate: string;
    }>;
    score: number;
    recommendations: Array<{
      title: string;
      description: string;
      priority: string;
    }>;
  };
  error?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'keyword'>('analysis');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  return (
    <div className="App">
      <Header />
      <div className="container">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'analysis' ? (
          <PlaceAnalysis 
            analysisResult={analysisResult} 
            setAnalysisResult={setAnalysisResult} 
          />
        ) : (
          <KeywordRankCheck 
            analysisResult={analysisResult}
          />
        )}
      </div>
    </div>
  );
}

export default App; 