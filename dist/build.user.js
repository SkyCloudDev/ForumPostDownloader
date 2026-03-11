// noinspection SpellCheckingInspection,JSUnresolvedVariable,JSUnresolvedFunction,TypeScriptUMDGlobal,JSUnusedGlobalSymbols
// ==UserScript==
// @name XenForoPostDownloader
// @namespace https://github.com/SkyCloudDev
// @author SkyCloudDev
// @description Downloads images and videos from posts
// @version 3.17
// @updateURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/dist/build.user.js
// @downloadURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/dist/build.user.js
// @icon https://simp4.selti-delivery.ru/simpcityIcon192.png
// @license WTFPL; http://www.wtfpl.net/txt/copying/
// @match https://simpcity.cr/threads/*
// @match https://simpcity.is/threads/*
// @match https://simpcity.cz/threads/*
// @match https://simpcity.hk/threads/*
// @match https://simpcity.rs/threads/*
// @match https://simpcity.ax/threads/*
// @require https://unpkg.com/@popperjs/core@2
// @require https://unpkg.com/tippy.js@6
// @require https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @connect self
// @connect simpcity.su
// @connect coomer.st
// @connect box.com
// @connect boxcloud.com
// @connect kemono.cr
// @connect github.com
// @connect scdn.st
// @connect cache8.st
// @connect bunkr.ac
// @connect bunkr.ax
// @connect bunkr.black
// @connect bunkr.cat
// @connect bunkr.ci
// @connect bunkr.cr
// @connect bunkr.fi
// @connect bunkr.is
// @connect bunkr.media
// @connect bunkr.nu
// @connect bunkr.red
// @connect bunkr.ru
// @connect bunkr.se
// @connect bunkr.si
// @connect bunkr.site
// @connect bunkr.pk
// @connect bunkr.ph
// @connect bunkr.ps
// @connect bunkr.sk
// @connect bunkr.ws
// @connect bunkrr.ru
// @connect bunkrr.su
// @connect bunkrrr.org
// @connect bunkr-cache.se
// @connect b-cdn.net
// @connect gigachad-cdn.ru
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.ch
// @connect cyberdrop.cloud
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect cyberdrop.cr
// @connect cyberfile.su
// @connect cyberfile.me
// @connect turbo.cr
// @connect turbocdn.st
// @connect saint2.su
// @connect saint2.cr
// @connect redd.it
// @connect onlyfans.com
// @connect i.ibb.co
// @connect ibb.co
// @connect imagebam.com
// @connect jpg.fish
// @connect jpg.fishing
// @connect jpg.pet
// @connect jpeg.pet
// @connect jpg1.su
// @connect jpg2.su
// @connect jpg3.su
// @connect jpg4.su
// @connect jpg5.su
// @connect jpg6.su
// @connect jpg7.cr
// @connect selti-delivery.ru
// @connect imgbox.com
// @connect pixhost.to
// @connect pomf2.lain.la
// @connect pornhub.com
// @connect postimg.cc
// @connect imgvb.com
// @connect pixxxels.cc
// @connect imagevenue.com
// @connect nhentai-proxy.herokuapp.com
// @connect pbs.twimg.com
// @connect media.tumblr.com
// @connect pixeldrain.com
// @connect pixeldrain.net
// @connect pixeldra.in
// @connect redgifs.com
// @connect rule34.xxx
// @connect noodlemagazine.com
// @connect pvvstream.pro
// @connect spankbang.com
// @connect sb-cd.com
// @connect gofile.io
// @connect phncdn.com
// @connect xvideos.com
// @connect give.xxx
// @connect githubusercontent.com
// @connect filester.me
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log
// @grant GM_openInTab

// ==/UserScript==
// --- tab handle helper (Tampermonkey can return either a Tab object or a Promise<Tab>) ---
function xfpdCloseTabHandle(tabOrPromise) {
    try {
        if (!tabOrPromise) return;
        // Promise-like (e.g., some GM implementations return Promise<Tab>)
        if (typeof tabOrPromise.then === 'function') {
            try {
                tabOrPromise.then(t => {
                    try { if (t && typeof t.close === 'function') t.close(); } catch (e) {}
                }).catch(() => {});
            } catch (e) {}
            return;
        }
        // Direct tab handle
        if (typeof tabOrPromise.close === 'function') {
            try { tabOrPromise.close(); } catch (e) {}
        }
    } catch (e) {}
}
// ---------------------------------------------------------------------------
const JSZip = window.JSZip;
const tippy = window.tippy;
const http = window.GM_xmlhttpRequest;
window.isFF = typeof InstallTrigger !== 'undefined';
window.logs = [];

const log = {
    /**
   * @returns {number}
   */
    separator: postId => window.logs.push({ postId, message: '-'.repeat(175) }),
    /**
   * @param postId
   * @param str
   * @param type
   * @param toConsole
   */
    write: (postId, str, type, toConsole = true) => {
        const date = new Date();
        const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
        .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
        .replace(/::/g, '');
        window.logs.push({ postId, message });
        if (toConsole) {
            if (type.toLowerCase() === 'info') {
                console.info(message);
            } else if (type.toLowerCase() === 'warn') {
                console.warn(message);
            } else {
                console.error(message);
            }
        }
    },
    /**
   * @param postId
   * @param str
   * @param scope
   */
    info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'INFO'),
    /**
   * @param postId
   * @param str
   * @param scope
   */
    warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'WARNING'),
    /**
   * @param postId
   * @param str
   * @param scope
   */
    error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'ERROR'),
    // TODO: Fix param orders for the methods: -.-
    post: {
        /**
     * @param postId
     * @param str
     * @param postNumber
     * @returns {*}
     */
        info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
        /**
     * @param postId
     * @param str
     * @param postNumber
     * @returns {*}
     */
        error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`),
    },
    host: {
        /**
     * @param postId
     * @param str
     * @param host
     * @returns {*}
     */
        info: (postId, str, host) => log.info(postId, str, host),
        /**
     * @param postId
     * @param str
     * @param host
     * @returns {*}
     */
        error: (postId, str, host) => log.error(postId, str, host),
    },
};

const settings = {
    naming: {
        allowEmojis: false,
        invalidCharSubstitute: '-',
    },
    hosts: {
        goFile: {
            token: '',
        },
    },
    ui: {
        checkboxes: {
            toggleAllCheckboxLabel: '',
        },
    },
    extensions: {
        documents: ['.txt', '.doc', '.docx', '.pdf'],
        compressed: ['.zip', '.rar', '.7z', '.tar', '.bz2', '.gzip'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.gif', '.webp', '.jpe', '.svg', '.tif', '.tiff', '.jif'],
        video: [
            '.mpeg',
            '.avchd',
            '.webm',
            '.mpv',
            '.swf',
            '.avi',
            '.m4p',
            '.wmv',
            '.mp2',
            '.m4v',
            '.qt',
            '.mpe',
            '.mp4',
            '.flv',
            '.mov',
            '.mpg',
            '.ogg',
        ],
    },
};

// GoFile filename hints (from API) so we don't rely on URL-encoded path segments
const gofileNameById = new Map();
const gofileNameByUrl = new Map();

// Cyberdrop filename hints (from API)
const cyberdropNameBySlug = new Map();
const cyberdropNameByUrl = new Map();

// Filester filename/size hints (from API)
const filesterNameBySlug = new Map();
const filesterNameByUrl = new Map();
const filesterSizeBySlug = new Map();
const filesterSizeByUrl = new Map();
const filesterSlugByUrl = new Map();
const filesterRefByUrl = new Map();

// Filester: cache candidate fallback (some tokens are served from different cacheN hosts; cache6 is common but not guaranteed)
const filesterCandidatesByToken = new Map(); // token -> string[]
const filesterTriedByToken = new Map();      // token -> Set<string> of tried candidate URLs
const filester429AttemptsByKey = new Map(); // token/url -> number of 429 retries (rate limiting)
const filesterRetryAttemptsByKey = new Map(); // token/url -> number of retries on transient HTTP errors (429/400/etc)


function filesterTokenFromVUrl(u) {
    try {
        const m = /\/v\/([^\/?#]+)/i.exec(String(u || ''));
        return m && m[1] ? String(m[1]) : '';
    } catch (e) { return ''; }
}

function filesterBuildCandidates(token) {
    const t = String(token || '').trim();
    if (!t) return [];
    const order = [6, 1, 2, 3, 4, 5, 7, 8];
    const out = [];
    for (const n of order) out.push(`https://cache${n}.filester.me/v/${t}`);
    out.push(`https://filester.me/v/${t}`);
    return out;
}

// Bunkr filename hints (from /v/ pages)
const bunkrNameByUrl = new Map();


// Bunkr/Cloudflare: best-effort warm-up to let the browser complete a JS-only CF interstitial ("Just a moment...").
// NOTE: This does NOT solve interactive Turnstile/CAPTCHA challenges; in that case you still need to do it manually.
const BUNKR_CF_WARMUP_MS = 6000;
const BUNKR_CF_MAX_RETRIES = 3;
const BUNKR_CF_WARMUP_ACTIVE_TAB = false;

const BUNKR_CF_WARMUP_COOLDOWN_MS = 15000; // reduce repeated warm-up tabs


// Bunkr fast-fail + domain blacklist:
// - On first 403 or obvious CF interstitial on a non-last domain, immediately switch to next domain (no extra retries).
// - Blacklist the failing domain for a while so subsequent links skip it entirely.
const BUNKR_FASTFAIL_ON_403 = true;
const BUNKR_DOMAIN_BLACKLIST_MS = 60 * 60 * 1000; // 60 minutes
const xfpdBunkrDomainBanUntil = new Map(); // baseOrigin -> timestamp

function xfpdBunkrNormalizeBase(baseOrUrl) {
    try {
        const u = new URL(String(baseOrUrl || ''));
        return u.origin;
    } catch (e) {
        return String(baseOrUrl || '').replace(/\/+$/, '');
    }
}

function xfpdBunkrIsBaseBanned(baseOrUrl) {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        const until = xfpdBunkrDomainBanUntil.get(base);
        if (!until) return false;
        if (Date.now() >= until) {
            xfpdBunkrDomainBanUntil.delete(base);
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function xfpdBunkrBanBase(baseOrUrl) {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        // Don't blacklist the last-resort domain (it may be the only thing left).
        if (base === 'https://bunkr.cr') return;
        xfpdBunkrDomainBanUntil.set(base, Date.now() + BUNKR_DOMAIN_BLACKLIST_MS);
    } catch (e) {}
}

function xfpdBunkrFilterBases(bases) {
    const uniq = [];
    const seen = new Set();
    for (const b of (bases || [])) {
        const base = xfpdBunkrNormalizeBase(b);
        if (!base || seen.has(base)) continue;
        seen.add(base);
        uniq.push(base);
    }
    const filtered = uniq.filter(b => b === 'https://bunkr.cr' || !xfpdBunkrIsBaseBanned(b));
    // Never return an empty list; keep last-resort behavior intact.
    return filtered.length ? filtered : uniq;
}

function xfpdLooksLikeCfChallenge(source, dom) {
    try {
        const s = String(source || '');
        const head = s.slice(0, 8000).toLowerCase();

        const title =
            String(dom?.querySelector?.('title')?.textContent || '').trim();

        if (title && /just a moment|attention required|checking your browser/i.test(title)) return true;
        if (title && /cloudflare/i.test(title)) return true;

        if (head.includes('cdn-cgi/challenge-platform')) return true;
        if (head.includes('challenges.cloudflare.com')) return true;
        if (head.includes('cf-browser-verification')) return true;
        if (head.includes('checking your browser')) return true;
        if (head.includes('just a moment')) return true;
        if (head.includes('attention required')) return true;

        // DOM markers (when we have it)
        if (dom?.querySelector?.('#cf-challenge-running, #challenge-form, .cf-browser-verification, .cf-challenge')) return true;
    } catch (e) {}
    return false;
}

function xfpdLooksLikeCfFilenameHint(name) {
    const n = String(name || '').trim();
    return /^(?:just a moment\.{0,3}|checking your browser\.{0,3}|attention required\.{0,3})$/i.test(n) || /cloudflare/i.test(n);
}


// Try to extract the original filename from Bunkr /api/vs JSON (when /v/ is blocked by CF/403).
function xfpdBunkrExtractNameFromVsData(data) {
    try {
        const cands = [];
        const add = (v) => {
            if (!v) return;
            if (typeof v === 'string') cands.push(v);
            else if (typeof v === 'number') cands.push(String(v));
        };

        add(data?.name);
        add(data?.filename);
        add(data?.file_name);
        add(data?.original);
        add(data?.title);

        // common nesting patterns
        if (data?.data && typeof data.data === 'object') {
            add(data.data.name);
            add(data.data.filename);
            add(data.data.file_name);
            add(data.data.original);
            add(data.data.title);
        }
        if (data?.file && typeof data.file === 'object') {
            add(data.file.name);
            add(data.file.filename);
            add(data.file.original);
            add(data.file.title);
        }

        const norm = (s) => {
            let t = String(s || '').replace(/\s+/g, ' ').trim();
            t = t.replace(/\s*\|\s*Bunkr\s*$/i, '').trim();
            return t;
        };

        // Prefer candidates that look like a real filename with an extension.
        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            if (/\.[A-Za-z0-9]{1,8}$/.test(t)) return t;
        }
        // Otherwise, return the first non-empty non-CF string.
        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            return t;
        }
    } catch (e) {}
    return '';
}


async function xfpdWarmupTab(url, ms = BUNKR_CF_WARMUP_MS, active = BUNKR_CF_WARMUP_ACTIVE_TAB) {
    try {
        const tab = GM_openInTab(url, { active: !!active, insert: true, setParent: true });
        await h.delayedResolve(ms);
        try { tab?.close?.(); } catch (e) {}
    } catch (e) {
        // Ignore - warm-up is best-effort
        try { await h.delayedResolve(ms); } catch (e2) {}
    }
}

let xfpdBunkrCfWarmupPromise = null;
let xfpdBunkrCfWarmupLastAt = 0;

// Ensure we open at most ONE warm-up tab at a time (and no more than once per cooldown window).
async function xfpdBunkrCfWarmup(url) {
    try {
        const now = Date.now();

        // If a warm-up is already running, just wait for it.
        if (xfpdBunkrCfWarmupPromise) {
            return await xfpdBunkrCfWarmupPromise;
        }

        // If we recently warmed up, don't open another tab; just wait a bit to avoid hammering.
        if (now - xfpdBunkrCfWarmupLastAt < BUNKR_CF_WARMUP_COOLDOWN_MS) {
            try { await h.delayedResolve(Math.min(1000, BUNKR_CF_WARMUP_MS)); } catch (e) {}
            return null;
        }

        xfpdBunkrCfWarmupLastAt = now;

        xfpdBunkrCfWarmupPromise = (async () => {
            await xfpdWarmupTab(url);
        })();

        try {
            return await xfpdBunkrCfWarmupPromise;
        } finally {
            xfpdBunkrCfWarmupPromise = null;
        }
    } catch (e) {
        // Best-effort
        return null;
    }
}

async function xfpdBunkrGetWithCfRetry(http, url, warmUrlOrOrigin, allowWarmup = true) {
    let last = null;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            last = await http.get(url);
        } catch (e) {
            last = null;
        }

        const dom = last?.dom;
        const source = last?.source || '';


// Fast-fail on 403 / CF interstitial for non-last domains:
// Immediately blacklist this domain and return, so the caller can try the next domain.
const status = Number(last?.status || 0);
if (BUNKR_FASTFAIL_ON_403 && (status === 403) && !allowWarmup) {
    xfpdBunkrBanBase(warmUrlOrOrigin || url);
    return last || { dom: null, source: '' };
}
if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && last && xfpdLooksLikeCfChallenge(source, dom)) {
    xfpdBunkrBanBase(warmUrlOrOrigin || url);
    return last || { dom: null, source: '' };
}

        if (last && !xfpdLooksLikeCfChallenge(source, dom)) return last;

        if (attempt < BUNKR_CF_MAX_RETRIES) {
            if (allowWarmup) {
                await xfpdBunkrCfWarmup(String(warmUrlOrOrigin || url));
            } else {
                try { await h.delayedResolve(200); } catch (e) {}
            }
}
    }
    return last || { dom: null, source: '' };
}

async function xfpdBunkrPostVsWithCfRetry(http, endpoint, slug, refererUrl, originUrl, allowWarmup = true) {
    let lastText = '';
    let lastStatus = 0;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            const response = await http.post(
                endpoint,
                JSON.stringify({ slug }),
                {},
                {
                    'Content-Type': 'application/json',
                    Referer: refererUrl,
                    Origin: originUrl,
                },
            );
            lastText = String(response?.source || '');
            lastStatus = Number(response?.status || 0);
        } catch (e) {
            lastText = '';
            lastStatus = 0;
        }



// Fast-fail on 403 / CF interstitial for non-last domains:
// Immediately blacklist this domain and return null so the caller tries the next domain.
if (BUNKR_FASTFAIL_ON_403 && (Number(lastStatus || 0) === 403) && !allowWarmup) {
    xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
    return null;
}
if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && xfpdLooksLikeCfChallenge(lastText, null)) {
    xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
    return null;
}
try {
            return JSON.parse(lastText || '{}');
        } catch (e) {
            if (xfpdLooksLikeCfChallenge(lastText, null) && attempt < BUNKR_CF_MAX_RETRIES) {
                if (allowWarmup) {
                    await xfpdBunkrCfWarmup(String(refererUrl || originUrl || endpoint));
                } else {
                    try { await h.delayedResolve(200); } catch (e2) {}
                }
continue;
            }
            return null;
        }
    }
    return null;
}







// Turbo mapping: signed turbocdn URL -> Turbo id (needed for re-sign when resolving from /a/ albums)
const turboIdBySignedUrl = new Map();

const h = {
    /**
   * @param v
   * @returns {arg is any[]}
   */
    isArray: v => Array.isArray(v),
    /**
   * @param v
   * @returns {boolean}
   */
    isObject: v => typeof v === 'object',
    /**
   * @param v
   * @returns {boolean}
   */
    isNullOrUndef: v => v === null || v === undefined || typeof v === 'undefined',
    /**
   * @param path
   * @returns {unknown}
   */
    basename: path =>
    path
    .replace(/\/(\s+)?$/, '')
    .split('/')
    .reverse()[0],
    /**
   * @param path
   * @returns {string}
   */
    fnNoExt: path => path.trim().split('.').reverse().slice(1).reverse().join('.'),
    /**
   * @param path
   * @returns {unknown}
   */
    ext: path => {
        return !path || path.indexOf('.') < 0 ? null : path.split('.').reverse()[0];
    },
    /**
   * @param element
   * @returns {string}
   */
    show: element => (element.style.display = 'block'),
    /**
   * @param element
   * @returns {string}
   */
    hide: element => (element.style.display = 'none'),
    /**
   * @param executor
   * @returns {Promise<unknown>}
   */
    promise: executor => new Promise(executor),
    /**
   * @param ms
   * @returns {Promise<unknown>}
   */
    delayedResolve: async ms => await h.promise(resolve => setTimeout(resolve, ms)),
    /**
   * @param tag
   * @param content
   * @returns {*}
   */
    stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?<\/${tag}>`, 'igs'), ''),
    /**
   * @param tags
   * @param content
   * @returns {*}
   */
    stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
    /**
   * @param string
   * @param maxLength
   * @returns {string|*}
   */
    limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
    /**
   * @param selector
   * @param container
   * @returns {*}
   */
    element: (selector, container = document) => container.querySelector(selector),
    /**
   * @param selector
   * @param container
   * @returns {NodeListOf<*>}
   */
    elements: (selector, container = document) => container.querySelectorAll(selector),
    /**
   * @param needle
   * @param haystack
   * @param ignoreCase
   * @returns {boolean}
   */
    contains: (needle, haystack, ignoreCase = true) =>
    (ignoreCase ? haystack.toLowerCase().indexOf(needle.toLowerCase()) : haystack.indexOf(needle)) > -1,
    /**
   * @param str
   * @returns {*|string}
   */
    ucFirst: str => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
    /**
   * @param items
   * @param cb
   * @returns {*}
   */
    unique: (items, cb) => {
        if (cb) {
            return items.reduce((acc, item) => (!acc.find(i => i[byKey] === item[byKey]) ? acc.concat(item) : acc), []);
        }

        return items.reduce((acc, item) => (acc.indexOf(item) < 0 ? acc.concat(item) : acc), []);
    },
    /**
   * https://github.com/sindresorhus/pretty-bytes
   *
   * @param number
   * @param options
   * @returns {string}
   */
    prettyBytes: (number, options = {}) => {
        const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const BIBYTE_UNITS = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        const BIT_UNITS = ['b', 'kbit', 'Mbit', 'Gbit', 'Tbit', 'Pbit', 'Ebit', 'Zbit', 'Ybit'];

        const BIBIT_UNITS = ['b', 'kibit', 'Mibit', 'Gibit', 'Tibit', 'Pibit', 'Eibit', 'Zibit', 'Yibit'];

        /*
    Formats the given number using `Number#toLocaleString`.
    - If locale is a string, the value is expected to be a locale-key (for example: `de`).
    - If locale is true, the system default locale is used for translation.
    - If no value for locale is specified, the number is returned unmodified.
    */
        const toLocaleString = (number, locale, options) => {
            let result = number;
            if (typeof locale === 'string' || Array.isArray(locale)) {
                result = number.toLocaleString(locale, options);
            } else if (locale === true || options !== undefined) {
                result = number.toLocaleString(undefined, options);
            }

            return result;
        };

        if (!Number.isFinite(number)) {
            throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
        }

        options = {
            bits: false,
            binary: false,
            space: true,
            ...options,
        };

        const UNITS = options.bits ? (options.binary ? BIBIT_UNITS : BIT_UNITS) : options.binary ? BIBYTE_UNITS : BYTE_UNITS;

        const separator = options.space ? ' ' : '';

        if (options.signed && number === 0) {
            return ` 0${separator}${UNITS[0]}`;
        }

        const isNegative = number < 0;
        const prefix = isNegative ? '-' : options.signed ? '+' : '';

        if (isNegative) {
            number = -number;
        }

        let localeOptions;

        if (options.minimumFractionDigits !== undefined) {
            localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
        }

        if (options.maximumFractionDigits !== undefined) {
            localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
        }

        if (number < 1) {
            const numberString = toLocaleString(number, options.locale, localeOptions);
            return prefix + numberString + separator + UNITS[0];
        }

        const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
        number /= (options.binary ? 1024 : 1000) ** exponent;

        if (!localeOptions) {
            number = number.toPrecision(3);
        }

        const numberString = toLocaleString(Number(number), options.locale, localeOptions);

        const unit = UNITS[exponent];

        return prefix + numberString + separator + unit;
    },
    ui: {
        /**
     * @param element
     * @param text
     */
        setText: (element, text) => {
            element.textContent = text;
        },
        /**
     * @param element
     * @param props
     */
        setElProps: (element, props) => {
            for (const prop in props) {
                element.style[prop] = props[prop];
            }
        },
    },
    http: {
        /**
     * @param method
     * @param url
     * @param callbacks
     * @param headers
     * @param data
     * @param responseType
     * @returns {Promise<unknown>}
     */
        base: (method, url, callbacks = {}, headers = {}, data = {}, responseType = 'document') => {
            return h.promise((resolve, reject) => {
                let responseHeaders = null;
                let request = null;
                // Allow passing non-header request options via a special key in the headers object.
                // This keeps the original function signature intact.
                const hdrs = {
                    Referer: url,
                    ...(headers || {}),
                };
                const withCredentials = !!(hdrs && Object.prototype.hasOwnProperty.call(hdrs, '__xfpd_withCredentials') && hdrs.__xfpd_withCredentials);
                try { if (hdrs && Object.prototype.hasOwnProperty.call(hdrs, '__xfpd_withCredentials')) delete hdrs.__xfpd_withCredentials; } catch (e) {}

                request = http({
                    url,
                    method,
                    responseType,
                    data,
                    headers: hdrs,
                    ...(withCredentials ? { withCredentials: true, anonymous: false } : {}),
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            responseHeaders = response.responseHeaders;
                            const finalUrl = response.finalUrl || response.responseURL || '';

                            if (callbacks && callbacks.onResponseHeadersReceieved) {
                                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });

                                if (request) {
                                    request.abort();
                                    resolve({ request, response, status: response.status, responseHeaders, finalUrl });
                                }
                            }
                        }

                        callbacks && callbacks.onStateChange && callbacks.onStateChange({ request, response });
                    },
                    onprogress: response => {
                        callbacks && callbacks.onProgress && callbacks.onProgress({ request, response });
                    },
                    onload: response => {
                        const { responseText, status } = response;
                        const dom = response?.response;
                        const finalUrl = response.finalUrl || response.responseURL || '';
                        callbacks && callbacks.onLoad && callbacks.onLoad(response);
                        resolve({ source: responseText, request, status, dom, responseHeaders, finalUrl });
                    },
                    onerror: error => {
                        callbacks && callbacks.onError && callbacks.onError(error);
                        reject(error);
                    },
                });
            });
        },
        /**
     * @param url
     * @param callbacks
     * @param headers
     * @param responseType
     * @returns {Promise<unknown>}
     */
        get: (url, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.promise(resolve => resolve(h.http.base('GET', url, callbacks, headers, null, responseType)));
        },
        /**
     * @param url
     * @param data
     * @param callbacks
     * @param headers
     * @returns {Promise<unknown>}
     */
        post: (url, data = {}, callbacks = {}, headers = {}) => {
            return h.promise(resolve => resolve(h.http.base('POST', url, callbacks, headers, data)));
        },
    },
    re: {
        /**
     * @param pattern
     * @returns {string|*}
     */
        stripFlags: pattern => {
            if (!h.contains('/', pattern)) {
                return pattern;
            }

            const s = pattern.split('').reverse().join('');

            const index = s.indexOf('/');

            return s.substring(index).split('').reverse().join('');
        },
        /**
     * @param pattern
     * @returns {string|*}
     */
        toString: pattern => {
            let stringified = h.re.stripFlags(pattern.toString());

            if (stringified[0] === '/') {
                stringified = stringified.substring(1);
            }

            if (stringified[stringified.length - 1] === '/') {
                stringified = stringified.substring(0, stringified.length - 1);
            }

            return stringified;
        },
        /**
     * @param pattern
     * @param flags
     * @returns {RegExp}
     */
        toRegExp: (pattern, flags) => {
            return new RegExp(pattern, flags);
        },
        /**
     * @param pattern
     * @param subject
     * @returns {*|null}
     */
        match: (pattern, subject) => {
            const matches = pattern.exec(subject);
            return matches && matches.length ? matches[0] : null;
        },
        /**
     * @source regex101.com
     * @param pattern
     * @param subject
     * @returns {*[]}
     */
        matchAll: (pattern, subject) => {
            const matches = [];

            let m;

            while ((m = pattern.exec(subject)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === pattern.lastIndex) {
                    pattern.lastIndex++;
                }

                matches.push(m[0]);
            }

            return matches;
        },
    },
};

Array.prototype.unique = function (cb) {
    return h.unique(this, cb);
};

const parsers = {
    thread: {
        /**
     * @returns {string}
     */
        parseTitle: () => {
            const emojisPattern =
                  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
            let parsed = h.stripTags(['a', 'span'], h.element('.p-title-value').innerHTML).replace('/\n/g', '');
            return !settings.naming.allowEmojis ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim() : parsed.trim();
        },
        /**
     *
     * @param post
     * @returns {{pageNumber: string, post, spoilers: *, footer: HTMLElement, contentContainer: Element, textContent: (*|string|string), postId: string, postNumber: string, content: (*|string|string|string)}}
     */
        parsePost: post => {
            const messageContent = post.parentNode.parentNode.querySelector('.message-content > .message-userContent');
            const footer = post.parentNode.parentNode.querySelector('footer');
            const messageContentClone = messageContent.cloneNode(true);

            const postIdAnchor = post.querySelector('li:last-of-type > a');
            const postId = /(?<=\/post-).*/i.exec(postIdAnchor.getAttribute('href'))[0];
            const postNumber = postIdAnchor.textContent.replace('#', '').trim();

            // Remove the following from the post content:
            // 1. Quotes.
            // 2. CodeBlock headers
            // 3. Spoiler button text from each spoiler
            // 2. Icons from un-furled urls (url parser can sometimes match them).
            ['.contentRow-figure', '.js-unfurl-favicon', 'blockquote', '.button-text > span']
                .flatMap(i => [...messageContentClone.querySelectorAll(i)])
                .forEach(i => {
                if (i.tagName === 'BLOCKQUOTE') {
                    // Only remove blockquotes that quote the other posts.
                    if (i.querySelector('.bbCodeBlock-title')) {
                        i.remove();
                    }
                } else {
                    i.remove();
                }
            });

            // Remove thread links.
            [...messageContentClone.querySelectorAll('.contentRow-header > a[href^="https://simpcity.su/threads"]')]
                .map(a => a.parentNode.parentNode.parentNode.parentNode)
                .forEach(i => i.remove());

            // Prevent duplicate detection: Simpcity attachment links often wrap a JPGX preview image.
            // For parsing only, remove the preview <img> inside attachment links so we don't count/download it twice.
            try {
                messageContentClone.querySelectorAll('a[href*="/attachments/"] img').forEach((img) => img.remove());
            } catch (e) { /* ignore */ }


            // Decode forum outbound link protection (e.g. /redirect/?to=...&m=b64) for parsing only.
            // Some forums wrap external URLs in a redirect/proxy URL and store the real target in query params
            // (often base64). If we don't decode it, host detection won't see the original domain.
            try {
                const __decodeB64Url = (s) => {
                    if (!s) return null;
                    let b = String(s).trim().replace(/-/g, '+').replace(/_/g, '/');
                    while (b.length % 4) b += '=';
                    try { return atob(b); } catch (e) { return null; }
                };

                const __decodeForumRedirect = (href) => {
                    if (!href) return null;
                    try {
                        const u = new URL(href, location.origin);
                        const p = (u.pathname || '').toLowerCase();

                        const looksRedirect = p === '/redirect' || p === '/redirect/' || p.startsWith('/redirect/');
                        const looksLinkProxy = p.includes('link-proxy');
                        if (!looksRedirect && !looksLinkProxy) return null;

                        const to = u.searchParams.get('to')
                                 || u.searchParams.get('url')
                                 || u.searchParams.get('u')
                                 || u.searchParams.get('link')
                                 || u.searchParams.get('target');
                        if (!to) return null;

                        const mode = (u.searchParams.get('m') || '').toLowerCase();
                        let decoded = null;

                        if (mode === 'b64' || mode === 'base64') {
                            decoded = __decodeB64Url(to);
                        }

                        // Some installs omit the mode flag even though `to` is base64.
                        if (!decoded) {
                            const looksB64 = /^[A-Za-z0-9+/_-]+={0,2}$/.test(to) && to.length >= 16 && (to.length % 4 !== 1);
                            if (looksB64) decoded = __decodeB64Url(to);
                        }

                        if (!decoded) {
                            try { decoded = decodeURIComponent(to); } catch (e) { decoded = to; }
                        }

                        decoded = String(decoded || '').trim();

                        // Some protectors double-encode.
                        if (decoded && !/^https?:\/\//i.test(decoded) && /%3a%2f%2f/i.test(decoded)) {
                            try {
                                const d2 = decodeURIComponent(decoded);
                                if (/^https?:\/\//i.test(d2)) decoded = d2;
                            } catch (e) { /* ignore */ }
                        }

                        if (!/^https?:\/\//i.test(decoded)) return null;
                        return decoded;
                    } catch (e) {
                        return null;
                    }
                };


                const __imagebamFullFromThumb = (thumbUrl) => {
                    if (!thumbUrl) return null;
                    const s = String(thumbUrl).trim();
                    if (!s) return null;

                    try {
                        const u = new URL(s, location.origin);
                        const host = (u.hostname || '').toLowerCase();
                        if (!host.endsWith('.imagebam.com')) return null;
                        if (!host.startsWith('thumbs')) return null;

                        const newHost = host.replace(/^thumbs/i, 'images');
                        let path = u.pathname || '';
                        // common thumb naming: *_t.jpg
                        path = path.replace(/_t(\.[a-z0-9]+)$/i, '$1');
                        // some variants use -t
                        path = path.replace(/-t(\.[a-z0-9]+)$/i, '$1');

                        return `${u.protocol}//${newHost}${path}`;
                    } catch (e) {
                        return null;
                    }
                };

                const sel = [
                    'a[href*="/redirect/"]',
                    'a[href^="/redirect"]',
                    'a[href*="redirect?"]',
                    'a[href*="link-proxy"]',
                ].join(', ');

                messageContentClone.querySelectorAll(sel).forEach((a) => {
                    // Some XenForo installs store the redirect/protected URL in different attrs.
                    const candidates = [
                        a.getAttribute('href'),
                        a.getAttribute('data-href'),
                        a.getAttribute('data-url'),
                    ].filter(Boolean);

                    for (const c of candidates) {
                        const decoded = __decodeForumRedirect(c);
                        if (decoded) {
                            let finalUrl = decoded;
a.setAttribute('data-url', finalUrl);
                            a.setAttribute('href', finalUrl);
                            a.setAttribute('data-xfpd-decoded', '1');
                            break;
                        }
                    }
                });

                // Prevent common thumbnail URLs inside decoded redirect links from being treated as direct downloads.
                // (Keeps the UI intact for non-thumb embeds, but avoids downloading *_t.jpg / thumbs.* previews.)
                try {
                    messageContentClone.querySelectorAll('a[data-xfpd-decoded="1"] img').forEach((img) => {
                        const u = (img.getAttribute('data-url') || img.getAttribute('src') || '').trim();
                        if (!u) return;

                        let host = '';
                        let path = '';
                        try {
                            const uu = new URL(u, location.origin);
                            host = (uu.hostname || '').toLowerCase();
                            path = (uu.pathname || '').toLowerCase();
                        } catch (e) {
                            // ignore
                        }

                        const isThumb =
                            host.includes('thumb') ||
                            /_t\.(?:jpe?g|png|webp|gif)$/i.test(u) ||
                            /\/thumbs?\//i.test(path);

                        if (isThumb) img.remove();
                    });
                } catch (e) { /* ignore */ }
            } catch (e) { /* ignore */ }

            // Extract spoilers from the post content.
            const spoilers = [...messageContentClone.querySelectorAll('.bbCodeBlock--spoiler > .bbCodeBlock-content')]
            .filter(s => !s.querySelector('.bbCodeBlock--unfurl'))
            .concat([...messageContentClone.querySelectorAll('.bbCodeInlineSpoiler')].filter(s => !s.querySelector('.bbCodeBlock--unfurl')))
            .map(s => s.innerText)
            .concat(
                h.re
                .matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?\/,;.]+/gis, messageContentClone.innerText)
                .map(s => s.trim()),
            )
            .map(s =>
                 s
                 .trim()
                 .replace(/^:/, '')
                 .replace(/\bp:\b/i, '')
                 .replace(/\bpw:\b/i, '')
                 .replace(/\bkey:\b/i, '')
                 .trim(),
                )
            .filter(s => s !== '')
            .unique();

            const postContent = messageContentClone.innerHTML;
            const postTextContent = messageContentClone.innerText;

            const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);

            const pageNumber = matches && matches.length ? Number(matches[0]) : 1;

            return {
                post,
                postId,
                postNumber,
                pageNumber,
                spoilers,
                footer,
                content: postContent,
                textContent: postTextContent,
                contentContainer: messageContent,
            };
        },
    },
    hosts: {
        /**
     * @param postContent
     * @returns {(*&{id: number, enabled: boolean})[]}
     */
        parseHosts: postContent => {
            let parsed = [];

            for (const host of hosts) {
                // Require at-least the signature plus an array of matchers.
                if (host.length < 2) {
                    continue;
                }

                const signature = host[0].split(':');
                const matchers = host[1];

                if (!h.isArray(matchers) || !matchers.length) {
                    continue;
                }

                const name = signature[0];
                let category = signature.length > 1 ? signature[1] : 'misc';

                let singleMatcherPattern = matchers[0];
                let albumMatcherPattern = matchers.length > 1 ? matchers[1] : null;

                const execMatcher = matcher => {
                    let pattern = matcher.toString().replace(/~an@/g, 'a-zA-Z0-9');

                    const stripQueryString = h.contains('<no_qs>', pattern.toString());
                    const stripTrailingSlash = !h.contains('<keep_ts>', pattern.toString());
                    pattern = pattern.replace('<no_qs>', '').replace('<keep_ts>', '');

                    if (h.contains('!!', pattern)) {
                        pattern = pattern.replace('!!', '');
                        pattern = h.re.toRegExp(h.re.toString(pattern), 'igs');
                    } else {
                        const pat = `(?<=data-url="|src="|href=")${h.re.toString(pattern)}.*?(?=")|https?:\/\/(www.)?${h.re.toString(pattern)}.*?(?=("|<|$|\]|'))`;
                        pattern = h.re.toRegExp(pat, 'igs');
                    }

                    let matches = h.re.matchAll(pattern, postContent).unique();

                    matches = matches.map(url => {
                // Some XenForo post HTML can leak into the match (e.g. trailing </a>...</div>), which then
                // creates "ghost" resources (and broken filenames like "div>"). Strip anything after the URL.
                url = String(url || '');
                url = url.replace(/&amp;/g, '&');
                url = url.split(/[\s"'<>]/)[0].trim();
                // Normalize scheme so the same link in different representations dedupes cleanly.
                if (url && !/^https?:\/\//i.test(url)) {
                    url = `https://${url}`;
                }

                        if (stripQueryString && h.contains('?', url)) {
                            url = url.substring(0, url.indexOf('?'));
                        }

                        if (stripTrailingSlash && url[url.length - 1]) {
                            url = url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
                        }

                        return url.trim();
                    });

                    return h.unique(matches);
                };

                const categories = category.split(',');

                if (singleMatcherPattern) {
                    let singleCategory = [categories[0]].map(c => {
                        if (c === 'image' || c === 'video') {
                            return `${h.ucFirst(c)}s`;
                        }

                        if (c.trim() !== '') {
                            return h.ucFirst(c);
                        }

                        return 'Links';
                    })[0];

                    parsed.push({
                        name,
                        type: 'single',
                        category: singleCategory,
                        resources: execMatcher(singleMatcherPattern),
                    });
                }

                if (albumMatcherPattern) {
                    let albumCategory = categories.length > 1 ? categories[1] : categories[0];

                    albumCategory = `${h.ucFirst(albumCategory)} Albums`;

                    parsed.push({
                        name,
                        type: 'album',
                        category: albumCategory,
                        resources: execMatcher(albumMatcherPattern),
                    });
                }
            }

            return parsed
                .map(p => ({
                ...p,
                enabled: true,
                id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER),
            }))
                .filter(p => p.resources.length);
        },
    },
};

