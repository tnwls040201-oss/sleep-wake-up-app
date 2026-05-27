// ==========================================
// 1. 글로벌 핵심 제어 변수 선언
// ==========================================
let alarms = JSON.parse(localStorage.getItem('wakeme_alarms') || '[]');
let currentMission = null;
let activeAudioContext = null;
let alarmOscillator = null;
let survivalInterval = null;
let isRecordingSleep = false; 
let selectedMood = ""; 

// 💡 일반 백색소음(파도, 비, 천둥)을 위한 오디오 객체
let sleepAudio = new Audio();
sleepAudio.loop = true;
sleepAudio.volume = 1.0; 
let isPlayingNoise = false;

// 💡 유튜브 API를 활용한 백색소음(모닥불, 귀뚜라미) 플레이어 객체
let ytPlayers = {};
let isYtReady = false;

let stopwatchInterval = null;
let stopwatchElapsedTime = 0; 
let isStopwatchRunning = false;
let stopwatchLapCount = 0;

let isTestMode = false;
let wakemePoints = parseInt(localStorage.getItem('wakeme_points') || '0');

// 유튜브 Iframe API 동적 로드
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 유튜브 플레이어가 준비되면 숨겨진 iframe에 연결
window.onYouTubeIframeAPIReady = function() {
    isYtReady = true;
    ytPlayers['bonfire'] = new YT.Player('yt-player-campfire', {
        height: '10', width: '10', videoId: 'N_g3AiXF-q8',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'N_g3AiXF-q8' }
    });
    ytPlayers['forest'] = new YT.Player('yt-player-forest', {
        height: '10', width: '10', videoId: 'uNpanr3Jl3Q',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'uNpanr3Jl3Q' }
    });
};

// 15개 미션
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

