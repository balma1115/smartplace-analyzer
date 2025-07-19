const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 네이버 스마트플레이스 분석 API
app.post('/api/analyze-place', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL이 필요합니다.' });
  }

  console.log('=== 새로운 분석 요청 ===');
  console.log('요청 URL:', url);
  console.log('현재 시간:', new Date().toISOString());
  
  let browser;
  try {
    // Puppeteer 브라우저 실행 (매번 완전히 새로운 인스턴스)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-blink-features=AutomationControlled',
        '--disable-ipc-flooding-protection',
        '--user-data-dir=' + require('os').tmpdir() + '\\chrome-user-data-' + Date.now() + Math.random(),
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    const page = await browser.newPage();
    
    // 캐시와 스토리지 완전 비활성화
    await page.setCacheEnabled(false);
    await page.setJavaScriptEnabled(true);
    
    // User Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 모든 스토리지 클리어
    await page.evaluateOnNewDocument(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      // 쿠키도 클리어
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });
    
    // 추가 헤더 설정으로 캐시 방지
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('페이지 로딩 시작:', url);
    
    // URL에 캐시 방지 파라미터 추가
    const urlWithNoCacheParam = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now() + '&_r=' + Math.random();
    console.log('캐시 방지 URL:', urlWithNoCacheParam);
    
    // 페이지 로드
    await page.goto(urlWithNoCacheParam, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('페이지 로드 완료');
    
    // 현재 페이지 URL 확인
    const currentUrl = page.url();
    console.log('현재 페이지 URL:', currentUrl);
    
    // 페이지 타이틀 확인
    const pageTitle = await page.title();
    console.log('페이지 타이틀:', pageTitle);
    
    // 페이지 타이틀에서 학원명 추출 시도
    let titlePlaceName = null;
    if (pageTitle && pageTitle.includes(' - 네이버 지도')) {
      titlePlaceName = pageTitle.replace(' - 네이버 지도', '').trim();
      console.log('페이지 타이틀에서 추출한 학원명:', titlePlaceName);
    }
    
    // 잠시 대기 (페이지 완전 로딩을 위해)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // iframe 찾기 및 접근
    let placeName = null;
    let category = null;
    let address = null;
    let phone = null;
    let businessHours = null;
    let visitorReviews = 0;
    let blogReviews = 0;
    let hasReservationButton = false;
    let hasInquiryButton = false;
    let directions = null;
    let cost = null;
    let blogLink = null;
    let instagramLink = null;
    let keywords = [];
    let images = [];
    let reviews = [];
    let availableTabs = [];
    let hasReservationTab = false;
    let hasCouponTab = false;
    let hasCouponArea = false; // 쿠폰 영역 존재 여부
    let detailedInfo = {};
    let infoTabFound = false; // 정보 탭 발견 여부

    try {
      // 파이썬 코드와 동일한 방식으로 entryIframe 찾기
      console.log('🔍 entryIframe 찾기 시작...');
      
      try {
        // 1. entryIframe으로 정확한 iframe 찾기 (파이썬 코드와 동일)
        const entryIframe = await page.$('#entryIframe');
        if (entryIframe) {
          targetFrame = await entryIframe.contentFrame();
          console.log('✅ entryIframe 발견 및 접근 성공');
          
          // 학원명 찾기
          const titleElement = await targetFrame.$('#_title > div > span.GHAhO');
          if (titleElement) {
            placeName = await targetFrame.evaluate(el => el.textContent, titleElement);
            console.log('*** 학원명 찾음 (entryIframe) ***');
            console.log('학원명:', placeName);
            console.log('원본 URL:', url);
            console.log('현재 프레임 URL:', await targetFrame.url());
          }
        } else {
          console.log('❌ entryIframe을 찾을 수 없음, 대체 방법 시도...');
        }
      } catch (error) {
        console.log('entryIframe 접근 오류:', error.message);
      }

      // entryIframe을 찾지 못한 경우 기존 방식으로 대체
      if (!targetFrame) {
        console.log('🔍 대체 iframe 검색 시작...');
        const iframes = await page.$$('iframe');
        console.log(`총 ${iframes.length}개의 iframe 발견`);
        
        for (let i = 0; i < iframes.length; i++) {
          try {
            const frame = await iframes[i].contentFrame();
            if (frame) {
              const frameUrl = await frame.url();
              console.log(`iframe ${i + 1} URL: ${frameUrl}`);
              
              // 학원명 찾기 시도
              const titleElement = await frame.$('#_title > div > span.GHAhO');
              if (titleElement) {
                placeName = await frame.evaluate(el => el.textContent, titleElement);
                targetFrame = frame;
                console.log('*** 학원명 찾음 (대체 iframe) ***');
                console.log('학원명:', placeName);
                console.log('선택자:', '#_title > div > span.GHAhO');
                console.log('원본 URL:', url);
                console.log('현재 프레임 URL:', frameUrl);
                break;
              }

              // 다른 가능한 선택자들도 시도
              const altTitleSelectors = [
                '.place_bluelink > span',
                '.TYaxT',
                '[data-id="title"]',
                '.Fc1rA',
                'h1',
                '.place_title',
                '.business_name'
              ];

              for (let selector of altTitleSelectors) {
                const element = await frame.$(selector);
                if (element) {
                  placeName = await frame.evaluate(el => el.textContent, element);
                  if (placeName && placeName.trim()) {
                    targetFrame = frame;
                    console.log('*** 학원명 찾음 (대체 선택자) ***');
                    console.log('학원명:', placeName);
                    console.log('선택자:', selector);
                    console.log('원본 URL:', url);
                    console.log('현재 프레임 URL:', frameUrl);
                    
                    // 주변 HTML 컨텍스트도 확인
                    const parentHTML = await frame.evaluate(el => el.parentElement ? el.parentElement.innerHTML : '없음', element);
                    console.log('부모 HTML (처음 200자):', parentHTML.substring(0, 200));
                    break;
                  }
                }
              }

              if (targetFrame) break;
            }
          } catch (frameError) {
            console.log(`iframe ${i + 1} 접근 중 오류:`, frameError.message);
          }
        }
      }

      // iframe 외부에서도 찾기 시도
      // 페이지 타이틀에서 추출한 학원명을 우선 사용
      if (titlePlaceName && titlePlaceName.trim()) {
        placeName = titlePlaceName;
        console.log('*** 최종 학원명 (페이지 타이틀에서 추출) ***');
        console.log('학원명:', placeName);
      }

      if (!placeName) {
        console.log('메인 페이지에서 학원명 찾기 시도...');
        const mainTitleSelectors = [
          '#_title > div > span.GHAhO',
          '.place_bluelink > span',
          '.TYaxT',
          '[data-id="title"]',
          '.Fc1rA',
          'h1',
          '.place_name'
        ];

        for (let selector of mainTitleSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              placeName = await page.evaluate(el => el.textContent, element);
              if (placeName && placeName.trim()) {
                console.log('학원명 찾음 (메인 페이지):', placeName);
                break;
              }
            }
          } catch (err) {
            console.log(`선택자 ${selector} 오류:`, err.message);
          }
        }
      }

      // 정확한 선택자로 상세 정보 수집
      console.log('=== 상세 정보 수집 시작 ===');
      
      // targetFrame이 아직 설정되지 않은 경우에만 추가 검색
      if (!targetFrame) {
        console.log('🔍 추가 iframe 검색 시작...');
        const iframes = await page.$$('iframe');
        console.log(`총 ${iframes.length}개의 iframe 발견`);
        
        for (let i = 0; i < iframes.length; i++) {
          try {
            const frame = await iframes[i].contentFrame();
            if (frame) {
              const frameUrl = await frame.url();
              console.log(`iframe ${i + 1} URL: ${frameUrl}`);
              
              // 플레이스 상세 정보가 있는 iframe 찾기
              if (frameUrl.includes('pcmap.place.naver.com') && frameUrl.includes('/home')) {
                targetFrame = frame;
                console.log(`✅ 타겟 프레임 발견 (iframe ${i + 1}):`, frameUrl);
                break;
              }
              
              // 대안: list URL이지만 실제 데이터가 있는 경우
              if (frameUrl.includes('pcmap.place.naver.com') && frameUrl.includes('/list')) {
                // 이 iframe에서 실제 데이터가 있는지 확인
                const hasData = await frame.evaluate(() => {
                  return document.querySelector('.place_section') !== null || 
                         document.querySelector('#app-root') !== null;
                });
                
                if (hasData) {
                  targetFrame = frame;
                  console.log(`✅ 대체 타겟 프레임 발견 (iframe ${i + 1}):`, frameUrl);
                  break;
                }
              }
            }
          } catch (err) {
            console.log(`iframe ${i + 1} 접근 오류:`, err.message);
            continue;
          }
        }

        // 타겟 프레임을 찾지 못한 경우, 데이터가 있는 첫 번째 iframe 사용
        if (!targetFrame && iframes.length > 0) {
          console.log('🔍 최종 대체 iframe 검색 시작...');
          for (let i = 0; i < iframes.length; i++) {
            try {
              const frame = await iframes[i].contentFrame();
              if (frame) {
                const hasData = await frame.evaluate(() => {
                  return document.querySelector('.place_section') !== null || 
                         document.querySelector('#app-root') !== null ||
                         document.querySelector('.place_bluelink') !== null;
                });
                
                if (hasData) {
                  targetFrame = frame;
                  console.log(`✅ 최종 대체 타겟 프레임 발견 (iframe ${i + 1})`);
                  break;
                }
              }
            } catch (err) {
              console.log(`대체 iframe ${i + 1} 검사 실패:`, err.message);
            }
          }
        }
      }

      if (targetFrame) {
        try {
          // 기본 정보 수집을 병렬로 처리하여 속도 향상
          console.log('🔄 기본 정보 병렬 수집 시작...');
          
          const basicInfoPromises = [
            // 1. 업종/카테고리
            targetFrame.$('#_title > div > span.lnJFt').then(async (element) => {
              if (element) {
                category = await targetFrame.evaluate(el => el.textContent.trim(), element);
                console.log('업종:', category);
              }
            }).catch(() => console.log('업종 정보 없음')),
            
            // 2. 주소
            targetFrame.$('.LDgIH').then(async (element) => {
              if (element) {
                address = await targetFrame.evaluate(el => el.textContent.trim(), element);
                console.log('주소:', address);
              }
            }).catch(() => console.log('주소 정보 없음')),
            
            // 3. 전화번호
            targetFrame.$('.xlx7Q').then(async (element) => {
              if (element) {
                phone = await targetFrame.evaluate(el => el.textContent.trim(), element);
                console.log('전화번호:', phone);
              }
            }).catch(() => console.log('전화번호 정보 없음')),
            
            // 4. 영업시간
            targetFrame.$('.A_cdD').then(async (element) => {
              if (element) {
                businessHours = await targetFrame.evaluate(el => el.textContent.trim(), element);
                console.log('영업시간:', businessHours);
              }
            }).catch(() => console.log('영업시간 정보 없음')),
            
            // 5. 예약/문의 버튼 확인
            targetFrame.$('#app-root > div > div > div.place_section.no_margin.OP4V8 > div.UoIF_ > div').then(async (element) => {
              if (element) {
                const buttonText = await targetFrame.evaluate(el => el.textContent, element);
                hasReservationButton = buttonText.includes('예약');
                hasInquiryButton = buttonText.includes('문의');
                console.log('예약 버튼:', hasReservationButton, '문의 버튼:', hasInquiryButton);
              }
            }).catch(() => console.log('예약/문의 버튼 정보 없음')),
            
            // 6. 쿠폰 영역 확인
            targetFrame.$('#app-root > div > div > div:nth-child(6) > div > div.place_section.no_margin.l__qc > div > div > div > div > span').then(async (element) => {
              if (element) {
                hasCouponArea = true;
                console.log('쿠폰 영역 발견: true');
                const couponText = await targetFrame.evaluate(el => el.textContent, element);
                console.log('쿠폰 내용:', couponText);
              } else {
                hasCouponArea = false;
                console.log('쿠폰 영역 없음: false');
              }
            }).catch(() => {
              hasCouponArea = false;
              console.log('쿠폰 영역 확인 중 오류');
            })
          ];
          
          // 모든 기본 정보 수집 완료 대기
          await Promise.all(basicInfoPromises);
          console.log('✅ 기본 정보 병렬 수집 완료');

          // 7. 찾아오는길 (순차 처리 - 더보기 버튼 클릭이 필요하므로)
          try {
            const directionsElement = await targetFrame.$('.zPfVt');
            if (directionsElement) {
              directions = await targetFrame.evaluate(el => el.textContent.trim(), directionsElement);
              console.log('찾아오는길:', directions);
            }
            
            // 찾아오는길 더보기 버튼 클릭 시도
            try {
              const moreButton = await targetFrame.$('#app-root > div > div > div:nth-child(6) > div > div:nth-child(2) > div.place_section_content > div > div.O8qbU.AZ9_F > div > div > a > span.rvCSr');
              if (moreButton) {
                await moreButton.click();
                console.log('찾아오는길 더보기 버튼 클릭됨');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 확장된 정보 다시 수집
                const expandedDirections = await targetFrame.$('.zPfVt');
                if (expandedDirections) {
                  directions = await targetFrame.evaluate(el => el.textContent.trim(), expandedDirections);
                  console.log('확장된 찾아오는길:', directions);
                }
              }
            } catch (err) { console.log('더보기 버튼 없음 또는 클릭 실패'); }
          } catch (err) { console.log('찾아오는길 정보 없음'); }

          // 8. 비용 정보 (지정된 선택자 사용)
          try {
            const costElement = await targetFrame.$('#app-root > div > div > div:nth-child(6) > div > div:nth-child(2) > div.place_section_content > div > div.O8qbU.tXI2c > div > ul');
            if (costElement) {
              cost = await targetFrame.evaluate(el => el.textContent.trim(), costElement);
              console.log('비용 정보:', cost);
            }
          } catch (err) { console.log('비용 정보 없음'); }

                     // 8. 탭 정보 수집 및 예약/쿠폰 여부 확인
           
           try {
             const tabContainer = await targetFrame.$('#app-root > div > div > div.place_fixed_maintab > div > div > div > div');
             if (tabContainer) {
               const tabs = await targetFrame.$$('#app-root > div > div > div.place_fixed_maintab > div > div > div > div > *');
               for (let tab of tabs) {
                 const tabText = await targetFrame.evaluate(el => el.textContent.trim(), tab);
                 if (tabText) {
                   availableTabs.push(tabText);
                   // 예약/쿠폰 탭 여부 확인
                   if (tabText.includes('예약')) hasReservationTab = true;
                   if (tabText.includes('쿠폰')) hasCouponTab = true;
                 }
               }
               console.log('사용 가능한 탭들:', availableTabs);
               console.log('예약 탭 사용:', hasReservationTab);
               console.log('쿠폰 탭 사용:', hasCouponTab);
               
                                               // 정보 탭 클릭 및 상세 정보 수집
                // 정보 탭이 있는지 확인하고 클릭
                let infoTabFound = false;
                let infoTabClicked = false;
                
                // 먼저 정보 탭이 실제로 존재하는지 확인
                for (let i = 0; i < availableTabs.length; i++) {
                  if (availableTabs[i] === '정보') {
                    infoTabFound = true;
                    break;
                  }
                }
                
                if (infoTabFound) {
                  try {
                    console.log('정보 탭 발견됨, 마지막에 처리 예정...');
                  } catch (infoTabErr) { 
                    console.log('정보 탭 처리 중 오류:', infoTabErr.message); 
                  }
                } else {
                  console.log('정보 탭을 찾을 수 없음');
                }
             }
           } catch (err) { console.log('탭 정보 없음'); }

                     // 9. 방문자 리뷰 수 (정확한 선택자 사용)
           try {
             const visitorReviewElement = await targetFrame.$('#app-root > div > div > div.place_section.no_margin.OP4V8 > div.zD5Nm.undefined > div.dAsGb > span:nth-child(1) > a');
             if (visitorReviewElement) {
               const reviewText = await targetFrame.evaluate(el => el.textContent, visitorReviewElement);
               const match = reviewText.match(/(\d+)/);
               if (match) {
                 visitorReviews = parseInt(match[1]);
                 console.log('방문자 리뷰 수:', visitorReviews);
               }
             } else {
               visitorReviews = 0;
               console.log('방문자 리뷰 없음, 0으로 설정');
             }
           } catch (err) { 
             visitorReviews = 0;
             console.log('방문자 리뷰 정보 없음, 0으로 설정'); 
           }

           // 10. 블로그 리뷰 수 (정확한 선택자 사용)
           try {
             const blogReviewElement = await targetFrame.$('#app-root > div > div > div.place_section.no_margin.OP4V8 > div.zD5Nm.undefined > div.dAsGb > span:nth-child(2) > a');
             if (blogReviewElement) {
               const blogText = await targetFrame.evaluate(el => el.textContent, blogReviewElement);
               const match = blogText.match(/(\d+)/);
               if (match) {
                 blogReviews = parseInt(match[1]);
                 console.log('블로그 리뷰 수:', blogReviews);
               }
             } else {
               blogReviews = 0;
               console.log('블로그 리뷰 없음, 0으로 설정');
             }
           } catch (err) { 
             blogReviews = 0;
             console.log('블로그 리뷰 정보 없음, 0으로 설정'); 
           }

          // 11. 블로그/인스타그램 링크
          try {
            const linkElements = await targetFrame.$$('a');
            for (let link of linkElements) {
              const href = await targetFrame.evaluate(el => el.href, link);
              if (href && href.includes('blog') && !blogLink) {
                blogLink = href;
                console.log('블로그 링크:', blogLink);
              }
              if (href && href.includes('instagram') && !instagramLink) {
                instagramLink = href;
                console.log('인스타그램 링크:', instagramLink);
              }
            }
          } catch (err) { console.log('링크 정보 없음'); }

          // 12. 이미지 업로드 날짜 수집
          const imageUploadDates = [];
          try {
            console.log('이미지 업로드 날짜 수집 시작...');
            for (let i = 1; i <= 5; i++) {
              const imageSelector = `#business_${i}`;
              const imageElement = await targetFrame.$(imageSelector);
              
              if (imageElement) {
                const imageSrc = await targetFrame.evaluate(el => el.src, imageElement);
                if (imageSrc) {
                  console.log(`이미지 ${i} URL:`, imageSrc);
                  // 이미지 URL에서 8자리 날짜 패턴 찾기 (YYYYMMDD)
                  const dateMatch = imageSrc.match(/(\d{8})/);
                  if (dateMatch) {
                    const dateStr = dateMatch[1];
                    // YYYYMMDD 형식을 YYYY-MM-DD로 변환
                    const formattedDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
                    imageUploadDates.push({
                      image: `business_${i}`,
                      uploadDate: formattedDate,
                      originalDate: dateStr
                    });
                    console.log(`이미지 ${i} 업로드 날짜:`, formattedDate);
                  } else {
                    console.log(`이미지 ${i}에서 날짜 패턴을 찾을 수 없음`);
                  }
                } else {
                  console.log(`이미지 ${i} src 없음`);
                }
              } else {
                console.log(`이미지 ${i} 요소 없음`);
              }
            }
            console.log('총 수집된 이미지 업로드 날짜:', imageUploadDates.length);
          } catch (err) { 
            console.log('이미지 업로드 날짜 수집 실패:', err.message); 
          }

          // 추가 변수들
          keywords = [];
          images = imageUploadDates; // 이미지 업로드 날짜 정보 저장
          reviews = [];
          
        } catch (frameError) {
          console.log('타겟 프레임에서 정보 수집 중 오류:', frameError.message);
        }
      } else {
        console.log('적절한 iframe을 찾을 수 없습니다.');
      }

    } catch (error) {
      console.error('스크래핑 중 오류:', error);
    }

    // 마지막에 정보 탭 처리 (다른 모든 정보 수집 후)
    if (availableTabs.includes('정보') && targetFrame) {
      console.log('🔍 마지막에 정보 탭 처리 시작...');
      
      try {
        // 정보 탭 클릭
        let infoTabClicked = false;
        const tabCount = availableTabs.length;
        
        // 1. nth-child 선택자로 정보 탭 찾기 (탭 수에 따라 위치 결정)
        for (let i = tabCount; i >= 1; i--) {
          if (infoTabClicked) break;
          
          try {
            const nthSelector = `#app-root > div > div > div.place_fixed_maintab > div > div > div > div > a:nth-child(${i})`;
            const tab = await targetFrame.$(nthSelector);
            
            if (tab) {
              const tabText = await targetFrame.evaluate(el => el.textContent.trim(), tab);
              console.log(`탭 ${i} 내용:`, tabText);
              
              if (tabText === '정보') {
                await tab.click();
                console.log(`정보 탭 클릭됨 (nth-child(${i}))`);
                infoTabClicked = true;
                await new Promise(resolve => setTimeout(resolve, 3000));
                break;
              }
            }
          } catch (err) { 
            console.log(`nth-child(${i}) 클릭 실패:`, err.message);
          }
        }
        
        // 2. 일반적인 방법으로 정보 탭 찾기
        if (!infoTabClicked) {
          const allTabLinks = await targetFrame.$$('#app-root > div > div > div.place_fixed_maintab > div > div > div > div > a');
          
          for (let tabLink of allTabLinks) {
            const tabText = await targetFrame.evaluate(el => el.textContent.trim(), tabLink);
            if (tabText === '정보') {
              await tabLink.click();
              console.log('정보 탭 클릭됨 (일반 a 태그)');
              infoTabClicked = true;
              await new Promise(resolve => setTimeout(resolve, 3000));
              break;
            }
          }
        }
        
        // 3. 모든 요소에서 정보 탭 찾기
        if (!infoTabClicked) {
          const allTabElements = await targetFrame.$$('#app-root > div > div > div.place_fixed_maintab > div > div > div > div > *');
          for (let tabElement of allTabElements) {
            const tabText = await targetFrame.evaluate(el => el.textContent.trim(), tabElement);
            if (tabText === '정보') {
              await tabElement.click();
              console.log('정보 탭 클릭됨 (일반 요소)');
              infoTabClicked = true;
              await new Promise(resolve => setTimeout(resolve, 3000));
              break;
            }
          }
        }
        
        if (infoTabClicked) {
          // 정보 탭 로드 후 더보기 버튼 찾기
          let moreButtonClicked = false;
          
          try {
            // 사용자가 제공한 정확한 더보기 버튼 선택자 사용
            const moreButtonSelectors = [
              '#app-root > div > div > div:nth-child(6) > div > div.place_section.no_margin.Od79H > div > div > div.Ve1Rp > a',
              '.place_section.no_margin.Od79H .Ve1Rp > a',
              '.Od79H .Ve1Rp > a',
              '.place_section.Od79H .Ve1Rp > a'
            ];
            
            for (let selector of moreButtonSelectors) {
              try {
                const moreButton = await targetFrame.$(selector);
                if (moreButton) {
                  console.log(`🔍 더보기 버튼 발견: ${selector}`);
                  await moreButton.click();
                  console.log('✅ 정보 탭 더보기 버튼 클릭됨');
                  moreButtonClicked = true;
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  break;
                }
              } catch (err) {
                console.log(`❌ 더보기 버튼 선택자 "${selector}" 실패:`, err.message);
              }
            }
            
            // 기존 방식도 백업으로 유지
            if (!moreButtonClicked) {
              const infoSections = await targetFrame.$$('.place_section.no_margin.Od79H');
              for (let section of infoSections) {
                const moreButton = await section.$('.Ve1Rp > a');
                if (moreButton) {
                  await moreButton.click();
                  console.log('정보 탭 더보기 버튼 클릭됨 (백업 방식)');
                  moreButtonClicked = true;
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  break;
                }
              }
            }
          } catch (err) {
            console.log('더보기 버튼 찾기 실패:', err.message);
          }
          
          if (!moreButtonClicked) {
            console.log('더보기 버튼을 찾을 수 없음, 현재 정보로 수집 진행...');
          }
          
          // 정보 탭에서 소개글과 키워드 수집
          try {
            console.log('정보 탭 상세 정보 수집 시작...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 현재 정보 탭의 전체 구조 확인
            console.log('🔍 정보 탭 구조 분석 시작...');
            const infoTabContent = await targetFrame.evaluate(() => {
              const sections = document.querySelectorAll('.place_section');
              const sectionInfo = [];
              
              sections.forEach((section, index) => {
                const className = section.className;
                const textContent = section.textContent.substring(0, 100);
                const children = section.children.length;
                sectionInfo.push({
                  index: index + 1,
                  className: className,
                  children: children,
                  preview: textContent
                });
              });
              
              return sectionInfo;
            });
            
            console.log('🔍 정보 탭 섹션 구조:', infoTabContent);
            
            // 소개글 수집 (사용자가 제공한 정확한 선택자)
            console.log('🔍 소개글 수집 시작...');
            const introSelectors = [
              '#app-root > div > div > div:nth-child(7) > div > div.place_section.no_margin.Od79H > div > div > div.Ve1Rp > div',
              '.place_section.no_margin.Od79H .Ve1Rp > div',
              '.Od79H .Ve1Rp div',
              '.place_section.Od79H .Ve1Rp div',
              '.Ve1Rp > div:not(a)',
              '.place_section .Ve1Rp div',
              '.place_section div[class*="Ve1Rp"] div',
              '.place_section div:not([class*="button"]):not([class*="link"])'
            ];
            
            let introFound = false;
            for (let selector of introSelectors) {
              if (introFound) break;
              
              try {
                const introElements = await targetFrame.$$(selector);
                console.log(`🔍 소개글 선택자 "${selector}"에서 ${introElements.length}개 요소 발견`);
                
                for (let element of introElements) {
                  const introText = await targetFrame.evaluate(el => {
                    if (!el) return '';
                    let text = el.textContent || el.innerText || '';
                    text = text.trim();
                    text = text.replace(/더보기|접기|정보 수정 제안하기|수정 제안|펼쳐보기/g, '').trim();
                    if (text.length < 20) return '';
                    return text;
                  }, element);
                  
                  if (introText && introText.length > 20) {
                    detailedInfo['소개글'] = introText;
                    console.log('✅ 소개글 수집됨:', introText.substring(0, 100) + '...');
                    introFound = true;
                    break;
                  }
                }
              } catch (err) {
                console.log(`❌ 소개글 선택자 "${selector}" 실패:`, err.message);
              }
            }
            
            // 대표 키워드 수집 (사용자가 제공한 정확한 선택자)
            console.log('🔍 대표키워드 수집 시작...');
            const keywordSelectors = [
              '#app-root > div > div > div:nth-child(7) > div > div.place_section.no_margin.no_border.fUlDc > div > div',
              '.place_section.no_margin.no_border.fUlDc',
              '.fUlDc',
              '.place_section.fUlDc',
              '.place_section div[class*="keyword"]',
              '.place_section div[class*="tag"]',
              '.place_section span[class*="keyword"]',
              '.place_section span[class*="tag"]',
              '.place_section a[class*="keyword"]',
              '.place_section a[class*="tag"]'
            ];
            
            let keywordFound = false;
            for (let selector of keywordSelectors) {
              if (keywordFound) break;
              
              try {
                const keywordSections = await targetFrame.$$(selector);
                console.log(`🔍 키워드 선택자 "${selector}"에서 ${keywordSections.length}개 요소 발견`);
                
                for (let section of keywordSections) {
                  const keywordData = await targetFrame.evaluate(el => {
                    if (!el) return { fullText: '', keywords: [] };
                    
                    const allText = el.textContent.trim();
                    console.log('키워드 섹션 텍스트:', allText);
                    
                    if (!allText.includes('키워드') && !allText.includes('태그') && !allText.includes('대표')) {
                      return { fullText: '', keywords: [] };
                    }
                    
                    const keywordElements = el.querySelectorAll('span, div, a, button');
                    const keywords = [];
                    
                    keywordElements.forEach(elem => {
                      const text = elem.textContent.trim();
                      if (text && text.length > 1 && text.length < 30) {
                        if (!text.includes('더보기') && !text.includes('접기') && 
                            !text.includes('수정') && !text.includes('제안') &&
                            !text.includes('키워드') && !text.includes('대표') &&
                            !text.includes('설정') && !text.includes('추가')) {
                          keywords.push(text);
                        }
                      }
                    });
                    
                    return {
                      fullText: allText,
                      keywords: keywords.slice(0, 10)
                    };
                  }, section);
                  
                  if (keywordData.keywords.length > 0) {
                    const uniqueKeywords = [...new Set(keywordData.keywords)];
                    
                    // 첫 번째 키워드가 모든 키워드들이 연결된 비정상적인 텍스트인지 확인
                    let filteredKeywords = uniqueKeywords;
                    if (uniqueKeywords.length > 1) {
                      const firstKeyword = uniqueKeywords[0];
                      const otherKeywords = uniqueKeywords.slice(1);
                      
                      // 첫 번째 키워드가 나머지 모든 키워드들이 공백 없이 연결된 형태인지 확인
                      const concatenatedKeywords = otherKeywords.join('');
                      
                      if (firstKeyword === concatenatedKeywords || firstKeyword.includes(concatenatedKeywords)) {
                        // 첫 번째 요소는 연결된 텍스트이므로 제거하고 개별 키워드만 사용
                        filteredKeywords = otherKeywords;
                        console.log('연결된 키워드 텍스트 제거됨:', firstKeyword);
                      }
                    }
                    
                    detailedInfo['대표키워드'] = filteredKeywords.join(', ');
                    console.log('✅ 최종 키워드:', filteredKeywords);
                    keywordFound = true;
                    break;
                  }
                }
              } catch (err) {
                console.log(`❌ 키워드 선택자 "${selector}" 실패:`, err.message);
              }
            }
            
            // 추가: 모든 텍스트에서 키워드 패턴 찾기
            if (!keywordFound) {
              console.log('🔍 전체 텍스트에서 키워드 패턴 검색...');
              const allText = await targetFrame.evaluate(() => {
                return document.body.textContent;
              });
              
              // 키워드 패턴 찾기 (예: "대표키워드", "키워드", "태그" 등)
              const keywordPatterns = [
                /대표키워드[:\s]*([^\n]+)/,
                /키워드[:\s]*([^\n]+)/,
                /태그[:\s]*([^\n]+)/,
                /관련키워드[:\s]*([^\n]+)/
              ];
              
              for (let pattern of keywordPatterns) {
                const match = allText.match(pattern);
                if (match && match[1]) {
                  const keywords = match[1].split(/[,，\s]+/).filter(k => k.trim().length > 0);
                  if (keywords.length > 0) {
                    detailedInfo['대표키워드'] = keywords.join(', ');
                    console.log('✅ 패턴으로 키워드 발견:', keywords);
                    keywordFound = true;
                    break;
                  }
                }
              }
            }
            
            console.log('=== 정보 탭 수집 완료 ===');
            console.log('수집된 항목 수:', Object.keys(detailedInfo).length);
            console.log('수집된 항목들:', Object.keys(detailedInfo));
            
          } catch (detailErr) { 
            console.log('정보 탭 상세 정보 수집 중 오류:', detailErr.message); 
          }
        } else {
          console.log('정보 탭 클릭 실패');
        }
      } catch (infoTabErr) { 
        console.log('정보 탭 처리 중 오류:', infoTabErr.message); 
      }
    } else {
      console.log('정보 탭이 없거나 타겟 프레임이 없어서 정보 탭 처리 건너뜀');
    }

    // 분석 결과 생성
    const analysisResult = {
      success: true,
      data: {
        // 기본 정보
        placeName: placeName || '정보를 찾을 수 없습니다',
        category: category || '업종 정보 없음',
        address: address || '주소 정보 없음',
        phone: phone || '전화번호 정보 없음',
        businessHours: businessHours || '영업시간 정보 없음',
        description: '설명 정보 없음', // description 필드는 사용하지 않음
        
        // 리뷰 및 버튼 정보
        visitorReviews: visitorReviews || 0,
        blogReviews: blogReviews || 0,
        hasReservationButton: hasReservationButton,
        hasInquiryButton: hasInquiryButton,
        
        // 추가 정보
        directions: directions || '찾아오는길 정보 없음',
        cost: cost || '비용 정보 없음',
        blogLink: blogLink || null,
        instagramLink: instagramLink || null,
        availableTabs: availableTabs || [], // 새로 추가된 탭 정보
        hasReservationTab: hasReservationTab || false, // 예약 탭 사용 여부
        hasCouponTab: hasCouponTab || false, // 쿠폰 탭 사용 여부
        hasCouponArea: hasCouponArea || false, // 쿠폰 영역 존재 여부
        detailedInfo: detailedInfo || {}, // 정보 탭에서 수집한 상세 정보
        
        // 기존 정보
        keywords: keywords,
        images: images,
        reviews: reviews,
        
        // 분석 점수 및 제안
        score: calculateScore(placeName, category, address, phone, businessHours, directions, visitorReviews, blogReviews),
        recommendations: generateRecommendations(placeName, directions, hasReservationButton, hasInquiryButton, cost)
      },
      timestamp: new Date().toISOString()
    };

    console.log('분석 완료:', analysisResult);
    res.json(analysisResult);

  } catch (error) {
    console.error('분석 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      error: '분석 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// 점수 계산 함수
function calculateScore(placeName, category, address, phone, businessHours, directions, visitorReviews, blogReviews) {
  let score = 0;
  
  // 기본 정보 (70점)
  if (placeName && placeName !== '정보를 찾을 수 없습니다') score += 15;
  if (category && category !== '업종 정보 없음') score += 10;
  if (address && address !== '주소 정보 없음') score += 15;
  if (phone && phone !== '전화번호 정보 없음') score += 10;
  if (businessHours && businessHours !== '영업시간 정보 없음') score += 10;
  if (directions && directions !== '찾아오는길 정보 없음') score += 10;
  
  // 리뷰 활성도 (15점)
  if (visitorReviews > 0) score += 5;
  if (visitorReviews > 10) score += 3;
  if (blogReviews > 0) score += 4;
  if (blogReviews > 5) score += 3;
  
  // 미래엔 키워드 포함 여부 (15점)
  const content = (placeName + ' ' + directions).toLowerCase();
  if (content.includes('미래엔')) score += 10;
  if (content.includes('영어')) score += 3;
  if (content.includes('파닉스')) score += 2;
  
  return Math.min(score, 100);
}

// 개선 제안사항 생성 함수
function generateRecommendations(placeName, directions, hasReservationButton, hasInquiryButton, cost) {
  const recommendations = [];
  const content = (placeName + ' ' + directions).toLowerCase();
  
  if (!content.includes('미래엔')) {
    recommendations.push({
      title: '미래엔영어 브랜드 키워드 추가 필요',
      description: '학원명이나 찾아오는길 설명에 "미래엔영어" 키워드를 추가하여 브랜드 인지도를 높이세요.',
      priority: 'high'
    });
  }
  
  if (!content.includes('파닉스')) {
    recommendations.push({
      title: '파닉스 프로그램 안내 추가',
      description: '미래엔영어의 핵심 프로그램인 파닉스 교육에 대한 설명을 추가하세요.',
      priority: 'medium'
    });
  }
  
  if (directions && directions.length < 50) {
    recommendations.push({
      title: '상세 설명 보강 필요',
      description: '학원의 특징, 교육 방식, 커리큘럼 등에 대한 더 자세한 설명을 추가하세요.',
      priority: 'high'
    });
  }
  
  if (!hasReservationButton && !hasInquiryButton) {
    recommendations.push({
      title: '예약/문의 버튼 추가 권장',
      description: '학부모들이 쉽게 상담을 신청할 수 있도록 예약 또는 문의 버튼을 추가하세요.',
      priority: 'medium'
    });
  }
  
  if (!cost || cost === '비용 정보 없음') {
    recommendations.push({
      title: '수강료 정보 등록',
      description: '월 수강료, 등록비, 교재비 등 구체적인 요금 정보를 등록하여 학부모의 문의를 줄이세요.',
      priority: 'high'
    });
  }
  
  return recommendations;
}

// 진행 상태 저장을 위한 메모리 저장소
const progressStore = new Map();

// 키워드 순위 확인 API (실제 구현) - 진행 상태 폴링 방식 + 위치 정보
app.post('/api/check-keywords', async (req, res) => {
  const { academyName, keywords, location } = req.body;
  
  console.log('=== 키워드 순위 확인 시작 ===');
  console.log('학원명:', academyName);
  console.log('키워드 목록:', keywords);
  console.log('위치 정보:', location);
  
  if (!academyName || !keywords) {
    return res.status(400).json({ 
      success: false, 
      error: '학원명과 키워드가 필요합니다.' 
    });
  }

  // 진행 상태 추적을 위한 고유 ID 생성
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  // 초기 진행 상태 설정 (위치 정보 포함)
  progressStore.set(sessionId, {
    progress: 0,
    currentKeyword: '',
    currentIndex: 0,
    total: 0,
    results: [],
    isComplete: false,
    error: null,
    location: location || null // 위치 정보 저장
  });

  // 비동기로 키워드 확인 작업 시작 (위치 정보 전달)
  processKeywords(sessionId, academyName, keywords, location);

  // 세션 ID 반환
  res.json({
    success: true,
    sessionId: sessionId
  });
});

// 진행 상태 확인 API
app.get('/api/check-progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const progress = progressStore.get(sessionId);
  
  if (!progress) {
    return res.status(404).json({
      success: false,
      error: '세션을 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    data: progress
  });
});

// 키워드 처리 함수 (비동기) - 위치 정보 포함
async function processKeywords(sessionId, academyName, keywords, location) {
  let browser;
  try {
    // 키워드 배열 처리
    const keywordList = Array.isArray(keywords) ? keywords : keywords.split('\n').filter(k => k.trim());
    console.log('처리된 키워드 목록:', keywordList);

    // 진행 상태 업데이트
    const updateProgress = (updates) => {
      const current = progressStore.get(sessionId) || {};
      progressStore.set(sessionId, { ...current, ...updates });
    };

    updateProgress({
      total: keywordList.length,
      currentKeyword: '브라우저 시작 중...'
    });

    // Puppeteer 브라우저 실행
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-blink-features=AutomationControlled',
        '--disable-ipc-flooding-protection',
        '--user-data-dir=' + require('os').tmpdir() + '\\chrome-user-data-' + Date.now() + Math.random(),
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    const results = [];
    
    // 각 키워드별로 순위 확인
    for (let i = 0; i < keywordList.length; i++) {
      const keyword = keywordList[i].trim();
      if (!keyword) continue;

      const progress = Math.round(((i + 1) / keywordList.length) * 100);
      console.log(`\n=== 키워드 "${keyword}" 순위 확인 중... (${i + 1}/${keywordList.length}) [${progress}%] ===`);
      
      // 진행 상태 업데이트
      updateProgress({
        progress: progress,
        currentKeyword: `"${keyword}" 키워드 확인 중...`,
        currentIndex: i + 1
      });
      
      try {
        const rank = await checkKeywordRank(browser, keyword, academyName, location);
        const status = getRankStatus(rank);
        
        const result = {
          keyword,
          rank,
          status,
          progress: progress
        };
        
        results.push(result);
        
        console.log(`키워드 "${keyword}" 결과: ${rank ? rank + '위' : '미노출'} (${status})`);
        
        // 결과 업데이트
        updateProgress({
          results: [...results]
        });
        
        // 요청 간격 조절 (1초 대기)
        if (i < keywordList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`키워드 "${keyword}" 확인 중 오류:`, error.message);
        const result = {
          keyword,
          rank: null,
          status: 'not-exposed',
          progress: progress
        };
        results.push(result);
        
        updateProgress({
          results: [...results]
        });
      }
    }

    // 통계 계산
    const summary = {
      totalChecked: results.length,
      exposed: results.filter(r => r.rank !== null).length,
      top3: results.filter(r => r.rank && r.rank <= 3).length,
      top10: results.filter(r => r.rank && r.rank <= 10).length,
      averageRank: results.filter(r => r.rank).length > 0 ? Math.round(
        results.filter(r => r.rank).reduce((sum, r) => sum + r.rank, 0) / 
        results.filter(r => r.rank).length
      ) : 0
    };

    console.log('\n=== 순위 확인 완료 ===');
    console.log('총 결과:', summary);

    // 최종 결과 업데이트
    updateProgress({
      progress: 100,
      currentKeyword: '순위 확인 완료!',
      isComplete: true,
      summary: summary,
      academyName: academyName
    });

    // 30분 후 세션 정리
    setTimeout(() => {
      progressStore.delete(sessionId);
    }, 30 * 60 * 1000);

  } catch (error) {
    console.error('키워드 순위 확인 중 전체 오류:', error);
    
    const current = progressStore.get(sessionId) || {};
    progressStore.set(sessionId, {
      ...current,
      error: '키워드 순위 확인 중 오류가 발생했습니다: ' + error.message,
      isComplete: true
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 개별 키워드의 순위를 확인하는 함수 (정확한 네이버 지도 검색 + 위치 정보)
async function checkKeywordRank(browser, keyword, academyName, location) {
  const page = await browser.newPage();
  
  try {
    // 위치 정보가 있으면 해당 위치로 이동, 없으면 기본 페이지
    let searchUrl = `https://map.naver.com/p`;
    
    if (location) {
      console.log('📍 위치 정보 활용:', JSON.stringify(location, null, 2));
      
      if (location.lat && location.lng) {
        // 위도/경도가 있는 경우
        searchUrl = `https://map.naver.com/p?c=${location.lat},${location.lng},15,0,0,0,dh`;
        console.log(`📍 좌표 기반 이동: ${location.lat}, ${location.lng}`);
      } else if (location.address) {
        // 주소가 있는 경우 - 주소로 검색 후 해당 위치로 이동
        searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(location.address)}`;
        console.log(`📍 주소 기반 이동: ${location.address}`);
      } else if (location.name) {
        // 장소명이 있는 경우 - 장소명으로 검색 후 해당 위치로 이동
        searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(location.name)}`;
        console.log(`📍 장소명 기반 이동: ${location.name}`);
      }
    } else {
      console.log('📍 위치 정보 없음 - 기본 위치에서 검색');
    }
    
    console.log(`네이버 지도 페이지 접속: ${searchUrl}`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // 위치 기반 이동인 경우 추가 대기 시간
    const waitTime = location ? 5000 : 3000;
    console.log(`⏳ 페이지 로딩 대기: ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // iframe 내의 검색창 찾기
    console.log(`키워드 "${keyword}" 검색 중...`);
    
    const frames = await page.frames();
    let searchFrame = null;
    
    // 검색 입력 필드가 있는 iframe 찾기
    for (const frame of frames) {
      try {
        const inputField = await frame.$('#input_search1752839756472');
        if (inputField) {
          searchFrame = frame;
          console.log('검색 iframe 발견');
          break;
        }
      } catch (e) {
        // 다음 frame 시도
        continue;
      }
    }

    // 동적 ID로 다시 시도
    if (!searchFrame) {
      for (const frame of frames) {
        try {
          const inputField = await frame.$('input[id*="input_search"]');
          if (inputField) {
            searchFrame = frame;
            console.log('검색 iframe 발견 (동적 ID)');
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!searchFrame) {
      throw new Error('검색 iframe을 찾을 수 없습니다');
    }

    // 검색창 클릭하여 포커스 설정 (파이썬 코드 참고)
    const searchInputSelector = '#home_search_input_box > div > div > div';
    console.log(`검색창 선택자: ${searchInputSelector}`);
    
    try {
      await page.waitForSelector(searchInputSelector, { timeout: 15000 });
      console.log('✅ 검색창 발견');
      
      // 요소가 실제로 상호작용 가능할 때까지 대기
      await page.waitForFunction(`
        () => {
          const element = document.querySelector('${searchInputSelector}');
          return element && element.offsetHeight > 0;
        }
      `, { timeout: 10000 });
      
      await page.click(searchInputSelector);
      console.log('✅ 검색창 클릭 완료');
      
    } catch (error) {
      console.log('❌ 검색창을 찾을 수 없음:', error.message);
      throw new Error('검색창을 찾을 수 없습니다');
    }

    console.log(`검색창에 키워드 "${keyword}" 입력 중...`);

    // 기존 내용 삭제 후 새 키워드 입력
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
    await page.keyboard.type(keyword);
    await page.keyboard.press('Enter');

    console.log(`키워드 "${keyword}" 검색 실행 완료`);

    // 검색 결과 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 검색 결과 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 검색 결과 iframe 찾기 (파이썬 코드 참고)
    console.log('🔍 검색 결과 iframe 찾는 중...');
    let resultFrame = null;
    
    try {
      // searchIframe 선택자로 찾기 (파이썬 코드와 동일)
      const searchIframe = await page.waitForSelector('#searchIframe', { timeout: 10000 });
      if (searchIframe) {
        resultFrame = await searchIframe.contentFrame();
        console.log('✅ searchIframe 발견');
        console.log('iframe URL:', resultFrame.url());
      }
    } catch (error) {
      console.log('❌ searchIframe을 찾을 수 없음, 다른 방법 시도...');
      
      // 대안: 모든 iframe에서 검색
      const updatedFrames = await page.frames();
      console.log('사용 가능한 iframe 개수:', updatedFrames.length);
      
      for (let i = 0; i < updatedFrames.length; i++) {
        try {
          console.log(`iframe ${i + 1} URL:`, updatedFrames[i].url());
          
          // 검색 결과 컨테이너 찾기
          const listContainer = await updatedFrames[i].$('#_pcmap_list_scroll_container');
          if (listContainer) {
            resultFrame = updatedFrames[i];
            console.log(`✅ iframe ${i + 1}에서 검색 결과 컨테이너 발견`);
            break;
          }
        } catch (e) {
          console.log(`iframe ${i + 1} 검사 중 오류:`, e.message);
          continue;
        }
      }
    }

    if (!resultFrame) {
      console.log('❌ 검색 결과 iframe을 찾을 수 없음');
      return null;
    }

    // 스크롤하여 모든 결과 로드
    await scrollToLoadAllResults(resultFrame);

    let rank = null;
    
    // 검색 결과에서 학원 찾기
    rank = await findAcademyInResults(resultFrame, academyName);
    
    return rank;
    
  } finally {
    await page.close();
  }
}

// 검색 결과를 모두 로드하기 위해 스크롤하는 함수 (파이썬 코드 참고)
async function scrollToLoadAllResults(frame) {
  try {
    console.log('📜 패널 내 스크롤을 내려서 모든 결과 로딩 중...');
    const scrollContainer = '#_pcmap_list_scroll_container';
    
    // 스크롤을 여러 번 내려서 모든 결과가 로드되도록 함
    for (let scrollCount = 0; scrollCount < 5; scrollCount++) {
      try {
        // 현재 스크롤 높이 확인
        const currentHeight = await frame.evaluate(`
          document.querySelector('${scrollContainer}').scrollHeight
        `);
        
        // 스크롤을 아래로 내리기
        await frame.evaluate(`
          const container = document.querySelector('${scrollContainer}');
          container.scrollTop = container.scrollHeight;
        `);
        
        // 스크롤 후 새로운 콘텐츠 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 스크롤 후 높이 다시 확인
        const newHeight = await frame.evaluate(`
          document.querySelector('${scrollContainer}').scrollHeight
        `);
        
        console.log(`  스크롤 ${scrollCount + 1}/5: ${currentHeight} → ${newHeight}`);
        
        // 높이가 변하지 않으면 더 이상 로드할 콘텐츠가 없음
        if (currentHeight === newHeight) {
          console.log('  ✅ 스크롤 완료 - 더 이상 로드할 콘텐츠 없음');
          break;
        }
        
      } catch (error) {
        console.log(`  ⚠️ 스크롤 중 오류: ${error.message}`);
        break;
      }
    }
    
    console.log('✅ 스크롤 완료 - 모든 결과 로드됨');
  } catch (error) {
    console.log('❌ 스크롤 중 오류:', error.message);
  }
}

// 검색 결과에서 학원을 찾는 함수 (파이썬 코드 참고)
async function findAcademyInResults(frame, academyName) {
  try {
    // 스크롤 완료 후 모든 li 요소 다시 수집
    const listItems = await frame.$$('#_pcmap_list_scroll_container ul li');
    console.log(`\n=== 검색 결과 전체 목록 ===`);
    console.log(`현재 페이지에서 ${listItems.length}개의 검색 결과 발견`);
    console.log(`찾고 있는 학원명: "${academyName}"`);
    
    // 먼저 모든 검색 결과를 수집하고 출력
    const allResults = [];
    for (let i = 0; i < listItems.length; i++) {
      const item = listItems[i];
      
      try {
        let businessName = null;
        
        // 업체명 추출 시도 (파이썬 코드와 동일한 선택자)
        const nameElement = await item.$('span.YwYLL');
        if (nameElement) {
          businessName = await frame.evaluate(el => el.textContent.trim(), nameElement);
        }
        
        if (!businessName) {
          // 다른 방법으로 시도
          const nameSelectors = ['.place_bluelink', '.business_name', '.place_name', 'a', 'span'];
          for (const nameSel of nameSelectors) {
            try {
              const nameElement = await item.$(nameSel);
              if (nameElement) {
                const text = await frame.evaluate(el => el.textContent.trim(), nameElement);
                if (text && text.length > 0) {
                  businessName = text;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        if (businessName && businessName.trim()) {
          const businessNameClean = businessName.trim();
          allResults.push({ rank: i + 1, name: businessNameClean });
        } else {
          allResults.push({ rank: i + 1, name: '업체명 요소 없음' });
        }
        
      } catch (itemError) {
        allResults.push({ rank: i + 1, name: '오류 발생' });
        continue;
      }
    }
    
    // 모든 검색 결과 출력
    console.log(`\n=== 전체 검색 결과 목록 ===`);
    allResults.forEach(result => {
      console.log(`  ${result.rank}위: "${result.name}"`);
    });
    console.log(`=== 검색 결과 목록 끝 ===\n`);
    
    // 이제 매칭 시도 (로그 제거)
    for (let i = 0; i < allResults.length; i++) {
      const result = allResults[i];
      
      if (result.name === '업체명 요소 없음' || result.name === '오류 발생') {
        continue;
      }
      
      // 학원명 매칭 (파이썬 코드와 동일한 로직)
      if (isAcademyMatch(result.name, academyName)) {
        console.log(`🎯 목표 업체 발견! '${academyName}' → ${result.rank}위`);
        console.log(`*** 최종 순위: ${result.rank}위 ***`);
        return result.rank;
      }
    }
    
    console.log(`\n"${academyName}" 학원을 찾을 수 없음 (총 ${allResults.length}개 결과 확인)`);
    return null;
    
  } catch (error) {
    console.error('검색 결과 분석 중 오류:', error.message);
    return null;
  }
}

// 학원명 매칭 함수 (정확한 일치만, 로그 제거)
function isAcademyMatch(foundName, targetName) {
  // 공백 제거 및 소문자 변환
  const cleanFound = foundName.replace(/\s+/g, '').toLowerCase();
  const cleanTarget = targetName.replace(/\s+/g, '').toLowerCase();
  
  // 정확한 일치만 허용
  return cleanFound === cleanTarget;
}

// 순위에 따른 상태 결정
function getRankStatus(rank) {
  if (rank === null) return 'not-exposed';
  if (rank <= 4) return 'excellent';
  if (rank <= 10) return 'good';
  return 'needs-improvement';
}

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
}); 