const styles = {
    tippy: {
        theme: `.tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:1 7px 7px;border-bottom-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:#3f3f3f}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:gainsboro}`,
    },
};

const ui = {
    /**
   * @returns {string}
   */
    getTooltipBackgroundColor: () => {
        const scheme = document.documentElement.dataset.colorScheme;
        return scheme === 'dark' ? '#2B2B2B' : '#EDF0F3';
    },

    /**
   * @param target
   * @param content
   * @param options
   * @returns {*}
   */
    tooltip: (target, content, options = {}) => {
        // noinspection JSUnusedGlobalSymbols
        return tippy(target, {
            arrow: true,
            theme: 'transparent',
            allowHTML: true,
            content: content,
            appendTo: () => document.body,
            placement: 'left',
            interactive: true,
            ...options,
        });
    },
    pBars: {
        /**
     * @param color
     * @param height
     * @param width
     * @returns {HTMLDivElement}
     */
        base: (color, height = '3px', width = '0%') => {
            const pb = document.createElement('div');
            pb.style.height = height;
            pb.style.background = color;
            pb.style.width = width;
            return pb;
        },
        /**
     * @param color
     * @returns {HTMLDivElement}
     */
        createFileProgressBar: (color = '#46658b') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '1px';
            return pb;
        },
        /**
     * @param color
     * @returns {HTMLDivElement}
     */
        createTotalProgressBar: (color = '#545454') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '10px';
            return pb;
        },
    },
    labels: {
        /**
     * @param initialText
     * @param color
     * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
     */
        createBlockLabel: (initialText = null, color = '#959595') => {
            const container = document.createElement('div');
            container.style.color = color;
            container.style.fontSize = '12px';

            const span = document.createElement('span');
            container.appendChild(span);

            if (initialText) {
                span.textContent = initialText;
            }

            return {
                el: span,
                container,
            };
        },
        status: {
            /**
       * @param initialText
       * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
       */
            createStatusLabel: (initialText = '') => {
                const label = ui.labels.createBlockLabel(initialText);
                label.el.style.marginBottom = '3px';

                return label;
            },
        },
    },
    buttons: {
        /**
     * @returns {HTMLAnchorElement}
     */
        createPostDownloadButton: () => {
            const downloadPostBtn = document.createElement('a');
            downloadPostBtn.setAttribute('href', '#');
            downloadPostBtn.innerHTML = '🡳 Download';

            return downloadPostBtn;
        },
        /**
     * @returns {HTMLLIElement}
     */
        createPostDownloadButtonContainer: () => {
            return document.createElement('li');
        },
        /**
     * @param post
     * @returns {{container: HTMLLIElement, btn: HTMLAnchorElement}}
     */
        addDownloadPostButton: post => {
            const btnDownloadPostContainer = ui.buttons.createPostDownloadButtonContainer();
            const btnDownloadPost = ui.buttons.createPostDownloadButton();
            btnDownloadPostContainer.appendChild(btnDownloadPost);
            post.prepend(btnDownloadPostContainer);

            return {
                container: btnDownloadPostContainer,
                btn: btnDownloadPost,
            };
        },
    },
    forms: {
        /**
     * @param id
     * @param label
     * @param checked
     * @returns {string}
     */
        createCheckbox: (id, label, checked) => {
            return `
          <div class="menu-row" style="margin-top: -5px;">
            <label class="iconic" style="user-select: none">
              <input type="checkbox" ${checked ? 'checked="checked"' : ''} id="${id}" />
                <i aria-hidden="true"></i>
                <span
                  class="iconic-label"
                  style="margin-left: -7px"
                >
                    <span id="${id}-label">${label}</span>
                </span>
            </label>
          </div>
          `;
        },
        /**
     * @param content
     * @returns {string}
     */
        createRow: content => {
            return `
      <div class="menu-row">
          ${content}
      </div>
      `;
        },
        /**
     * @param label
     * @returns {string}
     */
        createLabel: label => {
            return `
      <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #3DB7C7;">
          ${label}
      </div>
      `;
        },
        config: {
            page: {
                /**
         * @param backgroundColor
         * @param innerHTML
         * @returns {string}
         */
                createForm: (backgroundColor, innerHTML) => {
                    return `
          <form
            id="downloader-page-config-form"
            class="menu-content"
            style="padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
          >
            ${innerHTML}
          </form>
          `;
                },
            },
            post: {
                /**
         * @param postId
         * @param backgroundColor
         * @param innerHTML
         * @returns {string}
         */
                createForm: (postId, backgroundColor, innerHTML) => {
                    return `
          <form
            id="download-config-form-${postId}"
            class="menu-content"
            style="user-select: none; padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
          >
            ${innerHTML}
          </form>
          `;
                },
                /**
         * @param currentValue
         * @param postId
         * @param backgroundColor
         * @param placeholder
         * @returns {string}
         */
                createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => {
                    return `
          <div class="menu-row">
            <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #3DB7C7;">
                File / Archive Name
            </div>
            <input
              id="filename-input-${postId}"
              type="text"
              style="background: ${backgroundColor};"
              class="archive-name input"
              autocomplete="off"
              name="keywords"
              placeholder="${placeholder}"
              aria-label="Search"
              value="${currentValue}"
            />
          </div>
          `;
                },
                /**
         * @returns {string}
         */
                createZippedCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-zipped`, 'Zipped', checked);
                },
                /**
         * @returns {string}
         */
                /**
         * @returns {string}
         */
                createFlattenCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-flatten`, 'Flatten', checked);
                },
                /**
         * @returns {string}
         */
                createSkipDownloadCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-download`, 'Skip Download', checked);
                },
                /**
         * @returns {string}
         */
                createVerifyBunkrLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, 'Verify Bunkr Links', checked);
                },
                /**
         * @returns {string}
         */
                createGenerateLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-links`, 'Generate Links', checked);
                },
                /**
         * @returns {string}
         */
                createGenerateLogCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-log`, 'Generate Log', checked);
                },
                /**
         * @returns {string}
         */
                createSkipDuplicatesCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, 'Skip Duplicates', checked);
                },
                /**
         * @param hosts
         * @param getTotalDownloadableResourcesCB
         * @returns {string}
         */
                createFilterLabel: (hosts, getTotalDownloadableResourcesCB) => {
                    return `
          <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; margin-left: 8px; color: #3DB7C7;">Filter <span id="filtered-count">(${getTotalDownloadableResourcesCB(
                        hosts,
                    )})</span></div>
          `;
                },
                /**
         * @param postId
         * @returns {string}
         */
                createToggleAllCheckbox: postId => {
                    return ui.forms.createCheckbox(`settings-toggle-all-hosts-${postId}`, settings.ui.checkboxes.toggleAllCheckboxLabel, true);
                },
                /**
         * @param postId
         * @param host
         * @returns {string}
         */
                createHostCheckbox: (postId, host) => {
                    const title = `${host.name} ${host.category}`;
                    return ui.forms.createCheckbox(`downloader-host-${host.id}-${postId}`, `${title} (${host.resources.length})`, host.enabled);
                },
                /**
         * @param postId
         * @param filterLabel
         * @param hostsHtml
         * @param createToggleAllCheckbox
         * @returns {string}
         */
                createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAllCheckbox) => {
                    return `
          <div>
            ${filterLabel}
            ${createToggleAllCheckbox ? ui.forms.config.post.createToggleAllCheckbox(postId) : ''}
            ${hostsHtml}
          </div>
          `;
                },
                /**
         * @param parsedPost
         * @param parsedHosts
         * @param defaultFilename
         * @param settings
         * @param onSubmitFormCB
         * @param totalDownloadableResourcesForPostCB
         * @param btnDownloadPost
         */
                createPostConfigForm: (
                    parsedPost,
                    parsedHosts,
                    defaultFilename,
                    settings,
                    onSubmitFormCB,
                    totalDownloadableResourcesForPostCB,
                    btnDownloadPost,
                ) => {
                    const { postId } = parsedPost;
                    const color = ui.getTooltipBackgroundColor();

                    const customFilename = settings.output.find(o => o.postId === postId)?.value || '';

                    let hostsHtml = '<div>';
                    parsedHosts.forEach(host => (hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host)));
                    hostsHtml += '</div>';

                    const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB);

                    const settingsHeading = `
          <div class="menu-row">
            <div style="font-weight: bold; margin-top:3px; margin-bottom: 4px; color: #3DB7C7;">
                Settings
            </div>
          </div>
          `;

                    let formHtml = [
                        window.isFF ? ui.forms.config.post.createFilenameInput(customFilename, postId, color, defaultFilename) : null,
                        settingsHeading,
                        ui.forms.config.post.createZippedCheckbox(postId, settings.zipped),                        ui.forms.config.post.createFlattenCheckbox(postId, settings.flatten),
                        ui.forms.config.post.createSkipDuplicatesCheckbox(postId, settings.skipDuplicates),
                        ui.forms.config.post.createGenerateLinksCheckbox(postId, settings.generateLinks),
                        ui.forms.config.post.createGenerateLogCheckbox(postId, settings.generateLog),
                        ui.forms.config.post.createSkipDownloadCheckbox(postId, settings.skipDownload),
                        ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, settings.verifyBunkrLinks),
                        ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
                        ui.forms.createRow(
                            '<a href="#download-page" style="color: #3DB7C7; font-weight: bold"><i class="fa fa-arrow-up"></i> Show Download Page Button</a>',
                        ),
                    ].filter(c => c !== null);

                    const configForm = ui.forms.config.post.createForm(postId, color, formHtml.join(''));

                    ui.tooltip(btnDownloadPost, configForm, {
                        onShown: instance => {
                            const inputEl = h.element(`#filename-input-${postId}`);
                            if (inputEl) {
                                inputEl.addEventListener('input', e => {
                                    const value = e.target.value;
                                    const o = settings.output.find(o => o.postId === postId);
                                    if (o) {
                                        o.value = value;
                                    } else {
                                        settings.output.push({
                                            postId,
                                            value,
                                        });
                                    }
                                });
                            }

                            let prevSettings = JSON.parse(JSON.stringify(settings));

                            const setPrevSettings = settings => {
                                prevSettings = JSON.parse(JSON.stringify(settings));
                            };

                            let updateSettings = true;

                            h.element(`#settings-${postId}-skip-download`).addEventListener('change', e => {
                                const checked = e.target.checked;

                                settings.skipDownload = checked;

                                settings.flatten = checked ? false : prevSettings.flatten;
                                settings.skipDuplicates = checked ? false : prevSettings.skipDuplicates;
                                settings.generateLinks = checked ? true : prevSettings.generateLinks;

                                updateSettings = false;

                                h.element(`#settings-${postId}-flatten`).checked = checked ? false : prevSettings.flatten;
                                h.element(`#settings-${postId}-flatten`).disabled = checked;

                                h.element(`#settings-${postId}-skip-duplicates`).checked = checked ? false : prevSettings.skipDuplicates;
                                h.element(`#settings-${postId}-skip-duplicates`).disabled = checked;

                                h.element(`#settings-${postId}-generate-links`).checked = checked ? true : prevSettings.generateLinks;
                                h.element(`#settings-${postId}-generate-links`).disabled = checked;

                                setTimeout(() => (updateSettings = true), 100);
                            });

                            h.element(`#settings-${postId}-verify-bunkr-links`).addEventListener('change', e => {
                                settings.verifyBunkrLinks = e.target.checked;
                            });
                            h.element(`#settings-${postId}-zipped`).addEventListener('change', e => {
                                settings.zipped = e.target.checked;                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });
h.element(`#settings-${postId}-generate-links`).addEventListener('change', e => {
                                settings.generateLinks = e.target.checked;

                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-generate-log`).addEventListener('change', e => {
                                settings.generateLog = e.target.checked;

                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-flatten`).addEventListener('change', e => {
                                settings.flatten = e.target.checked;

                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-skip-duplicates`).addEventListener('change', e => {
                                settings.skipDuplicates = e.target.checked;

                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#download-config-form-${postId}`).addEventListener('submit', async e => {
                                e.preventDefault();
                                onSubmitFormCB({ tippyInstance: instance });
                            });

                            if (parsedHosts.length > 1) {
                                h.element(`#settings-toggle-all-hosts-${postId}`).addEventListener('change', async e => {
                                    e.preventDefault();

                                    const checked = e.target.checked;

                                    const hostCheckboxes = parsedHosts.flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`));
                                    const checkedHostCheckboxes = hostCheckboxes.filter(e => e.checked);
                                    const unCheckedHostCheckboxes = hostCheckboxes.filter(e => !e.checked);

                                    if (checked) {
                                        unCheckedHostCheckboxes.forEach(c => c.click());
                                    } else {
                                        checkedHostCheckboxes.forEach(c => c.click());
                                    }
                                });
                            }

                            parsedHosts.forEach(host => {
                                h.element(`#downloader-host-${host.id}-${postId}`).addEventListener('change', e => {
                                    host.enabled = e.target.checked;
                                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                                    h.element('#filtered-count').textContent = `(${filteredCount})`;

                                    if (parsedHosts.length > 0) {
                                        const checkedLength = parsedHosts
                                        .flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`))
                                        .filter(h => h.checked).length;

                                        const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);

                                        const totalDownloadableResources = parsedHosts
                                        .filter(host => host.enabled && host.resources.length)
                                        .reduce((acc, host) => acc + host.resources.length, 0);

                                        btnDownloadPost.innerHTML = `🡳 Download (${totalDownloadableResources}/${totalResources})`;

                                        if (parsedHosts.length > 1) {
                                            const toggleAllHostsCheckbox = h.element(`#settings-toggle-all-hosts-${postId}`);

                                            if (checkedLength !== parsedHosts.length) {
                                                toggleAllHostsCheckbox.removeAttribute('checked');
                                                toggleAllHostsCheckbox.checked = false;
                                            } else {
                                                toggleAllHostsCheckbox.setAttribute('checked', 'checked');
                                                toggleAllHostsCheckbox.checked = true;
                                            }
                                        }
                                    }
                                });
                            });
                        },
                    });
                },
            },
        },
    },
};

const init = {
    injectCustomStyles: () => {
        // Tippy transparent theme.
        const styleEl = document.createElement('style');
        styleEl.textContent = styles.tippy.theme;
        document.head.append(styleEl);

        const customStyles = document.createElement('style');
        // Margins classes
        const marginClasses = [];

        for (let i = 1; i <= 15; i++) {
            marginClasses.push(`.m-l-${i} {margin-left: ${i}px;}`);
            marginClasses.push(`.m-t-${i} {margin-top: ${i}px;}`);
        }

        customStyles.textContent = marginClasses.join('\n');
        document.head.append(customStyles);
    },
};
// Holds the posts that are processing downloads.
let processing = [];

/**
 * An array of arrays defining how to match hosts inside the posts.
 *
 * The first item in the array is the signature.
 * The second item is an array of matchers.
 *
 * A matcher is a regular expression matching a substring inside the post.
 *
 * The first matcher matches a single resource (e.g. an image or a video).
 * The second matcher matches a folder or an album (e.g. a set of related images)
 *
 * [0: signature(name+category), 1: [single_regex, album_regex]]
 *
 * When applied, every matcher is prefixed with https?:\/\/(www.)?
 *
 * Every matcher is matched against the following attributes:
 *
 * href, src, data-url
 *
 * You must not include the pattern to match attributes.
 * They are automatically handled when a matcher is run.
 *
 * For a completely custom pattern, put !! (two excl. characters) anywhere in it:
 *
 * [/!!https:\/\/cyberfile.su\/\w+(?=")/, /cyberfile.su\/folder\//]
 *
 * @signature string The name and categories of the host, separated by a colon.
 * @matchers array The name and categories of the host, separated by a colon.
 *
 * Matchers can include the following options anywhere
 * (preferably where it doesn't break the pattern) within a pattern.
 *
 * @option <no_qs> Removes query string
 * @option <keep_ts> Keeps the trailing slash
 *
 * The following placeholders can be used inside any matcher pattern:
 *
 * @placeholder ~an@ -> a-zA-Z0-9
 *
 */
