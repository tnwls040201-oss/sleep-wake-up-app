// ==========================================
// 1. 글로벌 바인딩 상태 제어 변수
// ==========================================
let alarmTime = null;
let currentMission = null;
let activeAudioContext = null;
let alarmOscillator = null;
let survivalInterval = null;
let isRecordingSleep = false; 
let selectedMood = ""; 

// 스톱워치 상태 엔진 변수
let stopwatchInterval = null;
let stopwatchElapsedTime = 0; // 밀리초 단주기 단위 누적저장용 변수
let isStopwatchRunning = false;
let lapCount = 0;

const missionPool = [
    { id: 1, step: 1, stepName: "1단계: 침대 탈출형 미션", title: "냉장고 문 열고 인증샷 찍기", desc: "주방 냉장고 안의 우유나 계란이 보이게 카메라 셔터를 누르세요!", type: "camera", target: "🥛 냉장고 내부" },
    { id: 2, step: 1, stepName: "1단계: 침대 탈출형 미션", title: "화장실 거울 보며 스쿼트 5회", desc: "화장실 거울 앞에 전신이 나오게 폰을 들고 아래 버튼을 홀드하세요.", type: "hold", duration: 5, label: "스쿼트 감지 중... 꾹 누르기" },
    { id: 3, step: 1, stepName: "1단계: 침대 탈출형 미션", title: "현관문 도어락 사진 찍기", desc: "침대에서 가장 먼 현관문으로 이동해 도어락 번호판을 선명하게 촬영하세요.", type: "camera", target: "🔑 현관 도어락" },
    { id: 4, step: 1, stepName: "1단계: 침대 탈출형 미션", title: "집안의 '초록색 물건' 찾아오기", desc: "방이나 거실을 돌며 초록색 식물이나 물건을 뷰파인더 중앙에 맞추세요.", type: "camera", target: "🟢 초록색 물건" },
    { id: 5, step: 1, stepName: "1단계: 침대 탈출형 미션", title: "기상 스트레칭 30초 유지", desc: "폰을 세워두고 만세 자세를 한 뒤 게이지가 가득 찰 때까지 버티세요.", type: "timer", duration: 5 },
    { id: 6, step: 2, stepName: "2단계: 뇌 각성형 미션", title: "물 한 컵 마시는 모습 인증", desc: "주방으로 가서 컵에 물을 채우고 원샷하는 모습을 전면 카메라로 찍으세요.", type: "camera", target: "🥛 물 마시는 정면" },
    { id: 7, step: 2, stepName: "2단계: 뇌 각성형 미션", title: "오늘의 날씨 뉴스 헤드라인 타이핑", desc: "잠결에 흐릿해진 뇌를 깨웁니다. 아래 문장을 오타 없이 입력창에 입력하세요.", type: "typing", target: "반짝이는 아침 햇살이 방안을 가득 채우는 오늘" },
    { id: 8, step: 2, stepName: "2단계: 뇌 각성형 미션", title: "틀린 문자 찾기 (집중력 각성)", desc: "정신을 바짝 차리세요! 아래 9개의 문자 중 혼자 다른 한 개를 찾아 클릭하세요.", type: "puzzle" },
    { id: 9, step: 2, stepName: "2단계: 뇌 각성형 미션", title: "영양제 또는 미스트 사진 찍기", desc: "매일 아침 필수템 루틴! 미스트 통이나 영양제 뚜껑이 나오게 찍으세요.", type: "camera", target: "💊 영양제 통" },
    { id: 10, step: 2, stepName: "2단계: 뇌 각성형 미션", title: "\"오늘도 화이팅\" 크게 외치기", desc: "아래 '외치기' 버튼을 누르고 마이크를 향해 힘차게 말하세요!", type: "voice", target: "오늘도 화이팅" },
    { id: 11, step: 3, stepName: "갱신형 미션", title: "침대 이불 정리하고 인증샷", desc: "다시 누울 공간을 원천 차단합니다. 이불과 베개를 정돈한 후 찍으세요.", type: "camera", target: "🛏️ 정돈된 침대 전체" },
    { id: 12, step: 3, stepName: "갱신형 미션", title: "가위바위보에서 AI 이기기", desc: "승부욕으로 뇌 깨우기! 인공지능을 상대로 먼저 3판을 이기세요.", type: "rps", target: 3 },
    { id: 13, step: 3, stepName: "갱신형 미션", title: "랜덤 영단어 퀴즈 맞히기", desc: "단어의 철자가 알맞게 정렬되도록 입력창에 똑같이 입력하세요.", type: "typing", target: "morning" },
    { id: 14, step: 3, stepName: "갱신형 미션", title: "양치질 1분 하기 (모션 시뮬레이션)", desc: "욕실로 직행하세요. 아래 칫솔질 버튼을 연타하여 치약 거품 게이지를 채우세요.", type: "click-loop", target: 15 },
    { id: 15, step: 3, stepName: "갱신형 미션", title: "\"타임 오버\" 5분 뒤 생존 신고", desc: "이 미션은 일단 알람을 끈 뒤, 잠시 방심하고 누웠을 때 허를 찌르는 트랩이 발동합니다.", type: "survival-trap" }
];

