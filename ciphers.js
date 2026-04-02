// ============================================================
// 暗号メーカー - ciphers.js
// 各暗号方式の変換ロジック
// ============================================================

const Ciphers = {

    // ============================================================
    // シーザー暗号
    // ============================================================
    caesar: {
        name: 'シーザー暗号',
        category: 'classic',
        icon: '🏛️',
        description: '文字をN文字分ずらして暗号化する最も基本的な暗号。ジュリアス・シーザーが使ったとされる。',
        hasParams: true,
        params: [{ name: 'shift', label: 'シフト数', type: 'range', min: 1, max: 25, default: 3 }],

        encrypt(text, { shift = 3 }) {
            return this._process(text, shift);
        },
        decrypt(text, { shift = 3 }) {
            return this._process(text, -shift);
        },
        _process(text, shift) {
            return text.split('').map(ch => {
                // アルファベット大文字
                if (ch >= 'A' && ch <= 'Z') {
                    return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift % 26 + 26) % 26) + 65);
                }
                // アルファベット小文字
                if (ch >= 'a' && ch <= 'z') {
                    return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift % 26 + 26) % 26) + 97);
                }
                // ひらがな (ぁ=0x3041 ～ ん=0x3093)
                if (ch >= '\u3041' && ch <= '\u3093') {
                    const base = 0x3041, range = 0x3093 - 0x3041 + 1;
                    return String.fromCharCode(((ch.charCodeAt(0) - base + shift % range + range) % range) + base);
                }
                // カタカナ (ァ=0x30A1 ～ ン=0x30F3)
                if (ch >= '\u30A1' && ch <= '\u30F3') {
                    const base = 0x30A1, range = 0x30F3 - 0x30A1 + 1;
                    return String.fromCharCode(((ch.charCodeAt(0) - base + shift % range + range) % range) + base);
                }
                return ch;
            }).join('');
        }
    },

    // ============================================================
    // ROT13
    // ============================================================
    rot13: {
        name: 'ROT13',
        category: 'classic',
        icon: '🔄',
        description: 'アルファベットを13文字ずらす暗号。2回適用すると元に戻る対称暗号。',
        hasParams: false,

        encrypt(text) {
            return text.split('').map(ch => {
                if (ch >= 'A' && ch <= 'Z') return String.fromCharCode(((ch.charCodeAt(0) - 65 + 13) % 26) + 65);
                if (ch >= 'a' && ch <= 'z') return String.fromCharCode(((ch.charCodeAt(0) - 97 + 13) % 26) + 97);
                return ch;
            }).join('');
        },
        decrypt(text) { return this.encrypt(text); }
    },

    // ============================================================
    // アトバシュ暗号
    // ============================================================
    atbash: {
        name: 'アトバシュ暗号',
        category: 'classic',
        icon: '🪞',
        description: 'A↔Z, B↔Y のようにアルファベットを逆順に置換する暗号。ヘブライ語起源。',
        hasParams: false,

        encrypt(text) {
            return text.split('').map(ch => {
                if (ch >= 'A' && ch <= 'Z') return String.fromCharCode(90 - (ch.charCodeAt(0) - 65));
                if (ch >= 'a' && ch <= 'z') return String.fromCharCode(122 - (ch.charCodeAt(0) - 97));
                if (ch >= '\u3041' && ch <= '\u3093') return String.fromCharCode(0x3093 - (ch.charCodeAt(0) - 0x3041));
                if (ch >= '\u30A1' && ch <= '\u30F3') return String.fromCharCode(0x30F3 - (ch.charCodeAt(0) - 0x30A1));
                return ch;
            }).join('');
        },
        decrypt(text) { return this.encrypt(text); }
    },

    // ============================================================
    // ヴィジュネル暗号
    // ============================================================
    vigenere: {
        name: 'ヴィジュネル暗号',
        category: 'classic',
        icon: '🔑',
        description: 'キーワードを使って文字ごとに異なるシフト量で暗号化する多表式暗号。',
        hasParams: true,
        params: [{ name: 'key', label: 'キーワード', type: 'text', default: 'SECRET' }],

        encrypt(text, { key = 'SECRET' }) {
            const k = key.toUpperCase();
            if (!k || !/^[A-Z]+$/.test(k)) return text;
            let ki = 0;
            return text.split('').map(ch => {
                const shift = k.charCodeAt(ki % k.length) - 65;
                if (ch >= 'A' && ch <= 'Z') { ki++; return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65); }
                if (ch >= 'a' && ch <= 'z') { ki++; return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97); }
                return ch;
            }).join('');
        },
        decrypt(text, { key = 'SECRET' }) {
            const k = key.toUpperCase();
            if (!k || !/^[A-Z]+$/.test(k)) return text;
            let ki = 0;
            return text.split('').map(ch => {
                const shift = k.charCodeAt(ki % k.length) - 65;
                if (ch >= 'A' && ch <= 'Z') { ki++; return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65); }
                if (ch >= 'a' && ch <= 'z') { ki++; return String.fromCharCode(((ch.charCodeAt(0) - 97 - shift + 26) % 26) + 97); }
                return ch;
            }).join('');
        }
    },

    // ============================================================
    // スキュタレー暗号
    // ============================================================
    scytale: {
        name: 'スキュタレー暗号',
        category: 'classic',
        icon: '📜',
        description: '棒に巻きつけて読む転置暗号。列数を指定してテキストを並べ替える。古代スパルタで使用。',
        hasParams: true,
        params: [{ name: 'columns', label: '列数', type: 'range', min: 2, max: 10, default: 4 }],

        encrypt(text, { columns = 4 }) {
            const rows = Math.ceil(text.length / columns);
            const padded = text.padEnd(rows * columns, ' ');
            let result = '';
            for (let c = 0; c < columns; c++) {
                for (let r = 0; r < rows; r++) {
                    result += padded[r * columns + c];
                }
            }
            return result;
        },
        decrypt(text, { columns = 4 }) {
            const rows = Math.ceil(text.length / columns);
            const arr = new Array(text.length);
            let idx = 0;
            for (let c = 0; c < columns; c++) {
                for (let r = 0; r < rows; r++) {
                    arr[r * columns + c] = text[idx++] || ' ';
                }
            }
            return arr.join('').trimEnd();
        }
    },

    // ============================================================
    // レールフェンス暗号
    // ============================================================
    railFence: {
        name: 'レールフェンス暗号',
        category: 'classic',
        icon: '🚂',
        description: 'テキストをジグザグに並べ替える転置暗号。段数を指定する。',
        hasParams: true,
        params: [{ name: 'rails', label: '段数', type: 'range', min: 2, max: 10, default: 3 }],

        encrypt(text, { rails = 3 }) {
            if (rails <= 1) return text;
            const fence = Array.from({ length: rails }, () => []);
            let rail = 0, dir = 1;
            for (const ch of text) {
                fence[rail].push(ch);
                if (rail === 0) dir = 1;
                if (rail === rails - 1) dir = -1;
                rail += dir;
            }
            return fence.flat().join('');
        },
        decrypt(text, { rails = 3 }) {
            if (rails <= 1) return text;
            const len = text.length;
            const pattern = [];
            let rail = 0, dir = 1;
            for (let i = 0; i < len; i++) {
                pattern.push(rail);
                if (rail === 0) dir = 1;
                if (rail === rails - 1) dir = -1;
                rail += dir;
            }
            const result = new Array(len);
            let idx = 0;
            for (let r = 0; r < rails; r++) {
                for (let i = 0; i < len; i++) {
                    if (pattern[i] === r) result[i] = text[idx++];
                }
            }
            return result.join('');
        }
    },

    // ============================================================
    // ポリュビオスの暗表
    // ============================================================
    polybius: {
        name: 'ポリュビオスの暗表',
        category: 'classic',
        icon: '📊',
        description: '5x5のグリッドで文字を座標(行列)に変換する暗号。I/Jは同じマスを共有する。',
        hasParams: false,
        _grid: 'ABCDEFGHIKLMNOPQRSTUVWXYZ',

        encrypt(text) {
            return text.toUpperCase().replace(/J/g, 'I').split('').map(ch => {
                const idx = this._grid.indexOf(ch);
                if (idx === -1) return ch;
                return `${Math.floor(idx / 5) + 1}${(idx % 5) + 1}`;
            }).join(' ');
        },
        decrypt(text) {
            return text.replace(/([1-5])([1-5])/g, (_, r, c) => {
                return this._grid[(parseInt(r) - 1) * 5 + (parseInt(c) - 1)] || '';
            });
        }
    },

    // ============================================================
    // モールス信号
    // ============================================================
    morse: {
        name: 'モールス信号',
        category: 'code',
        icon: '📡',
        description: '短点(・)と長点(-)の組み合わせで文字を表現する信号体系。サミュエル・モールスが考案。',
        hasParams: false,
        canPlayAudio: true,
        _map: {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
            'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
            'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
            '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
            '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', ' ': '/'
        },

        encrypt(text) {
            return text.toUpperCase().split('').map(ch => this._map[ch] || ch).join(' ');
        },
        decrypt(text) {
            const rev = {};
            for (const [k, v] of Object.entries(this._map)) rev[v] = k;
            return text.split(' ').map(code => {
                if (code === '/') return ' ';
                return rev[code] || code;
            }).join('');
        }
    },

    // ============================================================
    // Base64
    // ============================================================
    base64: {
        name: 'Base64',
        category: 'code',
        icon: '📦',
        description: 'バイナリデータを64種の文字(A-Z, a-z, 0-9, +, /)で表現するエンコード方式。メール添付などで使用。',
        hasParams: false,

        encrypt(text) {
            try { return btoa(unescape(encodeURIComponent(text))); } catch { return 'エンコードエラー'; }
        },
        decrypt(text) {
            try { return decodeURIComponent(escape(atob(text))); } catch { return 'デコードエラー: 不正なBase64文字列'; }
        }
    },

    // ============================================================
    // バイナリ (2進数)
    // ============================================================
    binary: {
        name: 'バイナリ(2進数)',
        category: 'code',
        icon: '💻',
        description: 'テキストの各文字をUTF-8バイト列の2進数表現に変換。コンピュータ内部のデータ表現の基本。',
        hasParams: false,

        encrypt(text) {
            const encoder = new TextEncoder();
            return Array.from(encoder.encode(text)).map(b => b.toString(2).padStart(8, '0')).join(' ');
        },
        decrypt(text) {
            try {
                const bytes = text.trim().split(/\s+/).map(b => parseInt(b, 2));
                return new TextDecoder().decode(new Uint8Array(bytes));
            } catch { return 'デコードエラー'; }
        }
    },

    // ============================================================
    // 16進数 (HEX)
    // ============================================================
    hex: {
        name: '16進数(HEX)',
        category: 'code',
        icon: '🔢',
        description: 'テキストの各バイトを16進数で表現。プログラミングやデータ解析で頻用。',
        hasParams: false,

        encrypt(text) {
            const encoder = new TextEncoder();
            return Array.from(encoder.encode(text)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        },
        decrypt(text) {
            try {
                const bytes = text.trim().split(/\s+/).map(h => parseInt(h, 16));
                return new TextDecoder().decode(new Uint8Array(bytes));
            } catch { return 'デコードエラー'; }
        }
    },

    // ============================================================
    // Unicode
    // ============================================================
    unicode: {
        name: 'Unicode',
        category: 'code',
        icon: '🌐',
        description: '各文字をUnicodeコードポイント(U+XXXX)で表現。世界中の文字を扱う共通規格。',
        hasParams: false,

        encrypt(text) {
            return Array.from(text).map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
        },
        decrypt(text) {
            try {
                return text.split(/\s+/).map(u => {
                    const code = parseInt(u.replace(/^U\+/i, ''), 16);
                    return String.fromCodePoint(code);
                }).join('');
            } catch { return 'デコードエラー'; }
        }
    },

    // ============================================================
    // XOR暗号
    // ============================================================
    xor: {
        name: 'XOR暗号',
        category: 'modern',
        icon: '⊕',
        description: 'キーとのXOR(排他的論理和)演算で暗号化。同じキーで再度XORすると復号される。現代暗号の基礎。',
        hasParams: true,
        params: [{ name: 'key', label: 'キー', type: 'text', default: 'KEY' }],

        encrypt(text, { key = 'KEY' }) {
            if (!key) return text;
            return Array.from(text).map((ch, i) => {
                const xored = ch.charCodeAt(0) ^ key.charCodeAt(i % key.length);
                return xored.toString(16).padStart(4, '0');
            }).join(' ');
        },
        decrypt(text, { key = 'KEY' }) {
            if (!key) return text;
            try {
                return text.trim().split(/\s+/).map((hex, i) => {
                    const code = parseInt(hex, 16) ^ key.charCodeAt(i % key.length);
                    return String.fromCharCode(code);
                }).join('');
            } catch { return 'デコードエラー'; }
        }
    },

    // ============================================================
    // 置換暗号
    // ============================================================
    substitution: {
        name: '置換暗号',
        category: 'modern',
        icon: '🔀',
        description: 'アルファベットの対応表を自分で定義して暗号化。26文字の完全な並べ替え(パーミュテーション)。',
        hasParams: true,
        params: [{ name: 'table', label: '置換テーブル(26文字)', type: 'text', default: 'QWERTYUIOPASDFGHJKLZXCVBNM' }],

        encrypt(text, { table = 'QWERTYUIOPASDFGHJKLZXCVBNM' }) {
            const t = table.toUpperCase();
            if (t.length !== 26) return text;
            return text.split('').map(ch => {
                if (ch >= 'A' && ch <= 'Z') return t[ch.charCodeAt(0) - 65];
                if (ch >= 'a' && ch <= 'z') return t[ch.charCodeAt(0) - 97].toLowerCase();
                return ch;
            }).join('');
        },
        decrypt(text, { table = 'QWERTYUIOPASDFGHJKLZXCVBNM' }) {
            const t = table.toUpperCase();
            if (t.length !== 26) return text;
            const rev = new Array(26);
            for (let i = 0; i < 26; i++) rev[t.charCodeAt(i) - 65] = String.fromCharCode(65 + i);
            return text.split('').map(ch => {
                if (ch >= 'A' && ch <= 'Z') return rev[ch.charCodeAt(0) - 65] || ch;
                if (ch >= 'a' && ch <= 'z') return (rev[ch.charCodeAt(0) - 97] || ch).toLowerCase();
                return ch;
            }).join('');
        }
    }
};
