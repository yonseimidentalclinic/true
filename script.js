// Firebase 초기화 모듈에서 db, analytics, (필요시 app) 등을 가져옵니다.
import { db, analytics, rtdb, auth } from './firebase-init.js';
// Firestore 문서 추가를 위해 addDoc과 collection도 필요합니다.
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
// Realtime Database 사용을 위해 ref, set 함수를 가져옵니다.
import { ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
// Firebase Authentication 함수를 가져옵니다.
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {

    // 모바일 메뉴 토글 기능
    const menuButton = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuButton && mainNav) {
        menuButton.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            const isExpanded = mainNav.classList.contains('active');
            menuButton.setAttribute('aria-expanded', isExpanded);
            // 햄버거 버튼 활성화 시 body 스크롤 방지 (선택 사항)
            // document.body.classList.toggle('no-scroll', isExpanded);
        });

        // 네비게이션 링크 클릭 시 모바일 메뉴 닫기
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    menuButton.setAttribute('aria-expanded', 'false');
                    // document.body.classList.remove('no-scroll');
                }
            });
        });
    }

    // 온라인 예약 폼 유효성 검사 및 제출
    const appointmentForm = document.getElementById('appt-form');
    if (appointmentForm) {
        const privacyCheckbox = appointmentForm.querySelector('#privacy');

        appointmentForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // 기본 제출 동작 우선 방지

            let isValid = true;

            // 개인정보 동의 체크 확인
            if (privacyCheckbox && !privacyCheckbox.checked) {
                isValid = false;
                privacyCheckbox.parentElement.classList.add('error'); // CSS .error 클래스 활용
                console.log('Privacy agreement is required.');
            } else if (privacyCheckbox) {
                privacyCheckbox.parentElement.classList.remove('error');
            }

            // 전체 폼 유효성 검증 (HTML5 required 포함)
            if (!appointmentForm.checkValidity() || !isValid) {
                alert('필수 항목을 모두 입력하거나 개인정보 수집 및 이용에 동의해주세요.');

                const firstInvalidField = appointmentForm.querySelector(':invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                } else if (!isValid && privacyCheckbox) {
                    privacyCheckbox.focus();
                }
                return; // 유효하지 않으면 여기서 중단
            }

            console.log('Form is valid. Submitting...');

            const formData = new FormData(appointmentForm);
            const appointmentData = {};
            formData.forEach((value, key) => {
                // 'privacy' 키는 'privacy-agreement'로 이미 처리하므로 건너뜁니다.
                if (key !== 'privacy') {
                    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
                    appointmentData[sanitizedKey] = (value === undefined || value === null || String(value).trim() === '') ? null : String(value);
                }
            });
            appointmentData['privacy-agreement'] = privacyCheckbox.checked;
            appointmentData['timestamp'] = new Date().toISOString(); // ISO 문자열로 시간 기록

            console.log("Data to be sent to Firestore:", JSON.stringify(appointmentData, null, 2)); // 데이터 확인 로그 추가
            try {
                const firestoreDocRef = await addDoc(collection(db, "appointments"), appointmentData);
                console.log("Document written to Firestore with ID: ", firestoreDocRef.id);
                
                // Realtime Database에 데이터 저장
                const rtdbRef = ref(rtdb, 'appointments/' + firestoreDocRef.id);
                await set(rtdbRef, appointmentData);
                console.log("Data written to Realtime Database at path: appointments/" + firestoreDocRef.id);
                // --- Realtime Database 저장 로직 끝 ---

                alert('예약/상담 신청이 성공적으로 접수되었습니다. 확인 후 연락드리겠습니다.');
                appointmentForm.reset();
                if (privacyCheckbox) { // 폼 리셋 후 스타일도 초기화
                    privacyCheckbox.parentElement.classList.remove('error');
                }
            } catch (e) {
                console.error("Error adding document: ", e);
                alert('죄송합니다. 예약/상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        });

        // 개인정보 동의 체크 시 에러 스타일 동적 제거
        if (privacyCheckbox) {
            privacyCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    this.parentElement.classList.remove('error');
                }
            });
        }
    }

    // --- 회원가입 및 로그인 기능 ---
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    // 회원가입 폼 처리
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nameInput = registerForm.querySelector('#register-name');
            const phoneInput = registerForm.querySelector('#register-phone');
            const emailInput = registerForm.querySelector('#register-email');
            const passwordInput = registerForm.querySelector('#register-password');

            if (!nameInput || !phoneInput || !emailInput || !passwordInput) {
                alert('회원가입 양식에 오류가 있습니다. 모든 필드를 확인해주세요.');
                return;
            }

            const name = nameInput.value;
            const phone = phoneInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!name || !phone || !email || !password) {
                alert('모든 필수 항목을 입력해주세요.');
                return;
            }
            if (password.length < 6) {
                alert('비밀번호는 6자 이상이어야 합니다.');
                return;
            }
            // 간단한 전화번호 형식 검사 (선택 사항, 필요시 정규식 강화)
            if (!/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(phone)) {
                alert('올바른 전화번호 형식(예: 010-1234-5678)으로 입력해주세요.');
                return;
            }


            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('User registered:', user.uid, user.email);

                const userRef = ref(rtdb, `users/${user.uid}`);
                await set(userRef, {
                    email: user.email,
                    name: name,
                    phone: phone,
                    createdAt: new Date().toISOString()
                });
                console.log('User data saved to RTDB');
                alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                registerForm.reset();
                window.location.href = 'index.html'; // 홈으로 이동 (onAuthStateChanged가 처리)
            } catch (error) {
                console.error('Error registering user:', error);
                // Firebase 에러 코드에 따른 사용자 친화적 메시지 (선택 사항)
                if (error.code === 'auth/email-already-in-use') {
                    alert('이미 사용 중인 이메일입니다.');
                } else if (error.code === 'auth/weak-password') {
                    alert('비밀번호는 6자 이상이어야 합니다.');
                } else {
                    alert(`회원가입 실패: ${error.message}`);
                }
            }
        });
    }

    // 로그인 폼 처리
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const emailInput = loginForm.querySelector('#login-email');
            const passwordInput = loginForm.querySelector('#login-password');

            if (!emailInput || !passwordInput) {
                alert('로그인 양식에 오류가 있습니다.');
                return;
            }
            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                alert('이메일과 비밀번호를 모두 입력해주세요.');
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('User logged in:', userCredential.user.uid, userCredential.user.email);
                // alert('로그인 되었습니다.'); // onAuthStateChanged에서 리디렉션하므로 불필요할 수 있음
                loginForm.reset();
                window.location.href = 'index.html'; // 홈으로 이동 (onAuthStateChanged가 처리)
            } catch (error) {
                console.error('Error logging in:', error);
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    alert('이메일 또는 비밀번호가 올바르지 않습니다.');
                } else {
                    alert(`로그인 실패: ${error.message}`);
                }
            }
        });
    }

    // 로그아웃 버튼 처리 (헤더에 있는 버튼 대상)
    const headerLogoutButtonListener = document.querySelector('.header-actions #logout-button');
    if (headerLogoutButtonListener) {
        headerLogoutButtonListener.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log('User logged out');
                // alert('로그아웃 되었습니다.'); // onAuthStateChanged가 auth.html로 리디렉션
            } catch (error) {
                console.error('Error logging out:', error);
                alert(`로그아웃 실패: ${error.message}`);
            }
        });
    }

    // 인증 상태 변경 감지 및 UI/페이지 이동 처리
    onAuthStateChanged(auth, (user) => {
        const isAuthPage = window.location.pathname.includes('auth.html');
        // 루트 경로('/')도 index.html로 간주
        const isIndexPage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html') || window.location.pathname === '/';


        // 헤더 UI 요소 가져오기
        const headerUserInfoDiv = document.querySelector('.header-actions #user-info');
        const headerUserEmailDisplay = document.querySelector('.header-actions #user-email-display');
        const headerLogoutButton = document.querySelector('.header-actions #logout-button');
        const headerLoginRegisterLink = document.querySelector('.header-actions #login-register-link');

        if (user) {
            // 사용자가 로그인한 상태
            console.log('Auth state changed: User is logged in -', user.email);
            if (isAuthPage) {
                console.log('User is on auth.html, redirecting to index.html');
                window.location.href = 'index.html';
                return; // 리디렉션 후 추가 코드 실행 방지
            }

            // 헤더 UI 업데이트 (로그인 상태)
            if (headerUserInfoDiv) headerUserInfoDiv.style.display = 'flex';
            if (headerUserEmailDisplay) headerUserEmailDisplay.textContent = user.email;
            if (headerLogoutButton) headerLogoutButton.style.display = 'block';
            if (headerLoginRegisterLink) headerLoginRegisterLink.style.display = 'none';

        } else {
            // 사용자가 로그아웃한 상태
            console.log('Auth state changed: User is logged out');
            // 로그아웃 상태이고, 현재 페이지가 auth.html이 아니라면 auth.html로 리디렉션
            // 단, auth.html 자체에 있을 때는 리디렉션하지 않음
            if (!isAuthPage) {
                console.log('User is logged out and not on auth.html, redirecting to auth.html');
                window.location.href = 'auth.html';
                return; // 리디렉션 후 추가 코드 실행 방지
            }

            // 헤더 UI 업데이트 (로그아웃 상태)
            if (headerUserInfoDiv) headerUserInfoDiv.style.display = 'none';
            if (headerLogoutButton) headerLogoutButton.style.display = 'none';
            if (headerLoginRegisterLink) headerLoginRegisterLink.style.display = 'block';

            // auth.html 페이지에 있을 때만 로그인/회원가입 폼 표시
           if (isAuthPage) {
                if (registerForm) registerForm.style.display = 'block';
                if (loginForm) loginForm.style.display = 'block';
            }
        }
    });
    // --- 회원가입 및 로그인 기능 끝 ---

}); // end DOMContentLoaded
