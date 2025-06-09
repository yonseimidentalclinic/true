document.addEventListener('DOMContentLoaded', function() {

    // 모바일 메뉴 토글 기능
    const menuButton = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuButton && mainNav) {
        menuButton.addEventListener('click', function() {
            mainNav.classList.toggle('active'); // 'active' 클래스 추가/제거
            // 접근성을 위한 aria-expanded 속성 토글 (선택 사항)
            const isExpanded = mainNav.classList.contains('active');
            menuButton.setAttribute('aria-expanded', isExpanded);
        });
    }

    // 네비게이션 링크 클릭 시 모바일 메뉴 닫기 (선택 사항)
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) {
                // 페이지 이동이 실제로 일어나는 경우 브라우저가 처리하므로,
                // SPA가 아니면 굳이 수동으로 닫을 필요는 없을 수 있음.
                // 하지만 부드러운 스크롤 등을 사용한다면 필요.
                mainNav.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
            }
        });
    });


    // 온라인 예약 폼 유효성 검사 (기본 HTML5 required 활용 + 추가 검증)
    const appointmentForm = document.getElementById('appt-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(event) {

            let isValid = true;
            const requiredFields = appointmentForm.querySelectorAll('[required]');

            // 기본 required 속성 외 추가 검증 필요 시 여기에 로직 추가
            // 예: 전화번호 형식 검증 등

            // 개인정보 동의 체크 확인
            const privacyCheckbox = appointmentForm.querySelector('#privacy');
            if (privacyCheckbox && !privacyCheckbox.checked) {
                isValid = false;
                // 시각적 피드백 (예: 레이블 스타일 변경)
                privacyCheckbox.parentElement.style.color = '#e74c3c'; // 경고 색상
                privacyCheckbox.parentElement.style.fontWeight = 'bold';
                console.log('Privacy agreement is required.');
            } else if (privacyCheckbox) {
                 privacyCheckbox.parentElement.style.color = 'inherit'; // 유효하면 원래대로
                 privacyCheckbox.parentElement.style.fontWeight = 'normal';
            }

            // 전체 폼 유효성 검증 (HTML5 required 포함)
            if (!appointmentForm.checkValidity() || !isValid) {
                alert('필수 항목을 모두 입력하거나 동의해주세요.');
                event.preventDefault(); // 유효하지 않으면 제출 막기

                // 첫 번째 유효하지 않은 필드로 포커스 이동 (선택 사항)
                const firstInvalidField = appointmentForm.querySelector(':invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                } else if (!isValid && privacyCheckbox) {
                     privacyCheckbox.focus();
                }

            } else {
                // 여기에 실제 폼 제출 로직 또는 AJAX 요청 추가 가능
                console.log('Form is valid. Submitting...');
                // 실제 서버로 전송하는 코드가 없으므로 임시 알림
                // 실제 구현 시에는 아래 alert 대신 서버 전송 로직 후 성공/실패 처리
                alert('예약/상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다. (실제 전송 기능은 구현 필요)');
                event.preventDefault(); // 임시: 실제 서버 전송 전까지는 제출 막기
            }
        });

        // 개인정보 동의 체크 시 경고 스타일 초기화
         const privacyCheckbox = appointmentForm.querySelector('#privacy');
         if (privacyCheckbox) {
             privacyCheckbox.addEventListener('change', function() {
                  if (this.checked) {
                      this.parentElement.style.color = 'inherit';
                      this.parentElement.style.fontWeight = 'normal';
                  }
             });
         }
    }

    // 지도 API 연동 코드 (contact.html 하단 스크립트에서 처리)
    // script.js 에서는 지도 관련 로직을 직접 다루지 않습니다.
    // contact.html 파일 하단의 <script> 태그 내에서 카카오맵 SDK를 로드하고 초기화합니다.

}); // end DOMContentLoaded