const tarotCards = [
    { name: "0. THE FOOL (광대 카드)", icon: "🃏", desc: "새로운 시작과 무한한 가능성의 날입니다. 두려움 없이 가벼운 발걸음으로 오늘 하루를 개척해 보세요!" },
    { name: "I. THE MAGICIAN (마법사 카드)", icon: "🧙", desc: "준비는 끝났습니다. 당신의 재능과 지혜를 마음껏 펼칠 수 있는 완벽한 아침입니다. 무엇이든 주도적으로 시작해 보세요!" },
    { name: "VI. THE LOVERS (연인 카드)", icon: "💖", desc: "대인 관계와 소통 능력이 최고조에 달하는 하루입니다. 만나는 사람들과 기분 좋은 대화가 이어질 것입니다." },
    { name: "X. WHEEL OF FORTUNE (운명의 수레바퀴)", icon: "🎡", desc: "정체되어 있던 흐름이 좋은 방향으로 굴러가기 시작하는 전환점입니다. 다가오는 우연한 행운을 붙잡으세요." },
    { name: "XI. JUSTICE (정의 카드)", icon: "⚖️", desc: "명확한 판단력과 이성이 빛을 발하는 날입니다. 해야 할 업무나 공부 등 계획을 밀어붙이기에 최적의 기운입니다." },
    { name: "XIX. THE SUN (태양 카드)", icon: "☀️", desc: "오늘의 최고 길운! 활력과 에너지가 가득 차오르는 하루가 예상됩니다. 자신감을 갖고 당당하게 행동하세요." },
    { name: "XXI. THE WORLD (세계 카드)", icon: "🌍", desc: "노력해 온 프로젝트나 루틴이 마침내 아름다운 마무리를 짓게 됩니다. 완벽한 만족감이 찾아오는 행운의 날입니다." }
];

