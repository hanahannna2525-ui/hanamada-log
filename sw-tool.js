// sw-tool.js (動きの制御)

document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.rule-check');
    const raceSelect = document.getElementById('race-select');
    const randomRaceBtn = document.getElementById('random-race-btn'); 
    const raceInfoContainer = document.getElementById('race-info-container');
    const tabBtns = document.querySelectorAll('.race-tab-btn');
    const tabContents = document.querySelectorAll('.race-tab-content');
    const diceSection = document.getElementById('dice-section');
    const rollBtn = document.getElementById('roll-btn');
    const diceResults = document.getElementById('dice-results');
    const selectedDiceSection = document.getElementById('selected-dice-section');
    const selectedDiceDisplay = document.getElementById('selected-dice-display');
    const adviceDisplay = document.getElementById('advice-display');

    let keptDiceData = null;

    // 1. プルダウンの選択肢を更新する
    function updateRaceOptions() {
        const activeRules = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        raceSelect.innerHTML = '<option value="">-- 種族を選択 --</option>';

        for (const [key, data] of Object.entries(RACES)) {
            if (activeRules.includes(data.source)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = data.name;
                raceSelect.appendChild(option);
            }
        }
        resetDisplay();
    }

    // 表示リセット用
    function resetDisplay() {
        raceInfoContainer.style.display = 'none';
        diceSection.style.display = 'none';
        selectedDiceSection.style.display = 'none';
        diceResults.innerHTML = '';
        selectedDiceDisplay.innerHTML = '';
        if (adviceDisplay) adviceDisplay.innerHTML = '';
        keptDiceData = null;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        if (tabBtns[0]) tabBtns[0].classList.add('active');
        if (tabContents[0]) tabContents[0].classList.add('active');
    }

    // イベント登録
    checkboxes.forEach(cb => cb.addEventListener('change', updateRaceOptions));

    // ▼ 種族ガチャ ▼
    randomRaceBtn.addEventListener('click', function() {
        const options = Array.from(raceSelect.options).filter(opt => opt.value !== "");
        if (options.length === 0) return;
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        raceSelect.value = randomOpt.value;
        raceSelect.dispatchEvent(new Event('change')); 
    });

    // ▼ 種族が選ばれたらデータを流し込む ▼
    raceSelect.addEventListener('change', function() {
        const selectedId = raceSelect.value;
        if (selectedId && RACES[selectedId]) {
            const data = RACES[selectedId];
            document.getElementById('tab-feature').innerHTML = `<strong>${data.name}の種族特徴</strong><br>${data.feature}`;
            document.getElementById('tab-desc').innerHTML = data.description;
            document.getElementById('tab-appearance').innerHTML = data.appearance;
            document.getElementById('tab-age').innerHTML = data.age;

            raceInfoContainer.style.display = 'block';
            diceSection.style.display = 'block';
            selectedDiceSection.style.display = 'none';
            diceResults.innerHTML = '';
            keptDiceData = null;

            if (tabBtns[0]) tabBtns[0].click();
        } else {
            resetDisplay();
        }
    });

    // ▼ タブ切り替えの処理 ▼
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ▼ ダイス計算ロジック ▼
    function rollDice(diceStr) {
        const match = diceStr.match(/^(\d+)d6(?:([+-])(\d+))?$/);
        if (!match) return { rolls:[], sum: 0, modStr: "", expected: 0 };

        const count = parseInt(match[1], 10);
        const sign = match[2];
        const mod = match[3] ? parseInt(match[3], 10) : 0;

        let rolls =[];
        let diceSum = 0;
        for (let i = 0; i < count; i++) {
            let d = Math.floor(Math.random() * 6) + 1;
            rolls.push(d);
            diceSum += d;
        }

        let totalSum = diceSum;
        let expected = count * 3.5;
        let modStr = "";
        
        if (sign === "+") {
            totalSum += mod; expected += mod; modStr = ` + ${mod}`;
        } else if (sign === "-") {
            totalSum -= mod; expected -= mod; modStr = ` - ${mod}`;
        }

        return { rolls: rolls, sum: totalSum, modStr: modStr, expected: expected };
    }

    function getEvalMark(val, expected) {
        const diff = val - expected;
        if (diff >= 2) return `<span style="color: #e91e63; font-weight: bold;">★</span>`; 
        if (diff > 0) return `<span style="color: #ff9800; font-weight: bold;">↑</span>`;   
        if (diff >= -1.5) return `<span style="color: #4caf50;">-</span>`;                 
        return `<span style="color: #2196f3;">↓</span>`;                                   
    }

    function getRank(totalVal, totalExpected) {
        const diff = totalVal - totalExpected;
        if (diff >= 6) return `<span style="color: #e91e63;">👑 Sランク（神のダイス！）</span>`;
        if (diff >= 3) return `<span style="color: #ff9800;">✨ Aランク（かなり優秀！）</span>`;
        if (diff >= 0) return `<span style="color: #4caf50;">🟢 Bランク（平均以上で安定）</span>`;
        if (diff >= -3) return `<span style="color: #9c27b0;">🟡 Cランク（ちょい下振れ）</span>`;
        return `<span style="color: #2196f3;">🔵 Dランク（愛と気合でカバー！）</span>`;
    }

    // ▼ 能力値からおすすめのロールを判定する関数
    function getAdvice(dice) {
        const tags = [];
        if (dice['C'] >= 12) tags.push("💪 筋力が高い！前衛アタッカーの素質があります。");
        if (dice['D'] >= 12) tags.push("🛡️ 生命力が高く、打たれ強いです。前衛や壁役に適しています。");
        if (dice['A'] >= 12) tags.push("🎯 器用度が高く、弓や投擲、スカウト技能と相性が良いです。");
        if (dice['B'] >= 12) tags.push("💨 敏捷度が高い！先制攻撃や回避盾として輝けます。");
        if (dice['E'] >= 12) tags.push("🧠 知力が高く、魔法使い（ソーサラーなど）として大成するでしょう。");
        if (dice['F'] >= 12) tags.push("✨ 精神力が高く、プリーストや妖精使いに向いています。");

        if (tags.length === 0) {
            return "バランスの良い数値です！どんな役割にもなれる万能型ですね。";
        }

        return `<strong>能力からのオススメ適性：</strong><br><ul><li>${tags.join("</li><li>")}</li></ul>`;
    }

    // ▼ ダイスを振る処理 ▼
    rollBtn.addEventListener('click', function() {
        const selectedRace = RACES[raceSelect.value];
        if (!selectedRace) return;

        const diceData = selectedRace.dice;
        const abilities =['A', 'B', 'C', 'D', 'E', 'F'];

        let resultsHtml = `<p><strong>${selectedRace.name}</strong> の能力値ダイス結果です。</p>`;
        resultsHtml += `<div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
        
        let generatedPatterns =[];

        for (let i = 1; i <= 3; i++) {
            let patternResult = {};
            let totalVal = 0;
            let totalExpected = 0;
            
            let listHtml = `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 10px;">`;
            
            abilities.forEach(key => {
                const diceStr = diceData[key];
                const result = rollDice(diceStr);
                
                patternResult[key] = result.sum;
                totalVal += result.sum;
                totalExpected += result.expected;
                
                const mark = getEvalMark(result.sum, result.expected);
                const displayStr = `[${result.rolls.join(' + ')}]${result.modStr}`;
                listHtml += `<li><strong>${key}</strong> (${diceStr}) : ${displayStr} = <strong>${result.sum}</strong> ${mark}</li>`;
            });
            listHtml += `</ul>`;

            generatedPatterns.push(patternResult); 
            const rankHtml = getRank(totalVal, totalExpected);

            resultsHtml += `
            <div class="dice-pattern-card" style="border: 2px solid #ddd; padding: 10px; border-radius: 8px; flex: 1; min-width: 220px; background: #fff;">
                <h4 style="margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">◆ パターン${i}</h4>
                <div style="font-size: 0.85em; font-weight: bold; margin-bottom: 10px;">総合評価：${rankHtml}</div>
                ${listHtml}
                <button class="social-btn select-pattern-btn" data-index="${i-1}" style="width: 100%; padding: 8px;">✅ これを選ぶ！</button>
            </div>`;
        }
        resultsHtml += `</div>`;
        diceResults.innerHTML = resultsHtml;

        // ▼ 「これを選ぶ！」ボタンが押された時の処理 ▼
        const selectBtns = document.querySelectorAll('.select-pattern-btn');
        selectBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const pIndex = this.getAttribute('data-index');
                keptDiceData = generatedPatterns[pIndex];
                
                let html = "";
                abilities.forEach(key => {
                    html += `<span style="margin-right: 15px;">${key}: <span style="color:#d32f2f;">${keptDiceData[key]}</span></span>`;
                });
                
                selectedDiceDisplay.innerHTML = html;
                selectedDiceSection.style.display = 'block';

                const advice = getAdvice(keptDiceData);
                if (adviceDisplay) adviceDisplay.innerHTML = advice;
                
                // 見た目を変える
                selectBtns.forEach(b => { b.innerHTML = "✅ これを選ぶ！"; b.style.opacity = "0.5"; });
                this.innerHTML = "⭐ 選択中！";
                this.style.opacity = "1";
            });
        });
    });


    // ==========================================
    // ▼ フレーバー（経歴・理由）ロジック
    // ==========================================

    const historySelects = document.querySelectorAll('.history-select');
    const historyInputs = document.querySelectorAll('.history-input');
    const randomHistoryBtns = document.querySelectorAll('.random-history-btn');
    
    const reasonSelect = document.getElementById('reason-select');
    const reasonInput = document.getElementById('reason-input');
    const randomReasonBtn = document.getElementById('random-reason-btn');
    const allRandomFlavorBtn = document.getElementById('all-random-flavor-btn');

    function initFlavorOptions() {
        if (typeof FLAVOR_DATA === 'undefined') return;

        // 経歴
        historySelects.forEach(select => {
            FLAVOR_DATA.histories.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                select.appendChild(opt);
            });
            select.addEventListener('change', function() {
                if (this.value !== "") {
                    this.closest('.flavor-item').querySelector('.history-input').value = this.value;
                }
            });
        });

        // 理由
        FLAVOR_DATA.reasons.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            reasonSelect.appendChild(opt);
        });
        reasonSelect.addEventListener('change', function() {
            if (this.value !== "") {
                reasonInput.value = this.value;
            }
        });
    }

    randomHistoryBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const select = historySelects[index];
            const options = Array.from(select.options).filter(opt => opt.value !== "");
            const randomOpt = options[Math.floor(Math.random() * options.length)];
            select.value = randomOpt.value;
            select.dispatchEvent(new Event('change'));
        });
    });

    randomReasonBtn.addEventListener('click', function() {
        const options = Array.from(reasonSelect.options).filter(opt => opt.value !== "");
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        reasonSelect.value = randomOpt.value;
        reasonSelect.dispatchEvent(new Event('change'));
    });

    allRandomFlavorBtn.addEventListener('click', function() {
        randomHistoryBtns.forEach(btn => btn.click());
        randomReasonBtn.click();
    });

    // 初期化実行
    updateRaceOptions();
    initFlavorOptions();
});