// 💡 22개 메이저 아르카나 전체 (깨지지 않는 고퀄리티 이모지 카드)
const tarotCards = [
    { name: "0. THE FOOL (바보)", emoji: "🚶", desc: "새로운 여정과 모험이 기다리는 하루입니다. 두려움을 떨치고 직관을 믿고 나아가세요!" },
    { name: "I. THE MAGICIAN (마법사)", emoji: "🪄", desc: "새로운 시작과 무한한 가능성의 날입니다. 당신의 능력을 마음껏 펼쳐보세요." },
    { name: "II. THE HIGH PRIESTESS (여사제)", emoji: "📖", desc: "지혜와 통찰력이 빛나는 날입니다. 차분하게 내면의 목소리에 귀 기울이면 뜻밖의 해결책을 얻습니다." },
    { name: "III. THE EMPRESS (여황제)", emoji: "👑", desc: "풍요로움과 창조성이 넘치는 하루입니다. 주변 사람들과 따뜻한 마음을 나누며 행복을 만끽하세요." },
    { name: "IV. THE EMPEROR (황제)", emoji: "🛡️", desc: "안정과 성취의 날입니다. 리더십을 발휘하여 계획했던 일들을 자신감 있게 추진해 보세요." },
    { name: "V. THE HIEROPHANT (교황)", emoji: "🗝️", desc: "전통과 배움의 날입니다. 멘토나 존경하는 사람의 조언이 큰 도움이 될 것입니다." },
    { name: "VI. THE LOVERS (연인)", emoji: "💞", desc: "조화와 선택의 날입니다. 마음이 끌리는 즐거운 선택을 하세요." },
    { name: "VII. THE CHARIOT (전차)", emoji: "🐎", desc: "강한 추진력과 자신감이 필요한 날입니다. 망설이지 말고 당신의 목표를 향해 힘차게 전진하세요!" },
    { name: "VIII. STRENGTH (힘)", emoji: "🦁", desc: "내면의 용기와 인내심이 빛을 발하는 하루입니다. 부드러운 카리스마로 어려움을 극복할 수 있습니다." },
    { name: "IX. THE HERMIT (은둔자)", emoji: "🏮", desc: "성찰과 휴식의 날입니다. 잠시 혼자만의 시간을 가지며 에너지를 재충전하세요." },
    { name: "X. WHEEL OF FORTUNE (운명)", emoji: "🎡", desc: "긍정적인 변화와 행운이 찾아오는 타이밍입니다. 흐름에 몸을 맡기고 기회를 잡으세요." },
    { name: "XI. JUSTICE (정의)", emoji: "⚖️", desc: "균형과 공정함의 날입니다. 객관적이고 이성적으로 판단하면 좋은 결과가 있습니다." },
    { name: "XII. THE HANGED MAN (매달린 사람)", emoji: "🙃", desc: "관점의 전환이 필요한 날입니다. 발상을 조금만 바꾸면 새로운 돌파구가 보입니다." },
    { name: "XIII. DEATH (죽음)", emoji: "🦋", desc: "끝맺음과 새로운 시작의 날입니다. 낡은 습관을 버리고 새롭게 다시 태어나세요!" },
    { name: "XIV. TEMPERANCE (절제)", emoji: "🌊", desc: "조절과 타협의 날입니다. 무리하지 말고 페이스를 유지하는 것이 성공의 열쇠입니다." },
    { name: "XV. THE DEVIL (악마)", emoji: "😈", desc: "강한 유혹이 있는 날입니다. 달콤한 유혹을 이겨내면 성취감이 배가 됩니다." },
    { name: "XVI. THE TOWER (탑)", emoji: "⚡", desc: "갑작스러운 변화가 생길 수 있습니다. 당황하지 말고 유연하게 대처하면 오히려 큰 기회가 됩니다." },
    { name: "XVII. THE STAR (별)", emoji: "⭐", desc: "희망과 영감이 가득한 긍정적인 하루입니다. 당신의 숨겨진 재능이 반짝반짝 빛나며 좋은 결과를 가져옵니다." },
    { name: "XVIII. THE MOON (달)", emoji: "🌕", desc: "불안과 상상력의 날입니다. 걱정은 접어두고 당신의 창의력을 믿어보세요." },
    { name: "XIX. THE SUN (태양)", emoji: "☀️", desc: "오늘의 최고 길운! 성공과 활력이 차오르는 눈부신 하루가 예상됩니다. 자신감을 갖고 당당하게 행동하세요." },
    { name: "XX. JUDGEMENT (심판)", emoji: "📯", desc: "부활과 보상의 날입니다. 그동안 노력했던 일들이 마침내 좋은 소식으로 돌아옵니다." },
    { name: "XXI. THE WORLD (세계)", emoji: "🌍", desc: "노력해 온 일들이 완벽한 결실을 맺거나 깔끔하게 정리되는 마무리의 날입니다. 스스로를 아낌없이 칭찬해 주세요." }
];

