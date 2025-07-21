import React from 'react';
import './TabNavigation.css';

interface TabNavigationProps {
  activeTab: 'analysis' | 'keyword';
  onTabChange: (tab: 'analysis' | 'keyword') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
        onClick={() => onTabChange('analysis')}
      >
        플레이스 분석
      </button>
      <button
        className={`tab-button ${activeTab === 'keyword' ? 'active' : ''}`}
        onClick={() => onTabChange('keyword')}
      >
        키워드 순위 확인
      </button>
    </nav>
  );
};

export default TabNavigation; 