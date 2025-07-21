import React, { useState } from 'react';
import { Settings, AlertTriangle, Rocket } from './Icons';
import './PlaceAnalysis.css';

interface AnalysisResult {
  success: boolean;
  data?: {
    // 기본 정보
    placeName: string;
    category: string;
    address: string;
    phone: string;
    businessHours: string;
    description: string;
    
    // 리뷰 및 버튼 정보
    visitorReviews: number;
    blogReviews: number;
    hasReservationButton: boolean;
    hasInquiryButton: boolean;
    
    // 추가 정보
    directions: string;
    cost: string;
    blogLink: string | null;
    instagramLink: string | null;
    
    // 새로 추가된 정보
    availableTabs: string[];
    hasReservationTab: boolean;
    hasCouponTab: boolean;
    hasCouponArea: boolean;
    detailedInfo: { [key: string]: string };
    
    // 이미지 정보
    images: Array<{
      image: string;
      uploadDate: string;
      originalDate: string;
    }>;
    
    // 분석 점수 및 제안
    score: number;
    recommendations: Array<{
      title: string;
      description: string;
      priority: string;
    }>;
  };
  error?: string;
}

// Props 타입 정의
interface PlaceAnalysisProps {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
}

const PlaceAnalysis: React.FC<PlaceAnalysisProps> = ({ analysisResult, setAnalysisResult }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    console.log('프론트엔드에서 분석 시작');
    console.log('전송할 URL:', url);
    console.log('현재 시간:', new Date().toISOString());

    setIsLoading(true);
    // 새로운 분석 시작시에만 이전 결과 초기화
    setAnalysisResult(null);

    try {
      const requestBody = { url: url.trim() };
      console.log('요청 본문:', requestBody);

      const response = await fetch('http://localhost:3001/api/analyze-place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      setAnalysisResult(result);
      
      if (!result.success) {
        alert(`분석 중 오류가 발생했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      alert('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="place-analysis">
      {/* 분석 섹션 */}
      <div className="analysis-section">
        <div className="section-header">
          <Settings size={20} />
          <h2>미래엔영어 가맹점 전용 분석</h2>
        </div>
        <p className="section-description">
          미래엔이 만든 초중등 영어학원 프랜차이즈의 네이버플레이스 최적화 상태를 체크합니다.
        </p>
        
        <div className="url-input-section">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="네이버플레이스 URL을 입력하세요"
            className="url-input"
          />
          <button onClick={handleAnalyze} className="analyze-button" disabled={isLoading}>
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </div>
      </div>

      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="warning-box">
          <AlertTriangle size={20} />
          <span>🔍 네이버플레이스 페이지를 분석 중입니다... 잠시만 기다려주세요.</span>
        </div>
      )}

      {/* 분석 결과가 없을 때 안내 메시지 */}
      {!analysisResult && !isLoading && (
        <div className="warning-box">
          <AlertTriangle size={20} />
          <span>⚡ 실제 네이버플레이스 크롤링 기능이 구현되었습니다! 위의 URL을 입력하고 "분석 시작" 버튼을 눌러보세요.</span>
        </div>
      )}

      {/* 분석 결과 표시 */}
      {analysisResult && analysisResult.success && (
        <>
          {/* 학원명 헤더 */}
          <div className="place-header">
            <h2 className="place-name">{analysisResult.data?.placeName}</h2>
          </div>

          {/* 기본 정보 */}
          <div className="content-section">
            <h3>🏫 기본 정보</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">업종</span>
                <span className="info-value">{analysisResult.data?.category}</span>
              </div>
              <div className="info-item">
                <span className="info-label">주소</span>
                <span className="info-value">{analysisResult.data?.address}</span>
              </div>
              <div className="info-item">
                <span className="info-label">전화번호</span>
                <span className="info-value">{analysisResult.data?.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">영업시간</span>
                <span className="info-value">{analysisResult.data?.businessHours}</span>
              </div>
              <div className="info-item">
                <span className="info-label">찾아오는길</span>
                <span className="info-value">{analysisResult.data?.directions}</span>
              </div>
              <div className="info-item">
                <span className="info-label">비용</span>
                <span className="info-value">{analysisResult.data?.cost}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">설명</span>
                <span className="info-value">{analysisResult.data?.description}</span>
              </div>
            </div>
          </div>

          {/* 리뷰 현황 */}
          <div className="content-section">
            <h3>📊 리뷰 현황</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{analysisResult.data?.visitorReviews || 0}</div>
                <div className="stat-label">방문자 리뷰</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analysisResult.data?.blogReviews || 0}</div>
                <div className="stat-label">블로그 리뷰</div>
              </div>
            </div>
          </div>

          {/* 탭 및 기능 활용 현황 */}
          <div className="content-section">
            <h3>🎯 탭 및 기능 활용 현황</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className={`stat-status ${(analysisResult.data?.hasReservationButton || analysisResult.data?.hasReservationTab) ? 'active' : 'inactive'}`}>
                  {(analysisResult.data?.hasReservationButton || analysisResult.data?.hasReservationTab) ? '✓' : '✗'}
                </div>
                <div className="stat-label">예약 기능</div>
              </div>
              <div className="stat-card">
                <div className={`stat-status ${analysisResult.data?.hasInquiryButton ? 'active' : 'inactive'}`}>
                  {analysisResult.data?.hasInquiryButton ? '✓' : '✗'}
                </div>
                <div className="stat-label">문의 버튼</div>
              </div>
              <div className="stat-card">
                <div className={`stat-status ${(analysisResult.data?.hasCouponTab || analysisResult.data?.hasCouponArea) ? 'active' : 'inactive'}`}>
                  {(analysisResult.data?.hasCouponTab || analysisResult.data?.hasCouponArea) ? '✓' : '✗'}
                </div>
                <div className="stat-label">쿠폰 기능</div>
              </div>
            </div>

            {/* 사용 가능한 탭 목록 */}
            {analysisResult.data?.availableTabs && analysisResult.data.availableTabs.length > 0 && (
              <div className="tabs-info">
                <h5>📋 사용 중인 탭</h5>
                <div className="tab-tags">
                  {analysisResult.data.availableTabs.map((tab, index) => (
                    <span key={index} className="tab-tag">{tab}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 소셜 링크 */}
          {(analysisResult.data?.blogLink || analysisResult.data?.instagramLink) && (
            <div className="social-links">
              <h4>🔗 소셜 미디어 링크</h4>
              {analysisResult.data?.blogLink && (
                <a href={analysisResult.data.blogLink} target="_blank" rel="noopener noreferrer" className="social-link blog">
                  📝 블로그
                </a>
              )}
              {analysisResult.data?.instagramLink && (
                <a href={analysisResult.data.instagramLink} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                  📷 인스타그램
                </a>
              )}
            </div>
          )}

          {/* 이미지 업데이트 날짜 */}
          {analysisResult.data?.images && analysisResult.data.images.length > 0 && (
            <div className="content-section">
              <h3>📷 이미지 업데이트 날짜</h3>
              <div className="image-dates">
                {analysisResult.data.images.map((imageInfo: any, index: number) => (
                  <div key={index} className="image-date-item">
                    <span className="image-label">{imageInfo.image}</span>
                    <span className="image-date">{imageInfo.uploadDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상세 정보 */}
          {analysisResult.data?.detailedInfo && Object.keys(analysisResult.data.detailedInfo).length > 0 && (
            <div className="content-section">
              <h3>📋 상세 정보 (정보 탭에서 수집)</h3>
              <div className="detailed-info">
                {Object.entries(analysisResult.data.detailedInfo).map(([key, value], index) => (
                  <div key={index} className="detail-item">
                    <h4 className="detail-title">{key}</h4>
                    <p className="detail-content">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 점수 */}
          <div className="score-section">
            <h3>전체 점수</h3>
            <div className="score-display">
              <span className="score">{analysisResult.data?.score || 0}/100</span>
              <span className="recommendation">
                <Rocket size={16} />
                {(analysisResult.data?.score || 0) >= 80 ? '우수' : 
                 (analysisResult.data?.score || 0) >= 60 ? '양호' : '개선 필요'}
              </span>
            </div>
          </div>

          {/* 개선 제안사항 */}
          {analysisResult.data?.recommendations && analysisResult.data.recommendations.length > 0 && (
            <div className="improvement-section">
              <h3>
                <Rocket size={20} />
                ★실시간 개선 제안사항
              </h3>
              
              {analysisResult.data.recommendations.map((rec, index) => (
                <div key={index} className="improvement-item">
                  <h4>{rec.title} ({rec.priority === 'high' ? '높은 우선순위' : '보통 우선순위'})</h4>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlaceAnalysis; 