// 💡 3가지 유튜브 뉴스 완벽 매칭
const mockNewsData = [
    { id: "XWFAHRsWQAo", title: "[속보] 26인 최종 명단 발표 | 북중미 월드컵 EP.1", src: "스포츠", desc: "북중미 월드컵 26인 최종 명단 발표 영상입니다." },
    { id: "W6urMb3qIr4", title: "ILLIT - It's Me [Music Bank] | KBS WORLD TV", src: "엔터테인먼트", desc: "ILLIT(아일릿)의 Music Bank 무대 교차편집 영상입니다." },
    { id: "Ab3LZbmPW74", title: "[Ansan Univ] 안산대학교 학과 홍보 동영상 | 보건의료정보학과", src: "안산대학교", desc: "안산대학교 보건의료정보학과의 홍보 동영상입니다." }
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
    
    const alarmTimeInput = document.getElementById('alarm-time-input');
    const btnAddAlarm = document.getElementById('btn-add-alarm');
    const alarmListContainer = document.getElementById('alarm-list-container');
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

    const currentRegionEl = document.getElementById('current-region-name');
    if(currentRegionEl) {
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if(data.city) { currentRegionEl.textContent = data.city; }
            }).catch(e => console.log('IP fetch fail'));
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

    const bannerTrack = document.getElementById('weather-banner-track');
    let bannerIndex = 0;
    if (bannerTrack) {
        setInterval(() => {
            bannerIndex = (bannerIndex === 0) ? 1 : 0;
            bannerTrack.style.transform = `translateX(-${bannerIndex * 50}%)`;
        }, 3000);
    }
    
    const dustBadge = document.getElementById('dust-badge');
    if(dustBadge) {
        const levels = [
            { text: "좋음 🔵", class: "good" },
            { text: "보통 🟢", class: "normal" },
            { text: "나쁨 🟠", class: "bad" },
            { text: "매우 나쁨 🔴", class: "bad" }
        ];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        dustBadge.textContent = randomLevel.text;
        dustBadge.className = `dust-badge ${randomLevel.class}`;
    }

    const btnToggleSleep = document.getElementById('btn-toggle-sleep');
    const sleepWaveBars = document.getElementById('sleep-wave-bars');
    const sleepWaveStatus = document.getElementById('sleep-wave-status');

    const btnViewReport = document.getElementById('btn-view-report');
    const sleepHistoryModal = document.getElementById('sleep-history-modal');
    const sleepHistoryList = document.getElementById('sleep-history-list');
    const btnCloseSleepHistory = document.getElementById('btn-close-sleep-history');
    
    const sleepResultModal = document.getElementById('sleep-result-modal');
    const sleepResultContent = document.getElementById('sleep-result-content');
    const btnCloseSleepResult = document.getElementById('btn-close-sleep-result');

    let sleepRecords = JSON.parse(localStorage.getItem('wakeme_sleep_records') || '[]');

    function renderSleepHistory() {
        if(!sleepHistoryList) return;
        sleepHistoryList.innerHTML = '';
        if (sleepRecords.length === 0) {
            sleepHistoryList.innerHTML = '<p style="color:#a0aec0; padding:20px; text-align:center;">저장된 수면 리포트가 없습니다.</p>';
            return;
        }
        sleepRecords.forEach(record => {
            const div = document.createElement('div');
            div.className = 'sleep-record-item';
            div.innerHTML = `
                <div style="font-size:12px; color:#a0aec0; margin-bottom:5px;">${record.date}</div>
                <div style="font-size:16px; font-weight:bold; color:white; margin-bottom:5px;">수면 점수: ${record.score}점 😴</div>
                <div style="font-size:13px; color:#cbd5e0;">수면 시간: ${record.duration} | 뒤척임: ${record.toss}회 | 코골이: ${record.snore}</div>
            `;
            sleepHistoryList.appendChild(div);
        });
    }

    if(btnViewReport) {
        btnViewReport.addEventListener('click', () => {
            renderSleepHistory();
            if(sleepHistoryModal) sleepHistoryModal.classList.add('active');
        });
    }
    if(btnCloseSleepHistory) { btnCloseSleepHistory.addEventListener('click', () => { sleepHistoryModal.classList.remove('active'); }); }
    if(btnCloseSleepResult) { btnCloseSleepResult.addEventListener('click', () => { sleepResultModal.classList.remove('active'); }); }

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
                
                const score = Math.floor(Math.random() * 20) + 75;
                const toss = Math.floor(Math.random() * 15);
                const snoreTypes = ["경미", "거의 없음", "보통", "심함"];
                const snore = snoreTypes[Math.floor(Math.random() * snoreTypes.length)];
                const hrs = Math.floor(Math.random() * 3) + 5;
                const mins = Math.floor(Math.random() * 60);
                
                const now = new Date();
                const dateStr = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`;

                const newRecord = { date: dateStr, score: score, toss: toss, snore: snore, duration: `${hrs}시간 ${mins}분` };
                
                sleepRecords.unshift(newRecord);
                localStorage.setItem('wakeme_sleep_records', JSON.stringify(sleepRecords));

                if(sleepResultContent) {
                    sleepResultContent.innerHTML = `
                        <p style="font-size:20px; font-weight:800; color:#f6e05e; margin-bottom:15px;">오늘의 수면 점수 : ${score}점</p>
                        <p style="margin-bottom:8px;">- 수면 시간: ${hrs}시간 ${mins}분</p>
                        <p style="margin-bottom:8px;">- 뒤척임 횟수: ${toss}회</p>
                        <p style="margin-bottom:8px;">- 코골이 위험도: ${snore}</p>
                        <p style="color:#a0aec0; font-size:12px; margin-top:15px;">추천 취침 시간: 오늘 밤 11시 30분</p>
                    `;
                }
                if(sleepResultModal) sleepResultModal.classList.add('active');
            }
        });
    }

    // 💡 유튜브 영상의 소리만 추출하여 완벽하게 연동 (모닥불 & 귀뚜라미)
    const btnToggleNoise = document.getElementById('btn-toggle-noise');
    const noiseStatusTxt = document.getElementById('noise-status-txt');
    const noiseVisualizer = document.getElementById('noise-visualizer');
    const noiseCurrentText = document.getElementById('noise-current-text');
    const noiseItems = document.querySelectorAll('.noise-item');
    
    // MP3 서버 링크 (파도, 비, 천둥 유지)
    const mp3Urls = {
        "waves": "https://assets.mixkit.co/active_storage/sfx/116/116-preview.mp3",
        "rain": "https://assets.mixkit.co/active_storage/sfx/1250/1250-preview.mp3",
        "thunder": "https://assets.mixkit.co/active_storage/sfx/1291/1291-preview.mp3"
    };

    let currentNoiseType = "none";

    function stopAllNoises() {
        sleepAudio.pause();
        if(isYtReady) {
            if(ytPlayers['bonfire'] && typeof ytPlayers['bonfire'].pauseVideo === 'function') ytPlayers['bonfire'].pauseVideo();
            if(ytPlayers['forest'] && typeof ytPlayers['forest'].pauseVideo === 'function') ytPlayers['forest'].pauseVideo();
        }
    }

    function playCurrentNoise() {
        stopAllNoises();
        if (currentNoiseType === "bonfire") {
            if(isYtReady && ytPlayers['bonfire']) ytPlayers['bonfire'].playVideo();
        } else if (currentNoiseType === "forest") {
            if(isYtReady && ytPlayers['forest']) ytPlayers['forest'].playVideo();
        } else if (mp3Urls[currentNoiseType]) {
            sleepAudio.src = mp3Urls[currentNoiseType];
            sleepAudio.play().catch(e => {
                alert("오디오 재생 권한이 차단되었습니다. 화면을 터치하거나 볼륨을 확인해주세요.");
                isPlayingNoise = false;
                btnToggleNoise.textContent = "▶";
                btnToggleNoise.classList.remove('playing');
                noiseVisualizer.classList.remove('playing');
            });
        }
    }

    noiseItems.forEach(item => {
        item.addEventListener('click', () => {
            noiseItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentNoiseType = item.getAttribute('data-sound');
            noiseCurrentText.textContent = item.querySelector('span').textContent;
            
            if (currentNoiseType !== "none") {
                if(isPlayingNoise) {
                    playCurrentNoise();
                }
            } else {
                stopAllNoises();
                if(isPlayingNoise) {
                    isPlayingNoise = false;
                    btnToggleNoise.textContent = "▶";
                    btnToggleNoise.classList.remove('playing');
                    noiseVisualizer.classList.remove('playing');
                    if(noiseStatusTxt) noiseStatusTxt.textContent = "플레이 버튼을 누르면 꿀잠 소리가 재생됩니다";
                }
            }
        });
    });

    if(btnToggleNoise) {
        btnToggleNoise.addEventListener('click', () => {
            if(currentNoiseType === "none") {
                alert("아래에서 듣고 싶은 소리를 먼저 선택해주세요!");
                return;
            }

            isPlayingNoise = !isPlayingNoise;
            
            if(isPlayingNoise) {
                btnToggleNoise.textContent = "■";
                btnToggleNoise.classList.add('playing');
                if(noiseStatusTxt) noiseStatusTxt.textContent = "🎵 편안한 수면 백색소음 재생 중..";
                noiseVisualizer.classList.add('playing');
                playCurrentNoise();
            } else {
                btnToggleNoise.textContent = "▶";
                btnToggleNoise.classList.remove('playing');
                if(noiseStatusTxt) noiseStatusTxt.textContent = "플레이 버튼을 누르면 꿀잠 소리가 재생됩니다";
                noiseVisualizer.classList.remove('playing');
                stopAllNoises();
            }
        });
    }

    const btnFortune = document.getElementById('btn-fortune');
    const fortuneModal = document.getElementById('fortune-modal');
    const btnCloseFortune = document.getElementById('btn-close-fortune');
    const fortuneDate = document.getElementById('fortune-date');
    const tarotEmojiDisplay = document.getElementById('tarot-emoji-display');
    const tarotCardName = document.getElementById('tarot-card-name');
    const tarotCardDesc = document.getElementById('tarot-card-desc');
    const fortuneConfirmView = document.getElementById('fortune-confirm-view');
    const fortuneResultView = document.getElementById('fortune-result-view');
    const btnFortuneConfirmYes = document.getElementById('btn-fortune-confirm-yes');
    const btnFortuneCancel = document.getElementById('btn-fortune-cancel');

    // 💡 타로카드 하루 한 번 제한 완전히 해제 (무제한)
    if(btnFortune) {
        btnFortune.addEventListener('click', () => {
            if(fortuneConfirmView) fortuneConfirmView.style.display = "block";
            if(fortuneResultView) fortuneResultView.style.display = "none";
            if(fortuneModal) fortuneModal.classList.add('active');
        });
    }

    if(btnFortuneConfirmYes) {
        btnFortuneConfirmYes.addEventListener('click', () => {
            const now = new Date();
            if(fortuneDate) fortuneDate.textContent = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일`;
            
            // 22개 타로 카드 중 랜덤 뽑기!
            const randomTarot = tarotCards[Math.floor(Math.random() * tarotCards.length)];
            
            if(tarotEmojiDisplay) {
                tarotEmojiDisplay.textContent = randomTarot.emoji;
            }
            if(tarotCardName) tarotCardName.textContent = randomTarot.name;
            if(tarotCardDesc) tarotCardDesc.textContent = randomTarot.desc;

            if(fortuneConfirmView) fortuneConfirmView.style.display = "none";
            if(fortuneResultView) fortuneResultView.style.display = "block";
        });
    }

    if(btnFortuneCancel) { btnFortuneCancel.addEventListener('click', () => { if(fortuneModal) fortuneModal.classList.remove('active'); }); }
    if(btnCloseFortune) btnCloseFortune.addEventListener('click', () => { if(fortuneModal) fortuneModal.classList.remove('active'); });

    // 💡 아침 일기 클릭 안 되던 문제 원상복구(수정) 완료
    const btnMoodDiary = document.getElementById('btn-mood-diary');
    const diaryModal = document.getElementById('diary-modal');
    const btnCloseDiary = document.getElementById('btn-close-diary');
    const btnSaveDiary = document.getElementById('btn-save-diary');
    const diaryInput = document.getElementById('diary-input');
    const diaryDate = document.getElementById('diary-date');
    const btnMoods = document.querySelectorAll('.btn-mood');

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


    const btnThemeOpen = document.getElementById('btn-theme-open');
    const themeModal = document.getElementById('theme-modal');
    const btnThemeClose = document.getElementById('btn-theme-close');
    const btnThemeSelects = document.querySelectorAll('.btn-theme-select');

    const stopwatchTime = document.getElementById('stopwatch-time');
    const btnStopwatchStart = document.getElementById('btn-stopwatch-start');
    const btnStopwatchLap = document.getElementById('btn-stopwatch-lap');
    const btnStopwatchReset = document.getElementById('btn-stopwatch-reset');
    const lapList = document.getElementById('lap-list');

    let savedLaps = JSON.parse(localStorage.getItem('wakeme_laps') || '[]');
    function renderLaps() {
        if(!lapList) return;
        lapList.innerHTML = '';
        savedLaps.forEach((lap, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>랩 ${savedLaps.length - idx}</span><span>${lap}</span>`;
            lapList.appendChild(li);
        });
    }
    renderLaps();

    if (btnStopwatchStart && btnStopwatchLap) {
        btnStopwatchStart.addEventListener('click', () => {
            isStopwatchRunning = !isStopwatchRunning;
            if (isStopwatchRunning) {
                btnStopwatchStart.textContent = "중단"; btnStopwatchStart.classList.add('running');
                btnStopwatchLap.textContent = "랩타임"; btnStopwatchLap.disabled = false;
                const startTime = Date.now() - stopwatchElapsedTime;
                stopwatchInterval = setInterval(() => { stopwatchElapsedTime = Date.now() - startTime; stopwatchTime.textContent = formatStopwatchTime(stopwatchElapsedTime); }, 10); 
            } else {
                clearInterval(stopwatchInterval); btnStopwatchStart.textContent = "시작"; btnStopwatchStart.classList.remove('running'); btnStopwatchLap.textContent = "기록";
            }
        });

        btnStopwatchLap.addEventListener('click', () => {
            if (isStopwatchRunning) {
                stopwatchLapCount++;
                const timeString = formatStopwatchTime(stopwatchElapsedTime);
                savedLaps.unshift(timeString);
                localStorage.setItem('wakeme_laps', JSON.stringify(savedLaps));
                renderLaps();
            }
        });
    }

    if (btnStopwatchReset) {
        btnStopwatchReset.addEventListener('click', () => {
            if(isStopwatchRunning) { alert("먼저 스톱워치를 중단해주세요."); return; }
            clearInterval(stopwatchInterval); stopwatchElapsedTime = 0; stopwatchLapCount = 0;
            if(stopwatchTime) stopwatchTime.textContent = "00:00.00"; 
            savedLaps = [];
            localStorage.setItem('wakeme_laps', JSON.stringify(savedLaps));
            renderLaps();
            btnStopwatchLap.disabled = true;
        });
    }

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

    const bannerTip = document.getElementById('banner-click-tip');
    const bannerPremium = document.getElementById('banner-click-premium');
    
    if(bannerTip) {
        bannerTip.addEventListener('click', () => {
            openSettingsModal("💡 알람 이용 팁", `
                <b style="color:#f6e05e;">1. 미디어 볼륨 확인</b><br>
                스마트폰의 '미디어 볼륨'이 켜져 있는지 확인하세요. 무음 모드라도 미디어 볼륨이 낮으면 소리가 나지 않습니다.<br><br>
                <b style="color:#f6e05e;">2. 배터리 사용량 최적화 예외</b><br>
                앱이 백그라운드에서 강제 종료되지 않도록 [설정 > 애플리케이션 > 웨이크미 > 배터리]에서 '제한 없음'으로 설정해주세요.<br><br>
                <b style="color:#f6e05e;">3. 다른 앱 위에 표시 허용</b><br>
                알람이 제시간에 화면을 깨울 수 있도록 설정에서 권한을 반드시 허용해주세요.
            `);
        });
    }
    
    if(bannerPremium) {
        bannerPremium.addEventListener('click', () => {
            alert("🛠️ 해당 프리미엄 상품은 현재 준비중입니다. 조금만 기다려주세요!");
        });
    }

    const sLogin = document.getElementById('setting-login');
    const sPoints = document.getElementById('setting-points');
    const sTheme = document.getElementById('setting-theme');
    const sSound = document.getElementById('setting-sound');
    const sNoti = document.getElementById('setting-noti');
    const sNotice = document.getElementById('setting-notice');
    const sFaq = document.getElementById('setting-faq');
    const sTerms = document.getElementById('setting-terms');
    const sPrivacy = document.getElementById('setting-privacy');
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

    if(sTerms) sTerms.onclick = () => {
        openSettingsModal("📜 이용 약관", `
            <b>제 1 조 (목적)</b><br>
            본 약관은 웨이크미(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.<br><br>
            <b>제 2 조 (서비스의 제공)</b><br>
            회사는 다음과 같은 서비스를 제공합니다.<br>
            1. 기상 알람 및 미션 서비스<br>
            2. 수면 분석 및 백색소음 제공<br>
            3. 포인트 상점 및 기타 연계 서비스<br><br>
            <b>제 3 조 (포인트의 소멸)</b><br>
            적립된 포인트는 1년간 사용하지 않을 경우 자동 소멸됩니다.
        `);
    };

    if(sPrivacy) sPrivacy.onclick = () => {
        openSettingsModal("🔒 개인정보 처리방침", `
            웨이크미는 사용자의 개인정보를 소중하게 생각합니다.<br><br>
            <b>1. 수집하는 개인정보 항목</b><br>
            - 수면 데이터 (디바이스 내 로컬 저장)<br>
            - 알람 설정 기록<br><br>
            <b>2. 개인정보의 이용 목적</b><br>
            - 맞춤형 수면 리포트 제공<br>
            - 서비스 품질 향상 및 신규 기능 개발<br><br>
            <b>3. 개인정보의 파기</b><br>
            앱 삭제 시 모든 로컬 데이터는 즉시 안전하게 파기됩니다. 서버에 불필요한 개인 식별 정보를 저장하지 않습니다.
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

    function renderAlarms() {
        if(!alarmListContainer) return;
        alarmListContainer.innerHTML = '';
        if(alarms.length === 0) {
            alarmListContainer.innerHTML = '<div class="empty-state">설정된 알람이 없습니다.</div>';
            return;
        }
        alarms.forEach((alarm, idx) => {
            const el = document.createElement('div');
            el.className = `alarm-item ${alarm.isActive ? '' : 'inactive'}`;
            el.innerHTML = `
                <span style="font-weight:900; font-size:18px;">${alarm.time} ${alarm.isActive ? '🔔' : '🔕'}</span>
                <div>
                    <button class="btn-toggle-single" data-idx="${idx}" style="color:${alarm.isActive?'#68d391':'#a0aec0'}; margin-right:10px;">${alarm.isActive?'ON':'OFF'}</button>
                    <button class="btn-delete-alarm" data-idx="${idx}">삭제</button>
                </div>
            `;
            alarmListContainer.appendChild(el);
        });

        document.querySelectorAll('.btn-toggle-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-idx');
                alarms[idx].isActive = !alarms[idx].isActive;
                localStorage.setItem('wakeme_alarms', JSON.stringify(alarms));
                renderAlarms();
            });
        });

        document.querySelectorAll('.btn-delete-alarm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-idx');
                alarms.splice(idx, 1);
                localStorage.setItem('wakeme_alarms', JSON.stringify(alarms));
                renderAlarms();
            });
        });
    }

    if (alarmListContainer) {
        renderAlarms();
    }

    if(btnAddAlarm) {
        btnAddAlarm.addEventListener('click', () => {
            const val = alarmTimeInput.value;
            if(!val) return;
            const exists = alarms.find(a => a.time === val);
            if(exists) {
                alert("이미 동일한 시간에 설정된 알람이 있습니다.");
                return;
            }
            alarms.push({ time: val, isActive: true });
            alarms.sort((a, b) => a.time.localeCompare(b.time));
            localStorage.setItem('wakeme_alarms', JSON.stringify(alarms));
            renderAlarms();
        });
    }

    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        const miliseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
        return `${minutes}:${seconds}.${miliseconds}`;
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

        if (seconds === '00') {
            alarms.forEach(alarm => {
                if (alarm.isActive && alarm.time === `${hours}:${minutes}`) {
                    alarm.isActive = false; 
                    localStorage.setItem('wakeme_alarms', JSON.stringify(alarms));
                    renderAlarms();
                    
                    isTestMode = false; 
                    triggerAlarm();
                }
            });
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
                box.innerHTML = `<p class="target-sentence">똑같이 치세요: <br>"${mission.target}"</p><input type="text" id="typing-input-field" class="typing-input premium-input" autocomplete="off"><button id="btn-action-trigger" class="btn btn-primary btn-lg">입력 확인</button>`;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const field = document.getElementById('typing-input-field');
                    if (field.value.trim() === mission.target) completeMission(); else { alert("오타 발생! 다시 치세요."); field.value = ""; field.focus(); }
                });
                break;
            case "math":
                box.innerHTML = `<p class="target-sentence">암산 문제: <br>"${mission.question}"</p><input type="number" id="math-input-field" class="typing-input premium-input" autocomplete="off"><button id="btn-action-trigger" class="btn btn-primary btn-lg">정답 제출</button>`;
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
                box.innerHTML = `<h3 style="color:#f6e05e; margin: 15px 0;">"${mission.target}"</h3><button id="btn-voice-rec" class="btn btn-danger btn-lg premium-btn-danger">🎤 크게 외치기</button>`;
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