const hosts = [
    ['Simpcity:Attachments', [/(\/attachments\/|\/data\/video\/)/]],
    ['Coomer:Profiles', [/coomer.st\/[~an@._-]+\/user/]],
    ['Coomer:image', [/(\w+\.)?coomer.st\/(data|thumbnail)/]],
    ['JPGX:image', [/(simp\d+\.)?(selti-delivery\.ru|jpg\d?\.(church|fish|fishing|pet|su|cr))\/(?!(img\/|a\/|album\/))/, /jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/]],
    ['kemono:direct link', [/.{2,6}\.kemono.cr\/data\//]],
    ['Postimg:image', [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]], //[/!!https?:\/\/(www.)?postimg.cc\/(.{8})/]],
    ['Ibb:image',
     [
         /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
         /ibb.co\/album\/[~an@_.-]+/,
     ],
    ],
    ['Ibb:direct link', [/!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/]],
    ['Imagevenue:image', [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
    ['Imgvb:image', [/imgvb.com\/images\//, /imgvb.com\/album/]],
    ['Imgbox:image', [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
    ['Onlyfans:image', [/public.onlyfans.com\/files/]],
    ['Reddit:image', [/(\w+)?.redd.it/]],
    ['Pomf2:File', [/pomf2.lain.la/]],
    ['Nitter:image', [/nitter\.(.{1,20})\/pic/]],
    ['Twitter:image', [/([~an@.]+)?twimg.com\//]],
    ['Pixhost:image', [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
    ['Imagebam:image', [/imagebam.com\/(view|gallery)/]],
    ['Imagebam:full embed', [/images\d.imagebam.com/]],
    ['turbo:video', [/([\w-]+\.)?turbo\.cr\/(embed|v|d)\//]],
    ['turbo:albums', [/([\w-]+\.)?turbo\.cr\/a\//]],
    ['Redgifs:video', [/!!redgifs.com(\/|\\\/)ifr.*?(?=["']|&quot;)/]],
    ['Redgifs:user', [/redgifs\.com\/users\//]],
    ['Bunkr:',
     [
         /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/,
     ]
    ],
    ['Bunkr:Albums', [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]],
    ['Give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
    ['Pixeldrain:', [/(focus\.)?(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)\/[lu]\//]],
    ['Gofile:', [/gofile.io\/d/]],
    ['Filester:links', [/filester\.me\/d\//]],
    ['Filester:albums', [/filester\.me\/f\/[~an@-_.]+<no_qs>/]],
    ['Box.com:', [/m\.box\.com\//]],
    ['Yandex:', [/(disk\.)?yandex\.[a-z]+/]],
    ['Cyberfile:', [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    ['Cyberdrop:', [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /cyberdrop\.[a-z]{2,}\/a\//]],
    ['Pornhub:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
    ['Noodlemagazine:video', [/(adult.)?noodlemagazine.com\/watch\//]],
    ['Spankbang:video', [/spankbang.com\/.*?\/video/]],
];

/**
 * An array of url resolvers.
 *
 * @type {((RegExp[]|(function(*): *))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*, *): Promise<string>))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*): *))[])[]}
 */
/* -------------------------------------------------------------------------
 * Turbo sign hardening:
 * - timeout 5000ms
 * - retry 2x with jitter delay 700–1400ms
 * This avoids rare ~50s "waiting" stalls on https://turbo.cr/api/sign
 * ------------------------------------------------------------------------- */
const XFPD_TURBO_SIGN_TIMEOUT_MS = 5000;
const XFPD_TURBO_SIGN_RETRIES = 2;
const XFPD_TURBO_SIGN_JITTER_MIN_MS = 700;
const XFPD_TURBO_SIGN_JITTER_MAX_MS = 1400;

const xfpdSleepMs = ms => new Promise(r => setTimeout(r, ms));
const xfpdJitterMs = (minMs, maxMs) => {
    const lo = Math.min(minMs, maxMs);
    const hi = Math.max(minMs, maxMs);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
};

const xfpdGmGetText = (getUrl, headers, timeoutMs) => new Promise(resolve => {
    try {
        GM_xmlhttpRequest({
            method: 'GET',
            url: String(getUrl),
            headers: headers || {},
            responseType: 'text',
            anonymous: false,
            timeout: Number(timeoutMs) || 0,
            onload: r => resolve({ ok: true, status: r.status || 0, text: String(r.responseText || r.response || '') }),
            onerror: () => resolve({ ok: false, status: 0, text: '' }),
            ontimeout: () => resolve({ ok: false, status: 0, text: '' }),
        });
    } catch (e) {
        resolve({ ok: false, status: 0, text: '' });
    }
});

const xfpdTurboFetchSignJsonWithTimeout = async (turboId, refererUrl) => {
    const id = String(turboId || '').trim();
    if (!id) return null;

    const embedUrl = String(refererUrl || `https://turbo.cr/embed/${id}`);
    const headers = {
        Accept: 'application/json, text/plain, */*',
        Referer: embedUrl,
    };

    const signUrls = [
        `https://turbo.cr/api/sign?v=${encodeURIComponent(id)}`,
        `https://turbo.cr/sign?v=${encodeURIComponent(id)}`, // legacy fallback
    ];

    for (let attempt = 0; attempt <= XFPD_TURBO_SIGN_RETRIES; attempt++) {
        for (const signUrl of signUrls) {
            const r = await xfpdGmGetText(signUrl, headers, XFPD_TURBO_SIGN_TIMEOUT_MS);
            if (!r || !r.ok || r.status !== 200 || !r.text) continue;

            let j = null;
            try { j = JSON.parse(r.text); } catch (e) { j = null; }
            if (!j || !j.url) continue;

            const ok = (j.success === undefined) ? true : !!j.success;
            if (ok) return j;
        }
        if (attempt < XFPD_TURBO_SIGN_RETRIES) {
            await xfpdSleepMs(xfpdJitterMs(XFPD_TURBO_SIGN_JITTER_MIN_MS, XFPD_TURBO_SIGN_JITTER_MAX_MS));
        }
    }
    return null;
};

const xfpdTurboSignUrlWithTimeout = async (turboId, refererUrl, nameHint) => {
    const j = await xfpdTurboFetchSignJsonWithTimeout(turboId, refererUrl);
    if (!j || !j.url) return null;

    let signed = j.url;
    const originalName = j.original_filename || nameHint;

    // Preserve filename for Turbo CDN downloads (used later for saveAs)
    if (signed && originalName && !/[?&]fn=/.test(String(signed))) {
        const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
        signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
    }
    return signed;
};

const resolvers = [
    [
        [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
        url => url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, 'https://pbs.twimg.com/media/$3'),
    ],
    [
        [/imagevenue.com/],
        async (url, http) => {
            const { dom } = await http.get(url);
            return dom.querySelector('.col-md-12 > a > img').getAttribute('src');
        },
    ],
    [[/pomf2.lain.la/], url => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, 'pomf2.lain.la/f/$1.$2')],
    [[/coomer.st\/(data|thumbnail)/], url => url],
    [
        [/coomer.st/, /:!coomer.st\/(data|thumbnail)/],
        async (url, http) => {
            const host = `https://coomer.st`;

            const profileId = url.replace(/\?.*/, '').split('/').reverse()[0];

            let finalURL = url.replace(/\?.*/, '');

            let nextPage = null;

            const posts = [];

            console.log(`[coomer.st] Resolving profile: ${profileId}`);

            let page = 1;

            do {
                const { dom } = await http.get(finalURL);

                const links = [...dom.querySelectorAll('.card-list__items > article')]
                .map(a => a.querySelector('.post-card__heading > a'))
                .map(a => {
                    return {
                        link: `${host}${a.getAttribute('href')}`,
                        id: a.getAttribute('href').split('/').reverse()[0],
                    };
                });

                posts.push(...links);
                nextPage = dom.querySelector('a[title="Next page"]');

                if (nextPage) {
                    finalURL = `${host}${nextPage.getAttribute('href')}`;
                }

                console.log(`[coomer.st] Resolved page: ${page}`);

                page++;
            } while (nextPage);

            const resolved = [];

            let index = 1;

            for (const post of posts) {
                const { dom } = await http.get(post.link);
                const filesContainer = dom.querySelector('.post__files');

                if (filesContainer) {
                    const images = filesContainer.querySelectorAll('.post__thumbnail > .fileThumb');

                    if (images.length) {
                        resolved.push(
                            ...[...images].map(a => {
                                return {
                                    url: `${host}${a.getAttribute('href')}`,
                                    folderName: post.id,
                                };
                            }),
                        );
                    }
                }

                const attachments = dom.querySelectorAll('.post__attachments > .post__attachment > .post__attachment-link');

                if (attachments.length) {
                    resolved.push(
                        ...[...attachments].map(a => {
                            const url = `${host}${a.getAttribute('href')}`;

                            let folder = 'Images';

                            const ext = h.ext(url.replace(/\?.*/, ''));

                            if (settings.extensions.video.includes(`.${ext.toLowerCase()}`)) {
                                folder = 'Videos';
                            }

                            {
                                return {
                                    url,
                                    folderName: `${post.id}/${folder}`,
                                };
                            }
                        }),
                    );
                }

                console.log(`[coomer.st] Resolved post ${index} / ${posts.length}`);

                index++;
            }

            return {
                folderName: profileId,
                resolved,
            };
        },
    ],
    [
        [/(postimg|pixxxels).cc/],
        async (url, http) => {
            url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, 'https://postimg.cc/$3');
            const { dom } = await http.get(url);
            return dom.querySelector('.controls > nobr > a').getAttribute('href');
        },
    ],
    [[/kemono.cr\/data/], url => url],
    [
        [/(jpg\d\.(church|fish|fishing|pet|su|cr))|selti-delivery\.ru\//i, /:!jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        url =>
        url
        .replace('.th.', '.')
        .replace('.md.', '.')
    ],
    [
        [/jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        async (url, http, spoilers, postId) => {
            url = url.replace(/\?.*/, '');

            let reFetch = false;

            let { source, dom } = await http.get(url, {
                onStateChange: response => {
                    // If it's a redirect, we'll have to fetch the new url.
                    if (response.readyState === 2 && response.finalUrl !== url) {
                        url = response.finalUrl;
                        reFetch = true;
                    }
                },
            });

            if (reFetch) {
                const { source: src, dom: d } = await http.get(url);
                source = src;
                dom = d;
            }

            if (h.contains('Please enter your password to continue', source)) {
                const authTokenNode = dom.querySelector('input[name="auth_token"]');
                const authToken = !authTokenNode ? null : authTokenNode.getAttribute('value');

                if (!authToken || !spoilers || !spoilers.length) {
                    return null;
                }

                const attemptWithPassword = async password => {
                    const { source, dom } = await http.post(
                        url,
                        `auth_token=${authToken}&content-password=${password}`,
                        {},
                        {
                            Referer: url,
                            Origin: 'https://jpg6.su',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );
                    return { source, dom };
                };

                let authenticated = false;

                spoilers = ['ramona'];

                for (const spoiler of spoilers) {
                    const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
                    if (!h.contains('Please enter your password to continue', src)) {
                        authenticated = true;
                        source = src;
                        dom = d;
                        break;
                    }
                }

                if (!authenticated) {
                    log.host.error(postId, `::Could not resolve password protected album::: ${url}`, 'jpg6.su');
                    return null;
                }
            }

            const resolvePageImages = async dom => {
                const images = [...dom.querySelectorAll('.list-item-image > a > img')]
                .map(img => img.getAttribute('src'))
                .map(url =>
                     url
                     .replace('.md.', '.')
                     .replace('.th.', '.')
                    );

                const nextPage = dom.querySelector('a[data-pagination="next"]');

                if (nextPage && nextPage.hasAttribute('href')) {
                    const { dom } = await http.get(nextPage.getAttribute('href'));
                    images.push(...(await resolvePageImages(dom)));
                }

                return images;
            };

            const resolved = await resolvePageImages(dom);

            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [
        [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            try{
                const { dom } = await http.get(url);
                return dom.querySelector('.header-content-right > a').getAttribute('href');
            } catch (err){
                url => url;
            }
        },
    ],

    [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], url => url],
    [
        [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            const albumId = url.replace(/\?.*/, '').split('/').reverse()[0];
            const { source, dom } = await http.get(url);
            const imageCount = Number(dom.querySelector('span[data-text="image-count"]').innerText);
            const pageCount = Math.ceil(imageCount / 32);
            const authToken = h.re.match(/(?<=auth_token=").*?(?=")/i, source);

            const fetchPageData = async (albumId, page, seekEnd, authToken) => {
                const seek = seekEnd || '';
                const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albumId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albumId}&auth_token=${authToken}&seek=${seek}&items_per_page=32`;
                const { source: response } = await http.post(
                    'https://ibb.co/json',
                    data,
                    {},
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                );

                try {
                    const parsed = JSON.parse(response);

                    if (parsed && parsed.status_code && parsed.status_code === 200) {
                        const html = parsed.html.replace('"', '"');
                        return {
                            urls: h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html).map(o => JSON.parse(decodeURIComponent(o)).url),
                            parsed,
                        };
                    }

                    return { urls: [], parsed };
                } catch (e) {
                    return { urls: [], parsed };
                }
            };

            const resolved = [];

            let seekEnd = '';

            for (let i = 1; i <= pageCount; i++) {
                const data = await fetchPageData(albumId, i, seekEnd, authToken);
                seekEnd = data.parsed.seekEnd;
                resolved.push(...data.urls);
            }

            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [[/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//], url => url.replace(/\/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/')],
    [
        [/pixhost.to\/gallery\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);

            let imageLinksInput = dom?.querySelector('.share > div:nth-child(2) > input');

            if (h.isNullOrUndef(imageLinksInput)) {
                imageLinksInput = dom?.querySelector('.share > input:nth-child(2)');
            }

            const resolved = h.re
            .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, imageLinksInput.getAttribute('value'))
            .map(url => url.replace(/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/'));

            return {
                dom,
                source,
                folderName: dom?.querySelector('.link > h2').innerText.trim(),
                resolved,
            };
        },
    ],
    [
        [/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/(v\/)?/i, /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
        async (url, http) => {
            try {
                const cleanUrl = String(url || '').split('#')[0];

                // If this already looks like a direct media file URL, keep it (don't call /api/vs).
                // (CDN links usually include the real filename already.)
                if (
                    /\.(?:mp4|m4v|webm|mov|mkv|jpg|jpeg|png|gif|webp|zip|rar|7z|pdf)(?:$|\?)/i.test(cleanUrl) &&
                    !/\/(?:v|f|d)\//i.test(cleanUrl)
                ) {
                    return cleanUrl;
                }

                const u = new URL(cleanUrl);
                const origin = u.origin;
                const pathname = u.pathname || '';

                const segments = pathname.split('/').filter(Boolean);
                const index = segments.findIndex(s => ['f', 'v', 'd'].includes(s));
                const id = index > -1 ? segments.slice(index + 1).join('/') : segments.pop();

// Best-effort: read the human filename from the view page (og:title / h1 / <title>).
// This lets us rename CDN GUID links back to the original filename.
try {
    const strip = (s) => String(s || '').split('#')[0].split('?')[0];
    const bases = xfpdBunkrFilterBases([origin, 'https://bunkr.pk', 'https://bunkr.cr']);

    for (const base of bases) {
        const base0 = String(base || '').replace(/\/$/, '');
        const candidates = [];
        if (/\/v\//i.test(pathname) && base0 === origin) candidates.push(cleanUrl);
        candidates.push(`${base0}/v/${id}`);
        candidates.push(`${base0}/f/${id}`);

        const uniq = candidates.filter((v, i, a) => a.indexOf(v) === i);
        let found = false;

        for (const viewUrl of uniq) {
            const viewRes = await xfpdBunkrGetWithCfRetry(http, viewUrl, base0, base0 === 'https://bunkr.cr');
            const dom = viewRes?.dom;
            const viewSource = viewRes?.source || '';

            // If Cloudflare interstitial is active, don't capture a bogus "Just a moment..." title as a filename hint.
            if (xfpdLooksLikeCfChallenge(viewSource, dom)) continue;

            let title =
                dom?.querySelector?.('meta[property="og:title"]')?.getAttribute?.('content') ||
                dom?.querySelector?.('h1')?.textContent ||
                dom?.querySelector?.('title')?.textContent ||
                '';
            title = String(title || '').replace(/\s+/g, ' ').trim();
            title = title.replace(/\s*\|\s*Bunkr\s*$/i, '').trim();

            if (title && !xfpdLooksLikeCfFilenameHint(title)) {
                bunkrNameByUrl.set(cleanUrl, title);
                bunkrNameByUrl.set(strip(cleanUrl), title);
                bunkrNameByUrl.set(viewUrl, title);
                bunkrNameByUrl.set(strip(viewUrl), title);
                found = true;
                break;
            }
        }

        if (found) break;
    }
} catch (e) {}

                const decodeFinalUrl = data => {
                    try {
                        if (!data || !data.url) return null;
                        if (!data.encrypted) return data.url;

                        const binaryString = atob(data.url);
                        const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);

                        return Array.from(binaryString)
                            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                            .join('');
                    } catch (e) {
                        return null;
                    }
                };

                const tryVs = async base => {
                    const base0 = String(base || '').replace(/\/$/, '');
                    const vsEndpoint = `${base0}/api/vs`;

                    try {
                        const data = await xfpdBunkrPostVsWithCfRetry(http, vsEndpoint, id, cleanUrl, base0, base0 === 'https://bunkr.cr');
                        if (!data) return null;

                        let finalUrl = decodeFinalUrl(data);

                        if (!finalUrl || typeof finalUrl !== 'string') return null;
                        finalUrl = finalUrl.trim();
                        if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;

                        // Attach filename hint to the final URL too (so later download naming can pick it up).
                        try {
                            const strip = (s) => String(s || '').split('#')[0].split('?')[0];

                            // Prefer filename from /api/vs JSON when available (works even if /v/ is blocked by CF/403).
                            const vsHint = xfpdBunkrExtractNameFromVsData(data);

                            const hint =
                                vsHint ||
                                bunkrNameByUrl.get(cleanUrl) ||
                                bunkrNameByUrl.get(strip(cleanUrl)) ||
                                '';

                            if (hint && String(hint).trim() && !xfpdLooksLikeCfFilenameHint(hint)) {
                                const h0 = String(hint).trim();
                                bunkrNameByUrl.set(cleanUrl, h0);
                                bunkrNameByUrl.set(strip(cleanUrl), h0);
                                bunkrNameByUrl.set(finalUrl, h0);
                                bunkrNameByUrl.set(strip(finalUrl), h0);
                            }
                        } catch (e) {}
return finalUrl;
                    } catch (e) {
                        return null;
                    }
                };

                const apiBases = xfpdBunkrFilterBases([origin, 'https://bunkr.pk', 'https://bunkr.cr']);
                let finalURL = null;

                for (const b of apiBases) {
                    finalURL = await tryVs(b);
                    if (finalURL) break;
                }

                return finalURL || cleanUrl;
            } catch (error) {
                console.error(error?.message || error);
                return url;
            }
        },
    ],
[
    [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
    async (url, http, _, __, ___, progressCB) => {
        const cleanUrl = String(url || '').split('#')[0];
        const baseUrl = cleanUrl.split('?')[0].replace(/\/+$/, '');

        const resolved = [];
        const seen = new Set();

        // Bunkr album: keep the human filename from the album grid (title / .theName) and attach it to resolved CDN URLs.
        const nameHintBySlug = new Map();

        let firstDom = null;
        let firstSource = null;

        const sanitizeName = s => String(s || '')
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();

        const decodeFinalUrl = data => {
            try {
                if (!data || !data.url) return null;
                if (!data.encrypted) return data.url;

                const binaryString = atob(data.url);
                const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);

                return Array.from(binaryString)
                    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                    .join('');
            } catch (e) {
                return null;
            }
        };

        const extractSlugsFromDom = dom => {
            const containers = dom?.querySelectorAll?.('.grid-images > div') || [];
            const slugs = [];

            for (const c of containers) {
                const a =
                    c.querySelector('a[class="after:absolute after:z-10 after:inset-0"]') ||
                    c.querySelector('a[href*="/f/"]') ||
                    c.querySelector('a[href*="/v/"]') ||
                    c.querySelector('a[href*="/d/"]');

                const href = a?.getAttribute?.('href') || '';
                const m = href.match(/\/(f|v|d)\/([^\/?#]+)/i);
                if (m && m[2]) {
                    const slug = m[2];
                    slugs.push(slug);

                    // Name hint is visible on /a/ pages (e.g. <div title="...mp4"> or .theName). Use it later when we only have a CDN GUID URL.
                    try {
                        let hint = c?.getAttribute?.('title') || '';
                        if (!hint) hint = c?.querySelector?.('.theName')?.textContent || '';
                        if (!hint) hint = c?.querySelector?.('p.truncate')?.textContent || '';
                        if (!hint) hint = c?.querySelector?.('.grid-images_box-txt p')?.textContent || '';
                        hint = String(hint || '').replace(/\s+/g, ' ').trim();
                        if (hint) nameHintBySlug.set(slug, hint);
                    } catch (e) {}
                }
            }

            return slugs;
        };

        const asyncPool = async (limit, items, worker) => {
            const results = new Array(items.length);
            let i = 0;

            const runners = Array.from({ length: Math.max(1, limit) }, async () => {
                while (true) {
                    const idx = i++;
                    if (idx >= items.length) break;
                    try {
                        results[idx] = await worker(items[idx], idx);
                    } catch (e) {
                        results[idx] = null;
                    }
                }
            });

            await Promise.all(runners);
            return results;
        };

        const origin = (() => {
            try { return new URL(baseUrl).origin; } catch (e) { return 'https://bunkr.cr'; }
        })();

        const vsBasesAll = [origin, 'https://bunkr.pk', 'https://bunkr.cr'].filter((v, i, a) => a.indexOf(v) === i);

        let folderName = null;

        const MAX_PAGES = 500;
        const CONCURRENCY = 8;

        const albumUrlObj = (() => {
            try { return new URL(baseUrl); } catch (e) { return null; }
        })();
        const albumPath = (albumUrlObj && albumUrlObj.pathname) ? albumUrlObj.pathname : (() => {
            try { return new URL(cleanUrl).pathname; } catch (e) { return '/'; }
        })();
        const albumBasesAll = [origin, 'https://bunkr.pk', 'https://bunkr.cr'].filter((v, i, a) => a.indexOf(v) === i);
        let albumBaseChosen = null;

        for (let page = 1; page <= MAX_PAGES; page++) {
            const requestedPageUrl = `${baseUrl}?page=${page}`;

            if (typeof progressCB === 'function') {
                progressCB(`Resolving: ${requestedPageUrl}`);
            }

            const pageBases = albumBaseChosen
                ? [albumBaseChosen, ...xfpdBunkrFilterBases(albumBasesAll).filter(b => b !== albumBaseChosen)]
                : xfpdBunkrFilterBases(albumBasesAll);

            let dom = null, source = '';
            let pageUrl = requestedPageUrl;
            let slugs = [];

            for (const base of pageBases) {
                const base0 = String(base || '').replace(/\/$/, '');
                const candidate = `${base0}${albumPath}?page=${page}`;
                pageUrl = candidate;

                try {
                    ({ dom, source } = await xfpdBunkrGetWithCfRetry(http, candidate, base0, base0 === 'https://bunkr.cr'));
                } catch (e) {
                    dom = null;
                    source = '';
                }

                if (xfpdLooksLikeCfChallenge(source, dom)) continue;

                slugs = extractSlugsFromDom(dom);
                if (page === 1 && !slugs.length) {
                    continue;
                }

                if (!albumBaseChosen) albumBaseChosen = base0;
                break;
            }

            if (!dom) break;
            if (!slugs.length) break;
if (page === 1) {
                firstDom = dom;
                firstSource = source;

                const h1 = dom?.querySelector?.('h1');
                const title = (h1?.innerText || h1?.textContent || '').split('\n')[0]?.trim();
                if (title) folderName = sanitizeName(title);
            }

            const fresh = [];
            for (const s of slugs) {
                if (!s || seen.has(s)) continue;
                seen.add(s);
                fresh.push(s);
            }

            if (!fresh.length) break;

            const urls = await asyncPool(CONCURRENCY, fresh, async (slug) => {
                let data = null;
                for (const base of xfpdBunkrFilterBases(vsBasesAll)) {
                    const base0 = String(base || '').replace(/\/$/, '');
                    const ep = `${base0}/api/vs`;
                    data = await xfpdBunkrPostVsWithCfRetry(http, ep, slug, pageUrl, base0, base0 === 'https://bunkr.cr');
                    if (data && typeof data === 'object' && ('url' in data)) break;
                    data = null;
                }
                if (!data) return null;

                let finalUrl = decodeFinalUrl(data);
                if (!finalUrl || typeof finalUrl !== 'string') return null;

                finalUrl = finalUrl.trim();
                if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;

                // Attach the album filename hint to the final URL so download naming can use it.
                try {
                    const strip = (s) => String(s || '').split('#')[0].split('?')[0];
                    const hint = (nameHintBySlug.get(slug) || xfpdBunkrExtractNameFromVsData(data) || '');
                    if (hint && String(hint).trim()) {
                        const h0 = String(hint).trim();
                        bunkrNameByUrl.set(finalUrl, h0);
                        bunkrNameByUrl.set(strip(finalUrl), h0);
                    }
                } catch (e) {}

                return finalUrl;
            });

            for (const u of urls) if (u) resolved.push(u);
        }

        if (!folderName) folderName = h.basename(baseUrl);

        return {
            dom: firstDom,
            source: firstSource,
            folderName,
            resolved,
        };
    }
],

    [
        [/give.xxx\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const profileId = h.re.match(/(?<=profile-id=")\d+/, source);

            const resolved = [];

            let username = null;

            let firstMediaId = null;

            let mediaId = 1;

            let iteration = 1;

            while (true) {
                let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
                endpoint += iteration === 1 ? '&min_id=1' : `&max_id=${mediaId}`;
                const { source } = await http.get(endpoint);
                if (h.contains('_v', source)) {
                    const parsed = JSON.parse(source);

                    if (username === null) {
                        username = parsed[0].account.username;
                    }

                    if (firstMediaId === null) {
                        firstMediaId = parsed[0].id;
                    } else {
                        if (firstMediaId === parsed[0].id) {
                            break;
                        }
                    }
                    resolved.push(
                        ...parsed.flatMap(i => {
                            return i.media_attachments
                                .map(a => {
                                return a.sizes;
                            })
                                .map(s => s.large || s.normal || s.small);
                        }),
                    );
                    mediaId = parsed[parsed.length - 1].id;
                } else {
                    break;
                }

                iteration++;
            }

            return {
                dom,
                source,
                folderName: username,
                resolved,
            };
        },
    ],
    [
        [/(?:focus\.)?(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)\/[ul]/],
        url => {
            let resolved = url.replace('/u/', '/api/file/').replace('/l/', '/api/list/');
            resolved = h.contains('/api/list', resolved) ? `${resolved}/zip` : resolved;
            resolved = h.contains('/api/file', resolved) ? `${resolved}?download` : resolved;
            return resolved;
        },
    ],
    [
        [/([~an@]+\.)?pornhub.com\/view_video/],
        async (url, http) => {
            url = url.replace(/([a-zA-Z0-9]+\.)?pornhub/, 'pornhub');

            const resolvePH = async url => {
                const { dom } = await http.get(
                    url,
                    {},
                    {
                        referer: url,
                        cookie: 'age-verified: 1; platform=tv; cookiesBannerSeen=1; hasVisited=1',
                    },
                );
                const script = [...dom.querySelectorAll('script')]
                .map(s => s.innerText)
                .filter(s => /var\smedia_\d+/gis.test(s))
                .map(s => {
                    return {
                        mediaVars: h.re.matchAll(/var\smedia_\d+=.*?;/gis, s),
                        flashVars: s,
                    };
                })[0];

                const { mediaVars, flashVars } = script;

                return mediaVars
                    .map(m => {
                    const cleaned = m
                    .replace(/\/\*.*?\*\//gis, '')
                    .replace(/var\smedia_\d+=/i, '')
                    .replace(';', '');

                    return cleaned
                        .split('+')
                        .map(s => s.trim())
                        .map(s => {
                        let value = new RegExp(`var ${s}=".*?"`, 'isg').exec(flashVars)[0];
                        value = value.replace(/.*?"/i, '').replace(/"/i, '');
                        return value;
                    })
                        .join('');
                })
                    .find(url => url.indexOf('pornhub.com/video/get_media?s=') > -1);
            };

            let parsed = null;

            let tries = 0;

            // Scumbag pornhub won't send the right json link the first time.
            // Still, there are ocassional 403s / redirects.
            // TODO: Fix me
            do {
                const infoURL = await resolvePH(url);

                if (!infoURL) {
                    continue;
                }

                try {
                    const { source } = await h.http.get(infoURL);
                    const json = JSON.parse(source);
                    const fetchedFormats = json.reverse();
                    const qualities = ['1080', '720', '480', '320', '240'];
                    for (const q of qualities) {
                        const f = fetchedFormats.find(f => f.quality === q);
                        if (f && f.videoUrl) {
                            parsed = f.videoUrl;
                            break;
                        }
                    }
                } catch (e) {}
                await h.delayedResolve(1000);
                tries++;
            } while (!parsed && tries < 20);

            return parsed;
        },
    ],
    [
        [/gofile.io\/d/],
        async (url, http, spoilers, postId) => {
        const WT_KEY = 'xfpd_gofile_wt';
        const AT_KEY = 'xfpd_gofile_at';
        const WT_MAX_AGE_MS = 24 * 3600 * 1000;
        const AT_MAX_AGE_MS = 24 * 3600 * 1000;

        const gmGet = (key, fallback) => {
            try {
                return typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback;
            } catch (e) {
                return fallback;
            }
        };

        const gmSet = (key, val) => {
            try {
                if (typeof GM_setValue === 'function') GM_setValue(key, val);
            } catch (e) {}
        };

        const gmReq = async (method, url, data = null, headers = {}, responseType = 'text') => {
            return await http.base(method, url, {}, headers, data, responseType);
        };

        const getWebsiteToken = async (force = false) => {
            const now = Date.now();
            const cached = gmGet(WT_KEY, null);

            if (!force && cached && cached.value && cached.ts && now - cached.ts < WT_MAX_AGE_MS) {
                return cached.value;
            }

            const candidates = ['https://gofile.io/dist/js/config.js', 'https://gofile.io/dist/js/alljs.js'];

            for (const u of candidates) {
                try {
                    const { source } = await gmReq('GET', u, null, {}, 'text');
                    const txt = source || '';

                    const m =
                        txt.match(/\bwt\s*=\s*"([^"]+)"/) ||
                        txt.match(/fetchData\.wt\s*=\s*"([^"]+)"/) ||
                        txt.match(/"wt"\s*:\s*"([^"]+)"/);

                    if (m && m[1]) {
                        gmSet(WT_KEY, { value: m[1], ts: now });
                        return m[1];
                    }
                } catch (e) {}
            }

            throw new Error('Could not extract GoFile website token (WT).');
        };

        const createAccountToken = async wt => {
            const { source } = await gmReq(
                'POST',
                'https://api.gofile.io/accounts',
                JSON.stringify({}),
                {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'x-website-token': wt,
                },
                'text',
            );

            const json = JSON.parse(source || '{}');

            if (!json || json.status !== 'ok' || !json.data || !json.data.token) {
                throw new Error(`createAccount failed: ${json?.message || json?.status || 'unknown'}`);
            }

            const token = json.data.token;

            try {
                settings.hosts.goFile.token = token;
            } catch (e) {}

            gmSet(AT_KEY, { token, ts: Date.now() });
            return token;
        };

        const getAccountToken = async (force = false) => {
            // If the user provided a personal Bearer token, always use it.
            // (This is optional; leaving it empty keeps the anonymous account-token flow.)
            try {
                const override = settings?.hosts?.goFile?.bearerOverride;
                if (override && String(override).trim() !== '') {
                    return String(override).trim();
                }
            } catch (e) {}

            const now = Date.now();

            const cached = gmGet(AT_KEY, null);
            if (!force && cached && cached.token && cached.ts && now - cached.ts < AT_MAX_AGE_MS) {
                try {
                    settings.hosts.goFile.token = cached.token;
                } catch (e) {}
                return cached.token;
            }

            try {
                if (!force && settings && settings.hosts && settings.hosts.goFile && settings.hosts.goFile.token) {
                    return settings.hosts.goFile.token;
                }
            } catch (e) {}

            const wt = await getWebsiteToken(false);
            return await createAccountToken(wt);
        };

        const apiContentsRaw = async (contentId, passwordHash, wt, token) => {
            let apiUrl = `https://api.gofile.io/contents/${encodeURIComponent(contentId)}`;
            if (passwordHash) apiUrl += `?password=${encodeURIComponent(passwordHash)}`;

            const { source } = await gmReq(
                'GET',
                apiUrl,
                null,
                {
                    accept: 'application/json',
                    authorization: `Bearer ${token}`,
                    'x-website-token': wt,
                },
                'text',
            );

            return JSON.parse(source || '{}');
        };

        const apiContents = async (contentId, passwordHash) => {
            let wt = await getWebsiteToken(false);
            let token = await getAccountToken(false);

            let json = await apiContentsRaw(contentId, passwordHash, wt, token);
            if (json && json.status === 'ok') return json;

            const s = String(json?.status || json?.message || '').toLowerCase();

            if (s.includes('unauthorized') || s.includes('token') || s.includes('invalid')) {
                wt = await getWebsiteToken(true);
                token = await getAccountToken(true);
                json = await apiContentsRaw(contentId, passwordHash, wt, token);
                return json;
            }

            return json;
        };

        const resolveAlbum = async (urlOrId, spoilers) => {
            const id = String(urlOrId).includes('gofile.io/d/') ? String(urlOrId).split('/').reverse()[0] : String(urlOrId);

            let props = await apiContents(id, null);

            if (props && props.status === 'error-notFound') {
                log.host.error(postId, `::Album not found::: ${urlOrId}`, 'gofile.io');
                    return null;
                }

            if (props && props.status === 'error-notPublic') {
                log.host.error(postId, `::Album not public::: ${urlOrId}`, 'gofile.io');
                    return null;
                }

            if (props && props.status === 'error-passwordRequired') {
                log.host.info(postId, `::Album requires password::: ${urlOrId}`, 'gofile.io');

                if (!spoilers || !spoilers.length) {
                    return props;
                }

                        log.host.info(postId, `::Trying with ${spoilers.length} available password(s)::`, 'gofile.io');

                    for (const spoiler of spoilers) {
                        const hash = sha256(spoiler);
                    const attempt = await apiContents(id, hash);

                    if (attempt && attempt.status === 'ok') {
                            log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, 'gofile.io');
                        props = attempt;
                        break;
                        }
                    }
                }

                return props;
            };

            const props = await resolveAlbum(url, spoilers);

            let folderName = h.basename(url);

        if (!props || props.status !== 'ok' || !props.data) {
            if (props && props.status === 'error-passwordRequired') {
                log.host.error(postId, `::Password required (no valid password found)::: ${url}`, 'gofile.io');
            } else {
                log.host.error(postId, `::Unable to resolve album::: ${url}`, 'gofile.io');
            }

                return {
                    dom: null,
                    source: null,
                    folderName,
                    resolved: [],
                };
            }

            const resolved = [];

            const getChildAlbums = async (props, spoilers) => {
                if (!props || props.status !== 'ok' || !props.data || !props.data.children) {
                    return [];
                }

                const resolved = [];

            folderName = props.data.name || folderName;

                const files = props.data.children;

                for (const file in files) {
                    const obj = files[file];

                if (!obj) continue;

                    if (obj.type === 'file') {
                    const fileId = obj.id || obj.code;
                    const fileName = encodeURIComponent(obj.name || fileId || 'file');

                    // Prefer direct/CDN links when available. Do NOT force /download/web/
                    // (web flow can return album HTML).
                    const candidates = [obj.directLink, obj.link, obj.downloadLink].filter(Boolean);
                    let link =
                        candidates.find(u => /\/download\/direct\//i.test(String(u))) ||
                        candidates[0] ||
                        (fileId ? `https://gofile.io/download/web/${fileId}/${fileName}` : null);

                    if (link) {
                        // Preserve original GoFile filename (from API) so we don't rely on URL-encoded path segment.
                        try {
                            if (obj.name) {
                                if (fileId) gofileNameById.set(String(fileId), String(obj.name));
                                if (link) gofileNameByUrl.set(String(link), String(obj.name));
                            }
                        } catch (e) {}resolved.push(link);
                    }
                } else if (obj.type === 'folder') {
                    const folderId = obj.id || obj.code;
                    if (!folderId) continue;

                    const folderProps = await resolveAlbum(folderId, spoilers);
                        resolved.push(...(await getChildAlbums(folderProps, spoilers)));
                    }
                }

                return resolved;
            };

            resolved.push(...(await getChildAlbums(props, spoilers)));

            if (!resolved.length) {
                log.host.error(postId, `::Empty album::: ${url}`, 'gofile.io');
            }

            return {
                dom: null,
                source: null,
                folderName,
                resolved,
            };
        },
    ],
    [
        [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers) => {
            const { source } = await http.get(url);
            const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];

            const getFileInfo = async () => {
                const { source } = await http.post(
                    'https://cyberfile.me/account/ajax/file_details',
                    `u=${u}`,
                    {},
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                );
                return source;
            };

            let response = await getFileInfo();

            let requiredPassword = false;
            let unlocked = false;

            if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers.length) {
                const html = JSON.parse(response).html;

                const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html);

                const folderId = matches.length ? matches[1] : null;

                if (!folderId) {
                    return null;
                }

                requiredPassword = true;
                for (const password of spoilers) {
                    const { source } = await http.post(
                        'https://cyberfile.me/ajax/folder_password_process',
                        `submitme=1&folderId=${folderId}&folderPassword=${password}`,
                        {},
                        {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );

                    if (h.contains('success', source) && JSON.parse(source).success === true) {
                        unlocked = true;
                        break;
                    }
                }
            }

            if (requiredPassword && unlocked) {
                response = await getFileInfo();
            }

            return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\\//gi, '/');
        },
    ],
    [
        [/cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers) => {
            const { source, dom } = await http.get(url);

            const script = [...dom.querySelectorAll('script')].map(s => s.innerText).filter(s => h.contains('data-toggle="tab"', s))[0];

            const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script);

            const loadFiles = async () => {
                const { source } = await http.post(
                    'https://cyberfile.me/account/ajax/load_files',
                    `pageType=folder&nodeId=${nodeId}`,
                    {},
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                );
                return source;
            };

            let response = await loadFiles();

            let requiredPassword = false;
            let unlocked = false;

            if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers.length) {
                requiredPassword = true;
                for (const password of spoilers) {
                    const { source } = await http.post(
                        'https://cyberfile.me/ajax/folder_password_process',
                        `submitme=1&folderId=${nodeId}&folderPassword=${password}`,
                        {},
                        {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );

                    if (h.contains('success', source) && JSON.parse(source).success === true) {
                        unlocked = true;
                        break;
                    }
                }
            }

            if (!unlocked) {
                return null;
            }

            if (requiredPassword && unlocked) {
                response = await loadFiles();
            }

            const resolved = [];

            let folderName = h.basename(url);

            const props = JSON.parse(response);

            if (props && props.html) {
                folderName = props.page_title || folderName;

                const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);

                for (const fileUrl of urls) {
                    const { source } = await http.get(fileUrl);
                    const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
                    const { source: response } = await http.post(
                        'https://cyberfile.me/account/ajax/file_details',
                        `u=${u}`,
                        {},
                        {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );
                    resolved.push(h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\\//gi, '/'));
                }
            }

            return {
                dom,
                source,
                folderName,
                resolved,
            };
        },
    ],
    [
        [/([\w-]+\.)?turbo\.cr\/a\//],
        async (url, http) => {
            const { dom, source } = await http.get(url);

            // Album folder naming (stable + readable): turbo_<albumId> - <title>
            const mAlbum = url.match(/\/a\/([^\/?#]+)/i);
            const albumId = mAlbum ? mAlbum[1] : null;
            const base = albumId ? `turbo_${albumId}` : 'turbo_album';

            const rawTitle = dom?.querySelector('h1')?.textContent?.trim() || '';
            const invalidSub = settings.naming.invalidCharSubstitute || '_';

            let safeTitle = rawTitle
            .replace(/[\\/:*?"<>|]/g, invalidSub)
            .replace(/\s+/g, ' ')
            .trim();

            // Cap title to avoid extremely long Windows paths
            if (safeTitle.length > 120) safeTitle = safeTitle.slice(0, 120).trim();

            let folderName = base;
            if (safeTitle && safeTitle.toLowerCase() !== base.toLowerCase()) {
                folderName = `${safeTitle} - ${base}`;
            }

            // Final sanitize (defensive)
            folderName = folderName
                .replace(/[\\/:*?"<>|]/g, invalidSub)
                .replace(/\s+/g, ' ')
                .trim();

            // Hard cap for safety
            if (folderName.length > 180) folderName = folderName.slice(0, 180).trim();

            // Map videoId -> original filename (from album HTML)
            const idToName = new Map();

            // Collect video ids (and names) from the table rows (server-rendered HTML)
            let ids = Array.from(dom?.querySelectorAll('tr.file-row') || [])
            .map(row => {
                const a = row.querySelector('a[href^="/v/"]');
                const id = (a?.getAttribute('href') || '').match(/\/v\/([^\/?#]+)/i)?.[1];
                if (id) {
                    const nm = row.getAttribute('data-name') || row.dataset?.name;
                    if (nm) idToName.set(id, nm);
                }
                return id;
            })
            .filter(Boolean)
            .unique();

            // Fallback: regex scan (if DOM parsing fails)
            if (!ids.length && source) {
                ids = (source.match(/href="\/v\/([^"?#]+)"/gi) || [])
                    .map(s => (s.match(/\/v\/([^"?#]+)/i) || [null, null])[1])
                    .filter(Boolean)
                    .unique();
            }

            const resolved = [];

            for (const id of ids) {
                const embedUrl = `https://turbo.cr/embed/${id}`;
                let signed = null;
                try {
                    signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, idToName.get(id));
                } catch (e) {}

// Fallback: if signing fails, try to read media URL from the embed page
                if (!signed) {
                    try {
                        const { dom: edom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                        const src =
                              edom?.querySelector('source[src]')?.getAttribute('src') ||
                              edom?.querySelector('video[src]')?.getAttribute('src');
                        if (src) {
                            signed = new URL(src, embedUrl).toString();
                        }
                    } catch (e) {}
                }

                // If we got a Turbo CDN URL and have an original name, attach fn=
                if (signed && /turbocdn\.st/i.test(signed)) {
                    const originalName = idToName.get(id);
                    if (originalName && !/[?&]fn=/.test(signed)) {
                        const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
                        signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
                    }
                }

                // If sign fails, keep a workable fallback
                if (signed && id) {
                    try { turboIdBySignedUrl.set(String(signed), String(id)); } catch (e) {}
                }
                resolved.push(signed || `https://turbo.cr/d/${id}`);
            }

            return {
                dom,
                source,
                folderName,
                resolved,
            };
        },
    ],
    [
        [/([\w-]+\.)?turbo\.cr\/(v|d)\//],
        async (url, http) => {
            const mm = url.match(/\/(v|d)\/([^\/?#]+)/i);
            let id = mm ? mm[2] : null;
            if (!id) {
                return url;
            }

            const embedUrl = `https://turbo.cr/embed/${id}`;
            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, null);
                if (signed) return signed;
            } catch (e) {}

// Fallback: try to read <source>/<video> directly from the embed page
            try {
                const { dom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) {
                    return new URL(src, embedUrl).toString();
                }
            } catch (e) {}

            // Last fallback: the site's direct download route
            return `https://turbo.cr/d/${id}`;
        },
    ],
    [[/public.onlyfans.com\/files/], async url => url],
    [
        [/([\w-]+\.)?turbo\.cr\/embed/],
        async (url, http) => {
            const m = url.match(/\/embed\/([^\/?#]+)/i);
            const id = m ? m[1] : null;
            if (!id) {
                return null;
            }

            const embedUrl = `https://turbo.cr/embed/${id}`;
            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, null);
                if (signed) return signed;
            } catch (e) {}

// Fallback: try to read <source> / <video> directly if present
            try {
                const { dom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) {
                    return new URL(src, embedUrl).toString();
                }
            } catch (e) {}

            return null;

        },
    ],

    [
        [/redgifs\.com\/users\//i],
        async (url, http, passwords, postId, postSettings, progressCB) => {
            const raw = String(url || '');
            const m = raw.match(/redgifs\.com\/users\/([^\/?#]+)/i);
            const username = m && m[1] ? decodeURIComponent(m[1]) : '';

            if (!username) {
                return null;
            }

            const baseUrl = `https://www.redgifs.com/users/${username}`;

            const fetchTempToken = async () => {
                try {
                    const { source, status } = await http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
                    if (status === 200 && source && h.contains('token', source)) {
                        const token = JSON.parse(source).token;
                        if (token) {
                            GM_setValue('redgifs_token', token);
                        }
                        return token || null;
                    }
                } catch (e) {}
                return null;
            };

            let token = GM_getValue('redgifs_token', null);
            if (!token) {
                token = await fetchTempToken();
            }
            if (!token) {
                return null;
            }

            const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
            const resolved = [];

            const MAX_PAGES = 5000;
            const COUNT = 80;
            const ORDER = 'new';

            const fetchPage = async (page, t) => {
                const apiUrl = `https://api.redgifs.com/v2/users/${encodeURIComponent(username)}/search?order=${ORDER}&page=${page}&count=${COUNT}`;
                try {
                    return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                } catch (e) {
                    return { source: null, status: 0 };
                }
            };

            const tryFetchPage = async (page) => {
                let attempt = 0;
                let last = { source: null, status: 0 };

                while (attempt < 3) {
                    attempt++;

                    last = await fetchPage(page, token);

                    if (last.status === 429) {
                        await new Promise(r => setTimeout(r, 800 * attempt));
                        continue;
                    }

                    if (last.status === 401 || last.status === 403 || (last.source && /unauthorized|forbidden/i.test(last.source))) {
                        token = await fetchTempToken();
                        if (!token) {
                            return last;
                        }
                        last = await fetchPage(page, token);
                    }

                    return last;
                }

                return last;
            };

            let pages = 1;

            for (let page = 1; page <= pages && page <= MAX_PAGES; page++) {
                if (typeof progressCB === 'function') {
                    progressCB(`Resolving: ${baseUrl} (page ${page}/${pages})`);
                }

                const { source, status } = await tryFetchPage(page);

                if (status !== 200 || !source) {
                    break;
                }

                let j;
                try {
                    j = JSON.parse(source);
                } catch (e) {
                    break;
                }

                const gifs = Array.isArray(j?.gifs) ? j.gifs : (Array.isArray(j?.results) ? j.results : []);
                pages = Number(j?.pages) || pages;

                for (const g of gifs) {
                    const urls = g?.urls || g?.gif?.urls;
                    if (!urls) {
                        continue;
                    }

                    let best = null;

                    for (const k of preferredKeys) {
                        const v = urls[k];
                        if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
                            best = v;
                            break;
                        }
                    }

                    if (!best) {
                        for (const v of Object.values(urls)) {
                            if (typeof v === 'string' && /^https?:\/\//i.test(v) && /\.mp4(\?|$)/i.test(v)) {
                                best = v;
                                break;
                            }
                        }
                    }

                    if (best) {
                        resolved.push(best);
                    }
                }

                if (!gifs.length) {
                    break;
                }

                await new Promise(r => setTimeout(r, 75));
            }

            if (!resolved.length) {
                return null;
            }

            return {
                folderName: username,
                resolved,
            };
        },
    ],
[
        [/redgifs\.com(\/|\\\/)(ifr|watch|gifs\/detail|gifs\/watch)/i],
        async (url, http) => {
            const raw = String(url || '');
            const idMatch =
                  raw.match(/redgifs\.com(?:\/|\\\/)(?:ifr(?:\/|\\\/)|watch(?:\/|\\\/)|gifs(?:\/|\\\/)detail(?:\/|\\\/))?([a-z0-9_-]+)/i) ||
                  raw.match(/\/([a-z0-9_-]+)(?:\?.*)?$/i);
            const id = (idMatch && idMatch[1] ? String(idMatch[1]) : '').match(/[a-z0-9_-]+/i)?.[0];

            if (!id) {
                return null;
            }

            const fetchTempToken = async () => {
                try {
                    const { source, status } = await http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
                    if (status === 200 && source && h.contains('token', source)) {
                        const token = JSON.parse(source).token;
                        if (token) {
                            GM_setValue('redgifs_token', token);
                        }
                        return token || null;
                    }
                } catch (e) {}
                return null;
            };

            let token = GM_getValue('redgifs_token', null);
            if (!token) {
                token = await fetchTempToken();
            }
            if (!token) {
                return null;
            }

            const apiUrl = `https://api.redgifs.com/v2/gifs/${id}`;

            const fetchGif = async t => {
                try {
                    return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                } catch (e) {
                    return { source: null, status: 0 };
                }
            };

            let { source, status } = await fetchGif(token);

            if (status === 401 || status === 403 || (source && /unauthorized|forbidden/i.test(source))) {
                token = await fetchTempToken();
                if (!token) {
                    return null;
                }
                ({ source, status } = await fetchGif(token));
            }

            if (status !== 200 || !source) {
                return null;
            }

            let j;
            try {
                j = JSON.parse(source);
            } catch (e) {
                return null;
            }

            const urls = j?.gif?.urls || j?.urls;
            if (!urls) {
                return null;
            }

            const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
            for (const k of preferredKeys) {
                const v = urls[k];
                if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
                    return v;
                }
            }

            for (const v of Object.values(urls)) {
                if (typeof v === 'string' && /\.mp4(\?|$)/i.test(v)) {
                    return v;
                }
            }

            return null;
        },
    ],

    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http, passwords, postId, postSettings, progressCB) => {
            // Cyberdrop albums (/a/<id>) are HTML pages listing many /f/<id> file links.
            // Resolve the album to a list of signed CDN URLs via the file auth API (no per-file warm-up tabs).
            try {
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

                const albumIdMatch = url.match(/\/a\/([^\/?#]+)/i);
                const albumId = albumIdMatch ? albumIdMatch[1] : '';

                const pageUrl = url;
                let pageOrigin = 'https://cyberdrop.cr';
                try { pageOrigin = new URL(pageUrl).origin; } catch (e) {}

                const decodeHtml = (s) => {
                    try {
                        const t = document.createElement('textarea');
                        t.innerHTML = String(s || '');
                        return t.value;
                    } catch (e) {
                        return String(s || '');
                    }
                };

                const getAlbumHtml = async () => {
                    progressCB?.('Cyberdrop: loading album page');
                    const r = await http.get(pageUrl, {}, {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Referer': pageOrigin + '/',
                        'Origin': pageOrigin,
                    }, 'text');
                    return r && r.source ? r.source : '';
                };

                let html = await getAlbumHtml();

                const extractSlugs = (src) => {
                    const slugs = [];
                    const seen = new Set();
                    const re = /href\s*=\s*["'](?:https?:\/\/(?:[\w-]+\.)*cyberdrop\.[a-z.]+)?\/f\/([A-Za-z0-9_-]+)(?:[\/?#"'])/ig;
                    let m;
                    while ((m = re.exec(src || '')) !== null) {
                        const s = m[1];
                        if (s && !seen.has(s)) {
                            seen.add(s);
                            slugs.push(s);
                        }
                    }
                    return slugs;
                };

                let slugs = extractSlugs(html);

                // If the HTML is gated/empty, do a single warm-up of the album page and retry once.
                if (!slugs.length && typeof cyberdropWarmupOnce === 'function') {
                    await cyberdropWarmupOnce(pageUrl);
                    html = await getAlbumHtml();
                    slugs = extractSlugs(html);
                }

                if (!slugs.length) return url;

                const pickTitle = (src) => {
                    const m1 = src.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                               src.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
                    const m2 = src.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    const m3 = src.match(/<title[^>]*>([^<]+)<\/title>/i);
                    let t = (m1 && (m1[1] || m1[2])) || (m2 && m2[1]) || (m3 && m3[1]) || '';
                    t = decodeHtml(t).trim();
                    // Strip common site suffixes
                    t = t.replace(/\s*\|\s*CyberDrop.*$/i, '').replace(/\s*-\s*CyberDrop.*$/i, '').trim();
                    if (!t) t = albumId ? `cyberdrop_${albumId}` : 'cyberdrop_album';
                    return t;
                };

                const folderName = pickTitle(html);

                // Capture per-file names from the album page so downloads keep extensions.
                try {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const nodes = doc.querySelectorAll('a#file[href^="/f/"], a[id="file"][href^="/f/"], a[href^="/f/"][title][href^="/f/"]');
                    nodes.forEach((a) => {
                        const href = a.getAttribute('href') || '';
                        const m = href.match(/\/f\/([A-Za-z0-9]+)/);
                        if (!m) return;
                        const slug = m[1];
                        const nm = (a.getAttribute('title') || a.textContent || '').trim();
                        if (nm) cyberdropNameBySlug.set(slug, nm);
                    });
                } catch (e) { /* ignore */ }

                // Regex fallback (in case DOMParser is blocked).
                try {
                    const rxName = /href=["']\/f\/([A-Za-z0-9]+)["'][^>]*\btitle=["']([^"']+)["']/gi;
                    let m;
                    while ((m = rxName.exec(html)) !== null) {
                        const slug = m[1];
                        const nm = decodeHtml(m[2]).trim();
                        if (nm) cyberdropNameBySlug.set(slug, nm);
                    }
                } catch (e) { /* ignore */ }

                const host = (() => { try { return new URL(pageUrl).hostname; } catch (e) { return ''; } })();
                const root = (String(host || '').match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBases = [];
                if (root) apiBases.push(`https://api.${root}`);
                apiBases.push('https://api.cyberdrop.cr');
                const apiBaseList = [...new Set(apiBases)];

                const resolved = [];
                for (let i = 0; i < slugs.length; i++) {
                    const slug = slugs[i];
                    progressCB?.(`Cyberdrop: resolving ${i + 1}/${slugs.length}`);

                    let j = null;

                    for (const base of apiBaseList) {
                        const apiUrl = `${base}/api/file/auth/${slug}`;

                        const r = await http.get(apiUrl, {}, {
                            'Accept': 'application/json, text/plain, */*',
                            'Origin': pageOrigin,
                            'Referer': pageOrigin + '/',
                        }, 'text');

                        if (!r || !r.source) continue;

                        try { j = JSON.parse(r.source); } catch (e) { j = null; }
                        if (j) break;
                    }

                    if (!j) continue;

                    let direct = null;
                    if (typeof j.url === 'string') direct = j.url;
                    else if (j.data && typeof j.data.url === 'string') direct = j.data.url;
                    else if (typeof j.file === 'string') direct = j.file;
                    else if (j.data && typeof j.data.file === 'string') direct = j.data.file;

                    if (typeof direct !== 'string' || !direct.trim()) continue;
                    direct = direct.trim();
                    if (direct.startsWith('//')) direct = 'https:' + direct;

                    if (!/^https?:\/\//i.test(direct)) continue;
                    resolved.push(direct);
                }

                if (!resolved.length) return url;

                return { folderName, resolved };
            } catch (e) {
                return url;
            }
        },
    ],
    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /:!cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http) => {
            // Cyberdrop embeds (/e/) expose the real file URL only after loading the /f/ page.
            // Preferred approach:
            //  1) Call the info API to get the signed CDN URL
            //  2) If blocked, briefly warm up /f/ in an inactive tab and retry once
            try {
                // Ensure absolute URL (some posts omit the scheme, e.g. "cyberdrop.cr/e/<slug>")
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

                // Normalize legacy fs-*/img-* hosts (old Cyberdrop mirrors)
                if (url.includes('fs-') || url.includes('img-')) {
                    url = url.replace(/(fs|img)-\d+/i, '').replace(/(to|cc|nl)-\d+/i, 'me');
                }

                const u = new URL(url);
                const origin = `${u.protocol}//${u.hostname}`;
                const slugMatch = String(url).match(/\/([ef])\/([^\/?#]+)/i);
                if (!slugMatch || !slugMatch[2]) {
                    // Not a /f/ or /e/ URL; return as-is.
                    return url;
                }

                const slug = slugMatch[2];
                const pageUrl = `${origin}/f/${slug}`;

                const apiCandidates = [];

                // New API style (observed on cyberdrop.cr): https://api.cyberdrop.cr/api/file/info/<slug>
                const root = (u.hostname.match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBaseDefault = root ? `https://api.${root}` : 'https://api.cyberdrop.cr';
                if (root) {
                    apiCandidates.push(`https://api.${root}/api/file/info/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/auth/${slug}`);
                }
                // Known working for cyberdrop.cr even if the embed is on /e/
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/info/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/auth/${slug}`);
                // Additional API variants seen in the wild
                if (root) {
                    apiCandidates.push(`https://api.${root}/api/file/url/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/auth/${slug}`);
                }
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/url/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/auth/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/${slug}`);

                // Legacy API style (older Cyberdrop): https://cyberdrop.me/api/f/<slug>
                apiCandidates.push(`${origin}/api/f/${slug}`);

                const headers = {
                    Accept: 'application/json, text/plain, */*',
                    Referer: `${origin}/`,
                    Origin: origin,
                };

                const cyberdropGmGetText = (reqUrl, hdrs) => new Promise(resolve => {
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: String(reqUrl),
                            headers: hdrs || {},
                            responseType: 'text',
                            anonymous: false,
                            timeout: 6000,
                            onload: r => resolve({ status: r.status || 0, source: String(r.responseText || r.response || '') }),
                            onerror: () => resolve({ status: 0, source: '' }),
                            ontimeout: () => resolve({ status: 0, source: '' }),
                        });
                    } catch (e) {
                        resolve({ status: 0, source: '' });
                    }
                });

                const cyberdropFetchText = async reqUrl => {
                    let r = await cyberdropGmGetText(reqUrl, headers);
                    if ((r.status === 0) && (headers.Origin || headers.Referer)) {
                        r = await cyberdropGmGetText(reqUrl, { Accept: headers.Accept });
                    }
                    return r;
                };

                const fetchInfo = async () => {
                    const parseInfoText = (txt, baseHint) => {
                        const out = { direct: null, name: null, token: null, base: null, auth: null };
                        const s = String(txt || '');
                        const apiBase = (typeof baseHint === 'string' && /^https?:\/\//i.test(baseHint))
                            ? baseHint.replace(/\/$/, '')
                            : apiBaseDefault;
                        if (!s) return out;

                        // 1) Quick regex for absolute token URL (unescaped or JSON-escaped)
                        const rePlain = new RegExp(`https?:\/\/[^"'\\s]+\/api\/file\/d\/${slug}\?[^"'\\s]*token=[^"'\\s]+`, 'i');
                        let m = s.match(rePlain);
                        if (m && m[0]) out.direct = m[0];

                        if (!out.direct) {
                            const reEsc = new RegExp(`https?:\\/\\/[^"\\s]+\\/api\\/file\\/d\\/${slug}\\?[^"\\s]*token=[^"\\s]+`, 'i');
                            m = s.match(reEsc);
                            if (m && m[0]) out.direct = m[0].replace(/\\\//g, '/');
                        }

                        // 2) Relative token URL (e.g. "/api/file/d/<slug>?token=...")
                        if (!out.direct) {
                            const reRel1 = new RegExp(`\/api\/file\/d\/${slug}\?[^"'\\s]*token=[^"'\\s]+`, 'i');
                            m = s.match(reRel1);
                            if (m && m[0]) out.direct = `${apiBase}${m[0]}`;
                        }

                        if (!out.direct) {
                            const reRel2 = new RegExp(`api\/file\/d\/${slug}\?[^"'\\s]*token=[^"'\\s]+`, 'i');
                            m = s.match(reRel2);
                            if (m && m[0]) out.direct = `${apiBase}/${m[0].replace(/^\//, '')}`;
                        }

                        // 3) JSON parse + deep scan for filename and/or token/host components
                        try {
                            const j = JSON.parse(s);
                            const seen = new Set();

                            const looksLikeName = v => {
                                if (!v || typeof v !== 'string') return false;
                                if (v.length > 260) return false;
                                if (/^https?:\/\//i.test(v)) return false;
                                const base = v.split(/[\\/]/).pop();
                                return /^[^<>:"|?*\x00-\x1F]+\.[a-z0-9]{2,8}$/i.test(base);
                            };

                            const looksLikeJwt = v => {
                                if (!v || typeof v !== 'string') return false;
                                // Typical JWT: header.payload.sig (base64url)
                                if (/^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return true;
                                return false;
                            };

                            const isTokenUrl = v => {
                                if (!v || typeof v !== 'string') return false;
                                return v.includes(`/api/file/d/${slug}`) && /token=/i.test(v);
                            };

                            const looksLikeBase = v => {
                                if (!v || typeof v !== 'string') return false;
                                // Accept origins or hostnames that look like Cyberdrop CDN
                                if (/gigachad-cdn\.ru/i.test(v) || /cyberdrop\./i.test(v)) return true;
                                if (/^k\d+-cd\./i.test(v)) return true;
                                return false;
                            };

                            const normalizeBase = v => {
                                try {
                                    const t = String(v || '').trim();
                                    if (!t) return null;
                                    if (/^https?:\/\//i.test(t)) {
                                        const uu = new URL(t);
                                        return `${uu.protocol}//${uu.hostname}`;
                                    }
                                    // plain hostname
                                    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(t)) return `https://${t}`;
                                } catch (e) {}
                                return null;
                            };

                            const walk = (val, key = '') => {
                                if (val === null || val === undefined) return;

                                if (typeof val === 'string') {
                                    const v = val;

                                    if (isTokenUrl(v) && (!out.direct || v.length > out.direct.length)) out.direct = v;

                                    if (!out.name) {
                                        if (looksLikeName(v) || /(file)?name/i.test(String(key))) {
                                            const base = v.split(/[\\/]/).pop();
                                            if (looksLikeName(base)) out.name = base;
                                        }
                                    }

                                    // token can be stored separately (e.g. "token": "eyJ...")
                                    if (!out.token) {
                                        if (/(^|[^a-z])token([^a-z]|$)/i.test(String(key)) && looksLikeJwt(v)) {
                                            out.token = v;
                                        } else if (looksLikeJwt(v)) {
                                            // last resort: any JWT-looking string
                                            out.token = v;
                                        }
                                    }

                                    // auth URL can be provided separately (new API flow: info -> auth -> direct)
                                    if (!out.auth) {
                                        if (/(^|[^a-z])auth([^a-z]|$)/i.test(String(key)) && /\/api\/file\/auth\//i.test(v)) {
                                            out.auth = v;
                                        } else if (/\/api\/file\/auth\//i.test(v) && /cyberdrop/i.test(v)) {
                                            out.auth = v;
                                        }
                                    }

                                    if (!out.base && (/(cdn|host|domain|server|origin)/i.test(String(key)) || looksLikeBase(v))) {
                                        const b = normalizeBase(v);
                                        if (b) out.base = b;
                                    }

                                    return;
                                }

                                if (typeof val !== 'object') return;
                                if (seen.has(val)) return;
                                seen.add(val);

                                if (Array.isArray(val)) {
                                    for (const v of val) walk(v, key);
                                } else {
                                    for (const [k, v] of Object.entries(val)) walk(v, k);
                                }
                            };

                            walk(j, '');

                            // Common direct URL fields
                            if (!out.direct) {
                                const direct =
                                    (j &&
                                        (j.url ||
                                            j.downloadUrl ||
                                            j.download_url ||
                                            (j.data && (j.data.url || j.data.downloadUrl || j.data.download_url)) ||
                                            (j.file && (j.file.url || j.file.downloadUrl || j.file.download_url)) ||
                                            (j.data && j.data.file && (j.data.file.url || j.data.file.downloadUrl || j.data.file.download_url)))) ||
                                    null;
                                if (direct && typeof direct === 'string') out.direct = direct;
                            }

                            // Common auth URL fields (new Cyberdrop API flow: info -> auth -> direct)
                            if (!out.auth) {
                                const a =
                                    (j &&
                                        (j.auth_url ||
                                            j.authUrl ||
                                            (j.data && (j.data.auth_url || j.data.authUrl)) ||
                                            (j.file && (j.file.auth_url || j.file.authUrl)) ||
                                            (j.data && j.data.file && (j.data.file.auth_url || j.data.file.authUrl)))) ||
                                    null;
                                if (a && typeof a === 'string') out.auth = a;
                            }

                            // Common filename fields
                            if (!out.name) {
                                const n =
                                    (j &&
                                        (j.name ||
                                            j.filename ||
                                            j.fileName ||
                                            j.originalName ||
                                            (j.file && (j.file.name || j.file.filename || j.file.fileName || j.file.originalName)) ||
                                            (j.data && (j.data.name || j.data.filename || j.data.fileName || j.data.originalName)) ||
                                            (j.data && j.data.file && (j.data.file.name || j.data.file.filename || j.data.file.fileName || j.data.file.originalName)))) ||
                                    null;
                                if (n && typeof n === 'string' && looksLikeName(n)) out.name = n.split(/[\\/]/).pop();
                            }

                            // If we got token but not direct, try to build a direct URL
                            if (!out.direct && out.token) {
                                const tok = out.token.includes('%') ? out.token : encodeURIComponent(out.token);
                                const base = out.base || apiBase;
                                out.direct = `${base.replace(/\/$/, '')}/api/file/d/${slug}?token=${tok}`;
                            }
                        } catch (e) {}

                        // Normalize escaped slashes if needed
                        if (out.direct && typeof out.direct === 'string' && out.direct.includes('\\/')) {
                            out.direct = out.direct.replace(/\\\//g, '/');
                        }

                        // If out.direct is relative, make it absolute
                        if (out.direct && typeof out.direct === 'string' && out.direct.startsWith('/')) {
                            out.direct = `${apiBase}${out.direct}`;
                        }

                        // Normalize escaped slashes and relative auth URLs
                        if (out.auth && typeof out.auth === 'string' && out.auth.includes('\\/')) {
                            out.auth = out.auth.replace(/\\\//g, '/');
                        }
                        if (out.auth && typeof out.auth === 'string') {
                            if (out.auth.startsWith('/')) {
                                out.auth = `${apiBase}${out.auth}`;
                            } else if (!/^https?:\/\//i.test(out.auth) && /api\/file\/auth\//i.test(out.auth)) {
                                out.auth = `${apiBase}/${out.auth.replace(/^\/+/, '')}`;
                            }
                        }

                        return out;
                    };

                    for (const apiUrl of apiCandidates) {
                        try {
                            const { source, status } = await cyberdropFetchText(apiUrl);
                            if (status !== 200 || !source) continue;

                            let baseHint = apiBaseDefault;
                            try { baseHint = new URL(apiUrl).origin; } catch (e) {}
                            const { direct, name, auth } = parseInfoText(source, baseHint);

                            let resolvedName = name || null;
                            let resolvedDirect = direct || null;

                            // New flow: info returns auth_url; auth returns tokenized direct URL
                            if (!resolvedDirect && auth && typeof auth === 'string') {
                                const authUrl = auth;
                                try {
                                    const { source: authSource, status: authStatus } = await cyberdropFetchText(authUrl);
                                    if (authStatus === 200 && authSource) {
                                        let authBase = baseHint;
                                        try { authBase = new URL(authUrl).origin; } catch (e) {}
                                        const parsedAuth = parseInfoText(authSource, authBase);
                                        if (!resolvedName && parsedAuth && parsedAuth.name) resolvedName = parsedAuth.name;
                                        if (!resolvedDirect && parsedAuth && parsedAuth.direct) resolvedDirect = parsedAuth.direct;
                                    }
                                } catch (e) {}
                            }

                            if (resolvedName) cyberdropNameBySlug.set(String(slug), String(resolvedName));

                            if (resolvedDirect && typeof resolvedDirect === 'string') {
                                if (resolvedName) cyberdropNameByUrl.set(String(resolvedDirect), String(resolvedName));
                                return resolvedDirect;
                            }
                        } catch (e) {}
                    }
                    return null;
                };

                // 1st attempt: API directly (some setups need two requests for ddos-guard cookies)
                let directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                if (directUrl) return directUrl;

                // Warm-up (only one tab at a time) then retry
                let warmKey = 'cyberdrop';
                try { warmKey = `cyberdrop:${new URL(pageUrl).origin}`; } catch (e) { }
                await cyberdropWarmupOnce(warmKey, pageUrl, CYBERDROP_WARMUP_DEFAULT_MS);

                directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                return directUrl || url;
            } catch (e) {
                return url;
            }
        },
    ],
[
        [/noodlemagazine.com\/watch\//],
        async (url, http) => {
            const { dom } = await http.get(url);
            let playerIFrameUrl = dom.querySelector('#iplayer')?.getAttribute('src');

            if (!playerIFrameUrl) {
                return null;
            }

            playerIFrameUrl = playerIFrameUrl.replace('/player/', 'https://noodlemagazine.com/playlist/');

            const { source } = await http.get(playerIFrameUrl);

            // noinspection JSCheckFunctionSignatures
            const props = JSON.parse(source || JSON.stringify([]));

            if (props.sources && props.sources.length) {
                return props.sources[0].file;
            }

            return null;
        },
    ],
    [
        [/spankbang.com\/.*?\/video/],
        async (url, http) => {
            const { source } = await http.get(url);

            let streamData = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)[0].replace(/'/g, '"');

            streamData = JSON.parse(streamData);

            const qualities = ['240p', '320p', '480p', '720p', '1080p', '4k'].reverse();

            for (const quality of qualities) {
                if (streamData[quality].length) {
                    return streamData[quality][0];
                }
            }

            return null;
        },
    ],

    [
        [/imagebam.com\/(view|gallery)/],
        async (url, http) => {
            const date = new Date();
            date.setTime(date.getTime() + 6 * 60 * 60 * 1000);
            const expires = '; expires=' + date.toUTCString();
            const { source, dom } = await http.get(
                url,
                {},
                {
                    cookie: 'nsfw_inter=1' + expires + '; path=/',
                },
            );

            if (h.contains('gallery-name', source)) {
                const resolved = [];

                const imageLinksInput = dom.querySelector('.links.gallery > div:nth-child(2) > div > input');

                const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput.getAttribute('value'));

                for (const link of rawImageLinks) {
                    const { dom } = await http.get(link);
                    resolved.push(dom?.querySelector('.main-image')?.getAttribute('src'));
                }

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('#gallery-name').innerText.trim(),
                    resolved,
                };
            } else {
                return dom?.querySelector('.main-image')?.getAttribute('src');
            }
        },
    ],

[[/images\d.imagebam.com/], url => url],
    [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], url => url.replace('.th.', '.').replace('.md.', '.')],
    [
        [/imgvb.com\/album\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const resolved = [...dom.querySelectorAll('.image-container > img')]
            .map(i => i.getAttribute('src'))
            .map(url => url.replace('.th.', '.').replace('.md.', '.'));

            return {
                dom,
                source,
                folderName: dom?.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [
        [/(\/attachments\/|\/data\/video\/)/],
        async (url) => {
            // Normalize broken "https:///..." and accidental double-scheme cases.
            url = String(url || '').trim();
            url = url.replace(/^https?:\/\/https?:\/\//i, 'https://');
            url = url.replace(/^https?:\/\/\//i, '/');

            // If it's already absolute, keep it (don't rewrite hosts).
            if (/^https?:\/\//i.test(url)) return url;

            // Otherwise it's a path; prefix with Simpcity origin.
            if (!url.startsWith('/')) url = '/' + url;

            if (url.startsWith('/attachments/') || url.startsWith('/data/video/')) {
                return `https://simpcity.su${url}`;
            }

            return `https://simpcity.su${url}`;
        },
    ],
    [[/(thumbs|images)(\d+)?.imgbox.com\//, /:!imgbox.com\/g\//], url => url.replace(/_t\./gi, '_o.').replace(/thumbs/i, 'images')],
    [
        [/imgbox.com\/g\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);

            const resolved = [...dom?.querySelectorAll('#gallery-view-content > a > img')]
            .map(img => img.getAttribute('src'))
            .map(url => url.replace(/(thumbs|t)(\d+)\./gis, 'images$2.').replace('_b.', '_o.'));

            return {
                dom,
                source,
                folderName: dom?.querySelector('#gallery-view > h1').innerText.trim(),
                resolved,
            };
        },
    ],

[
    [/filester\.me\/f\//],
    async (url, http, spoilers, postId, postSettings, progressCB) => {
        try {
            url = String(url || '').trim();
            if (!url) return null;

            if (url.startsWith('//')) url = 'https:' + url;
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

            const u0 = new URL(url);
            const origin = `${u0.protocol}//${u0.hostname}`;

            const mId = (u0.pathname || '').match(/\/f\/([^\/?#]+)/i);
            if (!mId || !mId[1]) return url;

            const albumId = mId[1];
            const baseUrl = `${origin}/f/${albumId}`;

            const resolved = [];
            const seen = new Set();

            let firstDom = null;
            let firstSource = '';
            let folderName = '';

            const MAX_PAGES = 500;

            const getFolderName = (dom, html) => {
                try {
                    const pickClean = (s) => {
                        s = String(s || '').trim();
                        if (!s) return '';

                        // Strip common suffixes.
                        s = s.replace(/\s*\|\s*filester\.me\s*$/i, '').trim();
                        s = s.replace(/\s*-\s*filester\.me\s*$/i, '').trim();

                        // Replace remaining pipes with a Windows-safe separator.
                        if (s.includes('|')) s = s.replace(/\s*\|\s*/g, ' - ').trim();

                        // Final cleanup
                        s = s.replace(/\s+/g, ' ').trim();

                        return s;
                    };

                    const isBad = (t) => {
                        const x = String(t || '').trim();
                        if (!x) return true;
                        if (/^filester\.me\b/i.test(x)) return true;
                        if (/BETA\s*\d/i.test(x)) return true;
                        return false;
                    };

                    let t = '';

                    // DOM: og:title first
                    try {
                        t = pickClean(dom?.querySelector('meta[property="og:title"]')?.getAttribute('content') || '');
                    } catch (e) {}
                    try {
                        if (!t) t = pickClean(dom?.querySelector('meta[name="og:title"]')?.getAttribute('content') || '');
                    } catch (e) {}
                    try {
                        if (!t) t = pickClean(dom?.querySelector('title')?.textContent || '');
                    } catch (e) {}

                    // HTML fallback (order-independent meta parsing)
                    if (isBad(t)) {
                        const s = String(html || '');
                        if (s) {
                            try {
                                const mTag =
                                    /<meta\b[^>]*\b(?:property|name)=["']og:title["'][^>]*>/i.exec(s) ||
                                    /<meta\b[^>]*\bcontent=["'][^"']+["'][^>]*\b(?:property|name)=["']og:title["'][^>]*>/i.exec(s);
                                if (mTag && mTag[0]) {
                                    const mC = /\bcontent=["']([^"']+)["']/i.exec(mTag[0]);
                                    if (mC && mC[1]) t = pickClean(mC[1]);
                                }
                            } catch (e) {}

                            try {
                                if (isBad(t)) {
                                    const mT = /<title[^>]*>\s*([^<]+?)\s*<\/title>/i.exec(s);
                                    if (mT && mT[1]) t = pickClean(mT[1]);
                                }
                            } catch (e) {}
                        }
                    }

                    if (isBad(t)) return albumId;
                    return t;
                } catch (e) {}
                return albumId;
            };

            const addHint = (slug, name, sizeBytes) => {
                try {
                    const dUrl = `${origin}/d/${slug}`;
                    if (name) {
                        try { filesterNameBySlug.set(String(slug), String(name)); } catch (e) {}
                        try { filesterNameByUrl.set(String(dUrl), String(name)); } catch (e) {}
                    }
                    if (sizeBytes) {
                        try { filesterSizeBySlug.set(String(slug), Number(sizeBytes)); } catch (e) {}
                        try { filesterSizeByUrl.set(String(dUrl), Number(sizeBytes)); } catch (e) {}
                    }
                    try { filesterSlugByUrl.set(String(dUrl), String(slug)); } catch (e) {}
                } catch (e) {}
            };

            const parsePage = (dom, html) => {
                const out = [];
                try {
                    const items = dom ? [...dom.querySelectorAll('div.file-item')] : [];
                    for (const el of items) {
                        let slug = '';
                        try {
                            const oc = String(el.getAttribute('onclick') || '');
                            const m = /\/d\/([^'"?\s]+)/i.exec(oc);
                            if (m && m[1]) slug = m[1];
                        } catch (e) {}

                        if (!slug) {
                            try {
                                const btn = el.querySelector('button.download-btn');
                                const oc2 = String(btn?.getAttribute?.('onclick') || '');
                                const m2 = /downloadFile\(\s*'([^']+)'/i.exec(oc2);
                                if (m2 && m2[1]) slug = m2[1];
                            } catch (e) {}
                        }

                        if (!slug) {
                            try {
                                const a = el.querySelector('a[href*="/d/"]');
                                const href = String(a?.getAttribute?.('href') || '');
                                const m3 = /\/d\/([^\/?#]+)/i.exec(href);
                                if (m3 && m3[1]) slug = m3[1];
                            } catch (e) {}
                        }

                        if (!slug) continue;

                        let name = '';
                        let size = 0;

                        try { name = String(el.getAttribute('data-name') || '').trim(); } catch (e) {}
                        if (!name) {
                            try { name = String(el.querySelector('.file-name')?.textContent || '').trim(); } catch (e) {}
                        }

                        try { size = Number(el.getAttribute('data-size') || 0) || 0; } catch (e) {}

                        out.push({ slug, name, size });
                    }
                } catch (e) {}

                // Regex fallback if DOM parsing is incomplete
                try {
                    const s = String(html || '');
                    if (s) {
                        const rx = /data-name="([^"]+)"[^>]*\bonclick="window\.location\.href='\/d\/([^']+)'/gi;
                        let m;
                        while ((m = rx.exec(s)) !== null) {
                            const name = String(m[1] || '').trim();
                            const slug = String(m[2] || '').trim();
                            if (!slug) continue;
                            out.push({ slug, name, size: 0 });
                        }
                    }
                } catch (e) {}

                return out;
            };

            for (let page = 1; page <= MAX_PAGES; page++) {
                const u = new URL(baseUrl);
                u.searchParams.set('page', String(page));
                const pageUrl = u.toString();

                if (typeof progressCB === 'function') {
                    progressCB(`[Filester] Resolving album page ${page}`);
                }

                let dom = null;
                let source = '';
                try {
                    const r = await http.get(pageUrl, {}, {
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    Referer: baseUrl,
                    __xfpd_withCredentials: true,
                });
                    dom = r?.dom;
                    source = r?.source || '';
                } catch (e) {
                    break;
                }

                if (page === 1) {
                    firstDom = dom;
                    firstSource = source;
                    folderName = getFolderName(dom, source);
                }

                const before = seen.size;

                const entries = parsePage(dom, source);
                for (const it of entries) {
                    const slug = String(it.slug || '').trim();
                    if (!slug || seen.has(slug)) continue;
                    seen.add(slug);

                    const name = String(it.name || '').trim();
                    const size = Number(it.size || 0) || 0;
                    addHint(slug, name, size);

                    resolved.push(`${origin}/d/${slug}`);
                }

                const added = seen.size - before;
                if (added <= 0) break;
            }

            if (!folderName) folderName = albumId;

            if (!resolved.length) return url;

            return { dom: firstDom, source: firstSource, folderName, resolved };
        } catch (e) {
            return url;
        }
    },
],
[
    [/filester\.me\/d\//],
    async (url, http, spoilers, postId, postSettings, progressCB) => {
        const slug = (() => {
            try {
                const u = new URL(url);
                const parts = String(u.pathname || '').split('/').filter(Boolean);
                return parts.length ? parts[parts.length - 1] : '';
            } catch (e) {
                const m = /filester\.me\/d\/([^\/?#]+)/i.exec(String(url || ''));
                return m && m[1] ? m[1] : '';
            }
        })();

        if (!slug) return null;

        const apiBase = 'https://filester.me';

        const mkHeaders = () => ({
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            Origin: apiBase,
            Referer: url,
            __xfpd_withCredentials: true,
        });

        const safeJson = (txt) => {
            try { return JSON.parse(String(txt || '')); } catch (e) { return null; }
        };

        const walk = (obj, cb, maxNodes = 5000) => {
            const seen = new Set();
            const q = [obj];
            let nodes = 0;
            while (q.length && nodes++ < maxNodes) {
                const cur = q.shift();
                if (!cur || typeof cur !== 'object') continue;
                if (seen.has(cur)) continue;
                seen.add(cur);
                try {
                    if (cb(cur) === true) return true;
                } catch (e) {}
                if (Array.isArray(cur)) {
                    for (const it of cur) q.push(it);
                } else {
                    for (const k of Object.keys(cur)) q.push(cur[k]);
                }
            }
            return false;
        };

        const deepFindValueByKeys = (obj, keys) => {
            const keySet = new Set((keys || []).map(k => String(k).toLowerCase()));
            let out = null;
            walk(obj, (o) => {
                if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
                for (const k of Object.keys(o)) {
                    if (keySet.has(String(k).toLowerCase())) {
                        const v = o[k];
                        if (v !== null && v !== undefined) {
                            out = v;
                            return true;
                        }
                    }
                }
                return false;
            });
            return out;
        };

        const normalizeUrl = (s) => {
            if (!s || typeof s !== 'string') return null;
            const t = s.trim();
            if (/^https?:\/\//i.test(t)) return t;
            if (t.startsWith('/')) {
                try { return new URL(t, apiBase).href; } catch (e) { return null; }
            }
            if (/^[dv]\//i.test(t)) {
                try { return new URL('/' + t.replace(/^\/+/, ''), apiBase).href; } catch (e) { return null; }
            }
            return null;
        };

        const pickBestUrl = (obj) => {
            const candidates = [];
            const push = (v) => {
                const u = normalizeUrl(v);
                if (u) candidates.push(u);
            };

            const prefer = deepFindValueByKeys(obj, ['download_url', 'downloadUrl', 'url', 'link', 'href', 'direct', 'download', 'view_url', 'viewUrl']);
            if (prefer) push(prefer);

            walk(obj, (o) => {
                for (const k of Object.keys(o || {})) {
                    const v = o[k];
                    if (typeof v === 'string') push(v);
                }
                if (Array.isArray(o)) {
                    for (const it of o) if (typeof it === 'string') push(it);
                }
                return false;
            });

            const clean = candidates
                .map(s => String(s))
                .filter(s => !/filester\.me\/api\//i.test(s))
                .filter(s => !/filester\.me\/(css|js)\//i.test(s));

            if (!clean.length) return null;

            const score = (s) => {
                let sc = 0;
                // Strongly prefer CDN /v/ stream URLs.
                if (/https?:\/\/cache\d+\.filester\.me\/v\//i.test(s)) sc += 200;
                else if (/cache\d+\.filester\.me/i.test(s)) sc += 160;
                if (/\/v\//i.test(s)) sc += 80;
                if (/\.filester\.me\//i.test(s)) sc += 10;
                // De-prioritize HTML view tokens (/d/).
                if (/\/d\//i.test(s)) sc -= 25;
                if (/\.mp4(\?|$)/i.test(s)) sc += 2;
                return sc;
            };

            clean.sort((a, b) => score(b) - score(a));
            return clean[0];
        };

        const pickName = (obj) => {
            const v = deepFindValueByKeys(obj, ['filename', 'file_name', 'name', 'original_name', 'originalName', 'title']);
            if (typeof v === 'string' && v.trim()) return v.trim();
            return null;
        };

        const pickSize = (obj) => {
            const v = deepFindValueByKeys(obj, ['size', 'bytes', 'file_size', 'fileSize', 'length']);
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        let nameHint = null;
        let sizeHint = 0;
        let relViewPath = null;
        let streamUrlImmediate = null;

        const filesterExtFromCt = (ct) => {
            const t = String(ct || '').toLowerCase();
            if (t.includes('video/mp4')) return 'mp4';
            if (t.includes('video/webm')) return 'webm';
            if (t.includes('image/jpeg') || t.includes('image/jpg')) return 'jpg';
            if (t.includes('image/png')) return 'png';
            if (t.includes('image/gif')) return 'gif';
            if (t.includes('application/zip')) return 'zip';
            if (t.includes('application/x-7z-compressed')) return '7z';
            if (t.includes('application/x-rar') || t.includes('application/vnd.rar')) return 'rar';
            return 'bin';
        };

        const filesterParseViewMeta = (html) => {
            const out = { fileName: '', fileType: '' };
            const s = String(html || '');
            try {
                // Prefer JSON-style double-quoted assignment: window.fileName = "..."
                const m1 = /window\.fileName\s*=\s*("([^"\\]|\\.)*")\s*;?/m.exec(s);
                if (m1 && m1[1]) out.fileName = JSON.parse(m1[1]);
            } catch (e) {}
            try {
                // Fallback: single-quoted assignment: window.fileName = '...'
                if (!out.fileName) {
                    const m1b = /window\.fileName\s*=\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*;?/m.exec(s);
                    if (m1b && m1b[1]) out.fileName = String(m1b[1]).replace(/\\'/g, "'").replace(/\\n/g, "\n");
                }
            } catch (e) {}
            try {
                const m2 = /window\.fileType\s*=\s*("([^"\\]|\\.)*")\s*;?/m.exec(s);
                if (m2 && m2[1]) out.fileType = JSON.parse(m2[1]);
            } catch (e) {}
            try {
                if (!out.fileType) {
                    const m2b = /window\.fileType\s*=\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*;?/m.exec(s);
                    if (m2b && m2b[1]) out.fileType = String(m2b[1]).replace(/\\'/g, "'").replace(/\\n/g, "\n");
                }
            } catch (e) {}
            return out;
        };



        const filesterNormalizeFilename = (s) => {
            let name = String(s || '').trim();
            if (!name) return '';

            // If UTF-8 bytes were interpreted as Latin-1 (common in Chrome/Tampermonkey),
            // decode it back to proper UTF-8.
            try {
                let hasHigh = false;
                let allByte = true;
                for (let i = 0; i < name.length; i++) {
                    const c = name.charCodeAt(i);
                    if (c > 255) { allByte = false; break; }
                    if (c >= 128) hasHigh = true;
                }
                if (allByte && hasHigh && typeof TextDecoder !== 'undefined') {
                    const bytes = new Uint8Array(name.length);
                    for (let i = 0; i < name.length; i++) bytes[i] = name.charCodeAt(i) & 0xFF;
                    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
                    if (decoded && decoded !== name) name = decoded;
                }
            } catch (e) {}

            // Strip control chars (Windows will refuse these in filenames; mojibake often introduces them)
            name = name.replace(/[\u0000-\u001F\u007F\u0080-\u009F]/g, '').trim();
            return name;
        };

const filesterParseDispositionFilename = (headersRaw) => {
            try {
                const h = String(headersRaw || '');
                const mLine = /content-disposition:\s*([^\r\n]+)/i.exec(h);
                if (!mLine || !mLine[1]) return '';
                const v = String(mLine[1] || '');

                // RFC5987: filename*=UTF-8''...
                let m = /filename\*\s*=\s*([^;]+)/i.exec(v);
                if (m && m[1]) {
                    let val = String(m[1]).trim();
                    val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

                    const mEnc = /^([^']*)''(.*)$/.exec(val);
                    if (mEnc) {
                        let data = String(mEnc[2] || '').trim();
                        try {
                            data = decodeURIComponent(data.replace(/\+/g, '%20'));
                        } catch (e) {
                            // best-effort
                        }
                        if (data) return filesterNormalizeFilename(data);
                    } else {
                        try {
                            const decoded = decodeURIComponent(val.replace(/\+/g, '%20'));
                            if (decoded) return filesterNormalizeFilename(decoded);
                        } catch (e) {}
                        if (val) return filesterNormalizeFilename(val);
                    }
                }

                // Basic: filename="..."
                m = /filename\s*=\s*([^;]+)/i.exec(v);
                if (m && m[1]) {
                    let val = String(m[1]).trim();
                    val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                    val = val.replace(/\\(.)/g, '$1');
                    return filesterNormalizeFilename(val);
                }
            } catch (e) {}
            return '';
        };



        const filesterProbe = async (probeUrl) => {
            try {
                const r = await http.base(
                    'GET',
                    probeUrl,
                    { onResponseHeadersReceieved: () => {} },
                    { Range: 'bytes=0-0', Referer: `${apiBase}/`, __xfpd_withCredentials: true },
                    null,
                    'text',
                );
                const status = Number(r && r.status) || 0;
                const headers = String((r && r.responseHeaders) || '');
                const dispName = filesterParseDispositionFilename(headers);
                const mCt = /content-type:\s*([^\r\n]+)/i.exec(headers);
                const ct = (mCt && mCt[1]) ? mCt[1].trim() : '';
                const mCr = /content-range:\s*bytes\s+\d+-\d+\/(\d+)/i.exec(headers);
                const mCl = /content-length:\s*(\d+)/i.exec(headers);
                const size = mCr && mCr[1] ? Number(mCr[1]) : (mCl && mCl[1] ? Number(mCl[1]) : 0);
                const isHtmlOrJson = /text\/html|application\/xhtml\+xml|application\/json/i.test(ct);
                const ok = status >= 200 && status < 400 && !isHtmlOrJson;
                return { ok, status, headers, contentType: ct, size: Number.isFinite(size) ? size : 0, fileName: dispName || '' };
            } catch (e) {
                return { ok: false, status: 0, headers: '', contentType: '', size: 0 };
            }
        };

        const filesterResolveDownloadToken = async (tokenUrl) => {
            try {
                const ref = `${apiBase}/d/${slug}`;

                const normalizeMaybeUrl = (v) => {
                    try {
                        if (!v) return '';
                        const s = String(v).trim();
                        if (!s) return '';
                        if (s.startsWith('/')) return new URL(s, apiBase).href;
                        if (/^https?:\/\//i.test(s)) return s;
                        return '';
                    } catch (e) {
                        return '';
                    }
                };

                // Phase 1: range request (follows redirects) to capture finalUrl without downloading the whole file.
                const r1 = await http.base(
                    'GET',
                    tokenUrl,
                    {},
                    { Range: 'bytes=0-0', Referer: ref, __xfpd_withCredentials: true },
                    null,
                    'text',
                );

                const headers1 = String((r1 && r1.responseHeaders) || '');
                const fu1 = String((r1 && r1.finalUrl) || '');

                const mLoc1 = /(?:^|\r?\n)location:\s*([^\r\n]+)/i.exec(headers1);
                const loc1Abs = normalizeMaybeUrl(mLoc1 && mLoc1[1] ? mLoc1[1] : '');
                if (loc1Abs && /\/v\//i.test(loc1Abs)) return loc1Abs;
                if (fu1 && /\/v\//i.test(fu1)) return fu1;

                // If this looks like HTML, fetch the full HTML page (small) and extract the /v/ link.
                const mCt1 = /content-type:\s*([^\r\n]+)/i.exec(headers1);
                const ct1 = (mCt1 && mCt1[1]) ? String(mCt1[1]).trim() : '';
                const isHtml = /text\/html|application\/xhtml\+xml/i.test(ct1);

                if (isHtml) {
                    const r2 = await http.base(
                        'GET',
                        tokenUrl,
                        {},
                        { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', Referer: ref, __xfpd_withCredentials: true },
                        null,
                        'text',
                    );

                    const headers2 = String((r2 && r2.responseHeaders) || '');
                    const fu2 = String((r2 && r2.finalUrl) || '');

                    const mLoc2 = /(?:^|\r?\n)location:\s*([^\r\n]+)/i.exec(headers2);
                    const loc2Abs = normalizeMaybeUrl(mLoc2 && mLoc2[1] ? mLoc2[1] : '');
                    if (loc2Abs && /\/v\//i.test(loc2Abs)) return loc2Abs;
                    if (fu2 && /\/v\//i.test(fu2)) return fu2;

                    const body = String((r2 && r2.source) || '');

                    const mFull = /(https?:\/\/cache\d+\.filester\.me\/v\/[^\"'<>\s]+)/i.exec(body);
                    if (mFull && mFull[1]) return String(mFull[1]).trim();

                    const mRel = /[\"'](\/v\/[^\"'<>\s]+)[\"']/i.exec(body);
                    if (mRel && mRel[1]) return new URL(String(mRel[1]), apiBase).href;
                }

                return null;
            } catch (e) {
                return null;
            }
        };

        try {
            if (progressCB) progressCB('[Filester] Fetching metadata...');
            const viewRes = await http.base(
                'POST',
                `${apiBase}/api/public/view`,
                {},
                mkHeaders(),
                JSON.stringify({ file_slug: slug }),
                'text',
            );
            const viewJson = safeJson(viewRes && viewRes.source);
            if (viewJson) {
                nameHint = pickName(viewJson) || nameHint;
                sizeHint = pickSize(viewJson) || sizeHint;
                try {
                    const relView = deepFindValueByKeys(viewJson, ['view_url', 'viewUrl', 'view']);
                    if (typeof relView === 'string' && relView.trim()) {
                        const s = String(relView).trim();
                        if (s.startsWith('/v/')) {
                            relViewPath = s;
                        } else if (s.startsWith('v/')) {
                            relViewPath = '/' + s;
                        } else if (/^https?:\/\//i.test(s)) {
                            try {
                                const u0 = new URL(s);
                                if (/^\/v\//i.test(String(u0.pathname || ''))) {
                                    relViewPath = String(u0.pathname || '') + String(u0.search || '');
                                }
                                // If the API already gave us a cache /v/ URL, keep it as an immediate candidate.
                                if (!streamUrlImmediate && /https?:\/\/cache6\.filester\.me\/v\//i.test(s)) {
                                    streamUrlImmediate = s;
                                }
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            }
        } catch (e) {}

        // Try to extract the real filename (window.fileName = "...") from the HTML view.
// Some Filester API responses don't include the filename, but the HTML view does.
try {
    // First try the slug page (it may redirect to /v/... or even directly to a cacheX /v/ stream).
    // We use it for both filename hints and to discover the real /v/ path when the public API is blocked.
    if (!nameHint || (!relViewPath && !streamUrlImmediate)) {
        const slugPageUrl = `${apiBase}/d/${slug}`;
        const htmlRes0 = await http.base(
            'GET',
            slugPageUrl,
            {},
            { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', __xfpd_withCredentials: true },
            {},
            'text',
        );
        const html0 = String((htmlRes0 && htmlRes0.source) || '');
        const meta0 = filesterParseViewMeta(html0);
        if (meta0 && meta0.fileName) nameHint = String(meta0.fileName);

        // If this request ended up at a /v/ URL, capture it.
        try {
            const fu0 = String((htmlRes0 && htmlRes0.finalUrl) || '');
            if (fu0 && /\/v\//i.test(fu0)) {
                if (!streamUrlImmediate && /https?:\/\/cache6\.filester\.me\/v\//i.test(fu0)) {
                    streamUrlImmediate = fu0;
                }
                if (!relViewPath) {
                    try {
                        const u1 = new URL(fu0);
                        if (/^\/v\//i.test(String(u1.pathname || ''))) {
                            relViewPath = String(u1.pathname || '') + String(u1.search || '');
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // Fallback: extract a /v/... token from the HTML itself.
        if (!streamUrlImmediate) {
            try {
                const mFull = /(https?:\/\/cache\d+\.filester\.me\/v\/[^\s"'<>]+)/i.exec(html0);
                if (mFull && mFull[1] && /https?:\/\/cache6\.filester\.me\/v\//i.test(mFull[1])) streamUrlImmediate = mFull[1];
            } catch (e) {}
        }
        if (!relViewPath) {
            try {
                const mRel = /["'](\/v\/[^"'<>\s]+)["']/i.exec(html0) || /(\/v\/[0-9a-f]{16,}[^"'<>\s]*)/i.exec(html0);
                if (mRel && mRel[1] && String(mRel[1]).startsWith('/v/')) relViewPath = mRel[1];
            } catch (e) {}
        }
    }

    // If still missing, try the explicit view_url returned by the API.
    if (!nameHint && relViewPath && /^\/v\//i.test(String(relViewPath))) {
        const viewPageUrl = `${apiBase}${relViewPath}`;
        const htmlRes = await http.base(
            'GET',
            viewPageUrl,
            {},
            { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', __xfpd_withCredentials: true },
            {},
            'text',
        );
        const html = String((htmlRes && htmlRes.source) || '');
        const meta = filesterParseViewMeta(html);
        if (meta && meta.fileName) nameHint = filesterNormalizeFilename(String(meta.fileName));
    }
} catch (e) {}

                // Download API can return a /d/<token> which then redirects to the real /v/... stream URL.
        // Use it as a fallback to discover the stream path when /api/public/view doesn't provide it.
        try {
            if (!streamUrlImmediate && !relViewPath) {
                if (progressCB) progressCB('[Filester] Resolving download token...');
                const dlRes0 = await http.base(
                    'POST',
                    `${apiBase}/api/public/download`,
                    {},
                    mkHeaders(),
                    JSON.stringify({ file_slug: slug }),
                    'text',
                );

                const src0 = String((dlRes0 && dlRes0.source) || '');
                const dlJson0 = safeJson(src0);

                let tokenUrl = null;
                try {
                    const rel = dlJson0 ? deepFindValueByKeys(dlJson0, ['download_url', 'downloadUrl', 'url']) : null;
                    if (typeof rel === 'string' && rel.trim()) tokenUrl = normalizeUrl(rel);
                } catch (e) {}

                if (!tokenUrl) {
                    const m0 = /"download_url"\s*:\s*"([^"]+)"/i.exec(src0);
                    if (m0 && m0[1]) tokenUrl = normalizeUrl(m0[1]);
                }

                if (tokenUrl) {
                    // If the API returned a token (or /d/<token>), the actual stream is usually /v/<token> on cacheX.
                    // Build relViewPath early so the probe loop can find a working cache host (cache6 preferred).
                    try {
                        let tokenStr = '';
                        try {
                            const tk = dlJson0 ? deepFindValueByKeys(dlJson0, ['token']) : null;
                            if (typeof tk === 'string') tokenStr = String(tk).trim();
                        } catch (e) {}
                        if (!tokenStr) {
                            const mTok = /\/d\/([^\/\?#]+)/i.exec(String(tokenUrl || ''));
                            if (mTok && mTok[1]) tokenStr = String(mTok[1]).trim();
                        }
                        if (tokenStr && !relViewPath) {
                            if (tokenStr.startsWith('/v/')) relViewPath = tokenStr;
                            else if (tokenStr.startsWith('v/')) relViewPath = '/' + tokenStr;
                            else if (tokenStr.startsWith('/d/')) relViewPath = tokenStr.replace(/^\/d\//i, '/v/');
                            else if (tokenStr.startsWith('d/')) relViewPath = '/' + tokenStr.replace(/^d\//i, 'v/');
                            else relViewPath = `/v/${tokenStr}`;
                        }
                    } catch (e) {}

                    const sUrl = await filesterResolveDownloadToken(tokenUrl);
                    if (sUrl) {
                        try {
                            const u2 = new URL(sUrl);
                            if (/^\/v\//i.test(String(u2.pathname || ''))) {
                                relViewPath = String(u2.pathname || '') + String(u2.search || '');
                                if (/https?:\/\/cache6\.filester\.me\/v\//i.test(sUrl)) streamUrlImmediate = String(sUrl);
                            }
                        } catch (e) {
                            if (String(sUrl).startsWith('/v/')) relViewPath = String(sUrl);
                        }
                    }
                }
            }
        } catch (e) {}

// If we already discovered a cache /v/ stream URL from redirects or HTML, prefer it.
        try {
            if (streamUrlImmediate) {
                if (progressCB) progressCB('[Filester] Probing discovered stream URL...');
                const p0 = await filesterProbe(streamUrlImmediate);
                if (p0 && p0.ok) {
                    const streamUrl = String(streamUrlImmediate);
                    const streamCt = String(p0.contentType || '');
                    const streamSize = Number(p0.size || 0) || 0;
                    const streamHdrName = String((p0 && p0.fileName) || '');

                    try { filesterSlugByUrl.set(String(streamUrl), String(slug)); } catch (e) {}
                    try {
                        const ref0 = (relViewPath ? `${apiBase}${relViewPath}` : `${apiBase}/d/${slug}`);
                        if (ref0 && String(ref0).startsWith('http')) {
                            filesterRefByUrl.set(String(streamUrl), String(ref0));
                            filesterRefByUrl.set(String(url), String(ref0));
                            filesterRefByUrl.set(`${apiBase}/d/${slug}`, String(ref0));
                        }
                    } catch (e) {}
                    try { if (!nameHint && streamHdrName) nameHint = String(streamHdrName); } catch (e) {}

                    const ext = filesterExtFromCt(streamCt);
                    let finalName = '';
                    try { if (nameHint) finalName = String(nameHint); } catch (e) {}
                    if (!finalName) finalName = `Filester_${slug}.${ext || 'bin'}`;
                    try {
                        const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(String(finalName || ''));
                        if (!hasExt && ext) finalName = `${finalName}.${ext}`;
                    } catch (e) {}

                    try {
                        filesterNameBySlug.set(String(slug), String(finalName));
                        filesterNameByUrl.set(String(streamUrl), String(finalName));
                        try { filesterNameByUrl.set(String(url), String(finalName)); } catch (e) {}
                        try { filesterNameByUrl.set(`${apiBase}/d/${slug}`, String(finalName)); } catch (e) {}
                        try { if (relViewPath) filesterNameByUrl.set(`${apiBase}${relViewPath}`, String(finalName)); } catch (e) {}
                    } catch (e) {}
                    if (streamSize) {
                        try {
                            filesterSizeBySlug.set(String(slug), Number(streamSize));
                            filesterSizeByUrl.set(String(streamUrl), Number(streamSize));
                        } catch (e) {}
                    }

                    return streamUrl;
                }
            }
        } catch (e) {}

// Prefer the cache /v/ stream URL. The /d/ token often requires a Filester referer (otherwise it returns not_whitelisted).
        try {
            if (relViewPath && /^\/v\//i.test(String(relViewPath))) {
                if (progressCB) progressCB('[Filester] Probing cache stream URL...');
                const bases = [];
                // Chrome Tampermonkey downloads are more reliable when starting from filester.me (redirects preserve a Filester referrer).
                if (!isFF) bases.push(apiBase);
                bases.push('https://cache6.filester.me');
                for (let i = 1; i <= 8; i++) if (i !== 6) bases.push(`https://cache${i}.filester.me`);
                if (isFF) bases.push(apiBase);

                let streamUrl = null;
                let streamCt = '';
                let streamSize = 0;
                let streamHdrName = '';

                for (const base of bases) {
                    const cand = String(base).replace(/\/$/, '') + String(relViewPath);
                    const p = await filesterProbe(cand);
                    if (p && p.ok) {
                        streamUrl = cand;
                        streamCt = String(p.contentType || '');
                        streamSize = Number(p.size || 0) || 0;
                        streamHdrName = String((p && p.fileName) || '');
                        break;
                    }
                }

                if (streamUrl) {
                    try { filesterSlugByUrl.set(String(streamUrl), String(slug)); } catch (e) {}
                    try {
                        const ref0 = (relViewPath ? `${apiBase}${relViewPath}` : `${apiBase}/d/${slug}`);
                        if (ref0 && String(ref0).startsWith('http')) {
                            filesterRefByUrl.set(String(streamUrl), String(ref0));
                            filesterRefByUrl.set(String(url), String(ref0));
                            filesterRefByUrl.set(`${apiBase}/d/${slug}`, String(ref0));
                        }
                    } catch (e) {}
                    try { if (!nameHint && streamHdrName) nameHint = String(streamHdrName); } catch (e) {}
                    const ext = filesterExtFromCt(streamCt);
                    let finalName = '';
                    try { if (nameHint) finalName = String(nameHint); } catch (e) {}
                    if (!finalName) finalName = `Filester_${slug}.${ext || 'bin'}`;
                    try {
                        const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(String(finalName || ''));
                        if (!hasExt && ext) finalName = `${finalName}.${ext}`;
                    } catch (e) {}

                    try {
                        filesterNameBySlug.set(String(slug), String(finalName));
                        filesterNameByUrl.set(String(streamUrl), String(finalName));
                    try { filesterNameByUrl.set(String(url), String(finalName)); } catch (e) {}
                    try { filesterNameByUrl.set(`${apiBase}/d/${slug}`, String(finalName)); } catch (e) {}
                    try { if (relViewPath) filesterNameByUrl.set(`${apiBase}${relViewPath}`, String(finalName)); } catch (e) {}

                    } catch (e) {}
                    if (streamSize) {
                        try {
                            filesterSizeBySlug.set(String(slug), Number(streamSize));
                            filesterSizeByUrl.set(String(streamUrl), Number(streamSize));
                        } catch (e) {}
                    }

                    return streamUrl;
                }
            }
        } catch (e) {}

        try {
            if (progressCB) progressCB('[Filester] Resolving download URL...');
            const dlRes = await http.base(
                'POST',
                `${apiBase}/api/public/download`,
                {},
                mkHeaders(),
                JSON.stringify({ file_slug: slug }),
                'text',
            );

            const src = String((dlRes && dlRes.source) || '');
            const dlJson = safeJson(src);
            let dlUrl = null;

            if (dlJson) {
                dlUrl = pickBestUrl(dlJson);
            }
            if (dlJson && !dlUrl) {
                try {
                    const rel = deepFindValueByKeys(dlJson, ['download_url', 'downloadUrl', 'url']);
                    if (typeof rel === 'string' && rel.startsWith('/')) dlUrl = `${apiBase}${rel}`;
                } catch (e) {}
            }

            if (dlJson && !dlUrl) {
                const waitRaw = deepFindValueByKeys(dlJson, ['wait', 'wait_time', 'waitSeconds', 'wait_seconds', 'seconds']);
                const waitSec = Number(waitRaw);
                if (Number.isFinite(waitSec) && waitSec > 0 && waitSec <= 300) {
                    try {
                        if (progressCB) progressCB(`[Filester] Waiting ${Math.ceil(waitSec)}s...`);
                    } catch (e) {}
                    await new Promise(r => setTimeout(r, Math.ceil(waitSec) * 1000));
                    const dlRes2 = await http.base(
                        'POST',
                        `${apiBase}/api/public/download`,
                        {},
                        mkHeaders(),
                        JSON.stringify({ file_slug: slug }),
                        'text',
                    );
                    const src2 = String((dlRes2 && dlRes2.source) || '');
                    const dlJson2 = safeJson(src2);
                    if (dlJson2) dlUrl = pickBestUrl(dlJson2);
                    if (!dlUrl) {
                        const m2 = /(https?:\/\/[^\s"'<>]+)/i.exec(src2);
                        if (m2 && m2[1]) dlUrl = m2[1];
                    }
                }
            }

            if (!dlUrl) {
                const m = /(https?:\/\/[^\s"'<>]+)/i.exec(src);
                if (m && m[1]) dlUrl = m[1];
            }

            if (dlUrl) {
                try { filesterSlugByUrl.set(String(dlUrl), String(slug)); } catch (e) {}

                if (nameHint) {
                    filesterNameBySlug.set(String(slug), String(nameHint));
                    filesterNameByUrl.set(String(dlUrl), String(nameHint));
                }
                if (sizeHint) {
                    filesterSizeBySlug.set(String(slug), Number(sizeHint));
                    filesterSizeByUrl.set(String(dlUrl), Number(sizeHint));
                }
                return dlUrl;
            }
        } catch (e) {}

        return null;
    },
],
    [
        [/m\.box\.com\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const files = [...dom.querySelectorAll('.files-item-anchor')].map(el => `https://m.box.com${el.getAttribute('href')}`);

            const resolved = [];

            for (const fileUrl of files) {
                const { source, dom } = await http.get(fileUrl);
                if (h.contains('image-preview', source)) {
                    resolved.push(dom.querySelector('.image-preview').getAttribute('src'));
                } else {
                    resolved.push(dom.querySelector('.mtl > a').getAttribute('href'));
                }
            }

            return {
                source,
                dom,
                folderName: dom.querySelector('.folder-nav-title')?.innerText.trim(),
                resolved: resolved.map(u => `https://m.box.com${u}`),
            };
        },
    ],
    [
        [/twimg.com\//],
        url => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, 'https://pbs.twimg.com/media/$1.$3'),
    ],
    [
        [/(disk\.)?yandex\.[a-z]+/],
        async (url, http) => {
            const { dom } = await http.get(url);

            const script = dom.querySelector('script[id="store-prefetch"]');

            if (!script) {
                return null;
            }

            const json = JSON.parse(script.innerText);

            let sk,
                hash = null;

            if (json && json.environment && json.resources) {
                sk = json.environment.sk;
                const resourcesKeys = Object.keys(json.resources);
                hash = json.resources[resourcesKeys[0]]?.hash;
            }

            const data = JSON.stringify({ hash, sk });

            const { source } = await http.post(
                'https://disk.yandex.ru/public/api/download-url',
                data,
                {},
                {
                    'Content-Type': 'text/plain',
                },
            );

            const response = JSON.parse(source);

            if (response && response.error !== 'true' && response.data) {
                return response.data.url;
            }

            return null;
        },
    ],
    [[/(\w+)?.redd.it/], url => url.replace(/&amp;/g, '&')],
];

const setProcessing = (isProcessing, postId) => {
    const p = processing.find(p => p.postId === postId);
    if (p) {
        p.processing = isProcessing;
    } else {
        processing.push({ postId, processing: isProcessing });
    }
};

const downloadPost = async (parsedPost, parsedHosts, enabledHostsCB, resolvers, getSettingsCB, statusUI, callbacks = {}) => {
    const { postId, postNumber } = parsedPost;

    const postSettings = getSettingsCB();

    const enabledHosts = enabledHostsCB(parsedHosts);

    // TODO: Fix this filth.
    window.logs = window.logs.filter(l => l.postId !== postId);

    log.separator(postId);
    log.post.info(postId, `::Using ${enabledHosts.length} host(s)::: ${enabledHosts.map(h => h.name).join(', ')}`, postNumber);

    log.separator(postId);
    log.post.info(postId, `::Preparing download::`, postNumber);

    let completed = 0;
    const zip = new JSZip();
    let zipFileCount = 0;
    let resolved = [];

    const statusLabel = statusUI.status;
    const filePB = statusUI.filePB;
    const totalPB = statusUI.totalPB;

    h.ui.setElProps(statusLabel, {
        color: '#469cf3',
        marginBottom: '3px',
        fontSize: '12px',
    });

    h.ui.setElProps(filePB, {
        width: '0%',
        marginBottom: '1px',
    });

    h.ui.setElProps(totalPB, {
        width: '0%',
        marginBottom: '10px',
    });

    h.show(statusLabel);
    h.show(filePB);
    h.show(totalPB);

    h.ui.setText(statusLabel, 'Resolving...');



// Bunkr: capture filename hints from visible link text (works even when CF blocks /v/ pages).
try {
    const cc = parsedPost && parsedPost.contentContainer;
    if (cc && cc.querySelectorAll) {
        const strip = (s) => String(s || '').split('#')[0].split('?')[0];
        const normUrl = (u) => {
            u = String(u || '').replace(/&amp;/g, '&').trim();
            u = u.split(/[\s"'<>]/)[0].trim();
            if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
            if (u.endsWith('/')) u = u.slice(0, -1);
            return u;
        };
        const extractName = (t) => {
            let s = String(t || '').replace(/\s+/g, ' ').trim();
            if (!s) return '';
            // If link text is itself a URL, it isn't a filename hint.
            if (/^https?:\/\//i.test(s)) return '';
            // Whole string looks like a filename (keep spaces).
            if (/\.[A-Za-z0-9]{1,8}$/.test(s) && s.length <= 200) return s;
            // Otherwise pick the last token-like filename.
            const m = s.match(/[^\\/:*?"<>|\s]+\.[A-Za-z0-9]{1,8}/g);
            if (m && m.length) {
                const cand = m[m.length - 1];
                if (cand && cand.length <= 200) return cand;
            }
            return '';
        };

        cc.querySelectorAll('a[href]').forEach(a => {
            const href0 = normUrl(a.getAttribute('href'));
            if (!href0) return;

            // only for bunkr-ish links (skip direct scdn links)
            if (!/bunkrr?r?\./i.test(href0)) return;
            if (/scdn\.st\//i.test(href0)) return;

            const nm = extractName(a.textContent || '');
            if (!nm) return;
            if (xfpdLooksLikeCfFilenameHint(nm)) return;

            bunkrNameByUrl.set(href0, nm);
            bunkrNameByUrl.set(strip(href0), nm);
        });
    }
} catch (e) {}

log.post.info(postId, '::Url resolution started::', postNumber);

    for (const host of enabledHosts.filter(host => host.resources.length)) {
        const resources = host.resources;

        for (const resource of resources) {
            h.ui.setElProps(statusLabel, { color: '#469cf3', fontWeight: 'bold' });
            h.ui.setText(statusLabel, `Resolving: ${h.limit(resource, 80)}`);

            for (const resolver of resolvers) {
                const patterns = resolver[0];
                const resolverCB = resolver[1];

                let matched = true;

                for (const pattern of patterns) {
                    let strPattern = pattern.toString();

                    let shouldMatch = !h.contains(':!', strPattern);

                    strPattern = strPattern.replace(':!', '');
                    strPattern = h.re.toRegExp(h.re.toString(strPattern), 'is');

                    if (shouldMatch && !strPattern.test(resource)) {
                        matched = false;
                        break;
                    } else if (!shouldMatch && strPattern.test(resource)) {
                        matched = false;
                        break;
                    }
                }

                if (!matched) {
                    continue;
                }

                const passwords = parsedPost.spoilers.concat(parsedPost.spoilers.map(s => s.toLowerCase()));

                let r = null;

                try {
                    const progressCB = (t) => {
    try {
        h.ui.setElProps(statusLabel, { color: '#469cf3', fontWeight: 'bold' });
        h.ui.setText(statusLabel, t);
    } catch (e) {}
};

r = await h.promise(resolve => resolve(resolverCB(resource, h.http, passwords, postId, postSettings, progressCB)));
                } catch (e) {
                    if (host.name === 'Cyberdrop' && /cyberdrop\.[a-z]{2,}\/a\//i.test(String(resource))) {
                        continue;
                    }
                    log.post.error(postId, `::Error resolving::: ${resource}`, postNumber);
                    continue;
                }

                if (h.isNullOrUndef(r)) {
                    log.post.error(postId, `::Could not resolve::: ${resource}`, postNumber);
                    continue;
                }

                h.ui.setElProps(statusLabel, { color: '#47ba24', fontWeight: 'bold' });
                h.ui.setText(statusLabel, `Resolved: ${resolved.length}`);

                const addResolved = (url, folderName) => {
                    if (!resolved.length) {
                        log.separator(postId);
                    }

                    if (h.isObject(url)) {
                        resolved.push({
                            url: url.url,
                            host,
                            original: resource,
                            folderName: url.folderName,
                            forceUnzipped: false, // Filester can be zipped when using blob; DIRECT always saves outside ZIP
                            forceDirect: false,
                        });
                        log.post.info(postId, `::Resolved::: ${url.url}`, postNumber);
                    } else {
                        resolved.push({
                            url,
                            host,
                            original: resource,
                            folderName,
                            forceUnzipped: false, // Filester can be zipped when using blob; DIRECT always saves outside ZIP
                            forceDirect: false,
                        });
                        log.post.info(postId, `::Resolved::: ${url}`, postNumber);
                    }
                };

                if (h.isArray(r.resolved)) {
                    r.resolved.forEach(url => {
                    try {
                        addResolved(url, r.folderName);
                    } catch (e) {
                    }
                });
                } else {
                    addResolved(r, null);
                }
            }
        }
    }

    if (resolved.length) {
        log.separator(postId);
    }

    log.post.info(postId, '::Url resolution completed::', postNumber);

    let totalDownloadable = resolved.filter(r => r.url).length;

    const totalResources = enabledHosts.reduce((acc, h) => h.resources.length + acc, 0);

    h.ui.setElProps(statusLabel, { color: '#47ba24', fontWeight: 'bold' });
    h.ui.setText(statusLabel, `Resolved: ${resolved.length} / ${totalDownloadable} 🢒 ${totalResources} Total Links`);

    const filenames = [];
    const mimeTypes = [];

    // Windows-safe sanitizers (used for folder/zip names). Kept local to downloadPost so it has access to settings.
    const sanitizeWinSegment = (seg, fallback = 'file') => {
        let s = String(seg ?? '').trim();


        // If emojis are disabled, strip emoji/pictographs for consistent behavior across hosts.
        if (settings?.naming?.allowEmojis === false) {
            try {
                s = s.replace(/\p{Extended_Pictographic}/gu, '');
            } catch (e) {
                // Fallback: strip surrogate pairs (covers most emoji)
                s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
            }
            // Remove variation selectors + ZWJ
            s = s.replace(/[\uFE0E\uFE0F\u200D]/g, '');
        }

        // Replace Windows-invalid chars and control chars.
        const sub = (settings?.naming?.invalidCharSubstitute ?? '-');
        s = s
            .replace(/[\u0000-\u001f\u007f]/g, '')
            .replace(/[<>:"/\\|?*]/g, sub)
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[. ]+$/g, ''); // no trailing dots/spaces on Windows

        if (!s) s = String(fallback || 'file');

        // Avoid reserved device names on Windows.
        if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(s)) s = `_${s}`;

        // Very long segments can cause path issues; keep it reasonable.
        if (s.length > 180) s = s.slice(0, 180).trim();

        return s;
    };

    const sanitizeWinPath = (p) => {
        const parts = String(p ?? '')
            .split('/')
            .map(x => sanitizeWinSegment(x, ''))
            .filter(Boolean);
        return parts.join('/');
    };

    const usedPaths = new Set();

    const ensureUniquePath = path => {
        let p = String(path || '').trim();
        if (!p) {
            p = 'file';
        }

        if (!usedPaths.has(p)) {
            usedPaths.add(p);
            return p;
        }

        const parts = p.split('/');
        const base = parts.pop();
        const dir = parts.length ? parts.join('/') : '';
        const ext = h.ext(base);
        const stem = ext ? h.fnNoExt(base) : base;

        let i = 2;
        while (true) {
            const candidateBase = ext ? `${stem} (${i}).${ext}` : `${stem} (${i})`;
            const candidate = dir ? `${dir}/${candidateBase}` : candidateBase;
            if (!usedPaths.has(candidate)) {
                usedPaths.add(candidate);
                return candidate;
            }
            i++;
        }
    };

    const usedFlatNames = new Set();

    const ensureUniqueFlatName = name => {
        let n = String(name || '').trim();
        if (!n) {
            n = 'file';
        }

        if (!usedFlatNames.has(n)) {
            usedFlatNames.add(n);
            return n;
        }

        const ext = h.ext(n);
        const stem = ext ? h.fnNoExt(n) : n;

        let i = 2;
        while (true) {
            const candidate = ext ? `${stem} (${i}).${ext}` : `${stem} (${i})`;
            if (!usedFlatNames.has(candidate)) {
                usedFlatNames.add(candidate);
                return candidate;
            }
            i++;
        }
    };

    setProcessing(true, postId);

    log.separator(postId);
    log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
    log.separator(postId);

    const threadTitle = parsers.thread.parseTitle();

    let customFilename = postSettings.output.find(o => o.postId === postId)?.value;

    if (customFilename) {
        customFilename = customFilename.replace(/:title:/g, threadTitle);
        customFilename = customFilename.replace(/:#:/g, postNumber);
        customFilename = customFilename.replace(/:id:/g, postId);
    }

    if (postSettings.skipDuplicates) {
        const unique = [];
        for (const r of resolved.filter(r => r.url).sort((a, b) => (a.host.type !== 'folder' || b.host.type !== 'folder' ? -1 : 1))) {
            const filename = h.basename(r.url);
            if (unique.find(u => u.filename.toLowerCase() === filename.toLowerCase())) {
                log.post.info(postId, `::Skipped duplicate::: ${filename} ::from:: ${r.url}`, postNumber);
                continue;
            }
            unique.push({ ...r, filename });
        }

        if (unique.length !== resolved.length) {
            h.ui.setText(statusLabel, `Removed ${resolved.length - unique.length} duplicates...`);
            unique.forEach(u => delete u.filename);
            resolved = unique;
            totalDownloadable = resolved.length;
        }
    }

    const isFF = window.isFF;

    if (!postSettings.skipDownload) {
        const resources = resolved.filter(r => r.url);
        totalDownloadable = resources.length;

        // Limit bunkr links to a single concurrent download.
        let batchLength = resolved.some(file => /(turbocdn\.st|turbo\.cr|turbovid\.cr)/i.test(file.url)) ? 1 : (resolved.some(file => /(bunkrr?\.\w+)|(bunkr-cache)/.test(file.url)) ? 1 : 2);

        let currentBatch = 0;

        const batches = [];

        // Build batches:
// - keep existing concurrency (batchLength) for speed
// - but never put more than ONE GoFile item in the same batch (prevents GoFile "gate" spam / soft-block cascades)
const isGoFileUrlBatch = u => /gofile\.io/i.test(String(u || ''));

let tmp = [];
let tmpHasGoFile = false;

for (const item of resources) {
    const isGF = isGoFileUrlBatch(item.url);
    // if current batch is full OR would contain 2x GoFile -> flush
    if (tmp.length >= batchLength || (tmpHasGoFile && isGF)) {
        batches.push(tmp);
        tmp = [];
        tmpHasGoFile = false;
    }

    tmp.push(item);
    if (isGF) tmpHasGoFile = true;
}

if (tmp.length) {
    batches.push(tmp);
        }

        const getNextBatch = () => {
            const batch = currentBatch < batches.length ? batches[currentBatch] : [];
            currentBatch++;
            return batch;
        };

        const requestProgress = [];

        const requests = [];

        let completedBatchedDownloads = 0;

        let cyberdropDirectWarmupDone = false;

        let batch = getNextBatch();

        while (batch.length) {

            const GOFILE_WARMUP_MS = 3000;

            // Turbo: if a signed turbocdn URL stalls (no progress), re-sign and retry quickly before falling back.
            const TURBO_STALL_MS = 5000;
            const TURBO_RESIGN_RETRIES = 3;    // number of re-sign + retry attempts
            const TURBO_DIRECT_FALLBACKS = 1;  // number of direct-download fallbacks after re-sign retries
            const TURBO_RETRY_DELAY_MS = 600;   // small pause before re-sign retry
            const TURBO_DIRECT_DELAY_MS = 800;  // small pause before DIRECT fallback
            const turboRetryState = new Map(); // key -> { resign: n, direct: n }

            const isTurboUrl = u => /turbocdn\.st|turbo\.cr|turbovid\.cr/i.test(String(u || ''));

            const turboExtractId = u => {
                const s = String(u || '');
                const m = s.match(/\/\/(?:[\w-]+\.)?turbo\.cr\/(?:v|d|embed)\/([^\/?#]+)/i) ||
                          s.match(/\/\/(?:[\w-]+\.)?turbovid\.cr\/(?:v|d|embed)\/([^\/?#]+)/i);
                return (m && m[1]) ? m[1] : '';
            };

            const turboExtractFn = u => {
                const s = String(u || '');
                const m = s.match(/[?&]fn=([^&]+)/i);
                if (m && m[1]) {
                    try { return decodeURIComponent(m[1].replace(/\+/g, '%20')); } catch (e) { return m[1]; }
                }
                return '';
            };

            const gmGetTextWithHeaders = (getUrl, headers) => new Promise(resolve => {
                try {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: getUrl,
                        headers: headers || {},
                        onload: r => resolve({ ok: true, status: r.status, text: r.responseText || '' }),
                        onerror: () => resolve({ ok: false, status: 0, text: '' }),
                        ontimeout: () => resolve({ ok: false, status: 0, text: '' }),
                    });
                } catch (e) {
                    resolve({ ok: false, status: 0, text: '' });
                }
            });

            const turboResignSignedUrl = async (turboId, currentUrl) => {
                if (!turboId) return null;

                const embedUrl = `https://turbo.cr/embed/${turboId}`;
                const keepFn = turboExtractFn(currentUrl) || '';

                try {
                    const j = await xfpdTurboFetchSignJsonWithTimeout(turboId, embedUrl);
                    if (j && j.url) {
                        let signed = j.url;
                        const name = (j.original_filename || keepFn || '').toString();
                        if (signed && name && !/[?&]fn=/i.test(String(signed))) {
                            const enc = encodeURIComponent(String(name)).replace(/%20/g, '+');
                            signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
                        }
                        try { turboIdBySignedUrl.set(String(signed), String(turboId)); } catch (e) {}
                        return signed;
                    }
                } catch (e) {}

                return null;
            };
            const isGoFileUrl = u => /gofile\.io/i.test(String(u || ''));
            const isPixeldrainUrl = u => /(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)/i.test(String(u || ''));
            const isImagebamCdnUrl = u => /https?:\/\/(?:images|thumbs)\d+\.imagebam\.com\//i.test(String(u || ''));
            const imagebamRefererForCdn = u => {
                try {
                    const uu = new URL(String(u || ''), location.origin);
                    const base = (uu.pathname || '').split('/').pop() || '';
                    const id = base.replace(/\.[a-z0-9]+$/i, '');
                    return id ? `https://www.imagebam.com/view/${id}` : 'https://www.imagebam.com/';
                } catch (e) {
                    return 'https://www.imagebam.com/';
                }
            };
            const gofileWarmupAttempted = new Set();
            const CYBERDROP_WARMUP_MS = 1500;

            const BLOB_MAX_BYTES = Math.floor(1.6 * 1024 * 1024 * 1024);
            const preflightMetaCache = new Map();
            // Windows-safe filenames for GM_download (Chrome is stricter than Firefox).
            const WIN_ILLEGAL_RE = /[<>:"\/\\|?*\x00-\x1F]/g;

            const sanitizeWinSegment = (s) => {
                const sub = (settings && settings.naming && settings.naming.invalidCharSubstitute) ? settings.naming.invalidCharSubstitute : '_';
                let out = String(s || '');

                // If emojis are disabled, strip emoji/pictographs for consistent behavior across hosts.
                if (settings?.naming?.allowEmojis === false) {
                    try {
                        out = out.replace(/\p{Extended_Pictographic}/gu, '');
                    } catch (e) {
                        // Fallback: strip surrogate pairs (covers most emoji)
                        out = out.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
                    }
                    // Remove variation selectors + ZWJ
                    out = out.replace(/[\uFE0E\uFE0F\u200D]/g, '');
                }
                out = out.replace(WIN_ILLEGAL_RE, sub);
                // Remove remaining control chars / oddities
                out = out.replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
                // Windows also hates trailing dots/spaces in path segments
                out = out.replace(/[\. ]+$/g, '').replace(/^[\. ]+/g, '');
                if (!out) out = '_';
                // Avoid reserved device names
                if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(out)) out = '_' + out;
                return out;
            };

            const sanitizeWinPath = (p) => {
                return String(p || '').split('/').map(sanitizeWinSegment).join('/');
            };


            const headerValue = (headers, name) => {
                try {
                    const re = new RegExp(`^${name}:\\s*([^\\r\\n]+)`, 'im');
                    const m = re.exec(headers || '');
                    return m && m[1] ? String(m[1]).trim() : '';
                } catch (e) { return ''; }
            };

            const parseDispositionFilename = headers => {
                const hRaw = headers || '';
                // RFC 5987 filename*=UTF-8''...
                let m = /filename\*\s*=\s*UTF-8''([^;\r\n]+)/i.exec(hRaw);
                if (m && m[1]) {
                    const raw = String(m[1]).trim().replace(/^"|"$/g, '');
                    try { return decodeURIComponent(raw); } catch (e) { return raw; }
                }
                m = /filename\s*=\s*"([^"\r\n]+)"/i.exec(hRaw) || /filename\s*=\s*([^;\r\n]+)/i.exec(hRaw);
                if (m && m[1]) return String(m[1]).trim().replace(/^"|"$/g, '');
                return '';
            };

            const gmHead = (headUrl, reflink) => new Promise(resolve => {
                try {
                    GM_xmlhttpRequest({
                        method: 'HEAD',
                        url: headUrl,
                                                onload: r => resolve({ ok: true, status: r.status, headers: r.responseHeaders || '' }),
                        onerror: () => resolve({ ok: false, status: 0, headers: '' }),
                        ontimeout: () => resolve({ ok: false, status: 0, headers: '' }),
                    });
                } catch (e) {
                    resolve({ ok: false, status: 0, headers: '' });
                }
            });

            const gmGetText = (getUrl, reflink) => new Promise(resolve => {
                try {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: getUrl,
                                                onload: r => resolve({ ok: true, status: r.status, text: r.responseText || '' }),
                        onerror: () => resolve({ ok: false, status: 0, text: '' }),
                        ontimeout: () => resolve({ ok: false, status: 0, text: '' }),
                    });
                } catch (e) {
                    resolve({ ok: false, status: 0, text: '' });
                }
            });

            const extractNum = v => {
                const n = Number(v);
                return Number.isFinite(n) ? n : 0;
            };

            const preflightMeta = async (dlUrl, reflink, isGoFile, isPixeldrain) => {
                const key = `${dlUrl}`;
                if (preflightMetaCache.has(key)) return preflightMetaCache.get(key);

                const meta = { size: 0, filename: '', status: 0, contentType: '', headers: '' };

                try {
                    if (isPixeldrain) {
                        const mFile = /(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)\/api\/file\/([^\/?#]+)/i.exec(dlUrl || '');
                        if (mFile && mFile[1]) {
                            const pdOrigin = (() => {
                                try {
                                    const uu = new URL(dlUrl || '', location.origin);
                                    const host = String(uu.hostname || '').toLowerCase();
                                    if (host.endsWith('pixeldrain.net')) return 'https://pixeldrain.net';
                                    if (host.endsWith('pixeldra.in')) return 'https://pixeldra.in';
                                    return 'https://pixeldrain.com';
                                } catch (e) {
                                    return 'https://pixeldrain.com';
                                }
                            })();
                            const infoUrl = `${pdOrigin}/api/file/${mFile[1]}/info`;
                            const r = await gmGetText(infoUrl, reflink);
                            if (r.ok && r.text) {
                                try {
                                    const j = JSON.parse(r.text);
                                    const v = j && (j.value || j.data || j);
                                    meta.size = extractNum((v && (v.size ?? v.bytes ?? v.length)) ?? (j && (j.size ?? j.bytes)));
                                    meta.filename = String((v && (v.name ?? v.filename ?? v.title)) ?? (j && (j.name ?? j.filename)) ?? '');
                                } catch (e) {}
                            }
                        }
                    }


                    // Filester hints (API gives name/size but the CDN URL may not include them)
                    try {
                        if (!meta.size) {
                        let hintedSize = 0;
                        try {
                            // Prefer slug-based hints (from /f/ album page) when available.
                            const s0 = String(filesterSlugByUrl.get(String(dlUrl)) || '');
                            hintedSize = Number(filesterSizeBySlug.get(s0) || filesterSizeByUrl.get(String(dlUrl)) || 0) || 0;
                        } catch (e) { hintedSize = 0; }
                        if (hintedSize) meta.size = extractNum(hintedSize);
                    }
                    if (!meta.filename) {
                        let hintedName = '';
                        try {
                            const s0 = String(filesterSlugByUrl.get(String(dlUrl)) || '');
                            hintedName = String(filesterNameBySlug.get(s0) || filesterNameByUrl.get(String(dlUrl)) || '');
                        } catch (e) { hintedName = ''; }
                        if (hintedName) meta.filename = String(hintedName);
                    }
                    } catch (e) {}

                    // Fallback HEAD (works for GoFile store links and Pixeldrain list ZIPs)
                    const nameHasExt = /\.[A-Za-z0-9]{1,8}$/.test(String(meta.filename || ''));
                    const isFilester = /(?:^https?:\/\/)?(?:cache\d+\.)?filester\.me\/v\//i.test(String(dlUrl || ''));
                    const needHead = !!(isGoFile || isPixeldrain || (!isFilester && (!meta.size || !meta.filename || !nameHasExt)));
                    if (needHead) {
                        const hRes = await gmHead(dlUrl, reflink);
                        meta.status = hRes.status || 0;
                        meta.headers = hRes.headers || '';
                        meta.contentType = headerValue(meta.headers, 'content-type');
                        const cl = headerValue(meta.headers, 'content-length');
                        if (!meta.size && cl) meta.size = extractNum(cl);
                        if (!meta.filename) {
                            const cdName = parseDispositionFilename(meta.headers);
                            if (cdName) meta.filename = cdName;
                        }
                    }                } catch (e) {}

                preflightMetaCache.set(key, meta);
                return meta;
            };

            // Filester album policy (location stays unchanged; this only decides ZIP vs DIRECT per file).
            // Rules:
            // - Zipped ON:
            //   * If album contains images + other files:
            //       - If total (all files) <= ~1.6GB AND all sizes are known -> ZIP all.
            //       - Else -> ZIP images only, save the rest via DIRECT (outside ZIP).
            //   * If album contains only non-image files:
            //       - If total <= ~1.6GB AND all sizes are known -> ZIP all.
            //       - Else -> DIRECT all (skip ZIP).
            // - Zipped OFF:
            //   * If album contains any non-image file (mixed OR video-only) -> DIRECT all.
            //   * Images-only album keeps default behavior.

            const FIL_IMG_EXTS = new Set(['.jpg','.jpeg','.png','.gif','.webp','.bmp','.avif','.tif','.tiff','.jxl','.heic','.heif']);
            const FIL_VID_EXTS = new Set(['.mp4','.m4v','.webm','.mkv','.mov','.avi','.wmv','.flv','.ts','.m2ts','.mpg','.mpeg','.3gp']);

            const filesterGuessExt = (s) => {
                const t = String(s || '').trim();
                const m = t.match(/\.([A-Za-z0-9]{1,8})(?=($|\?))/);
                return m ? `.${String(m[1]).toLowerCase()}` : '';
            };

            const filesterSlugFromUrl = (u0) => {
                try {
                    const s = String(u0 || '');
                    const mD = /\/d\/([^\/?#]+)/i.exec(s);
                    if (mD && mD[1]) return String(mD[1]);
                    // cacheN /v/ tokens -> map back to slug when known
                    const s2 = String(filesterSlugByUrl.get(String(u0)) || '');
                    if (s2) return s2;
                } catch (e) {}
                return '';
            };

            const filesterHintName = (u0) => {
                try {
                    const slug = filesterSlugFromUrl(u0);
                    const v =
                        (slug ? filesterNameBySlug.get(String(slug)) : '') ||
                        filesterNameByUrl.get(String(u0)) ||
                        '';
                    return String(v || '').trim();
                } catch (e) {
                    return '';
                }
            };

            const filesterHintSize = (u0) => {
                try {
                    const slug = filesterSlugFromUrl(u0);
                    const v =
                        (slug ? filesterSizeBySlug.get(String(slug)) : 0) ||
                        filesterSizeByUrl.get(String(u0)) ||
                        0;
                    const n = Number(v);
                    return Number.isFinite(n) && n > 0 ? n : 0;
                } catch (e) {
                    return 0;
                }
            };

            const filesterClassify = (u0) => {
                try {
                    const hintedName = filesterHintName(u0);
                    const ext = filesterGuessExt(hintedName || u0);
                    if (ext && FIL_IMG_EXTS.has(ext)) return 'image';
                    if (ext && FIL_VID_EXTS.has(ext)) return 'video';
                    // If no extension, treat as "other" (safer for ZIP decisions).
                    return 'other';
                } catch (e) {
                    return 'other';
                }
            };

            const applyFilesterAlbumPolicy = async () => {
                try {
                    const isFilesterAlbumOriginal = (s) => /(?:^|\/\/)(?:www\.)?filester\.me\/f\//i.test(String(s || '')) || /filester\.me\/f\//i.test(String(s || ''));
                    const albumItems = resolved.filter(r => r && r.url && isFilesterAlbumOriginal(r.original));
                    if (!albumItems.length) return;

                    // Group by the original album URL so each album is handled independently.
                    const groups = new Map();
                    for (const it of albumItems) {
                        const k = String(it.original || '');
                        if (!groups.has(k)) groups.set(k, []);
                        groups.get(k).push(it);
                    }

                    for (const [albumUrl, items] of groups.entries()) {
                        let hasImage = false;
                        let hasNonImage = false;
                        let imgCount = 0;
                        let vidCount = 0;
                        let otherCount = 0;
                        let nonImgCount = 0;
                        let totalSize = 0;
                        let unknownSize = 0;

                        const unknownItems = [];

                        // Collect classification + sizes.
                        for (const it of items) {
                            const kind = filesterClassify(it.url);
                            if (kind === 'image') { hasImage = true; imgCount++; }
                            else if (kind === 'video') { hasNonImage = true; vidCount++; nonImgCount++; }
                            else { hasNonImage = true; otherCount++; nonImgCount++; }

                            const sz0 = filesterHintSize(it.url);
                            if (sz0 > 0) totalSize += sz0;
                            else { unknownSize++; unknownItems.push(it); }
                        }

                        // Best-effort: only attempt HEAD for missing sizes on small albums.
                        // (Avoids 100x HEAD calls on huge albums; in that case we default to the safer policy.)
                        if (unknownItems.length && unknownItems.length <= 10 && items.length <= 25) {
                            for (const it of unknownItems) {
                                const meta = await preflightMeta(it.url, String(albumUrl || 'https://filester.me/'), false, false);
                                const sz = Number(meta && meta.size) || 0;
                                if (sz > 0) { totalSize += sz; unknownSize--; }
                            }
                        }

                        const allSizesKnown = unknownSize === 0 && totalSize > 0;
                        const canZipAll = allSizesKnown && totalSize <= BLOB_MAX_BYTES;

                        const totalStr = allSizesKnown ? `${Math.round(totalSize / 1024 / 1024)}MB` : 'unknown';
                        const info = `files=${items.length}, images=${imgCount}, videos=${vidCount}, other=${otherCount}, total=${totalStr}, unknown=${unknownSize}`;

                        if (!postSettings.zipped) {
                            // Unzipped: if there is ANY non-image (mixed or video-only) -> DIRECT all.
                            if (hasNonImage) {
                                for (const it of items) it.forceDirect = true;
                                log.post.info(postId, `::Filester album (unzipped) has non-image -> DIRECT all (${info})::: ${albumUrl}`, postNumber);
                            }
                            continue;
                        }

                        // Zipped ON
                        if (hasImage && hasNonImage) {
                            if (!canZipAll) {
                                // ZIP images only; everything else DIRECT.
                                for (const it of items) {
                                    const kind = filesterClassify(it.url);
                                    if (kind !== 'image') it.forceDirect = true;
                                }
                                log.post.info(postId, `::Filester mixed album -> ZIP images, DIRECT others (${info})::: ${albumUrl}`, postNumber);
                            } else {
                                log.post.info(postId, `::Filester mixed album total<=~1.6GB -> ZIP all (${info})::: ${albumUrl}`, postNumber);
                            }
                        } else if (!hasImage && hasNonImage) {
                            // Non-image only (videos and/or other file types)
                            const isVideoOnly = vidCount > 0 && otherCount === 0;

                            if (!canZipAll) {
                                for (const it of items) it.forceDirect = true;
                                log.post.info(
                                    postId,
                                    `::Filester ${isVideoOnly ? 'video-only' : 'non-image'} album >~1.6GB or unknown -> DIRECT all (${info})::: ${albumUrl}`,
                                    postNumber
                                );
                            } else {
                                log.post.info(
                                    postId,
                                    `::Filester ${isVideoOnly ? 'video-only' : 'non-image'} album total<=~1.6GB -> ZIP all (${info})::: ${albumUrl}`,
                                    postNumber
                                );
                            }
                        }
                        // Images-only album: keep default behavior.
                    }
                } catch (e) {}
            };

            await applyFilesterAlbumPolicy();

            const gofileWarmupOpenTab = warmUrl => {
                try {
                    const tab = GM_openInTab(warmUrl, { active: false, insert: true, setParent: true });
                    setTimeout(() => {
                        try { xfpdCloseTabHandle(tab); } catch (e) {}
                    }, GOFILE_WARMUP_MS);
                } catch (e) {}
            };

            let filesterNoTabTokenLogged = false;

            const startDownload = async (resource, pass = 1) => {
                let { url, host, original, folderName } = resource;
                const zippedForThis = !!(postSettings.zipped && !(resource && (resource.forceDirect || resource.forceUnzipped)) );
                const isGoFile = isGoFileUrl(url);
                const isPixeldrain = isPixeldrainUrl(url);
                const isTurbo = isTurboUrl(url);
                const isCyberdrop = String(host || '').toLowerCase() === 'cyberdrop';
                const isBunkr = String((host && host.name) || '').toLowerCase() === 'bunkr' || /bunkr/i.test(String(url || '')) || /bunkr/i.test(String(original || ''));
                const isFilester = String((host && host.name) || '').toLowerCase() === 'filester' || /(?:^|\.)filester\.me/i.test(String(url || ''));

                // Filester: turn short /d/<slug> view URLs into cache /v/<token> stream URLs (no tabs).
                // Album pages (/f/...) mostly contain only short slugs, which require this token step.
                if (isFilester) {
                    try {
                        const uF = new URL(String(url || ''));
                        const isFilesterD = /(^|\.)filester\.me$/i.test(String(uF.host || '')) && /^\/d\//i.test(String(uF.pathname || ''));
                        if (isFilesterD) {
                            const slug = String(uF.pathname || '').split('/').filter(Boolean).pop() || '';
                            // Short slugs look like "d8ZdCxc" / "QnUVP6A" etc.
                            const looksLikeShortSlug = /^[A-Za-z0-9]{6,12}$/.test(slug);
                            if (looksLikeShortSlug) {
                                const apiRes = await h.http.base(
                                    'POST',
                                    'https://filester.me/api/public/download',
                                    {},
                                    {
                                        Accept: 'application/json, text/plain, */*',
                                        'Content-Type': 'application/json',
                                        Origin: 'https://filester.me',
                                        Referer: `https://filester.me/d/${slug}`,
                                        __xfpd_withCredentials: true,
                                    },
                                    JSON.stringify({ file_slug: slug }),
                                    'text',
                                );

                                const txt = String((apiRes && apiRes.source) || '');
                                let j = null;
                                try { j = JSON.parse(txt); } catch (e) {}

                                let token = '';
                                try { if (j && typeof j.token === 'string') token = String(j.token).trim(); } catch (e) {}
                                if (!token) {
                                    try {
                                        const rel = j && (j.download_url || j.downloadUrl || j.url);
                                        if (typeof rel === 'string' && rel.trim()) {
                                            const m = /\/d\/([^\/?#]+)/i.exec(String(rel));
                                            if (m && m[1]) token = String(m[1]).trim();
                                        }
                                    } catch (e) {}
                                }
                                if (!token) {
                                    const m2 = /"token"\s*:\s*"([^"]+)"/i.exec(txt);
                                    if (m2 && m2[1]) token = String(m2[1]).trim();
                                }

                                if (token) {
                                    const candidates = filesterBuildCandidates(token);
                                    const streamUrl = (candidates && candidates.length) ? candidates[0] : `https://cache6.filester.me/v/${token}`;
                                    try { filesterCandidatesByToken.set(String(token), candidates); } catch (e) {}
                                    try {
                                        for (const c of (candidates || [])) {
                                            try { filesterSlugByUrl.set(String(c), String(slug)); } catch (e) {}
                                            try { filesterRefByUrl.set(String(c), 'https://filester.me/'); } catch (e) {}
                                        }
                                    } catch (e) {}
                                    if (!filesterNoTabTokenLogged) {
                                        filesterNoTabTokenLogged = true;
                                        log.post.info(postId, `::Filester slug->token->cache (no tab)::: ${slug} -> ${streamUrl}`, postNumber);
                                    }

                                    try { filesterSlugByUrl.set(String(streamUrl), String(slug)); } catch (e) {}
                                    try { filesterRefByUrl.set(String(streamUrl), 'https://filester.me/'); } catch (e) {}
                                    try { filesterRefByUrl.set(String(url), 'https://filester.me/'); } catch (e) {}
                                    url = streamUrl;
                                    try { resource.url = streamUrl; } catch (e) {}
                                }
                            }
                        }
                    } catch (e) {}
                }


                const turboId = isTurbo ? (turboIdBySignedUrl.get(String(url)) || turboExtractId(original) || turboExtractId(url) || '') : '';
                const turboKey = isTurbo ? (turboId ? `turbo:${turboId}` : `turbo-url:${url}`) : '';

                let cyberOrigin = '';
                let cyberSlug = '';
                let cyberFilePage = '';
                const progressKey = isGoFile ? `${url}@@gofilepass${pass}` : url;

                h.ui.setElProps(statusLabel, { fontWeight: 'normal' });

                var reflink = original;
                if (url.includes('bunkr')){
                    reflink = "https://bunkr.si"
                }
                if (url.includes('pomf2')){
                    reflink = "https://pomf2.lain.la"
                }
                if (url.includes('turbocdn.st')){
                    reflink = "https://turbo.cr/"
                }
                if (/(?:\bfilester\.me\b|cache\d+\.filester\.me)/i.test(String(url || ''))){
                    reflink = "https://filester.me/"
                }


                // Cyberdrop: normalize referer/origin and build a /f/ page for optional warm-up.
                if (isCyberdrop) {
                    try {
                        const o = new URL(/^https?:\/\//i.test(String(original || '')) ? String(original) : `https://${String(original)}`);
                        cyberOrigin = o.origin;
                        // Prefer slug from the original /e/ or /f/ URL, fallback to the resolved download URL.
                        const m1 = /\/[ef]\/([^\/?#]+)/i.exec(String(original || ''));
                        const m2 = /\/api\/file\/(?:d|info|auth)\/([^\/?#]+)/i.exec(String(original || ''));
                        const m3 = /\/api\/file\/d\/([^\/?#]+)/i.exec(String(url || ''));
                        cyberSlug = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || '';
                        if (cyberSlug) cyberFilePage = `${cyberOrigin}/f/${cyberSlug}`;
                        // Match browser requests: Referer/Origin are usually just https://cyberdrop.cr/
                        reflink = `${cyberOrigin}/`;
                    } catch (e) {}
                }

                const ellipsedUrl = h.limit(url, 80);
                log.post.info(postId, `::Downloading${isGoFile && pass > 1 ? ' (retry)' : ''}::: ${url}`, postNumber);

                if (isCyberdrop && pass === 1 && cyberOrigin && cyberFilePage && /gigachad-cdn\.ru|selti-delivery\.ru/i.test(String(url || '')) && !cyberdropDirectWarmupDone) {

                    cyberdropDirectWarmupDone = true;
                                        log.post.info(postId, `::Cyberdrop warm-up -> open tab (${CYBERDROP_WARMUP_MS}ms) then continue::: ${cyberFilePage}`, postNumber);
                    await cyberdropWarmupOnce(cyberOrigin, cyberFilePage, CYBERDROP_WARMUP_MS);
                }


                let switchedToDirect = false;

                const startDirectDownload = async (metaHint = null) => {
                    switchedToDirect = true;

                    try {
                        const baseMeta = isTurbo ? {} : ((await preflightMeta(url, reflink, isGoFile, isPixeldrain)) || {});
                        const meta = { ...baseMeta, ...(metaHint || {}) };
                        const sizeBytes = Number(meta.size || 0) || 0;

                        // GoFile: if HEAD already shows an HTML gate / bad status, do the same warm-up + one retry.
                        if (isGoFile) {
                            const ct = String(meta.contentType || '');
                            const badStatus = meta.status && meta.status >= 400;
                            const isHtml = /text\/html|application\/xhtml\+xml/i.test(ct);
                            if ((badStatus || isHtml) && pass === 1 && !gofileWarmupAttempted.has(url)) {
                                gofileWarmupAttempted.add(url);
                                log.post.info(postId, `::GoFile warm-up -> open tab (${GOFILE_WARMUP_MS}ms) then retry [1/2]::: ${url}`, postNumber);
                                gofileWarmupOpenTab(url);
                                setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                                return;
                            }
                        }

                        if (postSettings.zipped) {
                            log.post.info(postId, `::Zipped ON -> saving standalone (not in ZIP)::: ${url}`, postNumber);
                        }

                        // Try to reuse the existing GoFile filename hints, if available.
                        let filename = filenames.find(f => f.url === url);
                        if (!filename && isGoFile) {
                            const mGf = String(url).match(/\/download\/(?:web|direct)\/([^\/?#]+)\//i);
                            const gid = mGf && mGf[1] ? mGf[1] : null;
                            if (gid) {
                                filename = filenames.find(f => f && f.gofileId === gid);
                                if (!filename) {
                                    const hinted =
                                        gofileNameById.get(String(gid)) ||
                                        gofileNameByUrl.get(String(url));
                                    if (hinted) {
                                        filename = { url, name: String(hinted), gofileId: String(gid) };
                                    }
                                }
                            }
                        }

                        let basename = '';

                        if (isPixeldrain) {
                            basename = String(meta.filename || '') || parseDispositionFilename(meta.headers || '') || '';
                        } else if (isGoFile) {
                            basename =
                                (filename && filename.name ? String(filename.name) : '') ||
                                String(meta.filename || '') ||
                                parseDispositionFilename(meta.headers || '') ||
                                '';
                        }

                        if (!basename && isTurbo) {
                            basename = turboExtractFn(url) || '';
                        }

                        if (!basename) {
                            basename = (filename && filename.name) ? String(filename.name) : '';
                        }
                        if (!basename) {
                            basename = h.basename(url);
                        }

                        // Bunkr: prefer the human filename (og:title / h1) captured during resolution.
                        if (isBunkr) {
                            try {
                                const strip = (u) => String(u || '').split('#')[0].split('?')[0];
                                const hinted =
                                    bunkrNameByUrl.get(String(url)) ||
                                    bunkrNameByUrl.get(strip(url)) ||
                                    bunkrNameByUrl.get(String((resource && resource.original) || '')) ||
                                    bunkrNameByUrl.get(strip((resource && resource.original) || '')) ||
                                    '';
                                if (hinted && String(hinted).trim() && !xfpdLooksLikeCfFilenameHint(hinted)) {
                                    basename = String(hinted).trim();

                                    // If hinted has no extension, derive it from URL first, then content-type.
                                    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(basename);
                                    if (!hasExt) {
                                        const urlExt = h.ext(h.basename(strip(url))) || '';
                                        const ct0 = String((meta && (meta.contentType || meta.content_type)) || '');
                                        let ext0 = '';
                                        if (urlExt) ext0 = String(urlExt);
                                        else if (/video\/mp4/i.test(ct0)) ext0 = 'mp4';
                                        else if (/video\/webm/i.test(ct0)) ext0 = 'webm';
                                        else if (/image\/jpe?g/i.test(ct0)) ext0 = 'jpg';
                                        else if (/image\/png/i.test(ct0)) ext0 = 'png';
                                        else if (/image\/gif/i.test(ct0)) ext0 = 'gif';
                                        else if (/application\/zip/i.test(ct0)) ext0 = 'zip';
                                        else if (/application\/(x-7z-compressed)/i.test(ct0)) ext0 = '7z';
                                        else if (/application\/(x-rar|vnd\.rar)|application\/octet-stream/i.test(ct0)) ext0 = 'rar';
                                        else if (/application\/pdf/i.test(ct0)) ext0 = 'pdf';
                                        if (ext0) basename = `${basename}.${ext0}`;
                                    }

                                    basename = sanitizeWinSegment(String(basename || ''));
                                    if (!basename) basename = sanitizeWinSegment(String(h.basename(strip(url)) || ''));
                                }
                            } catch (e) {}
                        }

                        // Filester: prefer the real filename (from view page / API hints); fallback to a safe slug-based name.
                        if (isFilester) {
                            try {
                                let slug0 = '';
                                const m = /https?:\/\/(?:www\.)?filester\.me\/d\/([^\/?#]+)/i.exec(String((resource && resource.original) || ''));
                                if (m && m[1]) slug0 = m[1];
                                if (!slug0) slug0 = String(filesterSlugByUrl.get(String(url)) || '');
                                const ct0 = String((meta && (meta.contentType || meta.content_type)) || '');
                                let ext0 = 'bin';
                                if (/video\/mp4/i.test(ct0)) ext0 = 'mp4';
                                else if (/video\/webm/i.test(ct0)) ext0 = 'webm';
                                else if (/image\/jpe?g/i.test(ct0)) ext0 = 'jpg';
                                else if (/image\/png/i.test(ct0)) ext0 = 'png';
                                else if (/image\/gif/i.test(ct0)) ext0 = 'gif';
                                else if (/application\/zip/i.test(ct0)) ext0 = 'zip';
                                else if (/application\/x-7z-compressed/i.test(ct0)) ext0 = '7z';
                                else if (/application\/(x-rar|vnd\.rar)/i.test(ct0)) ext0 = 'rar';

                                const hinted =
                                    String((meta && (meta.filename || meta.fileName)) || '') ||
                                    String(filesterNameByUrl.get(String(url)) || '') ||
                                    (slug0 ? String(filesterNameBySlug.get(String(slug0)) || '') : '');

                                if (hinted && hinted.trim()) {
                                    basename = hinted.trim();
                                    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(String(basename || ''));
                                    if (!hasExt && ext0) basename = `${basename}.${ext0}`;
                                } else if (slug0) {
                                    basename = `Filester_${slug0}.${ext0}`;
                                }
                            } catch (e) {}
                        }

                        const originalName = basename;

                        // Handle duplicates within this run.
                        const same = filenames.filter(f => f && (f.original === basename || f.name === basename));
                        if (same.length) {
                            const ext2 = h.extension(basename);
                            if (ext2) {
                                basename = `${h.fnNoExt(basename)} (${same.length + 1}).${ext2}`;
                            } else {
                                basename = `${basename} (${same.length + 1})`;
                            }
                        }

                        if (!filename) {
                            const extra = {};
                            if (isGoFile) {
                                const mGf2 = String(url).match(/\/download\/(?:web|direct)\/([^\/?#]+)\//i);
                                const gid2 = mGf2 && mGf2[1] ? mGf2[1] : null;
                                if (gid2) extra.gofileId = String(gid2);
                            }
                            filenames.push({ url, name: basename, original: originalName, ...extra });
                        }

                        const folder = folderName || '';
                        let fn = basename;

                        if (!postSettings.flatten && folder && folder.trim() !== '') {
                            fn = `${folder}/${basename}`;
                        }

                        log.separator(postId);
                        log.post.info(postId, `::Completed (direct)::: ${url}`, postNumber);

                        if (folder && folder.trim() !== '') {
                            log.post.info(postId, `::Saving as (direct)::: ${basename} ::to:: ${folder}`, postNumber);
                        } else {
                            log.post.info(postId, `::Saving as (direct)::: ${basename}`, postNumber);
                        }

                        let title = sanitizeWinSegment(threadTitle);

                        fn = sanitizeWinPath(fn);
                        fn = ensureUniquePath(fn);
                        basename = h.basename(fn);
                        const saveAsFF = `${title} #${postNumber} - ${ensureUniqueFlatName(fn.replace(/\//g, ' - '))}`;
                        const saveAsPath = `${title}/${fn}`;
                        const saveAsName = isFF ? saveAsFF : saveAsPath;

                        h.ui.setElProps(statusLabel, { color: '#469cf3' });
                        h.show(filePB);


                        const origUrl = String(url);
                        let directUrl = String(url);
                        let filesterDirectPreflightDone = false;

                        // Filester DIRECT: retry a few times on transient HTTP errors (429/400/etc) and rotate cache hosts (cache6 <-> cache1 ...)
                        // before starting GM_download. Keeps pauses short (<=~2s).
                        if (isFilester) {
                            try {
                                const ref = String(filesterRefByUrl.get(String(url)) || (resource && resource.original) || 'https://filester.me/');
                                const token0 = filesterTokenFromVUrl(String(url || ''));

                                if (token0) {
                                    let candidates0 = filesterCandidatesByToken.get(token0) || filesterBuildCandidates(token0);
                                    candidates0 = Array.isArray(candidates0) ? candidates0.slice() : [];

                                    const u0 = String(url);
                                    const ix = candidates0.indexOf(u0);
                                    if (ix >= 0) candidates0.splice(ix, 1);
                                    candidates0.unshift(u0);

                                    const cacheLabel = (u) => {
                                        const m = String(u || '').match(/https?:\/\/cache(\d+)\.filester\.me/i);
                                        return m && m[1] ? `cache${m[1]}` : (String(u || '').includes('filester.me') ? 'filester' : 'url');
                                    };

                                    const isRetryableStatus = (st) => {
                                        const n = Number(st || 0) || 0;
                                        return n === 0 || n === 400 || n === 403 || n === 404 || n === 429 || (n >= 500 && n <= 599);
                                    };

                                    const delays = [650, 1300, 2000];

                                    for (let i = 0; i < 3; i++) {
                                        const cand = candidates0[i] || u0;

                                        const pre = await new Promise(resolve => {
                                            try {
                                                GM_xmlhttpRequest({
                                                    method: 'GET',
                                                    url: String(cand),
                                                    responseType: 'text',
                                                    anonymous: false,
                                                    withCredentials: true,
                                                    timeout: 5000,
                                                    headers: { Range: 'bytes=0-0', Accept: '*/*', Referer: ref },
                                                    onload: r => resolve(r),
                                                    onerror: _ => resolve(null),
                                                    ontimeout: _ => resolve(null),
                                                });
                                            } catch (e) {
                                                resolve(null);
                                            }
                                        });

                                        filesterDirectPreflightDone = true;

                                        const st0 = Number(pre && pre.status || 0) || 0;
                                        const finalUrl = pre && (pre.finalUrl || pre.responseURL) ? String(pre.finalUrl || pre.responseURL) : '';
                                        const ok = st0 && st0 < 400;

                                        if (ok) {
                                            directUrl = (finalUrl && /^https?:\/\//i.test(finalUrl)) ? finalUrl : String(cand);

                                            if (i > 0 || String(cand) !== u0 || (finalUrl && finalUrl !== cand)) {
                                                log.post.info(postId, `::Filester DIRECT picked ${cacheLabel(cand)} (HTTP ${st0})::: ${directUrl}`, postNumber);
                                            }
                                            break;
                                        }

                                        if (i < 2 && isRetryableStatus(st0) && candidates0[i + 1]) {
                                            const next = candidates0[i + 1];
                                            const delay = delays[i] || 1000;
                                            log.post.info(postId, `::Filester DIRECT HTTP ${st0 || 0} -> retry [${i + 1}/3] after ${delay}ms; switching ${cacheLabel(cand)}->${cacheLabel(next)}::: ${next}`, postNumber);
                                            await h.delayedResolve(delay);
                                        }
                                    }
                                }
                            } catch (e) {}
                        }

const imagebamHeaders = isImagebamCdnUrl(url) ? { Referer: imagebamRefererForCdn(url) } : null;
                        const dlOpts = {
                            url: directUrl,
                            name: saveAsName,
                                                        onprogress: e => {
                                const loadedMB = Number((e.loaded || 0) / 1024 / 1024).toFixed(2);
                                const totalBytes = (e.total && e.total > 0) ? e.total : (sizeBytes || 0);
                                const totalMB = totalBytes ? Number(totalBytes / 1024 / 1024).toFixed(2) : '??';
                                if (!totalBytes) {
                                    h.ui.setElProps(filePB, { width: '0%' });
                                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${host.name} 🢒 DIRECT 🢒 ${loadedMB} MB 🢒 ${ellipsedUrl}`);
                                } else {
                                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${host.name} 🢒 DIRECT 🢒 ${loadedMB} MB / ${totalMB} MB  🢒 ${ellipsedUrl}`);
                                    h.ui.setElProps(filePB, {
                                        width: `${(e.loaded / totalBytes) * 100}%`,
                                    });
                                }
                            },
                            onload: () => {
                                completed++;
                                completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#2d9053' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });
                            },
                            onerror: err => {
                                completed++;
                                completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });

                                log.post.error(postId, `::DIRECT download failed::: ${url}`, postNumber);
                                console.log(err);
                            },
                            ontimeout: err => {
                                completed++;
                                completedBatchedDownloads++;
                                log.post.error(postId, `::DIRECT download timed out::: ${url}`, postNumber);
                                console.log(err);
                            },
                        };
if (imagebamHeaders && isFF) {
                            // Imagebam CDN often blocks hotlinking without a Referer. In Firefox, GM_download headers
                            // are unreliable, so fetch as a blob with GM_xmlhttpRequest (with Referer) then save.
                            try {
                                GM_xmlhttpRequest({
                                    method: 'GET',
                                    url,
                                    headers: imagebamHeaders,
                                    responseType: 'blob',
                                    anonymous: false,
                                    timeout: 60000,
                                    onprogress: dlOpts.onprogress,
                                    onload: r => {
                                        const ct = headerValue(r.responseHeaders || '', 'content-type');
                                        const isHtml = /text\/html|application\/xhtml\+xml/i.test(String(ct || ''));
                                        if (!(r.status >= 200 && r.status < 300) || !r.response || isHtml) {
                                            dlOpts.onerror({ status: r.status, contentType: ct });
                                            return;
                                        }
                                        const blob = r.response;
                                        // Guard against tiny non-image responses (common for blocked hotlinks)
                                        if (blob && blob.size && blob.size < 2048 && isHtml) {
                                            dlOpts.onerror({ status: r.status, contentType: ct });
                                            return;
                                        }
                                        const blobUrl = URL.createObjectURL(blob);
                                        GM_download({
                                            url: blobUrl,
                                            name: saveAsName,
                                            onload: () => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} dlOpts.onload(); },
                                            onerror: err => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} dlOpts.onerror(err); },
                                            ontimeout: err => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} dlOpts.ontimeout(err); },
                                        });
                                    },
                                    onerror: dlOpts.onerror,
                                    ontimeout: dlOpts.ontimeout,
                                });
                            } catch (e) {
                                dlOpts.onerror(e);
                            }
                        } else {
                            if (imagebamHeaders) dlOpts.headers = { ...(dlOpts.headers || {}), ...imagebamHeaders };

                            // Filester (Chrome): preflight a 1-byte range request to capture the final URL.
                            // This helps when the downloads API drops cookies or when Filester redirects to a signed URL.
                            if (isFilester && !isFF && !filesterDirectPreflightDone) {
                                try {
                                    const ref = String(filesterRefByUrl.get(String(url)) || (resource && resource.original) || 'https://filester.me/');
                                    const pre = await new Promise(resolve => {
                                        try {
                                            GM_xmlhttpRequest({
                                                method: 'GET',
                                                url: String(dlOpts.url),
                                                responseType: 'text',
                                                anonymous: false,
                                                withCredentials: true,
                                                timeout: 15000,
                                                headers: { Range: 'bytes=0-0', Accept: '*/*', Referer: ref },
                                                onload: r => resolve(r),
                                                onerror: _ => resolve(null),
                                                ontimeout: _ => resolve(null),
                                            });
                                        } catch (e) {
                                            resolve(null);
                                        }
                                    });
                                    const finalUrl = pre && (pre.finalUrl || pre.responseURL);
                                    if (finalUrl && typeof finalUrl === 'string' && /^https?:\/\//i.test(finalUrl)) {
                                        dlOpts.url = finalUrl;
                                    }
                                } catch (e) {}
                            }

GM_download(dlOpts);
                        }

                    } catch (e) {
                        // Safety: never hang the batch loop.
                        completed++;
                        completedBatchedDownloads++;
                        log.post.error(postId, `::DIRECT download error::: ${url}`, postNumber);
                        console.log(e);
                    }
                };



                // Forced DIRECT (used by Filester album policy: mixed albums, unzipped mixed/video-only, etc.)
                if (resource && resource.forceDirect) {
                    log.post.info(postId, `::Forced DIRECT (skip blob/ZIP)::: ${url}`, postNumber);
                    setTimeout(() => startDirectDownload(), TURBO_DIRECT_DELAY_MS);
                    return;
                }

                const isPixeldrainList = isPixeldrain && /pixeldrain\.com\/l\//i.test(String(original || ''));
                if (isPixeldrainList) {
                    log.post.info(postId, `::Pixeldrain list (/l/) -> DIRECT (skip blob)::: ${url}`, postNumber);
                    setTimeout(() => startDirectDownload(), TURBO_DIRECT_DELAY_MS);
                    return;
                }

if (isGoFile || isPixeldrain || isFilester) {
                    const meta0 = await preflightMeta(url, reflink, isGoFile, isPixeldrain);
                    if (meta0 && meta0.size && meta0.size > BLOB_MAX_BYTES) {
                        log.post.info(postId, `::Large file (${meta0.size} bytes > ~1.6GB) -> DIRECT (skip blob)::: ${url}`, postNumber);
                        startDirectDownload(meta0);
                        return;
                    }
                }
                let abortReason = '';
                let bunkrMaintenanceHandled = false;

                const isTurboCdn = /turbocdn\.st/i.test(String(url || ''));
                const filesterRef = isFilester ? String(filesterRefByUrl.get(String(url)) || (resource && resource.original) || 'https://filester.me/') : '';
                const reqHeaders = isTurboCdn ? { Referer: 'https://turbo.cr/' } : (isFilester ? { Referer: filesterRef } : { Referer: reflink });

                const request = GM_xmlhttpRequest({
                    url,
                    headers: reqHeaders,
                    responseType: 'blob',
                    anonymous: false,
                    ...(isFilester ? { withCredentials: true } : {}),
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            let matches = h.re.matchAll(/(?<=attachment;filename=").*?(?=")/gis, response.responseHeaders);
                            if (matches.length && !filenames.find(f => f.url === url)) {
                                filenames.push({ url, name: matches[0] });
                            }
                            matches = h.re.matchAll(/(?<=content-type:\s).*$/gi, response.responseHeaders);
                            if (matches.length && !mimeTypes.find(m => m.url === url)) {
                                mimeTypes.push({ url, type: matches[0] });
                            }


                            // Bunkr: detect maintenance placeholder redirect (maint.mp4) early and abort (skip).
                            if (isBunkr && !abortReason) {
                                const loc = headerValue(response.responseHeaders || '', 'location');
                                const fu = String(response.finalUrl || '');
                                if (/\/maint\.mp4(\?|$)/i.test(loc) || /\/maint\.mp4(\?|$)/i.test(fu)) {
                                    abortReason = 'bunkr_maint';
                                    try { request.abort(); } catch (e) {}
                                }
                            }
                        }
                    },
                    onprogress: response => {
                        h.ui.setElProps(statusLabel, {
                            color: '#469cf3',
                        });

                        // Pixeldrain/GoFile: if size only becomes known mid-download and it's > ~1.6GB, switch to direct download.
                        if (!switchedToDirect && (isGoFile || isPixeldrain || isFilester) && response && response.total && response.total > BLOB_MAX_BYTES) {
                            log.post.info(postId, `::Large file (${response.total} bytes > ~1.6GB) detected -> switch to DIRECT::: ${url}`, postNumber);
                            switchedToDirect = true;
                            try { request.abort(); } catch (e) {}
                            startDirectDownload({ size: response.total });
                            return;
                        }

                        const downloadedSizeInMB = Number(response.loaded / 1024 / 1024).toFixed(2);
                        const totalSizeInMB = Number(response.total / 1024 / 1024).toFixed(2);
                        if (response.total === -1 || response.totalSize === -1) {
                            h.ui.setElProps(filePB, { width: '0%' });
                            h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${host.name} 🢒 ${downloadedSizeInMB} MB 🢒 ${ellipsedUrl}`);
                        } else {
                            h.show(filePB);
                            h.ui.setText(
                                statusLabel,
                                `${completed} / ${totalDownloadable} 🢒 ${host.name} 🢒 ${downloadedSizeInMB} MB / ${totalSizeInMB} MB  🢒 ${ellipsedUrl}`,
                            );
                            h.ui.setElProps(filePB, {
                                width: `${(response.loaded / response.total) * 100}%`,
                            });
                        }
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) p.new = response.loaded;
                    },
                    onload: async response => {
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) clearInterval(p.intervalId);



                        if (abortReason === 'bunkr_maint' && bunkrMaintenanceHandled) return;
                        // GoFile: detect soft-block / HTML gate
                        if (isGoFile) {
                            const mCt = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
                            const ct = mCt && mCt[1] ? mCt[1] : '';
                            const isHtml = /text\/html|application\/xhtml\+xml/i.test(ct);
                            const badStatus = !response.status || response.status >= 400;

                            if (badStatus || isHtml) {
                                if (pass === 1 && !gofileWarmupAttempted.has(url)) {
                                    gofileWarmupAttempted.add(url);
                                    log.post.info(postId, `::GoFile warm-up -> open tab (${GOFILE_WARMUP_MS}ms) then retry [1/2]::: ${url}`, postNumber);
                                    gofileWarmupOpenTab(url);
                                    setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                                    return;
                                }

                                // Retry failed -> mark as unsuccessful and continue.
                        completed++;
                        completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });

                                log.post.error(postId, `::GoFile failed (after retry)::: ${url}`, postNumber);
                                return;
                            }
                        }


                        // Cyberdrop: detect anti-bot / API responses (often tiny JSON/HTML) and retry once after warm-up.
                        if (isCyberdrop) {
                            const mCt = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
                            const ct = mCt && mCt[1] ? mCt[1] : '';
                            const isGate = /text\/html|application\/xhtml\+xml|application\/json/i.test(ct);
                            const badStatus = !response.status || response.status >= 400;
                            const size = response.response && typeof response.response.size === 'number' ? response.response.size : 0;
                            const isTiny = size > 0 && size <= 16384;

                            if (badStatus || isGate || isTiny) {
                                if (pass === 1 && cyberOrigin && cyberFilePage) {
                                                                        log.post.info(postId, `::Cyberdrop warm-up -> open tab (${CYBERDROP_WARMUP_MS}ms) then retry [1/2]::: ${cyberFilePage}`, postNumber);
                                    cyberdropWarmupOnce(cyberOrigin, cyberFilePage, CYBERDROP_WARMUP_MS)
                                        .then(() => startDownload(resource, 2))
                                        .catch(() => startDownload(resource, 2));
                                    return;
                                }

                                // Retry failed -> mark as unsuccessful and continue.
                                completed++;
                                completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });

                                log.post.error(postId, `::Cyberdrop failed (gate/tiny response)::: ${url}`, postNumber);
                                return;
                            }
                        }


                        // Filester: detect blocked/tiny responses (often an error thumbnail or HTML gate) and fall back to DIRECT once.
                        if (isFilester) {
                            const mCt = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
                            const ct = mCt && mCt[1] ? mCt[1] : '';
                            const isGate = /text\/html|application\/xhtml\+xml|application\/json/i.test(ct);
                            const badStatus = !response.status || response.status >= 400;

                            const blob = response.response;
                            const size = blob && typeof blob.size === 'number' ? blob.size : 0;

                            let hintSize = 0;
                            try {
                                const s0 = String(filesterSlugByUrl.get(String(url)) || '');
                                hintSize = Number(filesterSizeBySlug.get(s0) || filesterSizeByUrl.get(String(url)) || 0) || 0;
                            } catch (e) {
                                hintSize = 0;
                            }

                            // Only treat "tiny" as suspicious when we have a meaningful expected size.
                            const suspiciousTiny = !!hintSize && size > 0 && size <= 16384 && hintSize >= 32768;

                            if (badStatus || isGate || suspiciousTiny) {
                                if (pass === 1) {
                                    // Filester: some tokens are not available on cache6 (404). Try other cacheN hosts before falling back.
                                    if (badStatus && Number(response.status || 0) === 404) {
                                        const token0 = filesterTokenFromVUrl(String(url || ''));
                                        if (token0) {
                                            const candidates0 = filesterCandidatesByToken.get(token0) || filesterBuildCandidates(token0);
                                            let tried0 = filesterTriedByToken.get(token0);
                                            if (!tried0) { tried0 = new Set(); filesterTriedByToken.set(token0, tried0); }
                                            tried0.add(String(url));
                                            let nextUrl = '';
                                            for (const c of (candidates0 || [])) {
                                                if (!tried0.has(c)) { nextUrl = c; tried0.add(c); break; }
                                            }
                                            if (nextUrl) {
                                                log.post.info(postId, `::Filester cache 404 -> try next cache [${tried0.size}/${(candidates0 || []).length}]::: ${nextUrl}`, postNumber);
                                                try { filesterRefByUrl.set(String(nextUrl), 'https://filester.me/'); } catch (e) {}
                                                try { resource.url = nextUrl; } catch (e) {}
                                                try { url = nextUrl; } catch (e) {}
                                                startDownload(resource, pass);
                                                return;
                                            }
                                        }
                                    }


                                                                        // Filester: retry a few times on transient HTTP errors (429/400/etc) before switching to DIRECT.
                                    // Keep pauses short (<=~2.5s) and try alternate cacheN hosts (cache6 <-> cache1) when possible.
                                    if (badStatus) {
                                        const st0 = Number(response.status || 0) || 0;
                                        const isRetryable = (
                                            st0 === 429 ||
                                            st0 === 400 ||
                                            st0 === 403 ||
                                            st0 === 408 ||
                                            st0 === 409 ||
                                            st0 === 425 ||
                                            st0 === 500 ||
                                            st0 === 502 ||
                                            st0 === 503 ||
                                            st0 === 504
                                        );

                                        if (isRetryable) {
                                            const token0 = filesterTokenFromVUrl(String(url || ''));
                                            const key0 = token0 || String(url || '');
                                            const max0 = 3;

                                            let a0 = Number(filesterRetryAttemptsByKey.get(key0) || 0) || 0;
                                            a0++;
                                            filesterRetryAttemptsByKey.set(key0, a0);

                                            let waitMs = 0;
                                            const ra0 = headerValue(response.responseHeaders || '', 'retry-after');
                                            if (ra0) {
                                                const n0 = Number(String(ra0).trim());
                                                if (Number.isFinite(n0) && n0 > 0) waitMs = Math.floor(n0 * 1000);
                                            }
                                            if (!waitMs) {
                                                waitMs = (650 * a0) + Math.floor(Math.random() * 250);
                                            }
                                            waitMs = Math.min(2500, Math.max(0, waitMs));

                                            let nextUrl = '';
                                            if (token0) {
                                                const candidates0 = filesterCandidatesByToken.get(token0) || filesterBuildCandidates(token0);
                                                let tried0 = filesterTriedByToken.get(token0);
                                                if (!tried0) { tried0 = new Set(); filesterTriedByToken.set(token0, tried0); }
                                                tried0.add(String(url));

                                                const isOn6 = /https?:\/\/cache6\.filester\.me\//i.test(String(url || ''));
                                                const isOn1 = /https?:\/\/cache1\.filester\.me\//i.test(String(url || ''));

                                                // Prefer swapping cache6 <-> cache1 first.
                                                if (isOn6) {
                                                    for (const c of (candidates0 || [])) {
                                                        if (/https?:\/\/cache1\.filester\.me\//i.test(c) && !tried0.has(c)) { nextUrl = c; tried0.add(c); break; }
                                                    }
                                                } else if (isOn1) {
                                                    for (const c of (candidates0 || [])) {
                                                        if (/https?:\/\/cache6\.filester\.me\//i.test(c) && !tried0.has(c)) { nextUrl = c; tried0.add(c); break; }
                                                    }
                                                }

                                                if (!nextUrl) {
                                                    for (const c of (candidates0 || [])) {
                                                        if (!tried0.has(c)) { nextUrl = c; tried0.add(c); break; }
                                                    }
                                                }
                                            }

                                            if (a0 <= max0) {
                                                const tgt = nextUrl || String(url || '');
                                                // retry logging: include cache switch info (cache6<->cache1 etc.)
                                                let switchInfo = '';
                                                try {
                                                    const fromU = String(url || '');
                                                    const toU = String(nextUrl || '');
                                                    if (toU && toU !== fromU) {
                                                        const mf = /https?:\/\/(cache\d+)\.filester\.me\//i.exec(fromU);
                                                        const mt = /https?:\/\/(cache\d+)\.filester\.me\//i.exec(toU);
                                                        if (mf && mt) switchInfo = `; switching ${mf[1]}->${mt[1]}`;
                                                        else if (mf && !mt) switchInfo = `; switching ${mf[1]}->other`;
                                                        else if (!mf && mt) switchInfo = `; switching other->${mt[1]}`;
                                                        else switchInfo = '; switching host';
                                                    }
                                                } catch (e) {}
                                                log.post.info(postId, `::Filester HTTP ${st0} -> retry [${a0}/${max0}] after ${waitMs}ms${switchInfo}::: ${tgt}`, postNumber);

                                                setTimeout(() => {
                                                    try {
                                                        if (nextUrl) {
                                                            try { filesterRefByUrl.set(String(nextUrl), 'https://filester.me/'); } catch (e) {}
                                                            try { resource.url = nextUrl; } catch (e) {}
                                                            try { url = nextUrl; } catch (e) {}
                                                        }
                                                    } catch (e) {}
                                                    startDownload(resource, pass);
                                                }, waitMs);

                                                return;
                                            }
                                        }
                                    }

const isView = /https?:\/\/(?:www\.)?filester\.me\/d\//i.test(String(url || ''));
                                    if (!isView) {
                                        log.post.info(postId, `::Filester blocked/tiny response -> switch to DIRECT [1/2]::: ${url}`, postNumber);
                                        startDirectDownload({ size: hintSize || 0 });
                                        return;
                                    }

                                    // If we only have a /d/ view URL, DIRECT would just save HTML.
                                    completed++;
                                    completedBatchedDownloads++;

                                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                    h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                    h.ui.setElProps(totalPB, {
                                        width: `${(completed / totalDownloadable) * 100}%`,
                                    });

                                    log.post.error(postId, `::Filester failed (resolved to /d/ HTML view)::: ${url}`, postNumber);
                                    return;
                                }

                                completed++;
                                completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });

                                const reason = badStatus ? `HTTP ${response.status || 0}` : (isGate ? 'HTML/JSON gate' : 'tiny/blocked response');
                                log.post.error(postId, `::Filester failed (${reason})::: ${url}`, postNumber);
                                return;
                            }
                        }

                        // Bunkr: skip maintenance/dead placeholder responses (often tiny HTML) instead of saving a tiny file.
                        if (String((host && host.name) || '').toLowerCase() === 'bunkr' || /bunkr/i.test(String(url || '')) || /bunkr/i.test(String((resource && resource.original) || ''))) {
                            const mCt = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
                            const ct = mCt && mCt[1] ? mCt[1] : '';
                            const isHtml = /text\/html|application\/xhtml\+xml/i.test(ct);
                            const badStatus = !response.status || response.status >= 400;

                            const bunkrFinalUrl = String(response.finalUrl || '');
                            const bunkrLoc = headerValue(response.responseHeaders || '', 'location');
                            const isMaint = (abortReason === 'bunkr_maint') || /\/maint\.mp4(\?|$)/i.test(bunkrFinalUrl) || /\/maint\.mp4(\?|$)/i.test(bunkrLoc);

                            const blob = response.response;
                            const size = blob && typeof blob.size === 'number' ? blob.size : 0;
                            const tinyLimit = 32768;

                            let tinyLooksLikeHtml = false;
                            if (!isHtml && !badStatus && postSettings.verifyBunkrLinks && size > 0 && size <= tinyLimit) {
                                try {
                                    const t = await blob.text();
                                    const head = String(t || '').slice(0, 2048).toLowerCase();
                                    tinyLooksLikeHtml =
                                        head.includes('<!doctype') ||
                                        head.includes('<html') ||
                                        head.includes('<head') ||
                                        head.includes('<body') ||
                                        head.includes('temporarily not available') ||
                                        head.includes('maintenance') ||
                                        head.includes('cloudflare');
                                } catch (e) {
                                    tinyLooksLikeHtml = false;
                                }
                            }

                            if (badStatus || isHtml || tinyLooksLikeHtml || isMaint) {
                                if (isMaint) bunkrMaintenanceHandled = true;
                                completed++;
                                completedBatchedDownloads++;

                                h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                                h.ui.setElProps(totalPB, {
                                    width: `${(completed / totalDownloadable) * 100}%`,
                                });

                                const reason = isMaint ? 'maintenance redirect (maint.mp4)' : (badStatus ? `HTTP ${response.status || 0}` : (isHtml ? 'HTML/maintenance response' : 'tiny HTML placeholder'));
                                log.post.error(postId, `::Bunkr skipped (${reason})::: ${url}`, postNumber);
                                return;
                            }
                        }

// Success path (unchanged)
                        completed++;
                        completedBatchedDownloads++;

                        h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                        h.ui.setElProps(statusLabel, { color: '#2d9053' });
                        h.ui.setElProps(totalPB, {
                            width: `${(completed / totalDownloadable) * 100}%`,
                        });

                        // TODO: Extract to method.
                        let filename = filenames.find(f => f.url === url);
                        if (!filename && isGoFile) {
                            // GoFile URLs may be re-resolved to a file-*.gofile.io host, so match by GoFile fileId.
                            const mGf = String(url).match(/\/download\/(?:web|direct)\/([^\/?#]+)\//i);
                            const gid = mGf && mGf[1] ? mGf[1] : null;
                            if (gid) {
                                filename = filenames.find(f => f && f.gofileId === gid);

                                // If the per-run filenames list doesn't know this URL (e.g. re-resolved host),
                                // fall back to the global GoFile hint maps populated during /d/ resolution.
                                if (!filename) {
                                    const hinted =
                                        gofileNameById.get(String(gid)) ||
                                        gofileNameByUrl.get(String(url));
                                    if (hinted) {
                                        filename = { url, name: String(hinted), gofileId: String(gid) };
                                    }
                                }
                            }
                        }

                        if (!filename) {
                            const hintedFilester = filesterNameByUrl.get(String(url));
                            if (hintedFilester) {
                                filename = { url, name: String(hintedFilester) };
                            }
                        }

                        if (!filename) {
                            const hintedByUrl = cyberdropNameByUrl.get(String(url));
                            if (hintedByUrl) {
                                filename = { url, name: String(hintedByUrl) };
                            } else {
                                const mCd =
                                    String(url).match(/\/api\/file\/d\/([^\/\?#]+)\b/i) ||
                                    String(url).match(/cyberdrop\.[^\/]+\/(?:f|e)\/([^\/\?#]+)/i);
                                const slug = mCd && mCd[1] ? mCd[1] : null;
                                if (slug) {
                                    const hintedBySlug = cyberdropNameBySlug.get(String(slug));
                                    if (hintedBySlug) {
                                        filename = { url, name: String(hintedBySlug), cyberdropSlug: String(slug) };
                                    }
                                }
                            }
                        }

                        let basename;

                        if (/(?:pixeldrain\.(?:com|net)|pixeldra\.in)/i.test(String(url || ''))) {
                            const rh = response && response.responseHeaders ? String(response.responseHeaders) : '';
                            basename =
                                parseDispositionFilename(rh) ||
                                (filename ? filename.name : h.basename(url).replace(/\?.*/, '').replace(/#.*/, ''));
                        } else if (url.includes('https://simpcity.su/attachments/')) {
                            basename = filename ? filename.name : h.basename(url).replace(/(.*)-(.{3,4})\.\d*$/i, '$1.$2');
                        } else if (url.includes('kemono.cr')) {
                            basename = filename
                                ? filename.name
                            : h
                                .basename(url)
                                .replace(/(.*)\?f=(.*)/, '$2')
                                .replace('%20', ' ');
                        } else if (url.includes('cyberdrop')) {
                            const rh = response && response.responseHeaders ? String(response.responseHeaders) : '';
                            const cdName = parseDispositionFilename(rh);
                            basename = cdName
                                ? cdName
                                : (filename ? filename.name : h.basename(url).replace(/\?.*/, '').replace(/#.*/, ''));

                            try { basename = decodeURI(basename); } catch (e) {}

                            const extMatch = basename.match(/\.\w{3,6}$/);
                            const basename_ext = extMatch ? extMatch[0] : '';
                            if (basename_ext) {
                                basename =
                                    basename
                                        .replace(basename_ext, '')
                                        .replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/, '') +
                                    basename_ext;
                            }
                        } else {
                            // Turbo CDN signed URLs include the original filename in the fn= query param.
                            // Without this, we'd end up saving as the short id (e.g. uVOxoqFFlDGrZ.mp4).
                            if (url.includes('turbocdn.st')) {
                                const m = url.match(/[?&]fn=([^&]+)/i);
                                if (m && m[1]) {
                                    try {
                                        basename = decodeURIComponent(m[1].replace(/\+/g, '%20'));
                                    } catch (e) {
                                        basename = m[1];
                                    }
                                }
                            }

                            if (!basename) {
                                basename = filename ? filename.name : h.basename(url).replace(/\?.*/, '').replace(/#.*/, '');
                            }
                        }

                        // Bunkr: prefer the human filename (og:title / h1) captured during resolution.
                        if (isBunkr) {
                            try {
                                const strip = (u) => String(u || '').split('#')[0].split('?')[0];
                                const hinted =
                                    bunkrNameByUrl.get(String(url)) ||
                                    bunkrNameByUrl.get(strip(url)) ||
                                    bunkrNameByUrl.get(String((resource && resource.original) || '')) ||
                                    bunkrNameByUrl.get(strip((resource && resource.original) || '')) ||
                                    '';
                                if (hinted && String(hinted).trim() && !xfpdLooksLikeCfFilenameHint(hinted)) {
                                    basename = String(hinted).trim();

                                    // If hinted has no extension, derive it from URL first, then content-type.
                                    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(basename);
                                    if (!hasExt) {
                                        const urlExt = h.ext(h.basename(strip(url))) || '';
                                        const ct0 = headerValue(response.responseHeaders || '', 'content-type');
                                        let ext0 = '';
                                        if (urlExt) ext0 = String(urlExt);
                                        else if (/video\/mp4/i.test(ct0)) ext0 = 'mp4';
                                        else if (/video\/webm/i.test(ct0)) ext0 = 'webm';
                                        else if (/image\/jpe?g/i.test(ct0)) ext0 = 'jpg';
                                        else if (/image\/png/i.test(ct0)) ext0 = 'png';
                                        else if (/image\/gif/i.test(ct0)) ext0 = 'gif';
                                        else if (/application\/zip/i.test(ct0)) ext0 = 'zip';
                                        else if (/application\/(x-7z-compressed)/i.test(ct0)) ext0 = '7z';
                                        else if (/application\/(x-rar|vnd\.rar)|application\/octet-stream/i.test(ct0)) ext0 = 'rar';
                                        else if (/application\/pdf/i.test(ct0)) ext0 = 'pdf';
                                        if (ext0) basename = `${basename}.${ext0}`;
                                    }

                                    basename = sanitizeWinSegment(String(basename || ''));
                                    if (!basename) basename = sanitizeWinSegment(String(h.basename(strip(url)) || ''));
                                }
                            } catch (e) {}
                        }

                        // Filester: prefer the real filename (from view page / API hints). Only fall back to a safe slug-based name when needed.
                        if (/(?:^|https?:\/\/)(?:cache\d+\.)?filester\.me\/(?:d|v)\//i.test(String(url || ''))) {
                            try {
                                let slug0 = '';
                                const m = /https?:\/\/(?:www\.)?filester\.me\/d\/([^\/?#]+)/i.exec(String((resource && resource.original) || ''));
                                if (m && m[1]) slug0 = m[1];
                                if (!slug0) slug0 = String(filesterSlugByUrl.get(String(url)) || '');
                                const ct0 = headerValue(response.responseHeaders || '', 'content-type');
                                let ext0 = 'bin';
                                if (/video\/mp4/i.test(ct0)) ext0 = 'mp4';
                                else if (/video\/webm/i.test(ct0)) ext0 = 'webm';
                                else if (/image\/jpe?g/i.test(ct0)) ext0 = 'jpg';
                                else if (/image\/png/i.test(ct0)) ext0 = 'png';
                                else if (/image\/gif/i.test(ct0)) ext0 = 'gif';
                                else if (/application\/zip/i.test(ct0)) ext0 = 'zip';
                                else if (/application\/x-7z-compressed/i.test(ct0)) ext0 = '7z';
                                else if (/application\/(x-rar|vnd\.rar)/i.test(ct0)) ext0 = 'rar';

                                const hinted =
                                    String((filename && filename.name) || '') ||
                                    String(filesterNameByUrl.get(String(url)) || '') ||
                                    (slug0 ? String(filesterNameBySlug.get(String(slug0)) || '') : '');

                                if (hinted && hinted.trim()) {
                                    basename = hinted.trim();
                                    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(String(basename || ''));
                                    if (!hasExt && ext0) basename = `${basename}.${ext0}`;
                                } else if (slug0) {
                                    basename = `Filester_${slug0}.${ext0}`;
                                }

                                basename = sanitizeWinSegment(String(basename || ''));
                            } catch (e) {}
                        }




                        let ext = h.ext(basename);

                        const mimeType = mimeTypes.find(m => m.url === url);

                        if (!ext && mimeType) {
                            switch (mimeType.type) {
                                case 'image/jpeg':
                                case 'image/jpg':
                                    ext = 'jpg';
                                    break;
                                case 'image/png':
                                    ext = 'png';
                                    break;
                                default:
                                    ext = 'unknown';
                            }
                        }

                        const original = basename;

                        if (filenames.find(f => f.original === basename)) {
                            const count = filenames.filter(f => f.original === basename).length;
                            const baseNoExt = (ext && h.fnNoExt(basename)) ? h.fnNoExt(basename) : basename;
                            basename = ext ? `${baseNoExt} (${count + 1}).${ext}` : `${baseNoExt} (${count + 1})`;
                        }

                        if (!filename) {
                            filenames.push({ url, name: basename, original });
                        }

                        const folder = folderName || '';

                        let fn = basename;

                        if (!postSettings.flatten && folder && folder.trim() !== '') {
                            fn = `${folder}/${basename}`;
                        }

                        log.separator(postId);
                        log.post.info(postId, `::Completed::: ${url}`, postNumber);

                        if (folder && folder.trim() !== '') {
                            log.post.info(postId, `::Saving as::: ${basename} ::to:: ${folder}`, postNumber);
                        } else {
                            log.post.info(postId, `::Saving as::: ${basename}`, postNumber);
                        }

                        const fileBlob = response.response;

                        let title = sanitizeWinSegment(threadTitle);

                        // https://stackoverflow.com/a/53681022
                        fn = sanitizeWinPath(fn);

                        fn = ensureUniquePath(fn);
                        basename = h.basename(fn);

                        if (!isFF) {
                            if (!postSettings.flatten && folder && folder.trim() !== '') {
                                fn = `${folder}/${basename}`;
                            }
                        } else {
                            fn = `${fn}`;
                        }

                        const saveAsFF = `${title} #${postNumber} - ${ensureUniqueFlatName(fn.replace(/\//g, ' - '))}`;
                        const saveAsPath = `${title}/${fn}`;

                        const saveAsName = (isFF && !zippedForThis) ? saveAsFF : saveAsPath;

                        if (!zippedForThis) {
                            const blobUrl = URL.createObjectURL(fileBlob);
                            GM_download({
                                url: blobUrl,
                                name: saveAsName,
                                onload: () => {
                                    try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                                },
                                onerror: response => {
                                    console.log(`Error writing file ${fn} to disk. There may be more details below.`);
                                    console.log(response);
                                    try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                                },
                            });
                        }

                                                if (zippedForThis) {
                            zip.file(fn, fileBlob);
                            zipFileCount++;
                        }

                    },

                    onabort: () => {
                        if (abortReason !== 'bunkr_maint' || bunkrMaintenanceHandled) return;
                        bunkrMaintenanceHandled = true;

                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) clearInterval(p.intervalId);

                        completed++;
                        completedBatchedDownloads++;

                        h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                        h.ui.setElProps(statusLabel, { color: '#b23b3b' });
                        h.ui.setElProps(totalPB, {
                            width: `${(completed / totalDownloadable) * 100}%`,
                        });

                        log.post.error(postId, `::Bunkr skipped (maintenance redirect: maint.mp4)::: ${url}`, postNumber);
                    },

                    onerror: () => {
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) clearInterval(p.intervalId);

                        if (switchedToDirect) return;

                        if (isGoFile && pass === 1 && !gofileWarmupAttempted.has(url)) {
                            gofileWarmupAttempted.add(url);
                            log.post.info(postId, `::GoFile warm-up -> open tab (${GOFILE_WARMUP_MS}ms) then retry [1/2]::: ${url}`, postNumber);
                            gofileWarmupOpenTab(url);
                            setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                            return;
                        }

                        completed++;
                        completedBatchedDownloads++;
                    },
                });

                requests.push({ url: progressKey, request });

                                const stallMs = isTurbo ? TURBO_STALL_MS : 30000;

                const intervalId = setInterval(async () => {
                    const p = requestProgress.find(r => r.url === progressKey);
                    if (!p) return;

                    if (p.old === p.new) {
                        const rr = requests.find(r => r.url === progressKey);
                        if (rr && rr.request) rr.request.abort();
                        clearInterval(p.intervalId);

                        // Turbo: fast re-sign + retry, then (optional) direct fallback.
                        if (isTurbo) {
                            const st = turboRetryState.get(turboKey) || { resign: 0, direct: 0 };

                            if (st.resign < TURBO_RESIGN_RETRIES) {
                                st.resign++;
                                turboRetryState.set(turboKey, st);

                                log.post.info(postId, `::Turbo stalled (no progress for ${Math.round(stallMs / 1000)}s) -> re-sign + retry [${st.resign}/${TURBO_RESIGN_RETRIES}]::: ${url}`, postNumber);

                                try {
                                    const newUrl = await turboResignSignedUrl(turboId, url);
                                    if (newUrl) {
                                        resource.url = newUrl;
                                    }
                                } catch (e) {}

                                // Retry once (even if we couldn't re-sign, a plain retry sometimes works).
                                setTimeout(() => startDownload(resource, pass + 1), st.resign >= 3 ? TURBO_RETRY_DELAY_MS * 2 : TURBO_RETRY_DELAY_MS);
return;
                            }

                            if (st.direct < TURBO_DIRECT_FALLBACKS) {
                                st.direct++;
                                turboRetryState.set(turboKey, st);

                                log.post.info(postId, `::Turbo stalled (no progress for ${Math.round(stallMs / 1000)}s) -> DIRECT fallback (outside ZIP) [${st.direct}/${TURBO_DIRECT_FALLBACKS}]::: ${url}`, postNumber);
                                startDirectDownload();
                                return;
                            }

                            log.post.error(postId, `::Turbo failed (stalled after retries)::: ${url}`, postNumber);

                            if (completed < totalDownloadable) {
                                completed++;
                            }
                            completedBatchedDownloads++;

                            if (completedBatchedDownloads >= batch.length) {
                                completedBatchedDownloads = 0;
                            }
                            return;
                        }

                        // GoFile: make stalls visible and allow one warm-up retry.
                        if (isGoFile) {
                            log.post.error(postId, `::Stalled/Failed::: ${url}`, postNumber);
                        }

                        if (isGoFile && pass === 1 && !gofileWarmupAttempted.has(url)) {
                            gofileWarmupAttempted.add(url);
                            log.post.info(postId, `::GoFile stalled -> warm-up tab (${GOFILE_WARMUP_MS}ms) then retry [1/2]::: ${url}`, postNumber);
                            gofileWarmupOpenTab(url);
                            setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                            return;
                        }

                        if (completed < totalDownloadable) {
                            completed++;
                        }
                        completedBatchedDownloads++;

                        if (completedBatchedDownloads >= batch.length) {
                            completedBatchedDownloads = 0;
                        }
                    } else {
                        p.old = p.new;
                    }
                }, stallMs);

                requestProgress.push({ url: progressKey, intervalId, old: 0, new: 0 });
            };

            for (const item of batch) {
                startDownload(item, 1);
            }

            while (completedBatchedDownloads < batch.length) {
                await h.delayedResolve(1000);
            }

            if (completedBatchedDownloads >= batch.length) {
                completedBatchedDownloads = 0;
            }

            batch = getNextBatch();
        }
    } else {
        log.post.info(postId, '::Skipping download::', postNumber);
    }

    h.hide(statusLabel);
    h.hide(filePB);
    h.hide(totalPB);

    if (totalDownloadable > 0) {
        let title = sanitizeWinSegment(threadTitle);

        const mainZipName = customFilename || `${title} #${postNumber}.zip`;
        const generatedZipName = `${title} #${postNumber} generated.zip`;
        // Original (single ZIP) behavior.
        const needZipBlob = (postSettings.generateLog || postSettings.generateLinks || (postSettings.zipped && zipFileCount > 0));


                // If "Zipped" is enabled but nothing was added to the ZIP (e.g. everything was saved via DIRECT),
                // skip creating an empty ZIP file.
                if (postSettings.zipped && zipFileCount === 0 && !postSettings.generateLog && !postSettings.generateLinks) {
                    log.post.info(postId, `::Zipped ON but nothing to zip (all DIRECT downloads) -> skipping ZIP::`, postNumber);
                }
if (needZipBlob) {
            log.separator(postId);
            log.post.info(postId, postSettings.zipped ? `::Preparing zip::` : `::Preparing generated.zip::`, postNumber);

            if (postSettings.generateLog) {
                log.post.info(postId, `::Generating log file::`, postNumber);
                zip.file(
                    isFF ? 'generated/log.txt' : 'log.txt',
                    logs
                        .filter(l => l.postId === postId)
                        .map(l => l.message)
                        .join('\n'),
                );
            }

            if (postSettings.generateLinks) {
                log.post.info(postId, `::Generating links::`, postNumber);
                zip.file(
                    isFF ? 'generated/links.txt' : 'links.txt',
                    resolved
                        .filter(r => r.url)
                        .map(r => r.url)
                        .join('\n'),
                );
            }

            let blob = null;
            try {
                blob = await zip.generateAsync({ type: 'blob' });
            } catch (e) {
                console.log('JSZip failed to construct the Blob. For very large albums, try unzipped mode.');
                console.log(e);
                blob = null;
            }

            if (blob) {
                if (postSettings.zipped) {
                    if (isFF) {
                        saveAs(blob, mainZipName);
                    } else {
                        await new Promise(resolve => {
                            const url = URL.createObjectURL(blob);
                            GM_download({
                                url,
                                name: `${title}/#${postNumber}.zip`,
                                onload: () => {
                                    try { URL.revokeObjectURL(url); } catch (e) {}
                                    blob = null;
                                    resolve();
                                },
                                onerror: response => {
                                    try { URL.revokeObjectURL(url); } catch (e) {}
                                    console.log(`Error writing file to disk. There may be more details below.`);
                                    console.log(response);
                                    console.log('Trying to write using FileSaver...');
                                    try { saveAs(blob, mainZipName); } catch (e) {}
                                    console.log('Done!');
                                    resolve();
                                },
                            });
                        });
                    }
                } else {
                    if (postSettings.generateLog || postSettings.generateLinks) {
                        if (isFF) {
                            saveAs(blob, generatedZipName);
                        } else {
                            await new Promise(resolve => {
                                const url = URL.createObjectURL(blob);
                                GM_download({
                                    url,
                                    name: `${title}/#${postNumber}/generated.zip`,
                                    onload: () => {
                                        try { URL.revokeObjectURL(url); } catch (e) {}
                                        blob = null;
                                        resolve();
                                    },
                                    onerror: response => {
                                        try { URL.revokeObjectURL(url); } catch (e) {}
                                        console.log(`Error writing generated.zip to disk. There may be more details below.`);
                                        console.log(response);
                                        blob = null;
                                        resolve();
                                    },
                                });
                            });
                        }
                    }
                }
            }
        }

    }

    setProcessing(false, postId);

    if (totalDownloadable > 0) {
        // For logging in console since post logs are already written.
        if (!postSettings.skipDownload) {
            log.post.info(postId, `::Download completed::`, postNumber);
        } else {
            log.post.info(postId, `::Links generation completed::`, postNumber);
        }

        callbacks && callbacks.onComplete && callbacks.onComplete(totalDownloadable, completed);
    }

    window.logs = window.logs.filter(l => l.postId !== postId);
};

/**
 * @param post
 */
const addDuplicateTabLink = post => {
    const span = document.createElement('span');
    span.innerHTML = '<i class="fa fa-copy"></i> Duplicate Tab';

    const dupTabLI = post.parentNode.querySelector('.u-concealed').cloneNode(true);
    dupTabLI.setAttribute('class', 'duplicate-tab');

    const anchor = dupTabLI.querySelector('a');
    anchor.style.color = 'rgb(138, 138, 138)';
    anchor.setAttribute('target', '_blank');
    anchor.querySelector('time').remove();
    anchor.parentNode.style.marginLeft = '10px';
    anchor.append(span);

    post.parentNode.querySelector('.message-attribution-main').append(dupTabLI);
};

/**
 * @param post
 */
const addShowDownloadPageBtnLink = post => {
    const span = document.createElement('span');
    span.innerHTML = '<i class="fa fa-arrow-up"></i> Download Page';

    const dupTabLI = post.parentNode.querySelector('.u-concealed').cloneNode(true);
    dupTabLI.setAttribute('class', 'show-download-page');

    const anchor = dupTabLI.querySelector('a');
    anchor.style.color = 'rgb(138, 138, 138)';
    anchor.setAttribute('href', '#download-page');
    anchor.querySelector('time').remove();
    anchor.parentNode.style.marginLeft = '10px';
    anchor.append(span);

    post.parentNode.querySelector('.message-attribution-main').append(dupTabLI);
};

// TODO: Extract to ui.js
const addDownloadPageButton = () => {
    const downloadAllButton = document.createElement('a');
    downloadAllButton.setAttribute('id', 'download-page');
    downloadAllButton.setAttribute('href', '#');
    downloadAllButton.setAttribute('class', 'button--link button rippleButton');

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.setAttribute('class', 'button-text download-page-btn');
    buttonTextSpan.innerText = `🡳 Download Page`;

    downloadAllButton.appendChild(buttonTextSpan);

    const buttonGroup = h.element('.buttonGroup');
    buttonGroup.prepend(downloadAllButton);

    return downloadAllButton;
};

/**
 * @param postFooter
 */
const registerPostReaction = postFooter => {
    const hasReaction = postFooter.querySelector('.has-reaction');
    if (!hasReaction) {
        const reactionAnchor = postFooter.querySelector('.reaction--imageHidden');
        if (reactionAnchor) {
            reactionAnchor.setAttribute('href', reactionAnchor.getAttribute('href').replace('_id=1', '_id=33'));
            reactionAnchor.click();
        }
    }
};


const CYBERDROP_WARMUP_DEFAULT_MS = 2500;
let cyberdropWarmupChain = Promise.resolve();
const cyberdropWarmupAttempted = new Map();

/**
 * Warm up a Cyberdrop /f/ page in a background tab to let the site set any required cookies.
 * Ensures at most one warm-up tab is open at any time.
 */
async function cyberdropWarmupOnce(key, warmUrl, ms = CYBERDROP_WARMUP_DEFAULT_MS) {
    // Back-compat: allow cyberdropWarmupOnce(url) calls.
    if (typeof warmUrl === 'undefined') {
        const maybeUrl = String(key || '').trim();
        if (/^https?:\/\//i.test(maybeUrl)) {
            warmUrl = maybeUrl;
            try { key = `cyberdrop:${new URL(maybeUrl).origin}`; } catch { key = `cyberdrop:${maybeUrl}`; }
        }
    }

    // Normalize keys that accidentally include a full URL (avoid per-file warmups).
    const _k0 = String(key || '').trim();
    if (_k0.indexOf('://') !== -1) {
        const m = _k0.match(/https?:\/\/[^\s]+/i);
        if (m) { try { key = `cyberdrop:${new URL(m[0]).origin}`; } catch {} }
    }

    const k = String(key || '').trim();
    const u = String(warmUrl || '').trim();
    if (!k || !u) return;

    if (cyberdropWarmupAttempted.has(k)) {
        try { await cyberdropWarmupAttempted.get(k); } catch (e) {}
        return;
    }

    cyberdropWarmupChain = cyberdropWarmupChain.then(() => {
        return new Promise(resolve => {
            try {
                const tab = GM_openInTab(u, { active: false, insert: true, setParent: true });
                setTimeout(() => {
                    try { xfpdCloseTabHandle(tab); } catch (e) {}
                    resolve();
                }, Math.max(250, ms));
            } catch (e) {
                resolve();
            }
        });
    });

    cyberdropWarmupAttempted.set(k, cyberdropWarmupChain);
    await cyberdropWarmupChain;
}



// Legacy helper kept for compatibility (expects a Cyberdrop API URL that returns JSON with a "url" field).
async function cyberdrop_helper(apiUrl) {
    const url = String(apiUrl || '');
    if (!url) return null;

    const headers = { Accept: 'application/json, text/plain, */*' };

    const gmGetText = u =>
        new Promise(resolve => {
            try {
                GM.xmlHttpRequest({
                    method: 'GET',
                    url: u,
                    headers,
                    onload: r => resolve(r),
                    onerror: () => resolve(null),
                    ontimeout: () => resolve(null),
                });
            } catch (e) {
                resolve(null);
            }
        });

    for (let attempt = 0; attempt < 2; attempt++) {
        const r = await gmGetText(url);
        if (r && r.status === 200 && r.responseText) {
            try {
                const j = JSON.parse(r.responseText);
                const direct = j && (j.url || (j.data && j.data.url) || (j.file && j.file.url));
                if (direct && typeof direct === 'string') return direct;
            } catch (e) {}
        }
        await new Promise(res => setTimeout(res, 800));
    }

    return null;
}

const parsedPosts = [];
const selectedPosts = [];

(function () {
    try { if (window.__XFPD_ABORT_MAIN) return; } catch (e) {}

    window.addEventListener('beforeunload', e => {
        if (processing.find(p => p.processing)) {
            const message = 'Downloads are in progress. Sure you wanna exit this page?';
            e.returnValue = message;
            return message;
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {


        try {
            const { source, status } = await h.http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
            if (status !== 200) { throw new Error(`HTTP ${status}`); }
            if (h.contains('token', source)) {
                const token = JSON.parse(source).token;
                GM_setValue('redgifs_token', token);
            }
        } catch (e) {
            console.error('Error getting temporary redgifs auth token:');
            console.error(e);
        }

        init.injectCustomStyles();

        h.elements('.message-attribution-opposite').forEach(post => {
            const settings = {
                zipped: true,
                flatten: false,
                generateLinks: false,
                generateLog: false,
                skipDuplicates: false,
                skipDownload: false,
                verifyBunkrLinks: false,                output: [],
            };

            const parsedPost = parsers.thread.parsePost(post);

            const { content, contentContainer } = parsedPost;

            addDuplicateTabLink(post);
            addShowDownloadPageBtnLink(post);

            const parsedHosts = parsers.hosts.parseHosts(content);

            const getEnabledHostsCB = parsedHosts => parsedHosts.filter(host => host.enabled);

            if (!parsedHosts.length) {
                return;
            }

            const getTotalDownloadableResourcesForPostCB = parsedHosts => {
                return parsedHosts.filter(host => host.enabled && host.resources.length).reduce((acc, host) => acc + host.resources.length, 0);
            };

            // Create and attach the download button to post.
            const { btn: btnDownloadPost } = ui.buttons.addDownloadPostButton(post);
            const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
            const checkedLength = getTotalDownloadableResourcesForPostCB(parsedHosts);
            btnDownloadPost.innerHTML = `🡳 Download (${checkedLength}/${totalResources})`;

            // Create download status / progress elements.
            const { el: statusText } = ui.labels.status.createStatusLabel();
            const filePBar = ui.pBars.createFileProgressBar();
            const totalPBar = ui.pBars.createTotalProgressBar();

            contentContainer.prepend(totalPBar);
            contentContainer.prepend(filePBar);
            contentContainer.prepend(statusText);

            h.hide(statusText);
            h.hide(filePBar);
            h.hide(totalPBar);

            const onFormSubmitCB = data => {
                const { tippyInstance } = data;
                tippyInstance.hide();
            };

            ui.forms.config.post.createPostConfigForm(
                parsedPost,
                parsedHosts,
                `#${parsedPost.postNumber}.zip`,
                settings,
                onFormSubmitCB,
                getTotalDownloadableResourcesForPostCB,
                btnDownloadPost,
            );

            const statusUI = {
                status: statusText,
                filePB: filePBar,
                totalPB: totalPBar,
            };

            const postDownloadCallbacks = {
                onComplete: (total, completed) => {
                    if (total > 0 && completed > 0) {
                        registerPostReaction(parsedPost.footer);
                    }
                },
            };

            let getSettingsCB = () => settings;

            parsedPosts.push({
                parsedPost,
                parsedHosts,
                enabledHostsCB: getEnabledHostsCB,
                resolvers,
                getSettingsCB,
                statusUI,
                postDownloadCallbacks,
            });

            btnDownloadPost.addEventListener('click', e => {
                e.preventDefault();
                downloadPost(parsedPost, parsedHosts, getEnabledHostsCB, resolvers, getSettingsCB, statusUI, postDownloadCallbacks);
            });
        });

        if (parsedPosts.filter(p => p.parsedHosts.length).length > 0) {
            const btnDownloadPage = addDownloadPageButton();

            btnDownloadPage.addEventListener('click', e => {
                e.preventDefault();

                selectedPosts
                    .filter(s => s.enabled)
                    .forEach(s => {
                    downloadPost(
                        s.post.parsedPost,
                        s.post.parsedHosts,
                        s.post.enabledHostsCB,
                        s.post.resolvers,
                        s.post.getSettingsCB,
                        s.post.statusUI,
                        s.post.postDownloadCallbacks,
                    );
                });
            });

            // TODO: Extract to ui.js
            const color = ui.getTooltipBackgroundColor();

            let html = ui.forms.createCheckbox('config-toggle-all-posts', settings.ui.checkboxes.toggleAllCheckboxLabel, false);

            parsedPosts
                .filter(p => p.parsedHosts.length)
                .forEach(post => {
                const { postId, postNumber, textContent } = post.parsedPost;

                selectedPosts.push({ post, enabled: false });

                const threadTitle = parsers.thread.parseTitle();

                let defaultPostContent = textContent.trim().replace('​', '');

                const ellipsedText = h.limit(defaultPostContent === '' ? threadTitle : defaultPostContent, 20);

                const summary = `<a id="post-content-${postId}" href="#post-${postId}" style="color: #3DB7C7"> ${ellipsedText} </a>`;
                html += ui.forms.createCheckbox(`config-download-post-${postId}`, `Post #${postNumber} ${summary}`, false);
            });

            html = `${ui.forms.createRow(ui.forms.createLabel('Post Selection'))} ${html}`;
            ui.tooltip(btnDownloadPage, ui.forms.config.page.createForm(color, html), {
                placement: 'bottom',
                interactive: true,
                onShown: () => {
                    parsedPosts
                        .filter(p => p.parsedHosts.length)
                        .forEach(post => {
                        const { postId, contentContainer } = post.parsedPost;
                        ui.tooltip(
                            `#post-content-${postId}`,
                            `<div style="overflow-y: auto; background: #242323; padding: 16px; width: 500px; max-height: 500px">
                          ${contentContainer.innerHTML}
                         </div>`,
                            { placement: 'right', offset: [10, 15] },
                        );

                        document.querySelector(`#config-download-post-${postId}`).addEventListener('change', e => {
                            const selectedPost = selectedPosts.find(s => s.post.parsedPost.postId === postId);
                            selectedPost.enabled = e.target.checked;

                            const checkAllCB = h.element('#config-toggle-all-posts');
                            checkAllCB.checked = selectedPosts.filter(s => s.enabled).length === parsedPosts.length;
                        });

                        h.element('#config-toggle-all-posts').addEventListener('change', async e => {
                            e.preventDefault();

                            const checked = e.target.checked;

                            const postCheckboxes = parsedPosts
                            .filter(p => p.parsedHosts.length)
                            .map(p => p.parsedPost)
                            .flatMap(p => h.element(`#config-download-post-${p.postId}`));

                            const checkedPostCheckboxes = postCheckboxes.filter(e => e.checked);
                            const unCheckedPostCheckboxes = postCheckboxes.filter(e => !e.checked);

                            if (checked) {
                                unCheckedPostCheckboxes.forEach(c => c.click());
                            } else {
                                checkedPostCheckboxes.forEach(c => c.click());
                            }
                        });
                    });
                },
            });
        }
    });
})();
