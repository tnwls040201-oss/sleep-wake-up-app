// ==========================================
// 1. 글로벌 핵심 제어 변수 선언
// ==========================================
let alarmTime = null;
let currentMission = null;
let activeAudioContext = null;
let alarmOscillator = null;
let survivalInterval = null;
let isRecordingSleep = false; 
let selectedMood = ""; 

let noiseAudioContext = null;
let noiseNode = null;
let isPlayingNoise = false;

let stopwatchInterval = null;
let stopwatchElapsedTime = 0; 
let isStopwatchRunning = false;
let stopwatchLapCount = 0;

let isTestMode = false;
let wakemePoints = parseInt(localStorage.getItem('wakeme_points') || '0');

const missionPool = [
    { type: "camera", title: "냉장고 문 열고 인증샷 찍기", desc: "주방 냉장고 안의 우유나 계란이 보이게 셔터를 누르세요!", target: "🥛 냉장고 내부" },
    { type: "camera", title: "창밖 풍경 찍기", desc: "커튼을 걷고 상쾌한 아침 하늘을 찍어보세요.", target: "⛅ 아침 하늘" },
    { type: "hold", title: "화장실 거울 보며 스쿼트", desc: "화장실 거울 앞에 전신이 나오게 폰을 들고 홀드하세요.", duration: 5, label: "스쿼트 감지 중... 꾹 누르기" },
    { type: "hold", title: "침대 위 플랭크 10초", desc: "엎드려 뻗쳐 자세를 10초간 꾹 눌러 유지하세요.", duration: 10, label: "플랭크 유지 중..." },
    { type: "typing", title: "명언 따라 치기", desc: "오타 없이 정확하게 명언을 타이핑하세요.", target: "일찍 일어나는 새가 벌레를 잡는다" },
    { type: "typing", title: "영어 명언 타이핑", desc: "정신을 번쩍 차리고 영어로 입력하세요.", target: "No pain No gain" },
    { type: "math", title: "두뇌 풀가동 암산", desc: "잠든 뇌를 깨우는 간단한 산수 문제입니다.", question: "17 + 25 = ?", answer: "42" },
    { type: "math", title: "구구단 암산", desc: "정확한 답을 입력하여 알람을 해제하세요.", question: "8 x 7 = ?", answer: "56" },
    { type: "puzzle", title: "틀린 글자 찾기 (알파벳)", desc: "비슷한 글자들 사이에서 다른 하나를 찾아 누르세요.", baseChar: "O", targetChar: "Q" },
    { type: "puzzle", title: "틀린 이모지 찾기", desc: "수많은 웃는 얼굴 중 윙크하는 얼굴을 찾으세요.", baseChar: "😊", targetChar: "😉" },
    { type: "click-loop", title: "분노의 양치타", desc: "양치를 하며 버튼을 미친듯이 연타해서 게이지를 채우세요!", target: 30, btnLabel: "🪥 치카치카 연타!!" },
    { type: "click-loop", title: "찬물 한 잔 마시기", desc: "물 마시는 속도에 맞춰 버튼을 연타하세요!", target: 25, btnLabel: "💧 벌컥벌컥 마시기!!" },
    { type: "timer", title: "기지개 10초 유지", desc: "버튼을 누르고 10초간 팔을 뻗어 기지개를 켜세요.", duration: 10 },
    { type: "voice", title: "기상 선언 외치기", desc: "마이크에 대고 크고 힘차게 기상 선언을 외치세요!", target: "나는 오늘 하루도 찢었다!" },
    { type: "rps", title: "가위바위보에서 AI 이기기", desc: "승부욕으로 뇌 깨우기! 인공지능을 상대로 먼저 3판을 이기세요.", target: 3 }
];

