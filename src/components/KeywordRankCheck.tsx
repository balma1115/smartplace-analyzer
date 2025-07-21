import React, { useState } from 'react';
import { Trophy } from './Icons';
import LocationSelector from './LocationSelector';
import './KeywordRankCheck.css';

interface LocationInfo {
  lat?: number;
  lng?: number;
  address?: string;
  name?: string;
}

interface KeywordRank {
  keyword: string;
  rank: number | null;
  status: 'excellent' | 'good' | 'needs-improvement' | 'not-exposed';
}

// 분석 결과 타입 정의 (App.tsx와 동일)
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

interface KeywordRankCheckProps {
  analysisResult?: AnalysisResult | null;
}

const KeywordRankCheck: React.FC<KeywordRankCheckProps> = ({ analysisResult }) => {
  // 분석 결과가 있으면 학원명을 자동으로 설정
  const [academyName, setAcademyName] = useState(
    analysisResult?.data?.placeName || '벌원학원'
  );
  
  // 분석 결과에서 키워드 가져오기
  const getKeywordsFromAnalysis = () => {
    if (analysisResult?.data?.detailedInfo?.['대표키워드']) {
      return analysisResult.data.detailedInfo['대표키워드'];
    }
    return '';  // 기본값은 빈 문자열로 설정
  };

  const [keywords, setKeywords] = useState(getKeywordsFromAnalysis());
  const [ranks, setRanks] = useState<KeywordRank[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [progress, setProgress] = useState(0);
  const [location, setLocation] = useState<LocationInfo | null>(null);

  // 순위에 따른 상태 결정
  const getRankStatus = (rank: number | null): 'excellent' | 'good' | 'needs-improvement' | 'not-exposed' => {
    if (rank === null) return 'not-exposed';
    if (rank <= 4) return 'excellent';
    if (rank <= 10) return 'good';
    return 'needs-improvement';
  };

  // 진행 상태 폴링 함수
  const pollProgress = (sessionId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const checkProgress = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/check-progress/${sessionId}`);
          
          if (!response.ok) {
            throw new Error('진행 상태 확인 실패');
          }

          const result = await response.json();
          
          if (result.success && result.data) {
            const data = result.data;
            
            // UI 업데이트
            setProgress(data.progress || 0);
            setCurrentKeyword(data.currentKeyword || '');
            
            if (data.results && data.results.length > 0) {
              const keywordRanks: KeywordRank[] = data.results.map((item: any) => ({
                keyword: item.keyword,
                rank: item.rank,
                status: getRankStatus(item.rank)
              }));
              setRanks(keywordRanks);
            }
            
            // 완료되었는지 확인
            if (data.isComplete) {
              if (data.error) {
                reject(new Error(data.error));
              } else {
                setHasResults(true);
                setProgress(100);
                setCurrentKeyword('순위 확인 완료!');
                setTimeout(() => {
                  setCurrentKeyword('');
                  setProgress(0);
                }, 2000);
                resolve(data);
              }
            } else {
              // 아직 진행 중이면 1초 후 다시 확인
              setTimeout(checkProgress, 1000);
            }
          } else {
            reject(new Error('진행 상태 확인 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkProgress();
    });
  };

  const handleCheckRanks = async () => {
    if (!academyName.trim() || !keywords.trim()) {
      alert('학원명과 키워드를 모두 입력해주세요.');
      return;
    }

    setIsChecking(true);
    setHasResults(false);
    setProgress(0);
    setCurrentKeyword('');
    setRanks([]);

    try {
      const keywordList = keywords.split('\n').filter(k => k.trim());
      
      // 키워드 확인 작업 시작
      const response = await fetch('http://localhost:3001/api/check-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academyName: academyName.trim(),
          keywords: keywordList,
          location: location
        }),
      });

      if (!response.ok) {
        throw new Error('순위 확인 시작 실패');
      }

      const startResult = await response.json();
      
      if (startResult.success && startResult.sessionId) {
        // 진행 상태 폴링 시작
        await pollProgress(startResult.sessionId);
      } else {
        throw new Error('세션 생성 실패');
      }

    } catch (error) {
      console.error('키워드 순위 확인 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`순위 확인 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsChecking(false);
      setTimeout(() => {
        setCurrentKeyword('');
        setProgress(0);
      }, 3000);
    }
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
  const exposedCount = ranks.filter((r: KeywordRank) => r.rank !== null).length;
  const top3Count = ranks.filter((r: KeywordRank) => r.rank !== null && r.rank <= 3).length;
  const top10Count = ranks.filter((r: KeywordRank) => r.rank !== null && r.rank <= 10).length;
  const averageRank = ranks.filter((r: KeywordRank) => r.rank !== null).length > 0 ? Math.round(
    ranks.filter((r: KeywordRank) => r.rank !== null).reduce((sum: number, r: KeywordRank) => sum + (r.rank || 0), 0) / 
    ranks.filter((r: KeywordRank) => r.rank !== null).length
  ) : 0;

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

      {/* 위치 선택기 */}
      <LocationSelector 
        onLocationChange={setLocation}
        initialLocation={null}
      />

      {/* 입력 폼 */}
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="academy-name">학원명</label>
          <input
            id="academy-name"
            type="text"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            placeholder="예: 미래엔영어 벌원학원"
          />
        </div>
        <div className="input-group">
          <label htmlFor="keywords">확인할 키워드 (한 줄에 하나씩)</label>
          <textarea
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: &#10;벌원초 영어학원&#10;벌원동 영어학원&#10;광주시 영어학원&#10;초등영어 벌원&#10;영어학원 벌원"
            rows={8}
          />
          <p className="example-text">
            예시: 벌원동 영어학원, 광주시 초등영어, 경기도 영어학원 등
          </p>
        </div>

        <button 
          onClick={handleCheckRanks} 
          className="check-button"
          disabled={isChecking}
        >
          {isChecking ? '순위 확인 중...' : '순위 확인 시작'}
        </button>

        {/* 진행 상태 표시 */}
        {(isChecking || progress > 0) && (
          <div className="progress-container">
            <div className="progress-info">
              <span className="progress-text">{currentKeyword}</span>
              <span className="progress-percent">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 결과 표시 */}
      {hasResults && (
        <>
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
              {ranks.map((item: KeywordRank, index: number) => (
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
        </>
      )}
    </div>
  );
};

export default KeywordRankCheck; 