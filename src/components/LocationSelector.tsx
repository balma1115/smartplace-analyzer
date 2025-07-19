import React, { useState, useEffect } from 'react';
import './LocationSelector.css';

interface LocationInfo {
  lat?: number;
  lng?: number;
  address?: string;
  name?: string;
}

interface LocationSelectorProps {
  onLocationChange: (location: LocationInfo | null) => void;
  initialLocation?: LocationInfo | null;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationChange, initialLocation }) => {
  const [location, setLocation] = useState<LocationInfo | null>(initialLocation || null);
  const [locationType, setLocationType] = useState<'current' | 'manual' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('브라우저가 위치 정보를 지원하지 않습니다.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: LocationInfo = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(newLocation);
        setLocationType('current');
        onLocationChange(newLocation);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 접근 권한이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  };

  // 수동 입력 처리
  const handleManualInput = (field: keyof LocationInfo, value: string) => {
    const newLocation = { ...location } as LocationInfo;
    
    if (field === 'lat' || field === 'lng') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        newLocation[field] = numValue;
      } else {
        delete newLocation[field];
      }
    } else {
      if (value.trim()) {
        newLocation[field] = value.trim();
      } else {
        delete newLocation[field];
      }
    }

    setLocation(newLocation);
    setLocationType('manual');
    onLocationChange(Object.keys(newLocation).length > 0 ? newLocation : null);
  };

  // 위치 정보 초기화
  const clearLocation = () => {
    setLocation(null);
    setLocationType('none');
    onLocationChange(null);
    setError('');
  };

  return (
    <div className="location-selector">
      <h3>📍 검색 위치 설정</h3>
      <p className="location-description">
        네이버 지도는 검색 위치에 따라 결과 순위가 달라집니다. 
        정확한 순위 확인을 위해 학원과 가까운 위치를 설정해주세요.
      </p>

      <div className="location-options">
        <div className="location-option">
          <button
            type="button"
            className={`location-btn ${locationType === 'current' ? 'active' : ''}`}
            onClick={getCurrentLocation}
            disabled={isLoading}
          >
            {isLoading ? '📍 위치 확인 중...' : '📍 현재 위치 사용'}
          </button>
          {locationType === 'current' && location && (
            <div className="location-info">
              <span>위도: {location.lat?.toFixed(6)}, 경도: {location.lng?.toFixed(6)}</span>
              <button type="button" className="clear-btn" onClick={clearLocation}>
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="location-option">
          <button
            type="button"
            className={`location-btn ${locationType === 'manual' ? 'active' : ''}`}
            onClick={() => setLocationType('manual')}
          >
            📝 수동 입력
          </button>
          
          {locationType === 'manual' && (
            <div className="manual-input">
              <div className="input-group">
                <label>장소명 (예: 벌원초등학교)</label>
                <input
                  type="text"
                  placeholder="장소명을 입력하세요"
                  value={location?.name || ''}
                  onChange={(e) => handleManualInput('name', e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label>주소</label>
                <input
                  type="text"
                  placeholder="주소를 입력하세요"
                  value={location?.address || ''}
                  onChange={(e) => handleManualInput('address', e.target.value)}
                />
              </div>
              
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label>위도</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="37.123456"
                    value={location?.lat || ''}
                    onChange={(e) => handleManualInput('lat', e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>경도</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="127.123456"
                    value={location?.lng || ''}
                    onChange={(e) => handleManualInput('lng', e.target.value)}
                  />
                </div>
              </div>
              
              <button type="button" className="clear-btn" onClick={clearLocation}>
                위치 정보 초기화
              </button>
            </div>
          )}
        </div>

        <div className="location-option">
          <button
            type="button"
            className={`location-btn ${locationType === 'none' ? 'active' : ''}`}
            onClick={clearLocation}
          >
            🌍 기본 위치 사용
          </button>
          <span className="location-note">네이버 지도 기본 위치에서 검색</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {location && (
        <div className="location-summary">
          <h4>✅ 설정된 위치 정보</h4>
          <div className="location-details">
            {location.name && <div>장소명: {location.name}</div>}
            {location.address && <div>주소: {location.address}</div>}
            {location.lat && location.lng && (
              <div>좌표: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector; 