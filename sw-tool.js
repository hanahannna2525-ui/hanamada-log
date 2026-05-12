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
    let keptDiceId = null; // ★追加：現在決定しているダイスのID
    let stockDiceList = []; 
    const stockDiceSection = document.getElementById('stock-dice-section'); 
    const stockDiceContainer = document.getElementById('stock-dice-container'); 

    // ▼▼追加：決定状態をリセットして下部を閉じる関数▼▼
    function clearDecision() {
        keptDiceData = null;
        keptDiceId = null;
        selectedDiceSection.style.display = 'none';
        const jobSection = document.getElementById('job-diagnosis-section');
        if (jobSection) jobSection.style.display = 'none';
        const finalStatus = document.getElementById('final-status-display');
        if (finalStatus) finalStatus.innerHTML = '';
        const jobAdvice = document.getElementById('job-advice-display');
        if (jobAdvice) jobAdvice.style.display = 'none';
    }

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
        const jobSection = document.getElementById('job-diagnosis-section');
        if(jobSection) jobSection.style.display = 'none';
        const jobAdvice = document.getElementById('job-advice-display');
        if(jobAdvice) { jobAdvice.style.display = 'none'; jobAdvice.innerHTML = ''; }
        const finalStatus = document.getElementById('final-status-display');
        if(finalStatus) finalStatus.innerHTML = '';
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

    function getAdvice(dice, raceName) {
        const total = Object.values(dice).reduce((a, b) => a + b, 0);
        const avg = total / 6;

        let advice = `<strong>【${raceName}：能力傾向分析】</strong><br>`;

        let high = [];
        if (dice['A'] >= 13 || dice['B'] >= 13) high.push("敏捷・技巧的（先制や回避、スカウト向き）");
        if (dice['C'] >= 13 || dice['D'] >= 13) high.push("肉体派（前衛戦闘、タフネス向き）");
        if (dice['E'] >= 13 || dice['F'] >= 13) high.push("精神・知的（魔法、信仰、錬金術向き）");

        if (high.length > 0) {
            advice += `特筆すべき適性：${high.join("、")}が伸びやすい傾向です。<br>`;
        } else {
            advice += `非常にバランスの良い数値です。どの道へ進んでも無難にこなせます。<br>`;
        }

        let low = [];
        if (dice['E'] <= 9) low.push("知力：魔法行使や知識判定で苦労するかもしれません");
        if (dice['F'] <= 9) low.push("精神：MP管理や精神抵抗に注意が必要です");
        if (dice['D'] <= 9) low.push("生命：HPが伸び悩むので、後衛か回避重視が安全です");

        if (low.length > 0) {
            advice += `<br><strong>⚠️ 注意点:</strong><br><ul><li>${low.join("</li><li>")}</li></ul>`;
        }

        advice += `<br><small>※この能力値なら、ルールブックの「生まれ表」で<br><strong>「この長所を伸ばす」</strong>か<strong>「この短所を補う」</strong>生まれを選ぶのがオススメです！</small>`;
        return advice;
    }

    // ▼ 能力値の表示用ラベル（これを追加！） ▼
    const ABILITY_LABELS = {
        'A': 'A (器用度)',
        'B': 'B (敏捷度)',
        'C': 'C (筋力)',
        'D': 'D (生命力)',
        'E': 'E (知力)',
        'F': 'F (精神力)'
    };

    // ▼▼追加：ストックを描画する関数▼▼
    function renderStock() {
        if (!stockDiceSection || !stockDiceContainer) return;
        if (stockDiceList.length === 0) {
            stockDiceSection.style.display = 'none';
            return;
        }
        stockDiceSection.style.display = 'block';
        
        let html = '';
        stockDiceList.forEach((stock, index) => {
            const isSelected = (stock.id === keptDiceId);
            const btnText = isSelected ? "⭐ 選択中" : "✅ 決定";
            const btnOpacity = isSelected ? "1" : "0.6";

            html += `
            <div class="dice-pattern-card" style="border: 2px solid #4caf50; padding: 10px; border-radius: 8px; flex: 1; min-width: 220px; background: #fff;">
                <h4 style="margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${stock.raceName}</h4>
                <div style="font-size: 0.85em; margin-bottom: 10px;">${stock.rankHtml}</div>
                <div style="font-size: 0.95em; margin-bottom: 10px; background: #f9f9f9; padding: 5px; border-radius: 4px; line-height: 1.6;">
                    A:${stock.dice['A']}${stock.marks['A']} / B:${stock.dice['B']}${stock.marks['B']} / C:${stock.dice['C']}${stock.marks['C']} <br>
                    D:${stock.dice['D']}${stock.marks['D']} / E:${stock.dice['E']}${stock.marks['E']} / F:${stock.dice['F']}${stock.marks['F']}
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="social-btn decide-stock-btn" data-index="${index}" style="flex:1; padding: 5px; font-size:0.9em; background: #2196f3; opacity: ${btnOpacity};">${btnText}</button>
                    <button class="social-btn delete-stock-btn" data-index="${index}" style="padding: 5px; background: #e91e63; font-size:0.9em;">🗑️</button>
                </div>
            </div>`;
        });
        stockDiceContainer.innerHTML = html;

        // 「✅ 決定」ボタンが押された時
        document.querySelectorAll('.decide-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                decideDice(stockDiceList[idx]);
                renderStock(); // ★見た目を更新するために再描画
            });
        });

        // 「🗑️ 削除」ボタンが押された時
        document.querySelectorAll('.delete-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                const deletedId = stockDiceList[idx].id;
                
                stockDiceList.splice(idx, 1);

                if (keptDiceId === deletedId) {
                    clearDecision();
                }

                renderStock();

                // 画面に元のボタンが残っていれば「ストックする」に戻す
                const originBtn = document.querySelector(`.stock-pattern-btn[data-id="${deletedId}"]`);
                if (originBtn) {
                    originBtn.innerHTML = "📌 ストックする";
                    originBtn.style.opacity = "1";
                    originBtn.style.background = "#4caf50";
                }
            });
        });
    }

    // ▼▼追加：ストックから最終決定する関数▼▼
    function decideDice(stockItem) {
        keptDiceData = stockItem.dice;
        keptDiceId = stockItem.id; // ★これを追加！
        
        let html = `<div style="width:100%; margin-bottom: 5px;"><strong>【${stockItem.raceName}】</strong></div>`;
        const abilities =['A', 'B', 'C', 'D', 'E', 'F'];
        abilities.forEach(key => {
            html += `<span style="margin-right: 15px;">${ABILITY_LABELS[key] || key}: <span style="color:#d32f2f;">${keptDiceData[key]}</span> ${stockItem.marks[key]}</span>`;
        });
        
        selectedDiceDisplay.innerHTML = html;
        selectedDiceSection.style.display = 'block';
        document.getElementById('job-diagnosis-section').style.display = 'block';
        document.getElementById('final-status-display').innerHTML = '';
        document.getElementById('job-advice-display').style.display = 'none';

        const advice = getAdvice(keptDiceData, stockItem.raceName);
        if (adviceDisplay) adviceDisplay.innerHTML = advice;
    }
    // ▲▲追加ここまで▲▲

    // ▼ ダイスを振る処理 ▼
    rollBtn.addEventListener('click', function() {
        const selectedRace = RACES[raceSelect.value];
        if (!selectedRace) return;

        const diceData = selectedRace.dice;
        const abilities =['A', 'B', 'C', 'D', 'E', 'F'];

        let resultsHtml = `<p><strong>${selectedRace.name}</strong> の能力値ダイス結果です。</p>`;

        resultsHtml += `<div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
        
        let generatedPatterns =[];
        let generatedRanks = []; 
        let generatedIds = []; 
        let generatedMarks = []; // ★追加：マーク保存用の配列

        for (let i = 1; i <= 3; i++) {
            const uniqueId = 'pattern_' + Date.now() + '_' + i; // ★追加：被らない目印を作る
            generatedIds.push(uniqueId);

            let patternResult = {};
            let patternMarks = {}; // ★追加：このパターンのマーク
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
                patternMarks[key] = mark; // ★これを追加！

                const displayStr = `[${result.rolls.join(' + ')}]${result.modStr}`;
                
                // ↓ ${ABILITY_LABELS[key]} にした部分を元の ${key} に戻す
                listHtml += `<li><strong>${key}</strong> (${diceStr}) : ${displayStr} = <strong>${result.sum}</strong> ${mark}</li>`;
            });
            listHtml += `</ul>`;

            generatedPatterns.push(patternResult); 
            generatedMarks.push(patternMarks); // ★これを追加！
            const rankHtml = getRank(totalVal, totalExpected);
            generatedRanks.push(rankHtml); // ★追加

            resultsHtml += `
            <div class="dice-pattern-card" style="border: 2px solid #ddd; padding: 10px; border-radius: 8px; flex: 1; min-width: 220px; background: #fff;">
                <h4 style="margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">◆ パターン${i}</h4>
                <div style="font-size: 0.85em; font-weight: bold; margin-bottom: 10px;">総合評価：${rankHtml}</div>
                ${listHtml}
                <button class="social-btn stock-pattern-btn" data-index="${i-1}" data-id="${uniqueId}" style="width: 100%; padding: 8px; background: #4caf50;">📌 ストックする</button>
            </div>`;
        }
        resultsHtml += `</div>`;
        diceResults.innerHTML = resultsHtml;

        // ▼ 「ストックする」ボタンが押された時の処理 ▼
        const stockBtns = document.querySelectorAll('.stock-pattern-btn');
        stockBtns.forEach(btn => {
            const btnId = btn.getAttribute('data-id');
            const alreadyStocked = stockDiceList.some(item => item.id === btnId);
            if (alreadyStocked) {
                btn.innerHTML = "❌ ストック解除";
                btn.style.opacity = "0.8";
                btn.style.background = "#9e9e9e";
            }

            btn.addEventListener('click', function() {
                const pIndex = this.getAttribute('data-index');
                const pId = this.getAttribute('data-id'); // ★IDを取得
                
                // ★ すでにストックリストにあるか探す
                const existingIndex = stockDiceList.findIndex(item => item.id === pId);
                
                if (existingIndex >= 0) {
                    // 【リストにある場合】＝ ストック解除処理
                    const removedItem = stockDiceList.splice(existingIndex, 1)[0];
                    this.innerHTML = "📌 ストックする";
                    this.style.opacity = "1";
                    this.style.background = "#4caf50";

                    // ★解除したものが「現在決定中」のものだったら下部を閉じる
                    if (keptDiceId === pId) {
                        clearDecision();
                    }
                } else {
                    const newItem = {
                        id: pId,
                        raceId: raceSelect.value,
                        raceName: selectedRace.name,
                        dice: generatedPatterns[pIndex],
                        marks: generatedMarks[pIndex],
                        rankHtml: generatedRanks[pIndex]
                    };
                    stockDiceList.push(newItem);
                    this.innerHTML = "❌ ストック解除";
                    this.style.opacity = "0.8";
                    this.style.background = "#9e9e9e";

                    // ★★★ここがポイント：ストック追加と同時に「決定」もする！★★★
                    decideDice(newItem);
                }
                
                renderStock(); // ストック画面を更新
            });
        });
    });
// ==========================================
    // ▼ 職業体験・適性診断ロジック
    // ==========================================
    const calcJobBtn = document.getElementById('calc-job-btn');
    const baseTecInput = document.getElementById('base-tec');
    const basePhyInput = document.getElementById('base-phy');
    const baseSpiInput = document.getElementById('base-spi');
    const finalStatusDisplay = document.getElementById('final-status-display');
    const jobAdviceDisplay = document.getElementById('job-advice-display');

    if (calcJobBtn) {
    calcJobBtn.addEventListener('click', function() {
        if (!keptDiceData) { alert('先に能力値ダイスを決定してください！'); return; }

        const tec = parseInt(baseTecInput.value, 10) || 0;
        const phy = parseInt(basePhyInput.value, 10) || 0;
        const spi = parseInt(baseSpiInput.value, 10) || 0;

        const stats = {
            '器用度': tec + keptDiceData['A'], '敏捷度': tec + keptDiceData['B'],
            '筋力': phy + keptDiceData['C'], '生命力': phy + keptDiceData['D'],
            '知力': spi + keptDiceData['E'], '精神力': spi + keptDiceData['F']
        };

        // 【診断生成】
        let analysis = [];
        let concerns = [];

        // 1. 能力値の強み・弱み判定
        for (const [name, val] of Object.entries(stats)) {
            if (val >= 18) analysis.push(`<strong>${name}</strong>が非常に高いです。この能力を活かせる技能で輝けるでしょう。`);
            else if (val <= 10) concerns.push(`<strong>${name}</strong>が少し低めです。装備や魔法でカバーを検討してください。`);
        }

        // 2. 成長アドバイス（6の倍数あと1を複数対応）
        let nextBreak = [];
        for (const [key, val] of Object.entries(stats)) {
            if (val % 6 === 5) nextBreak.push(key);
        }

        // 3. ワンポイント・アドバイス
        const tips = [
            "「判定」に迷ったら、まずは得意な能力にボーナスが付く技能を優先して上げると成長が実感しやすいですよ。",
            "HPやMPが低い時は、無理せず「魔法のアイテム」を一つ持っておくだけで安心感が段違いです。",
            "能力値が低い場所は「弱点」ではなく「味方に助けてもらうためのチャームポイント」と考えましょう！",
            "戦闘ではダイス目も大切ですが、味方との連携でボーナスをもらうのが一番の近道です。"
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        // 【HTML出力】
        let html = `<h4>📊 能力診断レポート</h4>`;
        
        if (analysis.length > 0) html += `<p><strong>長所:</strong><br>${analysis.join('<br>')}</p>`;
        if (concerns.length > 0) html += `<p><strong>補うべき弱点:</strong><br>${concerns.join('<br>')}</p>`;
        else html += `<p>致命的な弱点は見当たりません！とてもバランスの良いステータスです。</p>`;

        if (nextBreak.length > 0) {
            html += `<div style="background:#e3f2fd; padding:10px; margin:10px 0; border-radius:5px;">
                     <strong>💡 あと少しで成長！(ボーナス+1のチャンス)</strong><br>
                     ${nextBreak.join('、')} が、あと「1」上がれば能力ボーナスが強化されます。<br>
                     成長の優先順位として覚えておくと便利です！
                     </div>`;
        }

        html += `<div style="border-top:1px solid #ccc; padding-top:10px; font-size:0.9em; color:#555;">
                 <strong>💡 ワンポイント:</strong> ${randomTip}
                 </div>`;

        jobAdviceDisplay.innerHTML = html;
        jobAdviceDisplay.style.display = 'block';
    });
    }

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