// ============================================================
// 暗号メーカー - app.js
// ============================================================

(function () {
    'use strict';

    // ---- State ----
    let currentCipher = 'caesar';
    let direction = 'encrypt';
    let favorites = JSON.parse(localStorage.getItem('cipher-favorites') || '[]');
    let theme = localStorage.getItem('cipher-theme') || 'dark';
    let morseAudioCtx = null;
    let morseOscillator = null;
    let morseTimeout = null;
    let isPlayingMorse = false;

    const categoryNames = { classic: '古典暗号', code: '符号・エンコード', modern: '現代暗号' };

    // ---- DOM Elements ----
    const $ = id => document.getElementById(id);
    const app = $('app');
    const inputText = $('input-text');
    const outputText = $('output-text');
    const cipherGrid = $('cipher-grid');
    const paramsArea = $('params-area');
    const infoContent = $('info-content');
    const btnCopy = $('btn-copy');
    const btnFavorite = $('btn-favorite');
    const btnMorsePlay = $('btn-morse-play');
    const morseControls = $('morse-controls');
    const morseSpeed = $('morse-speed');
    const morseSpeedLabel = $('morse-speed-label');
    const btnMorseStop = $('btn-morse-stop');
    const toast = $('toast');
    const cipherCards = $('cipher-cards');
    const favoritesListEl = $('favorites-list');
    const favoritesEmpty = $('favorites-empty');

    // ---- Init ----
    function init() {
        applyTheme();
        renderCipherGrid();
        selectCipher('caesar');
        bindEvents();
        renderCipherCards('all');
        renderFavorites();
    }

    // ---- Theme ----
    function applyTheme() {
        document.body.setAttribute('data-theme', theme);
        $('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        theme = theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('cipher-theme', theme);
        applyTheme();
    }

    // ---- Navigation ----
    function showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        $(`page-${page}`).classList.add('active');
        $(`nav-${page}`).classList.add('active');
        if (page === 'favorites') renderFavorites();
    }

    // ---- Cipher Grid (chips) ----
    function renderCipherGrid() {
        cipherGrid.innerHTML = '';
        for (const [key, cipher] of Object.entries(Ciphers)) {
            const chip = document.createElement('button');
            chip.className = 'cipher-chip';
            chip.dataset.cipher = key;
            chip.innerHTML = `${cipher.icon} ${cipher.name}`;
            chip.addEventListener('click', () => selectCipher(key));
            cipherGrid.appendChild(chip);
        }
    }

    function selectCipher(key) {
        currentCipher = key;
        document.querySelectorAll('.cipher-chip').forEach(c => c.classList.toggle('active', c.dataset.cipher === key));
        renderParams();
        updateOutput();
        renderInfo();

        const cipher = Ciphers[key];
        btnMorsePlay.style.display = cipher.canPlayAudio ? '' : 'none';
        morseControls.style.display = 'none';
        stopMorse();
    }

    // ---- Params ----
    function renderParams() {
        paramsArea.innerHTML = '';
        const cipher = Ciphers[currentCipher];
        if (!cipher.hasParams || !cipher.params) return;

        cipher.params.forEach(p => {
            const group = document.createElement('div');
            group.className = 'param-group';

            const label = document.createElement('label');
            label.textContent = p.label;
            group.appendChild(label);

            if (p.type === 'range') {
                const input = document.createElement('input');
                input.type = 'range';
                input.min = p.min;
                input.max = p.max;
                input.value = p.default;
                input.id = `param-${p.name}`;
                input.addEventListener('input', () => {
                    val.textContent = input.value;
                    updateOutput();
                });
                group.appendChild(input);

                const val = document.createElement('span');
                val.className = 'param-value';
                val.textContent = p.default;
                group.appendChild(val);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = p.default;
                input.id = `param-${p.name}`;
                input.placeholder = p.label;
                input.addEventListener('input', () => updateOutput());
                group.appendChild(input);
            }

            paramsArea.appendChild(group);
        });
    }

    function getParams() {
        const cipher = Ciphers[currentCipher];
        if (!cipher.hasParams || !cipher.params) return {};
        const params = {};
        cipher.params.forEach(p => {
            const el = $(`param-${p.name}`);
            if (!el) return;
            params[p.name] = p.type === 'range' ? parseInt(el.value) : el.value;
        });
        return params;
    }

    // ---- Convert ----
    function updateOutput() {
        const text = inputText.value;
        if (!text) { outputText.textContent = ''; return; }
        const cipher = Ciphers[currentCipher];
        const params = getParams();
        try {
            const result = direction === 'encrypt'
                ? cipher.encrypt(text, params)
                : cipher.decrypt(text, params);
            outputText.textContent = result;
        } catch (e) {
            outputText.textContent = 'エラー: 変換に失敗しました';
        }
    }

    // ---- Info ----
    function renderInfo() {
        const cipher = Ciphers[currentCipher];
        infoContent.innerHTML = `
            <p><strong>${cipher.icon} ${cipher.name}</strong></p>
            <p style="margin-top:8px">${cipher.description}</p>
            <p style="margin-top:8px;color:var(--text-muted);font-size:0.82rem">カテゴリ: ${categoryNames[cipher.category]}</p>
        `;
    }

    // ---- Cipher Cards (List Page) ----
    function renderCipherCards(category) {
        cipherCards.innerHTML = '';
        for (const [key, cipher] of Object.entries(Ciphers)) {
            if (category !== 'all' && cipher.category !== category) continue;
            const card = document.createElement('div');
            card.className = 'cipher-card';
            card.innerHTML = `
                <div class="card-icon">${cipher.icon}</div>
                <div class="card-info">
                    <h3>${cipher.name}</h3>
                    <p>${cipher.description}</p>
                </div>
                <span class="card-category">${categoryNames[cipher.category]}</span>
            `;
            card.addEventListener('click', () => {
                showPage('convert');
                selectCipher(key);
            });
            cipherCards.appendChild(card);
        }
    }

    // ---- Favorites ----
    function saveFavorite() {
        const input = inputText.value;
        const output = outputText.textContent;
        if (!input || !output) { showToast('テキストを入力してください'); return; }

        favorites.unshift({
            id: Date.now(),
            cipherType: currentCipher,
            cipherName: Ciphers[currentCipher].name,
            cipherIcon: Ciphers[currentCipher].icon,
            direction,
            input,
            output,
            params: getParams(),
            createdAt: new Date().toISOString()
        });

        if (favorites.length > 50) favorites = favorites.slice(0, 50);
        localStorage.setItem('cipher-favorites', JSON.stringify(favorites));
        showToast('⭐ お気に入りに保存しました');
    }

    function renderFavorites() {
        favoritesListEl.innerHTML = '';
        favoritesEmpty.style.display = favorites.length === 0 ? '' : 'none';

        favorites.forEach(fav => {
            const card = document.createElement('div');
            card.className = 'fav-card';
            const date = new Date(fav.createdAt);
            const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            card.innerHTML = `
                <div class="fav-header">
                    <span class="fav-cipher">${fav.cipherIcon} ${fav.cipherName} (${fav.direction === 'encrypt' ? '暗号化' : '復号'})</span>
                    <span class="fav-date">${dateStr}</span>
                </div>
                <div class="fav-content">
                    <div class="fav-text" title="${escapeHtml(fav.input)}">${escapeHtml(fav.input)}</div>
                    <span class="fav-arrow">→</span>
                    <div class="fav-text" title="${escapeHtml(fav.output)}">${escapeHtml(fav.output)}</div>
                </div>
                <div class="fav-actions">
                    <button class="fav-btn copy-fav" data-output="${escapeAttr(fav.output)}">📋 コピー</button>
                    <button class="fav-btn delete" data-id="${fav.id}">🗑 削除</button>
                </div>
            `;
            favoritesListEl.appendChild(card);
        });

        favoritesListEl.querySelectorAll('.copy-fav').forEach(btn => {
            btn.addEventListener('click', () => {
                copyToClipboard(btn.dataset.output);
            });
        });

        favoritesListEl.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                favorites = favorites.filter(f => f.id !== parseInt(btn.dataset.id));
                localStorage.setItem('cipher-favorites', JSON.stringify(favorites));
                renderFavorites();
                showToast('削除しました');
            });
        });
    }

    // ---- Morse Audio ----
    function playMorse() {
        const morseText = outputText.textContent;
        if (!morseText || currentCipher !== 'morse' || direction !== 'encrypt') {
            showToast('モールス信号に暗号化してから再生してください');
            return;
        }

        stopMorse();
        morseControls.style.display = 'flex';
        isPlayingMorse = true;

        morseAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const speed = parseFloat(morseSpeed.value);
        const dotDuration = 100 / speed;
        const dashDuration = 300 / speed;
        const symbolGap = 60 / speed;
        const charGap = 300 / speed;
        const wordGap = 700 / speed;

        let time = morseAudioCtx.currentTime + 0.1;
        const freq = 700;

        for (const ch of morseText) {
            if (!isPlayingMorse) break;
            if (ch === '.' || ch === '-') {
                const osc = morseAudioCtx.createOscillator();
                const gain = morseAudioCtx.createGain();
                osc.connect(gain);
                gain.connect(morseAudioCtx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, time);
                const dur = ch === '.' ? dotDuration : dashDuration;
                osc.start(time);
                osc.stop(time + dur / 1000);
                time += (dur + symbolGap) / 1000;
            } else if (ch === ' ') {
                time += charGap / 1000;
            } else if (ch === '/') {
                time += wordGap / 1000;
            }
        }

        morseTimeout = setTimeout(() => {
            morseControls.style.display = 'none';
            isPlayingMorse = false;
        }, (time - morseAudioCtx.currentTime) * 1000 + 200);
    }

    function stopMorse() {
        isPlayingMorse = false;
        if (morseTimeout) clearTimeout(morseTimeout);
        if (morseAudioCtx) { morseAudioCtx.close().catch(() => {}); morseAudioCtx = null; }
        morseControls.style.display = 'none';
    }

    // ---- Utils ----
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => showToast('📋 コピーしました'));
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ---- Event Bindings ----
    function bindEvents() {
        $('theme-toggle').addEventListener('click', toggleTheme);

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => showPage(btn.dataset.page));
        });

        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                direction = btn.dataset.dir;
                document.querySelectorAll('.dir-btn').forEach(b => b.classList.toggle('active', b.dataset.dir === direction));
                updateOutput();
            });
        });

        inputText.addEventListener('input', updateOutput);
        btnCopy.addEventListener('click', () => {
            if (outputText.textContent) copyToClipboard(outputText.textContent);
            else showToast('変換結果がありません');
        });
        btnFavorite.addEventListener('click', saveFavorite);
        btnMorsePlay.addEventListener('click', playMorse);
        btnMorseStop.addEventListener('click', stopMorse);

        morseSpeed.addEventListener('input', () => {
            morseSpeedLabel.textContent = `${parseFloat(morseSpeed.value).toFixed(1)}x`;
        });

        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderCipherCards(tab.dataset.cat);
            });
        });
    }

    // ---- Start ----
    init();
})();
