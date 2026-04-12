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

    // ▼ 新しく追加する要素の取得
    const birthSection = document.getElementById('birth-section');
    const birthSelect = document.getElementById('birth-select');
    const randomBirthBtn = document.getElementById('random-birth-btn');
    const finalStatusDisplay = document.getElementById('final-status-display');

    // ▼ キープしたダイスの値を保存する変数
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
        birthSection.style.display = 'none';
        finalStatusDisplay.style.display = 'none';
        diceResults.innerHTML = '';
        keptDiceData = null;
        birthSelect.innerHTML = '<option value="">-- 生まれを選択 --</option>';
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        if (tabBtns[0]) tabBtns[0].classList.add('active');
        if (tabContents[0]) tabContents[0].classList.add('active');
    }

    // 2. イベント登録
    checkboxes.forEach(cb => cb.addEventListener('change', updateRaceOptions));

    // ▼ 種族ガチャ ▼
    randomRaceBtn.addEventListener('click', function() {
        const options = Array.from(raceSelect.options).filter(opt => opt.value !== "");
        if (options.length === 0) return;
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        raceSelect.value = randomOpt.value;
        raceSelect.dispatchEvent(new Event('change')); 
    });

    // 3. 種族が選ばれたらデータを流し込む
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
            
            // ▼ 種族が選ばれた時点で、ダイスをリセットし生まれ表のプルダウンを作成して表示！
            keptDiceData = null;
            updateBirthOptions();
            birthSection.style.display = 'block';
            finalStatusDisplay.style.display = 'none';

            if (tabBtns[0]) tabBtns[0].click();
        } else {
            resetDisplay();
        }
    });

    // 4. タブ切り替えの処理
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ▼ 期待値（平均）を計算しつつダイスを振る ▼
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

    // ▼ 出目の評価アイコン ▼
    function getEvalMark(val, expected) {
        const diff = val - expected;
        if (diff >= 2) return `<span style="color: #e91e63; font-weight: bold;">★</span>`; 
        if (diff > 0) return `<span style="color: #ff9800; font-weight: bold;">↑</span>`;   
        if (diff >= -1.5) return `<span style="color: #4caf50;">-</span>`;                 
        return `<span style="color: #2196f3;">↓</span>`;                                   
    }

    // ▼ 全体のランク判定 ▼
    function getRank(totalVal, totalExpected) {
        const diff = totalVal - totalExpected;
        if (diff >= 6) return `<span style="color: #e91e63;">👑 Sランク（神のダイス！）</span>`;
        if (diff >= 3) return `<span style="color: #ff9800;">✨ Aランク（かなり優秀！）</span>`;
        if (diff >= 0) return `<span style="color: #4caf50;">🟢 Bランク（平均以上で安定）</span>`;
        if (diff >= -3) return `<span style="color: #9c27b0;">🟡 Cランク（ちょい下振れ）</span>`;
        return `<span style="color: #2196f3;">🔵 Dランク（愛と気合でカバー！）</span>`;
    }

    // 5. ダイスを振る処理
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
                
                // 見た目を変える
                selectBtns.forEach(b => { b.innerHTML = "✅ これを選ぶ！"; b.style.opacity = "0.5"; });
                this.innerHTML = "⭐ 選択中！";
                this.style.opacity = "1";

                // ▼ もしすでに生まれが選択されていたら、能力値を再計算させる ▼
                if (birthSelect.value !== "") {
                    birthSelect.dispatchEvent(new Event('change'));
                }
            });
        });
    });

    // ==========================================
    // ▼ 生まれ表ロジック
    // ==========================================

    function updateBirthOptions() {
        const selectedRaceId = raceSelect.value;
        const activeRules = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        birthSelect.innerHTML = '<option value="">-- 生まれを選択 --</option>';

        if (!selectedRaceId || !BACKGROUNDS[selectedRaceId]) return;

        BACKGROUNDS[selectedRaceId].forEach((bg, index) => {
            if (activeRules.includes(bg.source)) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${bg.name}（技:${bg.base.tec} 体:${bg.base.phy} 心:${bg.base.spi}）`;
                birthSelect.appendChild(option);
            }
        });
    }

    randomBirthBtn.addEventListener('click', function() {
        const options = Array.from(birthSelect.options).filter(opt => opt.value !== "");
        if (options.length === 0) return;
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        birthSelect.value = randomOpt.value;
        birthSelect.dispatchEvent(new Event('change'));
    });

    birthSelect.addEventListener('change', function() {
        if (this.value === "") {
            finalStatusDisplay.style.display = 'none';
            return;
        }

        const selectedRaceId = raceSelect.value;
        const bgData = BACKGROUNDS[selectedRaceId][this.value];
        if (!bgData) return;

        // ▼ 基本情報（技能、経験点、基礎値）はダイスがなくても表示する ▼
        let html = `
            <h4 style="margin-top:0; border-bottom: 2px solid #5fa8d3; padding-bottom: 5px;">
                生まれ：${bgData.name}
            </h4>
            <p style="font-size: 0.9em; color: #333; margin-bottom: 10px;">
                <strong>初期技能:</strong> ${bgData.skills} ／ <strong>初期経験点:</strong> ${bgData.exp}点<br>
                <strong>基礎値:</strong> 技:${bgData.base.tec} 体:${bgData.base.phy} 心:${bgData.base.spi}
            </p>
        `;

        if (!keptDiceData) {
            // ダイスが未決定の場合の案内
            html += `
                <div style="padding: 10px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; color: #856404; font-size: 0.9em;">
                    ⚠️ ダイスを振ってA〜Fの値をキープすると、ここに最終的な能力値が計算されます。
                </div>
            `;
        } else {
            // ダイスが決定済みなら最終計算
            const kiyou   = bgData.base.tec + keptDiceData['A'];
            const binshou = bgData.base.tec + keptDiceData['B'];
            const kinryoku = bgData.base.phy + keptDiceData['C'];
            const seimei   = bgData.base.phy + keptDiceData['D'];
            const chiryoku = bgData.base.spi + keptDiceData['E'];
            const seishin  = bgData.base.spi + keptDiceData['F'];

            // ▼ 追加：ボーナス値の計算（6で割って切り捨て）
            const kiyouB   = Math.floor(kiyou / 6);
            const binshouB = Math.floor(binshou / 6);
            const kinryokuB= Math.floor(kinryoku / 6);
            const seimeiB  = Math.floor(seimei / 6);
            const chiryokuB= Math.floor(chiryoku / 6);
            const seishinB = Math.floor(seishin / 6);

            // ▼ 追加：初期作成（冒険者レベル1）のHP・MP・抵抗力
            const advLv = 1;
            const hp = seimei + (advLv * 3);
            const seimeiRes = advLv + seimeiB;
            const seishinRes = advLv + seishinB;

            // MPの計算（魔法系技能のレベル×3を足す）
            let mp = seishin;
            const mpClasses = ["ソーサラー", "コンジャラー", "プリースト", "フェアリーテイマー", "マギテック", "デーモンルーラー"];
            let magicLv = 0;
            mpClasses.forEach(cls => {
                const regex = new RegExp(`${cls}(\\d+)レベル`);
                const match = bgData.skills.match(regex);
                if (match) magicLv += parseInt(match[1], 10);
            });
            mp += (magicLv * 3);

            // グラスランナーはMPを持たない
            if (selectedRaceId === "grassrunner") {
                mp = "0 (なし)";
            }

            // ▼ 追加：ステータスに基づくワンポイントアドバイス
            let advice = "バランスの取れた能力です。好きな技能を伸ばして自分だけのキャラクターを作りましょう！";
            if (kinryokuB >= 3 && seimeiB >= 3) {
                advice = "タフで筋力が高く、前衛で活躍するアタッカー（ファイターなど）にぴったりなステータスです！";
            } else if (chiryokuB >= 3 && seishinB >= 3) {
                advice = "知力・精神力が高く、魔法でパーティーを支える後衛（ソーサラーやプリーストなど）に向いています！";
            } else if (kiyouB >= 3 && binshouB >= 3) {
                advice = "手先が器用で素早く、斥候役（スカウト）や回避盾（フェンサー）として輝けそうです！";
            } else if (kinryokuB >= 3 && chiryokuB >= 3) {
                advice = "筋力と知力を併せ持ち、魔法戦士（ルーンナイトなど）のロマンを追える器です！";
            }

            html += `
                <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 15px;">
                    <tr style="background-color: #f0f8ff; border-bottom: 2px solid #5fa8d3;">
                        <th style="padding: 5px; width: 16%;">器用度</th>
                        <th style="padding: 5px; width: 16%;">敏捷度</th>
                        <th style="padding: 5px; width: 16%;">筋力</th>
                        <th style="padding: 5px; width: 16%;">生命力</th>
                        <th style="padding: 5px; width: 16%;">知力</th>
                        <th style="padding: 5px; width: 16%;">精神力</th>
                    </tr>
                    <tr style="font-size: 1.2em; font-weight: bold;">
                        <td style="padding: 10px; border-right: 1px dashed #ccc;">${kiyou}</td>
                        <td style="padding: 10px; border-right: 1px dashed #ccc;">${binshou}</td>
                        <td style="padding: 10px; border-right: 1px dashed #ccc;">${kinryoku}</td>
                        <td style="padding: 10px; border-right: 1px dashed #ccc;">${seimei}</td>
                        <td style="padding: 10px; border-right: 1px dashed #ccc;">${chiryoku}</td>
                        <td style="padding: 10px;">${seishin}</td>
                    </tr>
                    <tr style="font-size: 0.9em; font-weight: bold; color: #d32f2f; background-color: #fdf5f6;">
                        <td style="padding: 5px; border-right: 1px dashed #ccc;">ボ: +${kiyouB}</td>
                        <td style="padding: 5px; border-right: 1px dashed #ccc;">ボ: +${binshouB}</td>
                        <td style="padding: 5px; border-right: 1px dashed #ccc;">ボ: +${kinryokuB}</td>
                        <td style="padding: 5px; border-right: 1px dashed #ccc;">ボ: +${seimeiB}</td>
                        <td style="padding: 5px; border-right: 1px dashed #ccc;">ボ: +${chiryokuB}</td>
                        <td style="padding: 5px;">ボ: +${seishinB}</td>
                    </tr>
                    <tr style="font-size: 0.8em; color: #666;">
                        <td style="border-right: 1px dashed #ccc;">(技${bgData.base.tec}+A${keptDiceData['A']})</td>
                        <td style="border-right: 1px dashed #ccc;">(技${bgData.base.tec}+B${keptDiceData['B']})</td>
                        <td style="border-right: 1px dashed #ccc;">(体${bgData.base.phy}+C${keptDiceData['C']})</td>
                        <td style="border-right: 1px dashed #ccc;">(体${bgData.base.phy}+D${keptDiceData['D']})</td>
                        <td style="border-right: 1px dashed #ccc;">(心${bgData.base.spi}+E${keptDiceData['E']})</td>
                        <td>(心${bgData.base.spi}+F${keptDiceData['F']})</td>
                    </tr>
                </table>

                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1; background: #e8f5e9; border: 1px solid #4caf50; padding: 10px; border-radius: 5px; text-align: center;">
                        <span style="font-size: 0.9em; color: #2e7d32;">初期HP</span><br>
                        <strong style="font-size: 1.3em;">${hp}</strong>
                    </div>
                    <div style="flex: 1; background: #e3f2fd; border: 1px solid #2196f3; padding: 10px; border-radius: 5px; text-align: center;">
                        <span style="font-size: 0.9em; color: #1565c0;">初期MP</span><br>
                        <strong style="font-size: 1.3em;">${mp}</strong>
                    </div>
                    <div style="flex: 1; background: #f3e5f5; border: 1px solid #9c27b0; padding: 10px; border-radius: 5px; text-align: center;">
                        <span style="font-size: 0.8em; color: #6a1b9a;">生命抵抗 / 精神抵抗</span><br>
                        <strong style="font-size: 1.2em;">${seimeiRes} / ${seishinRes}</strong>
                    </div>
                </div>

                <div style="padding: 10px; background: #fff; border-left: 4px solid #ff9800; border-radius: 0 5px 5px 0;">
                    <p style="margin: 0; font-size: 0.95em;">💡 <strong>ワンポイント適性：</strong><br>${advice}</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.8em; color: #888;">※あくまで能力値から見た目安です。自由な発想で好きなキャラクターを作りましょう！</p>
                </div>
            `;
        }

        finalStatusDisplay.innerHTML = html;
        finalStatusDisplay.style.display = 'block';
    });

    updateRaceOptions();
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

    // プルダウンにデータを流し込む
    function initFlavorOptions() {
        if (!FLAVOR_DATA) return;

        // 経歴
        historySelects.forEach(select => {
            FLAVOR_DATA.histories.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                select.appendChild(opt);
            });
            // プルダウンが選ばれたらテキストボックスに反映
            select.addEventListener('change', function() {
                if (this.value !== "") {
                    // 同じ親要素内の input を探して代入
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

    // 個別ガチャボタンの処理（経歴）
    randomHistoryBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const select = historySelects[index];
            const options = Array.from(select.options).filter(opt => opt.value !== "");
            const randomOpt = options[Math.floor(Math.random() * options.length)];
            select.value = randomOpt.value;
            select.dispatchEvent(new Event('change')); // 連動してテキストボックスに反映させる
        });
    });

    // 個別ガチャボタンの処理（理由）
    randomReasonBtn.addEventListener('click', function() {
        const options = Array.from(reasonSelect.options).filter(opt => opt.value !== "");
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        reasonSelect.value = randomOpt.value;
        reasonSelect.dispatchEvent(new Event('change'));
    });

    // 全部まとめてガチャボタン
    allRandomFlavorBtn.addEventListener('click', function() {
        randomHistoryBtns.forEach(btn => btn.click());
        randomReasonBtn.click();
    });

    // 初期化実行
    initFlavorOptions();