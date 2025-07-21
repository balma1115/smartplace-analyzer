import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import './KeywordRankCheck.css';

interface KeywordRank {
  keyword: string;
  rank: number | null;
  status: 'excellent' | 'good' | 'needs-improvement' | 'not-exposed';
}

const KeywordRankCheck: React.FC = () => {
  const [academyName, setAcademyName] = useState('벌원학원');
  const [keywords, setKeywords] = useState(`탄벌동 영어학원
탄벌동 수학학원
탄벌초 영어학원
관악구 영어학원
신림동 영어학원
관악구 초등영어
신림동 파닉스
벌원동 학원`);

  // 데모 데이터
  const demoRanks: KeywordRank[] = [
    { keyword: '탄벌동 영어학원', rank: 2, status: 'excellent' },
    { keyword: '탄벌동 수학학원', rank: 5, status: 'good' },
    { keyword: '탄벌초 영어학원', rank: 8, status: 'good' },
    { keyword: '관악구 영어학원', rank: 12, status: 'needs-improvement' },
    { keyword: '신림동 영어학원', rank: 15, status: 'needs-improvement' },
    { keyword: '관악구 초등영어', rank: 3, status: 'excellent' },
    { keyword: '신림동 파닉스', rank: 7, status: 'good' },
    { keyword: '벌원동 학원', rank: null, status: 'not-exposed' },
  ];

  const handleCheckRanks = () => {
    // 실제 순위 확인 로직은 여기에 구현
    console.log('순위 확인 시작:', { academyName, keywords });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '우수';
      case 'good': return '양호';
      case 'needs-improvement': return '개선필요';
      case 'not-exposed': return '미노출';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#FF9800';
      case 'needs-improvement': return '#F44336';
      case 'not-exposed': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getBackgroundColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#E8F5E8';
      case 'good': return '#FFF3E0';
      case 'needs-improvement': return '#FFEBEE';
      case 'not-exposed': return '#F5F5F5';
      default: return '#F5F5F5';
    }
  };

  // 통계 계산
  const exposedCount = demoRanks.filter(r => r.rank !== null).length;
  const top3Count = demoRanks.filter(r => r.rank !== null && r.rank <= 3).length;
  const top10Count = demoRanks.filter(r => r.rank !== null && r.rank <= 10).length;
  const averageRank = Math.round(
    demoRanks.filter(r => r.rank !== null).reduce((sum, r) => sum + (r.rank || 0), 0) / 
    demoRanks.filter(r => r.rank !== null).length
  );

  return (
    <div className="keyword-rank-check">
      {/* 제목 및 설명 */}
      <div className="section-header">
        <Trophy size={20} />
        <h2>키워드 순위 확인</h2>
      </div>
      <p className="section-description">
        지역별 키워드에서 우리 학원이 몇 위에 위치하는지 확인하세요. 최대 20개 키워드까지 한 번에 확인할 수 있습니다.
      </p>

      {/* 입력 폼 */}
      <div className="input-section">
        <div className="input-group">
          <label>우리 학원명</label>
          <input
            type="text"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            placeholder="학원명을 입력하세요"
            className="academy-input"
          />
        </div>

        <div className="input-group">
          <label>확인할 키워드 목록 (한 줄에 하나씩 입력)</label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="키워드를 한 줄에 하나씩 입력하세요"
            className="keywords-textarea"
            rows={8}
          />
          <p className="example-text">
            예시: 탄벌동 영어학원, 관악구 초등영어, 신림동 미래엔영어 등
          </p>
        </div>

        <button onClick={handleCheckRanks} className="check-button">
          순위 확인 시작 (데모)
        </button>
      </div>

      {/* 결과 요약 */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-number">{exposedCount}</div>
          <div className="summary-label">검색 노출</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{top3Count}</div>
          <div className="summary-label">TOP 3</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{top10Count}</div>
          <div className="summary-label">TOP 10</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{averageRank}</div>
          <div className="summary-label">평균 순위</div>
        </div>
      </div>

      {/* 키워드 순위 목록 */}
      <div className="rank-list">
        <h3>키워드 순위 목록</h3>
        <div className="rank-items">
          {demoRanks.map((item, index) => (
            <div
              key={index}
              className="rank-item"
              style={{ backgroundColor: getBackgroundColor(item.status) }}
            >
              <div className="rank-keyword">{item.keyword}</div>
              <div className="rank-info">
                <span className="rank-number">
                  {item.rank ? `${item.rank}위` : '-'}
                </span>
                <span
                  className="rank-status"
                  style={{ color: getStatusColor(item.status) }}
                >
                  {getStatusText(item.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeywordRankCheck; 