// 💡 11종으로 대폭 확장된 타로카드 배열
const tarotCards = [
    { name: "XIX. THE SUN (태양)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/RWS_Tarot_19_Sun.jpg/300px-RWS_Tarot_19_Sun.jpg", desc: "오늘의 최고 길운! 성공과 활력이 차오르는 눈부신 하루가 예상됩니다. 자신감을 갖고 당당하게 행동하세요." },
    { name: "XXI. THE WORLD (세계)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/RWS_Tarot_21_World.jpg/300px-RWS_Tarot_21_World.jpg", desc: "노력해 온 일들이 완벽한 결실을 맺거나 깔끔하게 정리되는 마무리의 날입니다. 스스로를 아낌없이 칭찬해 주세요." },
    { name: "I. THE MAGICIAN (마법사)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RWS_Tarot_01_Magician.jpg/300px-RWS_Tarot_01_Magician.jpg", desc: "새로운 시작과 무한한 가능성의 날입니다. 당신의 능력을 마음껏 펼쳐보세요." },
    { name: "X. WHEEL OF FORTUNE (운명의 수레바퀴)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg/300px-RWS_Tarot_10_Wheel_of_Fortune.jpg", desc: "긍정적인 변화와 행운이 찾아오는 타이밍입니다. 흐름에 몸을 맡기고 기회를 잡으세요." },
    { name: "0. THE FOOL (바보)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/RWS_Tarot_00_Fool.jpg/300px-RWS_Tarot_00_Fool.jpg", desc: "새로운 여정과 모험이 기다리는 하루입니다. 두려움을 떨치고 당신의 직관을 믿고 자유롭게 나아가세요!" },
    { name: "II. THE HIGH PRIESTESS (여사제)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/300px-RWS_Tarot_02_High_Priestess.jpg", desc: "지혜와 통찰력이 빛나는 날입니다. 차분하게 내면의 목소리에 귀 기울이면 뜻밖의 훌륭한 해결책을 얻을 수 있습니다." },
    { name: "III. THE EMPRESS (여황제)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/RWS_Tarot_03_Empress.jpg/300px-RWS_Tarot_03_Empress.jpg", desc: "풍요로움과 창조성이 넘치는 하루입니다. 주변 사람들과 따뜻한 마음을 나누며 일상의 행복을 만끽하세요." },
    { name: "IV. THE EMPEROR (황제)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/RWS_Tarot_04_Emperor.jpg/300px-RWS_Tarot_04_Emperor.jpg", desc: "안정과 성취의 날입니다. 리더십을 발휘하여 계획했던 일들을 굳건하고 자신감 있게 추진해 보세요." },
    { name: "VII. THE CHARIOT (전차)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/RWS_Tarot_07_Chariot.jpg/300px-RWS_Tarot_07_Chariot.jpg", desc: "강한 추진력과 자신감이 필요한 날입니다. 망설이지 말고 당신의 목표를 향해 힘차게 전진하세요!" },
    { name: "VIII. STRENGTH (힘)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RWS_Tarot_08_Strength.jpg/300px-RWS_Tarot_08_Strength.jpg", desc: "내면의 용기와 인내심이 빛을 발하는 하루입니다. 부드러운 카리스마로 당면한 어려움을 지혜롭게 극복할 수 있습니다." },
    { name: "XVII. THE STAR (별)", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/RWS_Tarot_17_Star.jpg/300px-RWS_Tarot_17_Star.jpg", desc: "희망과 영감이 가득한 긍정적인 하루입니다. 당신의 숨겨진 재능이 반짝반짝 빛나며 좋은 결과를 가져올 것입니다." }
];

const mockNewsData = [
    { id: "M7lc1UVf-VE", title: "[속보] 2026년 최신 AI 기술 트렌드 총정리", src: "IT/과학", desc: "생성형 AI의 발전과 앞으로의 미래 전망에 대해 유튜브로 자세히 알아봅니다." },
    { id: "jNQXAC9IVRw", title: "오늘의 글로벌 경제 지표 및 증시 현황", src: "경제/주식", desc: "간밤의 뉴욕 증시 흐름과 오늘 국내 시장에 미칠 영향을 분석합니다." },
    { id: "dQw4w9WgXcQ", title: "전국 대부분 비... 낮에도 서늘한 날씨 주의", src: "기상청", desc: "오늘 전국적으로 흐리고 비가 내리며 기온이 크게 떨어질 전망입니다. 외출 시 겉옷과 우산을 꼭 챙기세요." }
];

function initApp() {
    const splashScreen = document.getElementById('splash-screen');
    setTimeout(() => { if (splashScreen) splashScreen.classList.add('fade-out'); }, 1500);

    const navItems = document.querySelectorAll('.nav-item');
    const tabScreens = document.querySelectorAll('.main-tab-screen');
    const appContainer = document.querySelector('.app-container');

    const savedTheme = localStorage.getItem('wakeme_user_theme') || 'dark';
    if(appContainer) { appContainer.className = `app-container theme-${savedTheme}`; }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            tabScreens.forEach(screen => screen.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetScreen = document.getElementById(targetId);
            if(targetScreen) targetScreen.classList.add('active');
        });
    });

    const screenMission = document.getElementById('screen-mission');
    const screenSurvival = document.getElementById('screen-survival');
    const clockEl = document.getElementById('clock');
    const dateStringEl = document.getElementById('date-string');
    const alarmTimeInput = document.getElementById('alarm-time');
    const btnToggleAlarm = document.getElementById('btn-toggle-alarm');
    const alarmStatusText = document.getElementById('alarm-status-text');
    const btnTestAlarm = document.getElementById('btn-test-alarm');

    const missionBadge = document.getElementById('mission-badge');
    const missionTitle = document.getElementById('mission-title');
    const missionDesc = document.getElementById('mission-desc');
    const dynamicMissionBox = document.getElementById('dynamic-mission-box');
    const survivalCountdown = document.getElementById('survival-countdown');
    const btnSurvivalConfirm = document.getElementById('btn-survival-confirm');

    const pointDisplay = document.getElementById('my-point-display');
    if (pointDisplay) pointDisplay.textContent = wakemePoints + " P";

    const scheduleInput = document.getElementById('my-schedule-input');
    const btnSaveSchedule = document.getElementById('btn-save-schedule');
    if (scheduleInput) { scheduleInput.value = localStorage.getItem('wakeme_my_schedule') || ''; }
    if (btnSaveSchedule) {
        btnSaveSchedule.addEventListener('click', () => {
            localStorage.setItem('wakeme_my_schedule', scheduleInput.value);
            alert("📅 오늘의 일정이 안전하게 저장되었습니다!");
        });
    }

    const btnAuHome = document.getElementById('btn-au-home');
    if (btnAuHome) {
        btnAuHome.addEventListener('click', () => {
            window.open('https://www.ansan.ac.kr/', '_blank');
        });
    }

    const settingShop = document.getElementById('setting-shop');
    const shopModal = document.getElementById('shop-modal');
    const btnCloseShop = document.getElementById('btn-close-shop');

    if(settingShop) settingShop.addEventListener('click', () => { if(shopModal) shopModal.classList.add('active'); });
    if(btnCloseShop) btnCloseShop.addEventListener('click', () => { if(shopModal) shopModal.classList.remove('active'); });

    document.querySelectorAll('.shop-item').forEach(item => {
        item.addEventListener('click', () => {
            alert("❌ 죄송합니다. 현재 해당 상품의 재고가 모두 소진되었습니다.");
        });
    });

    const btnToggleSleep = document.getElementById('btn-toggle-sleep');
    const sleepWaveBars = document.getElementById('sleep-wave-bars');
    const sleepWaveStatus = document.getElementById('sleep-wave-status');

    if(btnToggleSleep) {
        btnToggleSleep.addEventListener('click', () => {
            isRecordingSleep = !isRecordingSleep;
            if(isRecordingSleep) {
                btnToggleSleep.textContent = "측정 중단하기 (기록 저장)";
                btnToggleSleep.style.background = "#e53e3e"; btnToggleSleep.style.color = "#ffffff";
                
                if(sleepWaveBars) sleepWaveBars.classList.add('playing'); 
                if(sleepWaveStatus) { sleepWaveStatus.textContent = "🎙️ 수면 분석 중..."; sleepWaveStatus.style.color = "#fc8181"; }
            } else {
                btnToggleSleep.textContent = "수면 측정하기";
                btnToggleSleep.style.background = "#ffffff"; btnToggleSleep.style.color = "#000000";
                
                if(sleepWaveBars) sleepWaveBars.classList.remove('playing'); 
                if(sleepWaveStatus) { sleepWaveStatus.textContent = "측정 대기 중"; sleepWaveStatus.style.color = "#a0aec0"; }
                alert("💾 수면 주파수 분석이 안전하게 종료되어 저장되었습니다.");
            }
        });
    }

    const btnToggleNoise = document.getElementById('btn-toggle-noise');
    const noiseStatusTxt = document.getElementById('noise-status-txt');

    const btnFortune = document.getElementById('btn-fortune');
    const fortuneModal = document.getElementById('fortune-modal');
    const btnCloseFortune = document.getElementById('btn-close-fortune');
    const fortuneDate = document.getElementById('fortune-date');
    const tarotCardImage = document.getElementById('tarot-card-image');
    const tarotCardName = document.getElementById('tarot-card-name');
    const tarotCardDesc = document.getElementById('tarot-card-desc');
    const fortuneConfirmView = document.getElementById('fortune-confirm-view');
    const fortuneResultView = document.getElementById('fortune-result-view');
    const btnFortuneConfirmYes = document.getElementById('btn-fortune-confirm-yes');
    const btnFortuneCancel = document.getElementById('btn-fortune-cancel');

    const btnMoodDiary = document.getElementById('btn-mood-diary');
    const diaryModal = document.getElementById('diary-modal');
    const btnCloseDiary = document.getElementById('btn-close-diary');
    const btnSaveDiary = document.getElementById('btn-save-diary');
    const diaryInput = document.getElementById('diary-input');
    const diaryDate = document.getElementById('diary-date');
    const btnMoods = document.querySelectorAll('.btn-mood');

    const btnThemeOpen = document.getElementById('btn-theme-open');
    const themeModal = document.getElementById('theme-modal');
    const btnThemeClose = document.getElementById('btn-theme-close');
    const btnThemeSelects = document.querySelectorAll('.btn-theme-select');

    const stopwatchTime = document.getElementById('stopwatch-time');
    const btnStopwatchStart = document.getElementById('btn-stopwatch-start');
    const btnStopwatchLap = document.getElementById('btn-stopwatch-lap');
    const lapList = document.getElementById('lap-list');

    const newsListEl = document.getElementById('news-list');
    if(newsListEl) {
        mockNewsData.forEach(news => {
            const el = document.createElement('div');
            el.className = 'news-item';
            el.innerHTML = `
                <img src="https://img.youtube.com/vi/${news.id}/mqdefault.jpg" class="news-thumb">
                <div class="news-text">
                    <div class="news-title">${news.title}</div>
                    <div class="news-src">${news.src}</div>
                </div>
            `;
            el.addEventListener('click', () => {
                document.getElementById('news-modal-title').textContent = news.title;
                document.getElementById('news-modal-video').innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${news.id}?autoplay=1" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>`;
                document.getElementById('news-modal-desc').textContent = news.desc;
                document.getElementById('news-modal').classList.add('active');
            });
            newsListEl.appendChild(el);
        });
    }

    const btnCloseNews = document.getElementById('btn-close-news');
    if (btnCloseNews) {
        btnCloseNews.addEventListener('click', () => {
            document.getElementById('news-modal').classList.remove('active');
            document.getElementById('news-modal-video').innerHTML = ""; 
        });
    }

    const settingsInfoModal = document.getElementById('settings-info-modal');
    const settingsInfoTitle = document.getElementById('settings-info-title');
    const settingsInfoContent = document.getElementById('settings-info-content');
    const btnCloseSettingsInfo = document.getElementById('btn-close-settings-info');

    if(btnCloseSettingsInfo) {
        btnCloseSettingsInfo.addEventListener('click', () => {
            settingsInfoModal.classList.remove('active');
        });
    }

    const openSettingsModal = (title, htmlContent) => {
        if(settingsInfoTitle) settingsInfoTitle.textContent = title;
        if(settingsInfoContent) settingsInfoContent.innerHTML = htmlContent;
        if(settingsInfoModal) settingsInfoModal.classList.add('active');
    };

    const sLogin = document.getElementById('setting-login');
    const sPoints = document.getElementById('setting-points');
    const sTheme = document.getElementById('setting-theme');
    const sSound = document.getElementById('setting-sound');
    const sNoti = document.getElementById('setting-noti');
    const sNotice = document.getElementById('setting-notice');
    const sFaq = document.getElementById('setting-faq');
    const sFeedback = document.getElementById('setting-feedback');

    if(sLogin) sLogin.onclick = () => alert("로그인 화면으로 이동합니다. (현재 베타 버전에서는 게스트 모드로 동작합니다)");
    if(sPoints) sPoints.onclick = () => alert(`현재 보유 포인트: ${wakemePoints} P\n(알람 시간에 일어나 미션을 클리어하면 하루 50P가 적립됩니다!)`);
    if(sTheme) sTheme.onclick = () => { if(themeModal) themeModal.classList.add('active'); };
    if(sSound) sSound.onclick = () => alert("현재 모바일 기기의 스피커가 기본 출력으로 설정되어 있습니다.");
    if(sNoti) sNoti.onclick = () => alert("시스템의 앱 알림 설정 창으로 이동합니다.");
    
    if(sNotice) sNotice.onclick = () => {
        openSettingsModal("📢 공지사항", `
            <b style="color:#f6e05e;">[업데이트] 웨이크미 v2.5 정식 배포!</b><br><br>
            안녕하세요, 웨이크미 개발팀입니다.<br>
            드디어 15종의 강력한 기상 미션과 수면 분석 기능이 추가된 새로운 버전이 출시되었습니다.<br><br>
            - 15종 미션 풀 확장<br>
            - 수면 주파수 애니메이션 추가<br>
            - 유튜브 기반 실시간 뉴스 지원<br>
            - 감정 일기장 이벤트 시작<br><br>
            앞으로도 절대 다시 누울 수 없는 아침을 책임지겠습니다. 감사합니다!<br><br>
            <span style="font-size:12px; color:#888;">- 2026년 5월 22일</span>
        `);
    };

    if(sFaq) sFaq.onclick = () => {
        openSettingsModal("❓ 자주묻는 질문 (FAQ)", `
            <b style="color:#f6e05e;">Q. 알람이 울리지 않아요.</b><br>
            A. 기기의 미디어 볼륨이 켜져 있는지 확인하고, 배터리 최적화 예외 앱으로 웨이크미를 설정해주세요.<br><br>
            <b style="color:#f6e05e;">Q. 원하는 미션을 고를 수는 없나요?</b><br>
            A. 현재 미션은 15종 중 랜덤으로 등장하여 두뇌를 매번 새롭게 자극하는 것이 목적이므로 수동 선택은 불가능합니다.<br><br>
            <b style="color:#f6e05e;">Q. 백색소음은 배터리를 많이 소모하나요?</b><br>
            A. 브라우저 내장 오디오 엔진을 최적화하여 밤새 틀어놓아도 배터리 소모가 극히 적습니다.
        `);
    };

    if(sFeedback) sFeedback.onclick = () => {
        const feedback = prompt("앱에 대한 소중한 의견을 남겨주세요:");
        if(feedback) alert("의견이 성공적으로 전송되었습니다. 검토 후 더 나은 서비스로 보답하겠습니다!");
    };


    if (btnThemeOpen) { btnThemeOpen.addEventListener('click', () => { if(themeModal) themeModal.classList.add('active'); }); }
    if (btnThemeClose) { btnThemeClose.addEventListener('click', () => { if(themeModal) themeModal.classList.remove('active'); }); }

    btnThemeSelects.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetColor = e.currentTarget.getAttribute('data-theme');
            if (appContainer) { appContainer.className = `app-container theme-${targetColor}`; }
            localStorage.setItem('wakeme_user_theme', targetColor);
            if(themeModal) themeModal.classList.remove('active');
        });
    });

    function getFormattedAlarmText(timeValue) {
        if (!timeValue) return "";
        const parts = timeValue.split(':');
        let hour = parseInt(parts[0], 10); const minute = parts[1];
        const ampm = hour >= 12 ? '오후' : '오전';
        if (hour > 12) hour -= 12; if (hour === 0) hour = 12;
        return `🔔 [${ampm} ${String(hour).padStart(2, '0')}:${minute}]에 미션 알람이 작동합니다.`;
    }

    if (alarmTimeInput && alarmStatusText) {
        alarmTimeInput.addEventListener('input', () => {
            if (alarmTime !== null) { alarmTime = alarmTimeInput.value; alarmStatusText.textContent = getFormattedAlarmText(alarmTime); }
        });
    }

    if(btnToggleAlarm) {
        btnToggleAlarm.addEventListener('click', () => {
            if (alarmTime === null) {
                alarmTime = alarmTimeInput.value; btnToggleAlarm.textContent = "알람 끄기"; btnToggleAlarm.className = "btn btn-danger";
                alarmStatusText.textContent = getFormattedAlarmText(alarmTime);
            } else {
                alarmTime = null; btnToggleAlarm.textContent = "알람 켜기"; btnToggleAlarm.className = "btn btn-primary";
                alarmStatusText.textContent = "설정된 알람이 없습니다.";
            }
        });
    }

    if (btnStopwatchStart && btnStopwatchLap) {
        btnStopwatchStart.addEventListener('click', () => {
            isStopwatchRunning = !isStopwatchRunning;
            if (isStopwatchRunning) {
                btnStopwatchStart.textContent = "중단"; btnStopwatchStart.classList.add('running');
                btnStopwatchLap.textContent = "랩타임"; btnStopwatchLap.disabled = false;
                const startTime = Date.now() - stopwatchElapsedTime;
                stopwatchInterval = setInterval(() => { stopwatchElapsedTime = Date.now() - startTime; stopwatchTime.textContent = formatStopwatchTime(stopwatchElapsedTime); }, 10); 
            } else {
                clearInterval(stopwatchInterval); btnStopwatchStart.textContent = "시작"; btnStopwatchStart.classList.remove('running'); btnStopwatchLap.textContent = "초기화";
            }
        });

        btnStopwatchLap.addEventListener('click', () => {
            if (isStopwatchRunning) {
                stopwatchLapCount++;
                const li = document.createElement('li'); li.innerHTML = `<span>랩 ${stopwatchLapCount}</span><span>${formatStopwatchTime(stopwatchElapsedTime)}</span>`;
                if(lapList) lapList.insertBefore(li, lapList.firstChild);
            } else {
                clearInterval(stopwatchInterval); stopwatchElapsedTime = 0; stopwatchLapCount = 0;
                if(stopwatchTime) stopwatchTime.textContent = "00:00.00"; if(lapList) lapList.innerHTML = "";
                btnStopwatchLap.textContent = "랩타임"; btnStopwatchLap.disabled = true;
            }
        });
    }

    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        const miliseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
        return `${minutes}:${seconds}.${miliseconds}`;
    }

    if(btnFortune) {
        btnFortune.addEventListener('click', () => {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
            const lastViewedDate = localStorage.getItem('last_tarot_view_date');

            if (lastViewedDate === todayKey) {
                alert("🔮 오늘의 타로 운세는 하루에 한 번만 열람할 수 있습니다.\n내일 아침 새로운 기운으로 다시 시도해 주세요!"); return;
            }
            if(fortuneConfirmView) fortuneConfirmView.style.display = "block";
            if(fortuneResultView) fortuneResultView.style.display = "none";
            if(fortuneModal) fortuneModal.classList.add('active');
        });
    }

    if(btnFortuneConfirmYes) {
        btnFortuneConfirmYes.addEventListener('click', () => {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
            localStorage.setItem('last_tarot_view_date', todayKey);

            if(fortuneDate) fortuneDate.textContent = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일`;
            
            const randomTarot = tarotCards[Math.floor(Math.random() * tarotCards.length)];
            
            if(tarotCardImage) {
                tarotCardImage.src = randomTarot.imageUrl;
                tarotCardImage.style.display = 'block';
            }
            if(tarotCardName) tarotCardName.textContent = randomTarot.name;
            if(tarotCardDesc) tarotCardDesc.textContent = randomTarot.desc;

            if(fortuneConfirmView) fortuneConfirmView.style.display = "none";
            if(fortuneResultView) fortuneResultView.style.display = "block";
        });
    }

    if(btnFortuneCancel) { btnFortuneCancel.addEventListener('click', () => { if(fortuneModal) fortuneModal.classList.remove('active'); }); }
    if(btnCloseFortune) btnCloseFortune.addEventListener('click', () => { if(fortuneModal) fortuneModal.classList.remove('active'); });

    if(btnMoodDiary) {
        btnMoodDiary.addEventListener('click', () => {
            const now = new Date();
            if(diaryDate) { diaryDate.textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 기상 직후의 마음 기록하기`; }
            selectedMood = ""; 
            if(diaryInput) diaryInput.value = "";
            btnMoods.forEach(b => b.classList.remove('selected'));
            if(diaryModal) diaryModal.classList.add('active');
        });
    }

    btnMoods.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btnMoods.forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            selectedMood = e.currentTarget.getAttribute('data-mood');
        });
    });

    if(btnSaveDiary) {
        btnSaveDiary.addEventListener('click', () => {
            if(!selectedMood) { alert("오늘 아침 나의 상태 이모지를 선택해 주세요!"); return; }
            if(!diaryInput.value.trim()) { alert("오늘 아침의 기분을 일기장 양식에 작성해 주세요!"); return; }
            alert(`💾 [아침 감정 일기 저장 완료]\n\n이벤트에 참여하시려면 지금 작성하신 화면을 캡처해서 event@wakeme.com 으로 보내주세요!\n\n감정 상태: ${selectedMood}\n내용: "${diaryInput.value}"`);
            if(diaryModal) diaryModal.classList.remove('active');
        });
    }
    if(btnCloseDiary) btnCloseDiary.addEventListener('click', () => { if(diaryModal) diaryModal.classList.remove('active'); });

    if(btnToggleNoise) {
        btnToggleNoise.addEventListener('click', () => {
            isPlayingNoise = !isPlayingNoise;
            
            if(isPlayingNoise) {
                btnToggleNoise.textContent = "■";
                btnToggleNoise.classList.add('playing');
                if(noiseStatusTxt) noiseStatusTxt.textContent = "🎵 편안한 수면 백색소음이 울려 퍼지는 중..";
                startWhiteNoise();
            } else {
                btnToggleNoise.textContent = "▶";
                btnToggleNoise.classList.remove('playing');
                if(noiseStatusTxt) noiseStatusTxt.textContent = "플레이 버튼을 누르면 꿀잠 소리가 재생됩니다";
                stopWhiteNoise();
            }
        });
    }

    function startWhiteNoise() {
        try {
            if (!noiseAudioContext) noiseAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = 2 * noiseAudioContext.sampleRate;
            const noiseBuffer = noiseAudioContext.createBuffer(1, bufferSize, noiseAudioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2.0 - 1.0;
            }
            
            noiseNode = noiseAudioContext.createBufferSource();
            noiseNode.buffer = noiseBuffer;
            noiseNode.loop = true;
            
            const filter = noiseAudioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, noiseAudioContext.currentTime); 
            
            const gainNode = noiseAudioContext.createGain();
            gainNode.gain.setValueAtTime(0.06, noiseAudioContext.currentTime); 
            
            noiseNode.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(noiseAudioContext.destination);
            
            noiseNode.start();
        } catch(e) { console.log("오디오 가동 에러: ", e); }
    }

    function stopWhiteNoise() {
        if (noiseNode) {
            try { noiseNode.stop(); } catch(e){}
            noiseNode.disconnect();
            noiseNode = null;
        }
    }

    function updateClock() {
        if (!clockEl || !dateStringEl) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;
        const year = now.getFullYear(); const month = now.getMonth() + 1; const date = now.getDate();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        dateStringEl.textContent = `${year}년 ${month}월 ${date}일 (${dayNames[now.getDay()]}요일)`;

        if (alarmTime === `${hours}:${minutes}`) {
            alarmTime = null;
            if(btnToggleAlarm) { btnToggleAlarm.textContent = "알람 켜기"; btnToggleAlarm.className = "btn btn-primary"; }
            if(alarmStatusText) alarmStatusText.textContent = "알람이 울리는 중입니다!";
            
            isTestMode = false; 
            triggerAlarm();
        }
    }
    setInterval(updateClock, 1000); updateClock();

    if(btnTestAlarm) btnTestAlarm.addEventListener('click', () => { 
        isTestMode = true; 
        triggerAlarm(); 
    });

    function startAlarmSound() {
        try {
            if (!activeAudioContext) activeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (alarmOscillator) return; 
            alarmOscillator = activeAudioContext.createOscillator();
            const gainNode = activeAudioContext.createGain();
            alarmOscillator.type = 'sawtooth'; alarmOscillator.frequency.setValueAtTime(880, activeAudioContext.currentTime);
            alarmOscillator.frequency.linearRampToValueAtTime(440, activeAudioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.2, activeAudioContext.currentTime);
            alarmOscillator.connect(gainNode); gainNode.connect(activeAudioContext.destination); alarmOscillator.start();
            let high = true;
            alarmOscillator.soundInterval = setInterval(() => {
                if(alarmOscillator) { alarmOscillator.frequency.setValueAtTime(high ? 1000 : 500, activeAudioContext.currentTime); high = !high; }
            }, 150);
        } catch (e) { console.log(e); }
    }

    function stopAlarmSound() {
        if (alarmOscillator) { clearInterval(alarmOscillator.soundInterval); try { alarmOscillator.stop(); } catch(e){} alarmOscillator.disconnect(); alarmOscillator = null; }
    }

    function triggerAlarm() {
        if(screenMission) { screenMission.classList.add('active'); }
        startAlarmSound();
        const randomIndex = Math.floor(Math.random() * missionPool.length);
        currentMission = missionPool[randomIndex];
        
        if(missionTitle) missionTitle.textContent = currentMission.title;
        if(missionDesc) missionDesc.textContent = currentMission.desc;
        if(missionBadge) {
            missionBadge.textContent = "미션 진행 중"; missionBadge.className = "badge";
            missionBadge.classList.add("badge-step2");
        }
        if(dynamicMissionBox) { dynamicMissionBox.innerHTML = ""; buildInteractiveMission(currentMission); }
    }

    function buildInteractiveMission(mission) {
        const box = document.createElement('div'); box.className = "interactive-box";
        switch (mission.type) {
            case "camera":
                box.innerHTML = `<div class="camera-view"><span class="camera-placeholder-icon">📷</span><span class="camera-overlay-text">[ 촬영 대상: ${mission.target} ]</span></div><button id="btn-action-trigger" class="btn btn-primary btn-lg">찰칵! 촬영 인증 완료</button>`;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const view = document.querySelector('.camera-view'); if(view) view.style.background = "#059669"; setTimeout(completeMission, 600);
                });
                break;
            case "typing":
                box.innerHTML = `<p class="target-sentence">똑같이 치세요: <br>"${mission.target}"</p><input type="text" id="typing-input-field" class="typing-input" autocomplete="off"><button id="btn-action-trigger" class="btn btn-primary btn-lg">입력 확인</button>`;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const field = document.getElementById('typing-input-field');
                    if (field.value.trim() === mission.target) completeMission(); else { alert("오타 발생! 다시 치세요."); field.value = ""; field.focus(); }
                });
                break;
            case "math":
                box.innerHTML = `<p class="target-sentence">암산 문제: <br>"${mission.question}"</p><input type="number" id="math-input-field" class="typing-input" autocomplete="off"><button id="btn-action-trigger" class="btn btn-primary btn-lg">정답 제출</button>`;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const field = document.getElementById('math-input-field');
                    if (field.value.trim() === mission.answer) completeMission(); 
                    else { alert("오답입니다! 잠이 덜 깨셨나요?"); field.value = ""; field.focus(); }
                });
                break;
            case "hold":
                box.innerHTML = `<div class="camera-view" style="height:90px;"><span class="camera-overlay-text">🧘 모션 센서 연동 중</span></div><button id="btn-action-hold" class="btn btn-warning btn-lg">${mission.label}</button>`;
                dynamicMissionBox.appendChild(box);
                const holdBtn = document.getElementById('btn-action-hold'); let holdTimer = null, currentHoldCount = 0;
                const startHold = () => {
                    holdTimer = setInterval(() => { currentHoldCount++; holdBtn.textContent = `유지 중... (${currentHoldCount}/${mission.duration}초)`; if (currentHoldCount >= mission.duration) { clearInterval(holdTimer); completeMission(); } }, 1000);
                };
                const endHold = () => { clearInterval(holdTimer); currentHoldCount = 0; holdBtn.textContent = mission.label; };
                holdBtn.addEventListener('mousedown', startHold); holdBtn.addEventListener('mouseup', endHold); holdBtn.addEventListener('touchstart', startHold); holdBtn.addEventListener('touchend', endHold);
                break;
            case "timer":
                box.innerHTML = `<p>⚠️ 팔을 위로 올리고 정지하세요!</p><div class="progress-container"><div id="stretch-progress-bar" class="progress-bar"></div></div>`;
                dynamicMissionBox.appendChild(box);
                setTimeout(() => { const b = document.getElementById('stretch-progress-bar'); if(b) b.style.width = "100%"; }, 50); setTimeout(completeMission, mission.duration * 1000);
                break;
            case "puzzle":
                const bc = mission.baseChar || "O";
                const tc = mission.targetChar || "Q";
                box.innerHTML = `<p>다른 하나를 찾으세요!</p><div class="grid-puzzle"><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button><button id="correct-puzzle-piece" class="btn-puzzle">${tc}</button><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button><button class="btn-puzzle">${bc}</button></div>`;
                dynamicMissionBox.appendChild(box); 
                const gp = document.querySelector('.grid-puzzle'); 
                if(gp) { for (let i = gp.children.length; i >= 0; i--) gp.appendChild(gp.children[Math.random() * i | 0]); }
                document.querySelectorAll('.btn-puzzle').forEach(btn => { btn.addEventListener('click', (e) => { if (e.target.id === 'correct-puzzle-piece') completeMission(); else alert('틀렸습니다! 다시 찾으세요.'); }); });
                break;
            case "rps":
                box.innerHTML = `<p>AI를 상대로 <strong>${mission.target}연승</strong> 하세요!</p><div class="rps-hands"><div id="hand-player">❔</div><div>VS</div><div id="hand-ai">🤖</div></div><div class="rps-buttons"><button class="btn-rps" data-choice="✊">✊</button><button class="btn-rps" data-choice="✌️">✌️</button><button class="btn-rps" data-choice="🖐️">🖐️</button></div>`;
                dynamicMissionBox.appendChild(box); let wins = 0;
                document.querySelectorAll('.btn-rps').forEach(b => {
                    b.addEventListener('click', (e) => {
                        const p = e.currentTarget.getAttribute('data-choice'); const arr = ['✊','✌️','🖐️']; const ai = arr[Math.floor(Math.random() * 3)];
                        document.getElementById('hand-player').textContent = p; document.getElementById('hand-ai').textContent = ai; if(p === ai) return;
                        if((p==='✊'&&ai==='✌️')||(p==='✌️'&&ai==='🖐️')||(p==='🖐️'&&ai==='✊')) { wins++; if(wins >= mission.target) setTimeout(completeMission, 600); } else { wins = 0; alert("연승 실패! 처음부터 다시!"); }
                    });
                });
                break;
            case "click-loop":
                const btnLbl = mission.btnLabel || "연타!!";
                box.innerHTML = `<p>버튼을 난타하여 게이지를 완충하세요!</p><div class="progress-container"><div id="brush-progress-bar" class="progress-bar"></div></div><button id="btn-brush-click" class="btn btn-primary btn-lg">${btnLbl}</button>`;
                dynamicMissionBox.appendChild(box); let clicks = 0;
                document.getElementById('btn-brush-click').addEventListener('click', () => {
                    clicks++; const p = (clicks / mission.target) * 100; document.getElementById('brush-progress-bar').style.width = `${p}%`; if(clicks >= mission.target) completeMission();
                });
                break;
            case "voice":
                box.innerHTML = `<h3 style="color:#f6e05e; margin: 15px 0;">"${mission.target}"</h3><button id="btn-voice-rec" class="btn btn-danger btn-lg">🎤 크게 외치기</button>`;
                dynamicMissionBox.appendChild(box); document.getElementById('btn-voice-rec').addEventListener('click', () => { setTimeout(completeMission, 1200); });
                break;
            case "survival-trap":
                box.innerHTML = `<button id="btn-trap-clear" class="btn btn-warning btn-lg">임시로 알람 끄기</button>`;
                dynamicMissionBox.appendChild(box); document.getElementById('btn-trap-clear').addEventListener('click', () => {
                    stopAlarmSound(); if(screenMission) screenMission.classList.remove('active'); setTimeout(startSurvivalCheckMode, 6000); 
                });
                break;
        }
    }

    function completeMission() {
        stopAlarmSound(); 
        if(screenMission) screenMission.classList.remove('active');
        
        if (currentMission && currentMission.type !== "survival-trap") {
            
            if (!isTestMode) {
                const now = new Date();
                const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
                const lastEarnDate = localStorage.getItem('last_point_earn_date');

                if (lastEarnDate !== todayKey) {
                    wakemePoints += 50;
                    localStorage.setItem('wakeme_points', wakemePoints);
                    localStorage.setItem('last_point_earn_date', todayKey);
                    
                    const pDisplay = document.getElementById('my-point-display');
                    if(pDisplay) pDisplay.textContent = wakemePoints + " P";
                    
                    alert("🎉 아침 기상 미션 성공!\n\n부지런한 하루의 시작을 축하합니다.\n🎁 50 포인트가 지급되었습니다!\n\n잠시 후 '다시 눕기 방지' 최종 불시 검문이 작동합니다.");
                } else {
                    alert("🎉 미션 성공! 알람이 일시 해제됩니다.\n(오늘의 기상 포인트는 이미 지급되었습니다.)\n\n잠시 후 '다시 눕기 방지' 최종 불시 검문이 작동합니다.");
                }
            } else {
                alert("🎉 미션 성공!\n(테스트 모드이므로 포인트는 지급되지 않습니다.)\n\n잠시 후 '다시 눕기 방지' 최종 불시 검문이 작동합니다.");
            }

            setTimeout(startSurvivalCheckMode, 6000); 
        }
    }

    function startSurvivalCheckMode() {
        if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
        if(screenSurvival) screenSurvival.classList.add('active');
        let timerValue = 30; if(survivalCountdown) survivalCountdown.textContent = timerValue;
        survivalInterval = setInterval(() => {
            timerValue--; if(survivalCountdown) survivalCountdown.textContent = timerValue;
            if (timerValue <= 0) { clearInterval(survivalInterval); survivalInterval = null; if(screenSurvival) screenSurvival.classList.remove('active'); triggerAlarm(); setTimeout(() => { alert("⏰ 생존 신고 실패! 벌칙 미션 재가동!"); }, 100); }
        }, 1000);
    }

    if(btnSurvivalConfirm) {
        btnSurvivalConfirm.addEventListener('click', () => {
            if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
            if(screenSurvival) screenSurvival.classList.remove('active');
            navItems.forEach(nav => nav.classList.remove('active')); tabScreens.forEach(screen => screen.classList.remove('active'));
            const morningTabButton = document.querySelector('[data-target="screen-weather-tab"]');
            const morningScreen = document.getElementById('screen-weather-tab');
            if(morningTabButton) morningTabButton.classList.add('active'); if(morningScreen) morningScreen.classList.add('active');
            alert("☀️ 생존 확인 완료! 오늘의 전국 날씨 정보를 확인하세요!");
        });
    }
}

initApp();
