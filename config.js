// config.js
// 全ページで適用したい設定をここに書く
const head = document.head;

// フォントの読み込みをJSで追加する
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700&display=swap';
head.appendChild(fontLink);
// フォントを動的に追加
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap';
document.head.appendChild(link);
const dancingScriptLink = document.createElement('link');
dancingScriptLink.rel = 'stylesheet';
dancingScriptLink.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Shippori+Mincho:wght@700&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap';
document.head.appendChild(dancingScriptLink);
// CSSファイルの適用（全ページで必ず読み込む）
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = 'style.css';
head.appendChild(styleLink);