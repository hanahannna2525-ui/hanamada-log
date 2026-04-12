document.addEventListener('DOMContentLoaded', function() {
    // ヘッダーとフッターを読み込む
    loadComponent('header.html', 'header-placeholder');
    loadComponent('footer.html', 'footer-placeholder');

    // シナリオデータを読み込む
    if (document.getElementById('madamis-grid') || document.getElementById('uzu-grid') || document.getElementById('planned-madamis-grid') || document.getElementById('planned-grid')) {
        loadScenarios();
    }
    // 検索窓などの処理
    setupSearchBar();

    // spoiler-box（タブ）全てにコピー機能ボタンを追加
    setupCopyButtons();
});

function setupCopyButtons() {
    const detailsList = document.querySelectorAll('details.spoiler-box');
    detailsList.forEach((detail, index) => {
        const summary = detail.querySelector('summary');
        const content = detail.querySelector('.spoiler-content');
        if (!summary || !content) return;

        let targetId = content.id;
        if (!targetId) {
            targetId = `spoiler-text-${index + 1}`;
            content.id = targetId;
        }

        // すでにボタンがあれば追加しない
        if (detail.querySelector('.copy-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.dataset.target = targetId;
        const title = summary.textContent.trim().replace(/\s+/g, '_');
        btn.textContent = title ? `${title}をコピー` : 'コピー';

        summary.insertAdjacentElement('afterend', btn);
    });
}

function loadComponent(file, elementId) {
    const container = document.getElementById(elementId);
    if (container) {
        fetch(file)
            .then(response => response.text())
            .then(data => { container.innerHTML = data; })
            .catch(error => console.error(file + ' の読み込み失敗:', error));
    }
}

function setupSearchBar() {
    const wrapper = document.getElementById('search-container-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="search-container">
                <input type="text" id="scenario-search" placeholder="シナリオ名やカテゴリで検索...">
            </div>
        `;
        // 配置が終わったら検索機能を有効にする（ここで1回だけ呼ぶ）
        initializeSearch();
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('scenario-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            const cards = document.querySelectorAll('.scenario-card');

            cards.forEach(card => {
                // h3要素が存在しない場合のエラーを防ぐためにオプショナルチェーン(?.)を追加するとより安全です
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                
                if (title.includes(query) || tags.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

async function loadScenarios() {
    try {
        const response = await fetch('data.json');
        const scenarios = await response.json();
        
        // ▼ 通過シナリオ用の箱
        const madamisGrid = document.getElementById('madamis-grid');
        const uzuGrid = document.getElementById('uzu-grid');
        const cocGrid = document.getElementById('coc-grid');           
        const emokloreGrid = document.getElementById('emoklore-grid'); 
        const swGrid = document.getElementById('sw-grid');         
        
        // ▼ やりたいシナリオ用の箱
        const plannedGrid = document.getElementById('planned-grid'); // 古い箱が残っていた時用
        const plannedMadamisGrid = document.getElementById('planned-madamis-grid');
        const plannedCocGrid = document.getElementById('planned-coc-grid');
        const plannedEmokloreGrid = document.getElementById('planned-emoklore-grid');
        const plannedSwGrid = document.getElementById('planned-sw-grid');    

        // カウント用オブジェクトを作る
        const counts = {
            'マダミス': 0,
            'UZU': 0,
            'CoC': 0,
            'エモクロア': 0,
            'SW': 0
        };

        scenarios.forEach(s => {
            // カウントアップ（ステータスがclearedのものだけ）
            if (s.status === 'cleared' && counts.hasOwnProperty(s.category)) {
                counts[s.category]++;
            }

            // リンクの有無でカードの中身を作る
            let cardContent;
            if (s.url) {
                cardContent = `
                    <h3>
                        <a href="${s.url}" target="_blank" class="card-link">${s.title}</a>
                    </h3>`;
            } else {
                cardContent = `<h3>${s.title}</h3>`;
            }

            const cardHTML = `
                <div class="scenario-card" data-tags="${s.category}">
                    ${cardContent}
                </div>
            `;

            // ▼ 通過済み（cleared）の振り分け
            if (s.status === 'cleared') {
                if (s.category === 'マダミス' && madamisGrid) madamisGrid.innerHTML += cardHTML;
                if (s.category === 'UZU' && uzuGrid) uzuGrid.innerHTML += cardHTML;
                if (s.category === 'CoC' && cocGrid) cocGrid.innerHTML += cardHTML;
                if (s.category === 'エモクロア' && emokloreGrid) emokloreGrid.innerHTML += cardHTML;
                if (s.category === 'SW' && swGrid) swGrid.innerHTML += cardHTML;
            } 
            // ▼ やりたい（planned）の振り分け
            else if (s.status === 'planned') {
                // カテゴリごとに分けて入れる
                if (s.category === 'マダミス' && plannedMadamisGrid) plannedMadamisGrid.innerHTML += cardHTML;
                if (s.category === 'CoC' && plannedCocGrid) plannedCocGrid.innerHTML += cardHTML;
                if (s.category === 'エモクロア' && plannedEmokloreGrid) plannedEmokloreGrid.innerHTML += cardHTML;
                if (s.category === 'SW' && plannedSwGrid) plannedSwGrid.innerHTML += cardHTML;

                // 古い箱（全部ごちゃ混ぜ用）がHTMLにあった場合はそっちにも入れる
                if (plannedGrid) plannedGrid.innerHTML += cardHTML;
            }
        });

        // 最後に、見出しのテキストを書き換える処理を追加
        updateHeaderCount('マダミス', counts['マダミス']);
        updateHeaderCount('UZU', counts['UZU']);
        updateHeaderCount('CoC', counts['CoC']);
        updateHeaderCount('エモクロア', counts['エモクロア']);
        updateHeaderCount('SW', counts['SW']);
    } catch (error) {
        console.error("エラー発生:", error);
    }
}

// ====== メニューボタン ======
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'menu-btn') {
        const nav = document.getElementById('main-nav');
        if (nav) {
            nav.classList.toggle('is-active'); 
        }
    }
});

// 見出しを探して数字を書き換える関数
function updateHeaderCount(categoryName, count) {
    const columns = document.querySelectorAll('.scenario-column h3');
    columns.forEach(h3 => {
        if (h3.innerText.includes(categoryName)) {
            // すでに数字が入っている場合も考慮して上書き
            h3.innerText = `${categoryName} (${count})`;
        }
    });
}

// ====== 画像拡大表示処理 ======
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('expandable')) {
        // すでにオーバーレイがあれば削除
        const existing = document.getElementById('overlay');
        if (existing) existing.remove();

        // オーバーレイ(黒い膜)を作成
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.cursor = 'zoom-out';

        // 拡大画像を表示
        const img = document.createElement('img');
        img.src = e.target.src;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // どこか押したら閉じる
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
    }
});

// ====== PC詳細ページの画像切り替え機能 ======
document.addEventListener('click', function(e) {
    // クリックされたのが class="thumb-img" の画像だったら
    if (e.target.classList.contains('thumb-img')) {
        const mainDisplay = document.getElementById('main-display');
        
        if (mainDisplay) {
            const newSrc = e.target.src;
            if (mainDisplay.src !== newSrc) {
                mainDisplay.style.opacity = '0';
                setTimeout(() => {
                    mainDisplay.src = newSrc;
                    mainDisplay.style.opacity = '1';
                }, 150);
            }

            // すべてのサムネイルから 'active' クラスを外し、クリックしたものにだけ付ける
            const thumbs = document.querySelectorAll('.thumb-img');
            thumbs.forEach(thumb => thumb.classList.remove('active'));
            e.target.classList.add('active');
        }
    }
});

// ====== コピー機能 ======
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
        const targetId = e.target.getAttribute('data-target');
        const content = document.getElementById(targetId).innerText;
        
        navigator.clipboard.writeText(content).then(() => {
            const originalText = e.target.innerText;
            e.target.innerText = "コピーしました！";
            setTimeout(() => { e.target.innerText = originalText; }, 2000);
        });
    }
});

// ページ読み込み時にステータスを自動同期する処理
document.addEventListener("DOMContentLoaded", () => {
    // 【同期リスト】 "テキスト欄のID" :["表示させたいボード側のID"]
    const syncMap = {
        "val-hp":["disp-hp", "disp-disp-hp-max"], // HPは現在値と最大値の両方に同じ数字を入れる
        "val-mp":["disp-mp", "disp-disp-mp-max"],
        "val-vit":["disp-vit"],
        "val-mnd": ["disp-mnd"],
        "val-ini":["disp-ini"],
        "val-kno": ["disp-kno"],
        "val-hit": ["disp-hit"],
        "val-eva": ["disp-eva"],
        "val-def": ["disp-def"],
        "val-mag": ["disp-mag"]
    };

    for (const [sourceId, targetIds] of Object.entries(syncMap)) {
        const sourceEl = document.getElementById(sourceId);
        if (sourceEl) {
            targetIds.forEach(targetId => {
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.textContent = sourceEl.textContent;
            });
        }
    }
});