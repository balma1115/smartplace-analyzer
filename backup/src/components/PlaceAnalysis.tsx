import React, { useState } from 'react';
import { Settings, AlertTriangle, Rocket } from 'lucide-react';
import './PlaceAnalysis.css';

const PlaceAnalysis: React.FC = () => {
  const [url, setUrl] = useState('https://map.naver.com/p/search/%EB%B2%8C%EC%9B%90%ED%95%99%EC%9B%90/place/1616011574?placePath=/home?entry=pll&from=nx&fromNxList=true&fromPanelNum=2&timestamp=202507181409&locale=ko&svcName=map_pcv5&searchText=%EB%B2%8C%EC%9B%90%ED%95%99%EC%9B%90&searchType=place&c=15.00,0,0,0,dh');

  const handleAnalyze = () => {
    // 실제 분석 로직은 여기에 구현
    console.log('분석 시작:', url);
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
          <button onClick={handleAnalyze} className="analyze-button">
            분석 시작
          </button>
        </div>
      </div>

      {/* 경고 메시지 */}
      <div className="warning-box">
        <AlertTriangle size={20} />
        <span>▲ 데모 버전: 실제 URL 분석을 위해서는 네이버플레이스 스크래핑 기능을 추가해야 합니다.</span>
      </div>

      {/* 전체 점수 */}
      <div className="score-section">
        <h3>전체 점수</h3>
        <div className="score-display">
          <span className="score">37/100</span>
          <span className="recommendation">
            <Rocket size={16} />
            개선 필요
          </span>
        </div>
      </div>

      {/* 대표 키워드 분석 */}
      <div className="keyword-analysis">
        <h3>● 대표 키워드 분석</h3>
        <p className="keyword-summary">설정된 키워드: 3개 | 권장 키워드: 8개 | 누락: 6개</p>
        
        <div className="keyword-tags">
          <span className="keyword-tag set">벌원학원</span>
          <span className="keyword-tag set">영어학원</span>
          <span className="keyword-tag set">초등영어</span>
          <span className="keyword-tag missing">미래엔영어 (누락)</span>
          <span className="keyword-tag missing">중등영어 (누락)</span>
          <span className="keyword-tag missing">파닉스 (누락)</span>
          <span className="keyword-tag missing">영어교육 (누락)</span>
          <span className="keyword-tag missing">학원 (누락)</span>
          <span className="keyword-tag missing">미래엔 (누락)</span>
        </div>
      </div>

      {/* 정보 완성도 체크리스트 */}
      <div className="checklist-section">
        <h3>정보 완성도 체크리스트</h3>
        <div className="checklist-grid">
          <div className="checklist-item complete">
            <div className="checklist-icon">✓</div>
            <div className="checklist-content">
              <h4>기본 정보 완성도</h4>
              <p>학원명, 주소, 전화번호, 영업시간 등</p>
            </div>
          </div>
          
          <div className="checklist-item incomplete">
            <div className="checklist-icon">✗</div>
            <div className="checklist-content">
              <h4>상세 설명 충실도</h4>
              <p>미래엔 교재 사용, 교육 방식, 학원 특징 설명</p>
            </div>
          </div>
          
          <div className="checklist-item incomplete">
            <div className="checklist-icon">✗</div>
            <div className="checklist-content">
              <h4>프로그램 정보</h4>
              <p>초등영어, 중등영어, 파닉스 등 과정별 안내</p>
            </div>
          </div>
          
          <div className="checklist-item incomplete">
            <div className="checklist-icon">✗</div>
            <div className="checklist-content">
              <h4>쿠폰/이벤트</h4>
              <p>체험 수업, 등록 할인, 추천 혜택 등</p>
            </div>
          </div>
          
          <div className="checklist-item warning">
            <div className="checklist-icon">⚠</div>
            <div className="checklist-content">
              <h4>대표 키워드 설정</h4>
              <p>미래엔영어, 초등영어, 중등영어, 영어학원 등</p>
            </div>
          </div>
          
          <div className="checklist-item warning">
            <div className="checklist-icon">⚠</div>
            <div className="checklist-content">
              <h4>이미지 등록 상태</h4>
              <p>학원 외관, 내부, 교실, 교재 사진 등 5개 이상</p>
            </div>
          </div>
          
          <div className="checklist-item incomplete">
            <div className="checklist-icon">✗</div>
            <div className="checklist-content">
              <h4>수강료 정보</h4>
              <p>월 수강료, 등록비, 교재비 등 요금 안내</p>
            </div>
          </div>
          
          <div className="checklist-item complete">
            <div className="checklist-icon">✓</div>
            <div className="checklist-content">
              <h4>리뷰 관리</h4>
              <p>학부모 리뷰 응답률 및 평점 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 개선 제안사항 */}
      <div className="improvement-section">
        <h3>
          <Rocket size={20} />
          ★개선 제안사항
        </h3>
        
        <div className="improvement-item">
          <h4>대표 키워드 완성 필요 (높은 우선순위)</h4>
          <p>"미래엔영어", "파닉스", "영어교육" 등 브랜드 핵심 키워드를 추가하여 검색 노출을 향상시키세요.</p>
        </div>
        
        <div className="improvement-item">
          <h4>상세 설명 보강 필요</h4>
          <p>미래엔 교재 사용, 체계적인 교육 과정, 학원만의 특징을 구체적으로 설명하세요.</p>
        </div>
        
        <div className="improvement-item">
          <h4>수강료 정보 등록</h4>
          <p>월 수강료, 등록비, 교재비 등 구체적인 요금 정보를 등록하여 학부모의 문의를 줄이세요.</p>
        </div>
      </div>
    </div>
  );
};

export default PlaceAnalysis; 