function initApp() {
    
    // ⏱️ 스플래시 화면 디졸브 해제
    const splashScreen = document.getElementById('splash-screen');
    setTimeout(() => { if (splashScreen) splashScreen.classList.add('fade-out'); }, 1500);

    // 하단 탭 내비게이션 리스너 (4칸 제어로 자동 스케일 확장)
    const navItems = document.querySelectorAll('.nav-item');
    const tabScreens = document.querySelectorAll('.main-tab-screen');

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

    const btnToggleSleep = document.getElementById('btn-toggle-sleep');
    const btnViewReport = document.getElementById('btn-view-report');

    const btnFortune = document.getElementById('btn-fortune');
    const fortuneModal = document.getElementById('fortune-modal');
    const btnCloseFortune = document.getElementById('btn-close-fortune');
    const fortuneDate = document.getElementById('fortune-date');
    const tarotCardImage = document.getElementById('tarot-card-image');
    const tarotCardName = document.getElementById('tarot-card-name');
    const tarotCardDesc = document.getElementById('tarot-card-desc');

    const btnMoodDiary = document.getElementById('btn-mood-diary');
    const diaryModal = document.getElementById('diary-modal');
    const btnCloseDiary = document.getElementById('btn-close-diary');
    const btnSaveDiary = document.getElementById('btn-save-diary');
    const diaryDate = document.getElementById('diary-date');
    const diaryInput = document.getElementById('diary-input');
    const btnMoods = document.querySelectorAll('.btn-mood');

    // ⏱️ 💡 [추가: 스톱워치 코어 비즈니스 제어 노드 바인딩]
    const stopwatchTime = document.getElementById('stopwatch-time');
    const btnStopwatchStart = document.getElementById('btn-stopwatch-start');
    const btnStopwatchLap = document.getElementById('btn-stopwatch-lap');
    const lapList = document.getElementById('lap-list');

    // ⏱️ 💡 [추가: 스톱워치 실동작 알고리즘 엔진]
    if (btnStopwatchStart && btnStopwatchLap) {
        btnStopwatchStart.addEventListener('click', () => {
            isStopwatchRunning = !isStopwatchRunning;

            if (isStopwatchRunning) {
                // 스톱워치 [시작] 구동 상태
                btnStopwatchStart.textContent = "중단";
                btnStopwatchStart.classList.add('running');
                btnStopwatchLap.textContent = "랩타임";
                btnStopwatchLap.disabled = false;

                const startTime = Date.now() - stopwatchElapsedTime;
                stopwatchInterval = setInterval(() => {
                    stopwatchElapsedTime = Date.now() - startTime;
                    stopwatchTime.textContent = formatStopwatchTime(stopwatchElapsedTime);
                }, 10); // 10ms 단위 초정밀 인터벌 갱신 루프
            } else {
                // 스톱워치 [중단] 일시정지 상태
                clearInterval(stopwatchInterval);
                btnStopwatchStart.textContent = "시작";
                btnStopwatchStart.classList.remove('running');
                btnStopwatchLap.textContent = "초기화";
            }
        });

        btnStopwatchLap.addEventListener('click', () => {
            if (isStopwatchRunning) {
                // 실행 중일 때 누르면 랩타임 행을 리스트에 생성 및 누적
                lapCount++;
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="lap-index">랩 ${lapCount}</span>
                    <span class="lap-timestamp">${formatStopwatchTime(stopwatchElapsedTime)}</span>
                `;
                if(lapList) lapList.insertBefore(li, lapList.firstChild); // 최신 기록 상단 적재
            } else {
                // 정지 상태일 때 누르면 모든 데이터 클리어 리셋
                clearInterval(stopwatchInterval);
                stopwatchElapsedTime = 0;
                lapCount = 0;
                if(stopwatchTime) stopwatchTime.textContent = "00:00.00";
                if(lapList) lapList.innerHTML = "";
                btnStopwatchLap.textContent = "랩타임";
                btnStopwatchLap.disabled = true;
            }
        });
    }

    // 시간 문자열 포맷 가공 보조 함수 (분:초.밀리초)
    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        const miliseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
        return `${minutes}:${seconds}.${miliseconds}`;
    }

    // 🔮 타로 운세
    if(btnFortune) {
        btnFortune.addEventListener('click', () => {
            const now = new Date();
            if(fortuneDate) fortuneDate.textContent = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일`;
            
            const randomTarot = tarotCards[Math.floor(Math.random() * tarotCards.length)];
            if(tarotCardImage) tarotCardImage.textContent = randomTarot.icon;
            if(tarotCardName) tarotCardName.textContent = randomTarot.name;
            if(tarotCardDesc) tarotCardDesc.textContent = randomTarot.desc;

            if(fortuneModal) fortuneModal.classList.add('active');
        });
    }
    if(btnCloseFortune) btnCloseFortune.addEventListener('click', () => { if(fortuneModal) fortuneModal.classList.remove('active'); });

    // ✍️ 아침 기분 일기
    if(btnMoodDiary) {
        btnMoodDiary.addEventListener('click', () => {
            const now = new Date();
            if(diaryDate) diaryDate.textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 아침 기분 기록`;
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
            
            alert(`💾 [아침 감정 일기 저장 완료]\n\n선택한 감정: ${selectedMood}\n내용: "${diaryInput.value}"\n\n기록이 성공적으로 저장되었습니다!`);
            if(diaryModal) diaryModal.classList.remove('active');
        });
    }
    if(btnCloseDiary) btnCloseDiary.addEventListener('click', () => { if(diaryModal) diaryModal.classList.remove('active'); });

    // 🌙 수면 측정
    if(btnToggleSleep) {
        btnToggleSleep.addEventListener('click', () => {
            isRecordingSleep = !isRecordingSleep;
            if(isRecordingSleep) {
                btnToggleSleep.textContent = "측정 중단하기 (기록 저장)";
                btnToggleSleep.style.background = "#e53e3e"; btnToggleSleep.style.color = "#ffffff";
                alert("🎙️ 수면 소음 기록 시스템 구동을 시작합니다.");
            } else {
                btnToggleSleep.textContent = "수면 측정하기";
                btnToggleSleep.style.background = "#ffffff"; btnToggleSleep.style.color = "#000000";
                alert("💾 수면 측정이 종료되었으며 데이터가 요약 리포트에 저장되었습니다.");
            }
        });
    }
    if(btnViewReport) {
        btnViewReport.addEventListener('click', () => {
            alert("📊 [수면 리포트 요약]\n\n총 수면 시간: 6시간 42분\n깊은 수면: 23% (정상)\n잠버릇 분석: 특이 소음 없음.");
        });
    }

    // 시계 루틴
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
            triggerAlarm();
        }
    }
    setInterval(updateClock, 1000); updateClock();

    if(btnToggleAlarm) {
        btnToggleAlarm.addEventListener('click', () => {
            if (!alarmTime) {
                alarmTime = alarmTimeInput.value;
                btnToggleAlarm.textContent = "알람 끄기"; btnToggleAlarm.className = "btn btn-danger";
                alarmStatusText.textContent = `🔔 [오전/오후 ${alarmTime}]에 미션 알람이 작동합니다.`;
            } else {
                alarmTime = null;
                btnToggleAlarm.textContent = "알람 켜기"; btnToggleAlarm.className = "btn btn-primary";
                alarmStatusText.textContent = "설정된 알람이 없습니다.";
            }
        });
    }

    if(btnTestAlarm) btnTestAlarm.addEventListener('click', () => { triggerAlarm(); });

    // 알람 엔진
    function startAlarmSound() {
        try {
            if (!activeAudioContext) activeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (alarmOscillator) return; 

            alarmOscillator = activeAudioContext.createOscillator();
            const gainNode = activeAudioContext.createGain();
            alarmOscillator.type = 'sawtooth';
            alarmOscillator.frequency.setValueAtTime(880, activeAudioContext.currentTime);
            alarmOscillator.frequency.linearRampToValueAtTime(440, activeAudioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.2, activeAudioContext.currentTime);
            
            alarmOscillator.connect(gainNode); gainNode.connect(activeAudioContext.destination);
            alarmOscillator.start();
            
            let high = true;
            alarmOscillator.soundInterval = setInterval(() => {
                if(alarmOscillator) {
                    alarmOscillator.frequency.setValueAtTime(high ? 1000 : 500, activeAudioContext.currentTime);
                    high = !high;
                }
            }, 150);
        } catch (e) { console.log(e); }
    }

    function stopAlarmSound() {
        if (alarmOscillator) {
            clearInterval(alarmOscillator.soundInterval);
            try { alarmOscillator.stop(); } catch(e){}
            alarmOscillator.disconnect(); alarmOscillator = null;
        }
    }

    function triggerAlarm() {
        if(screenMission) screenMission.classList.add('active');
        startAlarmSound();

        const randomIndex = Math.floor(Math.random() * missionPool.length);
        currentMission = missionPool[randomIndex];

        if(missionTitle) missionTitle.textContent = currentMission.title;
        if(missionDesc) missionDesc.textContent = currentMission.desc;
        if(missionBadge) {
            missionBadge.textContent = currentMission.stepName; missionBadge.className = "badge";
            if (currentMission.step === 1) missionBadge.classList.add("badge-step1");
            else if (currentMission.step === 2) missionBadge.classList.add("badge-step2");
            else missionBadge.classList.add("badge-step3");
        }
        if(dynamicMissionBox) { dynamicMissionBox.innerHTML = ""; buildInteractiveMission(currentMission); }
    }

    function buildInteractiveMission(mission) {
        const box = document.createElement('div');
        box.className = "interactive-box";

        switch (mission.type) {
            case "camera":
                box.innerHTML = `
                    <div class="camera-view"><span class="camera-placeholder-icon">📷</span><span class="camera-overlay-text">[ 촬영 대상: ${mission.target} ]</span></div>
                    <button id="btn-action-trigger" class="btn btn-primary btn-lg">찰칵! 촬영 인증 완료</button>
                `;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const view = document.querySelector('.camera-view');
                    if(view) view.style.background = "#059669";
                    setTimeout(completeMission, 600);
                });
                break;

            case "typing":
                box.innerHTML = `
                    <p class="target-sentence">똑같이 치세요: <br>"${mission.target}"</p>
                    <input type="text" id="typing-input-field" class="typing-input" autocomplete="off">
                    <button id="btn-action-trigger" class="btn btn-primary btn-lg">입력 확인</button>
                `;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-action-trigger').addEventListener('click', () => {
                    const field = document.getElementById('typing-input-field');
                    if (field.value.trim() === mission.target) completeMission();
                    else { alert("오타 발생! 다시 치세요."); field.value = ""; field.focus(); }
                });
                break;

            case "hold":
                box.innerHTML = `
                    <div class="camera-view" style="height:90px;"><span class="camera-overlay-text">🧘 모션 센서 연동 중</span></div>
                    <button id="btn-action-hold" class="btn btn-warning btn-lg">${mission.label}</button>
                `;
                dynamicMissionBox.appendChild(box);
                const holdBtn = document.getElementById('btn-action-hold');
                let holdTimer = null, currentHoldCount = 0;
                const startHold = () => {
                    holdTimer = setInterval(() => {
                        currentHoldCount++; holdBtn.textContent = `유지 중... (${currentHoldCount}/${mission.duration}초)`;
                        if (currentHoldCount >= mission.duration) { clearInterval(holdTimer); completeMission(); }
                    }, 1000);
                };
                const endHold = () => { clearInterval(holdTimer); currentHoldCount = 0; holdBtn.textContent = mission.label; };
                holdBtn.addEventListener('mousedown', startHold); holdBtn.addEventListener('mouseup', endHold);
                holdBtn.addEventListener('touchstart', startHold); holdBtn.addEventListener('touchend', endHold);
                break;

            case "timer":
                box.innerHTML = `
                    <p>⚠️ 팔을 위로 올리고 정지하세요!</p>
                    <div class="progress-container"><div id="stretch-progress-bar" class="progress-bar"></div></div>
                `;
                dynamicMissionBox.appendChild(box);
                setTimeout(() => { const b = document.getElementById('stretch-progress-bar'); if(b) b.style.width = "100%"; }, 50);
                setTimeout(completeMission, mission.duration * 1000);
                break;

            case "puzzle":
                box.innerHTML = `
                    <p>스펠링이 다른 한 자를 찾으세요!</p>
                    <div class="grid-puzzle">
                        <button class="btn-puzzle">O</button><button class="btn-puzzle">O</button><button class="btn-puzzle">O</button>
                        <button class="btn-puzzle">O</button><button id="correct-puzzle-piece" class="btn-puzzle">Q</button><button class="btn-puzzle">O</button>
                        <button class="btn-puzzle">O</button><button class="btn-puzzle">O</button><button class="btn-puzzle">O</button>
                    </div>
                `;
                dynamicMissionBox.appendChild(box);
                const gp = document.querySelector('.grid-puzzle');
                if(gp) { for (let i = gp.children.length; i >= 0; i--) gp.appendChild(gp.children[Math.random() * i | 0]); }
                document.querySelectorAll('.btn-puzzle').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        if (e.target.id === 'correct-puzzle-piece') completeMission();
                        else alert("틀렸습니다! 집중!");
                    });
                });
                break;

            case "rps":
                box.innerHTML = `
                    <p>AI를 상대로 <strong>${mission.target}연승</strong> 하세요!</p>
                    <div class="rps-hands"><div id="hand-player">❔</div><div>VS</div><div id="hand-ai">🤖</div></div>
                    <div class="rps-buttons"><button class="btn-rps" data-choice="✊">✊</button><button class="btn-rps" data-choice="✌️">✌️</button><button class="btn-rps" data-choice="🖐️">🖐️</button></div>
                `;
                dynamicMissionBox.appendChild(box);
                let wins = 0;
                document.querySelectorAll('.btn-rps').forEach(b => {
                    b.addEventListener('click', (e) => {
                        const p = e.currentTarget.getAttribute('data-choice');
                        const arr = ['✊','✌️','🖐️']; const ai = arr[Math.floor(Math.random() * 3)];
                        document.getElementById('hand-player').textContent = p; document.getElementById('hand-ai').textContent = ai;
                        if(p === ai) return;
                        if((p==='✊'&&ai==='✌️')||(p==='✌️'&&ai==='🖐️')||(p==='🖐️'&&ai==='✊')) {
                            wins++; if(wins >= mission.target) setTimeout(completeMission, 600);
                        } else { wins = 0; alert("연승 실패! 처음부터 다시!"); }
                    });
                });
                break;

            case "click-loop":
                box.innerHTML = `
                    <p>버튼을 난타하여 게이지를 완충하세요!</p>
                    <div class="progress-container"><div id="brush-progress-bar" class="progress-bar"></div></div>
                    <button id="btn-brush-click" class="btn btn-primary btn-lg">🪥 치카치카 연타!!</button>
                `;
                dynamicMissionBox.appendChild(box);
                let clicks = 0;
                document.getElementById('btn-brush-click').addEventListener('click', () => {
                    clicks++; const p = (clicks / mission.target) * 100;
                    document.getElementById('brush-progress-bar').style.width = `${p}%`;
                    if(clicks >= mission.target) completeMission();
                });
                break;

            case "voice":
                box.innerHTML = `
                    <h3 style="color:#f6e05e; margin: 15px 0;">"${mission.target}"</h3>
                    <button id="btn-voice-rec" class="btn btn-danger btn-lg">🎤 크게 외치기</button>
                `;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-voice-rec').addEventListener('click', () => { setTimeout(completeMission, 1200); });
                break;

            case "survival-trap":
                box.innerHTML = `
                    <button id="btn-trap-clear" class="btn btn-warning btn-lg">임시로 알람 끄기</button>
                `;
                dynamicMissionBox.appendChild(box);
                document.getElementById('btn-trap-clear').addEventListener('click', () => {
                    stopAlarmSound(); if(screenMission) screenMission.classList.remove('active');
                    setTimeout(startSurvivalCheckMode, 6000); 
                });
                break;
        }
    }

    function completeMission() {
        stopAlarmSound();
        if(screenMission) screenMission.classList.remove('active');
        if (currentMission && currentMission.type !== "survival-trap") {
            alert("🎉 미션 성공! 알람이 일시 해제됩니다.\n\n잠시 후 '다시 눕기 방지' 최종 불시 검문이 작동하니 완전히 일어나세요!");
            setTimeout(startSurvivalCheckMode, 6000); 
        }
    }

    function startSurvivalCheckMode() {
        if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
        if(screenSurvival) screenSurvival.classList.add('active');
        
        let timerValue = 30;
        if(survivalCountdown) survivalCountdown.textContent = timerValue;

        survivalInterval = setInterval(() => {
            timerValue--;
            if(survivalCountdown) survivalCountdown.textContent = timerValue;

            if (timerValue <= 0) {
                clearInterval(survivalInterval); survivalInterval = null; 
                if(screenSurvival) screenSurvival.classList.remove('active');
                triggerAlarm();
                setTimeout(() => { alert("⏰ [타임오버] 생존 신고 실패! 벌칙 미션이 다시 강제 구동됩니다!"); }, 100);
            }
        }, 1000);
    }

    if(btnSurvivalConfirm) {
        btnSurvivalConfirm.addEventListener('click', () => {
            if (survivalInterval) { clearInterval(survivalInterval); survivalInterval = null; }
            if(screenSurvival) screenSurvival.classList.remove('active');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabScreens.forEach(screen => screen.classList.remove('active'));
            
            const morningTabButton = document.querySelector('[data-target="screen-weather-tab"]');
            const morningScreen = document.getElementById('screen-weather-tab');
            
            if(morningTabButton) morningTabButton.classList.add('active');
            if(morningScreen) morningScreen.classList.add('active');
            
            alert("☀️ 완벽한 생존 확인 완료!\n\n오늘의 출근/등교길 전국 평균 날씨 정보를 확인하세요!");
        });
    }
}

// 💡 스크립트 로드와 동시에 인스턴트 즉시 가동 (무한 로딩 디버깅 완료)
initApp();