// noinspection SpellCheckingInspection,JSUnresolvedVariable,JSUnresolvedFunction,TypeScriptUMDGlobal,JSUnusedGlobalSymbols
// ==UserScript==
// @name XenForoPostDownloader
// @namespace https://github.com/SkyCloudDev
// @author SkyCloudDev
// @description Downloads images and videos from posts
// @version 3.2
// @updateURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/dist/build.user.js
// @downloadURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/dist/build.user.js
// @icon https://simp4.host.church/simpcityIcon192.png
// @license WTFPL; http://www.wtfpl.net/txt/copying/
// @match https://simpcity.su/threads/*
// @require https://unpkg.com/@popperjs/core@2
// @require https://unpkg.com/tippy.js@6
// @require https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @connect self
// @connect coomer.su
// @connect box.com
// @connect boxcloud.com
// @connect kemono.su
// @connect github.com
// @connect big-taco-1img.bunkr.ru
// @connect i-pizza.bunkr.ru
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
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.ch
// @connect cyberdrop.cloud
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect cyberfile.su
// @connect cyberfile.me
// @connect saint2.su
// @connect saint2.pk
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
// @connect imgbox.com
// @connect pixhost.to
// @connect pomf2.lain.la
// @connect pornhub.com
// @connect postimg.cc
// @connect imgvb.com
// @connect pixxxels.cc
// @connect postimg.cc
// @connect imagevenue.com
// @connect nhentai-proxy.herokuapp.com
// @connect pbs.twimg.com
// @connect media.tumblr.com
// @connect pixeldrain.com
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
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log

// ==/UserScript==
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
            token: 'KPQJgKlYsy8JPmbuxj3MC4e5PFEpdZYP',
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
                request = http({
                    url,
                    method,
                    responseType,
                    data,
                    headers: {
                        Referer: url,
                        ...headers,
                    },
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            responseHeaders = response.responseHeaders;

                            if (callbacks && callbacks.onResponseHeadersReceieved) {
                                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });

                                if (request) {
                                    request.abort();
                                    resolve({ request, response, status: response.status, responseHeaders });
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
                        callbacks && callbacks.onLoad && callbacks.onLoad(response);
                        resolve({ source: responseText, request, status, dom, responseHeaders });
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
        const theme = document.body.innerHTML.indexOf('__&s=11') > -1 ? 'purple' : 'classic';
        return theme === 'purple' ? '#30204f' : '#2a2929';
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
                  style="font-weight: bold; margin-left: -7px"
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
      <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: dodgerblue;">
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
            <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: dodgerblue;">
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
          <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; margin-left: 8px; color: dodgerblue;">Filter <span id="filtered-count">(${getTotalDownloadableResourcesCB(
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
            <div style="font-weight: bold; margin-top:3px; margin-bottom: 4px; color: dodgerblue;">
                Settings
            </div>
          </div>
          `;

                    let formHtml = [
                        window.isFF ? ui.forms.config.post.createFilenameInput(customFilename, postId, color, defaultFilename) : null,
                        settingsHeading,
                        !window.isFF ? ui.forms.config.post.createZippedCheckbox(postId, settings.zipped) : null,
                        ui.forms.config.post.createFlattenCheckbox(postId, settings.flatten),
                        ui.forms.config.post.createSkipDuplicatesCheckbox(postId, settings.skipDuplicates),
                        ui.forms.config.post.createGenerateLinksCheckbox(postId, settings.generateLinks),
                        ui.forms.config.post.createGenerateLogCheckbox(postId, settings.generateLog),
                        ui.forms.config.post.createSkipDownloadCheckbox(postId, settings.skipDownload),
                        ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, settings.verifyBunkrLinks),
                        ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
                        ui.forms.createRow(
                            '<a href="#download-page" style="color: dodgerblue; font-weight: bold"><i class="fa fa-arrow-up"></i> Show Download Page Button</a>',
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

                            if (!window.isFF) {
                                h.element(`#settings-${postId}-zipped`).addEventListener('change', e => {
                                    settings.zipped = e.target.checked;
                                });
                            }

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
    ['Coomer:Profiles', [/coomer.su\/[~an@._-]+\/user/]],
    ['Coomer:image', [/(\w+\.)?coomer.su\/(data|thumbnail)/]],
    ['JPG5:image', [/(simp\d+.)?jpg\d\.(church|fish|fishing|pet|su)\/(?!(images2\/0fya082315al2ed460420dbc052c2\.png|images2\/scc49c36a108cefc020\.png|images\/0fya082315al\.png|2024\/0fya082315al84db03fa9bf467e3\.png|img\/|a\/|album\/))/, /jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/]],
    ['kemono:direct link', [/.{2,6}\.kemono.su\/data\//]],
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
    ['Saint:video', [/(saint2.(su|pk|cr)\/embed\/|([~an@]+\.)?saint2.(su|pk|cr)\/videos)/]],
    ['Redgifs:video', [/!!redgifs.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
    ['Bunkr:',
        [
            /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/,
        ]
    ],
    ['Bunkr:Albums', [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]],
    ['Give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
    ['Pixeldrain:', [/(focus\.)?pixeldrain.com\/[lu]\//]],
    ['Gofile:', [/gofile.io\/d/]],
    ['Box.com:', [/m\.box\.com\//]],
    ['Yandex:', [/(disk\.)?yandex\.[a-z]+/]],
    ['Cyberfile:', [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    //['Cyberdrop:', [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /cyberdrop.(me|to|cc|nl)\/a\//]],
    ['Pornhub:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
    ['Noodlemagazine:video', [/(adult.)?noodlemagazine.com\/watch\//]],
    ['Spankbang:video', [/spankbang.com\/.*?\/video/]],
];

/**
 * An array of url resolvers.
 *
 * @type {((RegExp[]|(function(*): *))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*, *): Promise<string>))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*): *))[])[]}
 */
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
    [[/coomer.su\/(data|thumbnail)/], url => url],
    [
        [/coomer.su/, /:!coomer.su\/(data|thumbnail)/],
        async (url, http) => {
            const host = `https://coomer.su`;

            const profileId = url.replace(/\?.*/, '').split('/').reverse()[0];

            let finalURL = url.replace(/\?.*/, '');

            let nextPage = null;

            const posts = [];

            console.log(`[coomer.su] Resolving profile: ${profileId}`);

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

                console.log(`[coomer.su] Resolved page: ${page}`);

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

                console.log(`[coomer.su] Resolved post ${index} / ${posts.length}`);

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
    [[/kemono.su\/data/], url => url],
    [
        [/jpg\d\.(church|fish|fishing|pet|su)\//i, /:!jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)/i],
        url =>
        url
        .replace('.th.', '.')
        .replace('.md.', '.')
    ],
    [
        [/jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)/i],
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
                            Origin: 'https://jpg5.su',
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
                    log.host.error(postId, `::Could not resolve password protected album::: ${url}`, 'jpg5.su');
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
        [/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/(v\/)?/i, /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//],
        async (url, http) => {
            const extension = h.ext(url);
            const filename = h.basename(url);
            let matches = /bunkr\.\w+\/i/i.exec(url);

            const isImage = matches && matches.length;
            const retrieveImageFromURL = matches && matches.length;

            let domain = null;

            if (!matches || !matches.length) {
                matches = /(?<=\/i-)\w+/.exec(url);

                if (matches && matches.length) {
                    domain = matches[0];
                }
            }

            const isImagExtension = settings.extensions.image.some(e => e.substring(1).toLowerCase() === extension.toLowerCase());

            // The file is an image.
            if (isImage || isImagExtension) {
                console.log('Image');
                if (isImagExtension) {
                    return `https://i-${domain}.bunkr.ru/${filename}.${extension}`;
                }

                if (retrieveImageFromURL) {
                    const { dom } = await http.get(url);

                    return dom?.querySelector('.lightgallery > img')?.getAttribute('src');
                }
            }

            // The file is a document or an archive.
            else {
                console.log('Doc');
                const { dom } = await http.get(url);
                const downloadPageURL = dom?.querySelector(`a[href^="https://get.bunkr"]`)?.href;
                console.log(downloadPageURL);

                if (!downloadPageURL) {
                    return null;
                }

                const { dom: downloadPageDOM } = await http.get(downloadPageURL);

                return downloadPageDOM?.querySelector('a')?.href;
            }

            const { dom } = await http.get(url);

            return dom?.querySelector('source')?.getAttribute('src');
        },
    ],
    [
        [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//],
        async (url, http, _, __, postSettings) => {
            const { dom, source } = await http.get(url);

            const containers = dom.querySelectorAll('.grid-images > div');

            const files = [];

            for (const f of containers) {
                const a = f.querySelector('a');
                const img = f.querySelector('img');

                const href = a?.href;

                const extension = f.getElementsByTagName('p')[0].innerHTML.split('.').pop();
                const filename = img?.getAttribute('src').split("/").pop().split('.').slice(0, -1).join(".");
                const matches = /(?<=\/i-)\w+/.exec(img?.getAttribute('src'));

                let domain = null;

                if (matches && matches.length) {
                    domain = matches[0];
                }

                // The file is an image.
                if (domain && settings.extensions.image.some(e => e.substring(1).toLowerCase() === extension.toLowerCase())) {
                    files.push(`https://i-${domain}.bunkr.ru/${filename}.${extension}`);

                    continue;
                }
                // The file is a document or an archive.
                if (
                    href &&
                    (
                        settings.extensions.documents.some(e => e.substring(1).toLowerCase() === extension.toLowerCase()) ||
                        settings.extensions.compressed.some(e => e.substring(1).toLowerCase() === extension.toLowerCase())
                    )
                ) {
                    const { dom } = await http.get(href);
                    const downloadPageURL = dom?.querySelector(`a[href^="https://get.bunkr"]`)?.href;

                    if (!downloadPageURL) {
                        continue;
                    }

                    const { dom: downloadPageDOM } = await http.get(downloadPageURL);

                    files.push(downloadPageDOM?.querySelector('a')?.href);

                    continue;
                }

                // From this point on, we assume that the file is a video.
                // Since it's a video, the domain regex on the image url has to be passed.
                if (!domain) {
                    continue;
                }

                // Start off without the cached url (bunkr-cache.se).

                let resolvedURL = `https://${domain}.bunkr.ru/${filename}.${extension}`;

                if (domain === "fries") {
                    const { status, dom } = await http.get(a.href);
                    resolvedURL = dom?.querySelector('source')?.getAttribute('src');
                }

                if (postSettings.verifyBunkrLinks) {
                    let status = null;

                    try {
                        console.log(`Verifying: ${resolvedURL}`);

                        await http.get(resolvedURL, {
                            onResponseHeadersReceieved: ({ status: s, request }) => {
                                status = s;
                                if (request) {
                                    request.abort();
                                }
                            }
                        });

                        console.log(status === 429 || status === 200 ? `File Exists: ${resolvedURL}` : `Verification Failed. Ignoring ${resolvedURL}`);
                    } catch (e) {
                        continue;
                    }

                    // The file was found. We'll ignore the error as the
                    // concurrent downloads for Bunkr are fixed to a single download.
                    if (status === 429) {
                        files.push(resolvedURL);
                        continue;
                    }

                    // Bail if the file's not found or there's a server error.
                    if (status === 404 || status.toString().substring(0, 1) === '5') {
                        continue;
                    }

                    // Try and pull the link from the video's source tag.
                    if (status !== 200) {
                        const { status, dom } = await http.get(a.href);
                        resolvedURL = dom?.querySelector('source')?.getAttribute('src');
                    }

                    if (!resolvedURL) {
                        continue;
                    }
                }

                files.push(resolvedURL);

            }

            const infoContainer = dom.querySelector('h1');
            const parts = infoContainer?.outerText
            .split('\n')
            .map(t => t.trim())
            .filter(t => t !== '');
            const OrigAlbumName = parts.length ? parts[0].trim() : url.split('/').reverse()[0];
            const albumName = OrigAlbumName.replaceAll('/', '-').replace('&amp;', '');

            return {
                dom,
                source,
                folderName: albumName,
                resolved: files.filter(file => file),
            };
        },
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
        [/pixeldrain.com\/[ul]/],
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
            const resolveAlbum = async (url, spoilers) => {
                const contentId = url.split('/').reverse()[0];

                const apiUrl = `https://api.gofile.io/contents/${contentId}?wt=4fd6sg89d7s6`;

                let { source } = await http.get(apiUrl, {}, { 'Authorization': `Bearer ${settings.hosts.goFile.token}` });

                if (h.contains('error-notFound', source)) {
                    log.host.error(postId, `::Album not found::: ${url}`, 'gofile.io');
                    return null;
                }

                if (h.contains('error-notPublic', source)) {
                    log.host.error(postId, `::Album not public::: ${url}`, 'gofile.io');
                    return null;
                }

                let props = JSON.parse(source?.toString());

                if (h.contains('error-passwordRequired', source) && spoilers.length) {
                    log.host.info(postId, `::Album requires password::: ${url}`, 'gofile.io');

                    if (spoilers.length) {
                        log.host.info(postId, `::Trying with ${spoilers.length} available password(s)::`, 'gofile.io');
                    }

                    for (const spoiler of spoilers) {
                        const hash = sha256(spoiler);

                        const { source } = await http.get(`${apiUrl}&password=${hash}`);

                        props = JSON.parse(source?.toString());

                        if (props && props.status === 'ok') {
                            log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, 'gofile.io');
                        }
                    }
                }

                return props;
            };

            const props = await resolveAlbum(url, spoilers);

            let folderName = h.basename(url);

            if (!props) {
                log.host.error(postId, `::Unable to resolve album::: ${url}`, 'gofile.io');

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

                folderName = props.data.name;

                const files = props.data.children;

                for (const file in files) {
                    const obj = files[file];
                    if (obj.type === 'file') {
                        resolved.push(files[file].link);
                    } else {
                        const folderProps = await resolveAlbum(obj.code, spoilers);
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
    [[/([~an@]+\.)?saint2.(su|pk|cr)\/videos/], async url => url],
    [[/public.onlyfans.com\/files/], async url => url],
    [
        [/saint2.(su|pk|cr)\/embed/],
        async (url, http) => {
            const { dom } = await http.get(url);
            return dom.querySelector('source')?.getAttribute('src');
        },
    ],
    [
        [/redgifs.com(\/|\\\/)ifr/],
        async (url, http) => {
            const id = url.split('/').reverse()[0];
            url = `https://api.redgifs.com/v2/gifs/${id}`;
            const token = GM_getValue('redgifs_token', null);
            const { source } = await http.get(url, {}, { Authorization: `Bearer ${token}` });
            if (h.contains('urls', source)) {
                const urls = JSON.parse(source).gif.urls;
                if (urls.hd) {
                    return urls.hd;
                }

                return urls.sd;
            }

            return null;
        },
    ],
    [
        [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /:!cyberdrop.(me|to|cc|nl)\/a\//],
        async (url) => {
            let resolved ="";
            if (url.includes('fs-')){
                url = url.replace(/(fs|img)-\d+/i, '').replace(/(to|cc|nl)-\d+/i,'me');

                let { source, dom } = await http.get(url, {
                    onStateChange: response => {
                        // If it's a redirect, we'll have to fetch the new url.
                        if (response.readyState === 2 && response.finalUrl !== url) {
                            url = response.finalUrl;
                        }
                    },
                });
            };
            url = url.replace('cyberdrop.me/f','https://cyberdrop.me/api/f').replace('cyberdrop.me/e','https://cyberdrop.me/api/f');
            await GM.xmlHttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    const webData = JSON.parse(response.responseText);
                    resolved=webData.url;
                }
            });
            return resolved;
        },
    ],
    [
        [/cyberdrop.me\/a\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            let resolved =[];
            let dl_url;
            let error_resolved = false;
            let files = [...dom?.querySelectorAll('#file')].map(file =>"https://cyberdrop.me/api" + file.getAttribute('href'));
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                await GM.xmlHttpRequest({
                    method: "GET",
                    url: file,
                    onload: function(response) {
                        if (response.status == 200) {
                        const webData = JSON.parse(response.responseText);
                        dl_url = webData.url;
                        resolved.push(dl_url);
                        } else {
                            error_resolved = true;
                        }
                    }
                });
                if (error_resolved == true)
                {
                    resolved.push( await cyberdrop_helper(file));
                    error_resolved = false;
                }
            }
            return {
                dom,
                source,
                folderName: dom.querySelector('#title').innerText.trim(),
                resolved,
            };
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
                url = url.replace('/attachments/', 'https://simpcity.su/attachments/').replace('/data/video/', 'https://simpcity.su/data/video/')
            return url;
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
                    r = await h.promise(resolve => resolve(resolverCB(resource, h.http, passwords, postId, postSettings)));
                } catch (e) {
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
                        });
                        log.post.info(postId, `::Resolved::: ${url.url}`, postNumber);
                    } else {
                        resolved.push({
                            url,
                            host,
                            original: resource,
                            folderName,
                        });
                        log.post.info(postId, `::Resolved::: ${url}`, postNumber);
                    }
                };

                if (h.isArray(r.resolved)) {
                    r.resolved.forEach(url => addResolved(url, r.folderName));
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
        let batchLength = resolved.some(file => /(bunkrr?\.\w+)|(bunkr-cache)/.test(file.url)) ? 1 : 2;

        let currentBatch = 0;

        const batches = [];

        for (let i = 0; i < totalDownloadable; i += batchLength) {
            batches.push(resources.slice(i, i + batchLength));
        }

        const getNextBatch = () => {
            const batch = currentBatch < batches.length ? batches[currentBatch] : [];
            currentBatch++;
            return batch;
        };

        const requestProgress = [];

        const requests = [];

        let completedBatchedDownloads = 0;

        let batch = getNextBatch();

        while (batch.length) {
            for (const { url, host, original, folderName } of batch) {
                h.ui.setElProps(statusLabel, { fontWeight: 'normal' });
                var reflink = original;
                if (url.includes('bunkr')){
                    reflink = "https://bunkr.si"
                }
                if (url.includes('pomf2')){
                    reflink = "https://pomf2.lain.la"
                }
                const ellipsedUrl = h.limit(url, 80);
                log.post.info(postId, `::Downloading::: ${url}`, postNumber);
                const request = GM_xmlhttpRequest({
                    url,
                    headers: {
                        Referer: reflink,
                    },
                    responseType: 'blob',
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
                        }
                    },
                    onprogress: response => {
                        h.ui.setElProps(statusLabel, {
                            color: '#469cf3',
                        });
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
                        const p = requestProgress.find(r => r.url === url);
                        p.new = response.loaded;
                    },
                    onload: response => {
                        completed++;
                        completedBatchedDownloads++;

                        const p = requestProgress.find(r => r.url === url);
                        clearInterval(p.intervalId);

                        h.ui.setText(statusLabel, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                        h.ui.setElProps(statusLabel, { color: '#2d9053' });
                        h.ui.setElProps(totalPB, {
                            width: `${(completed / totalDownloadable) * 100}%`,
                        });

                        // TODO: Extract to method.
                        const filename = filenames.find(f => f.url === url);

                        let basename;

                        if (url.includes('pixeldrain.com')) {
                            basename = response.responseHeaders.match(/^content-disposition.+filename=(.+)$/im)[1].replace(/"/g, '');
                        } else if (url.includes('https://simpcity.su/attachments/')) {
                            basename = filename ? filename.name : h.basename(url).replace(/(.*)-(.{3,4})\.\d*$/i, '$1.$2');
                        } else if (url.includes('kemono.su')) {
                            basename = filename
                                ? filename.name
                            : h
                                .basename(url)
                                .replace(/(.*)\?f=(.*)/, '$2')
                                .replace('%20', ' ');
                        } else if (url.includes('cyberdrop')) {
                            basename = response.responseHeaders.match(/^content-disposition.+filename=(.+)$/im)[1].replace(/"/g, '');
                            basename = decodeURI(basename);
                            let basename_ext = basename.match(/.\w{3,6}$/);
                            basename = basename.replace(basename_ext,"").replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/,"") + basename_ext;
                        } else {
                            basename = filename ? filename.name : h.basename(url).replace(/\?.*/, '').replace(/#.*/, '');
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
                            basename = `${h.fnNoExt(basename)} (${count + 1}).${ext}`;
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

                        let blob = URL.createObjectURL(response.response);

                        let title = threadTitle.replace(/[\\\/]/g, settings.naming.invalidCharSubstitute);

                        // https://stackoverflow.com/a/53681022
                        fn = fn.replace(/[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '');

                        if (!isFF) {
                            fn = `${fn}`;
                        }

                        const saveAs = `${title}/${fn}`;

                        if (!isFF && !postSettings.zipped) {
                            GM_download({
                                url: blob,
                                name: saveAs,
                                onload: () => {
                                    URL.revokeObjectURL(blob);
                                    blob = null;
                                },
                                onerror: response => {
                                    console.log(`Error writing file ${fn} to disk. There may be more details below.`);
                                    console.log(response);
                                },
                            });
                        }

                        if (isFF || postSettings.zipped) {
                            zip.file(fn, response.response);
                        }
                    },
                    onerror: () => {
                        completed++;
                        completedBatchedDownloads++;
                    },
                });

                requests.push({ url, request });

                const intervalId = setInterval(() => {
                    const p = requestProgress.find(r => r.url === url);
                    if (p.old === p.new) {
                        const r = requests.find(r => r.url === url);
                        r.request.abort();
                        clearInterval(p.intervalId);
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
                }, 30000);

                requestProgress.push({ url, intervalId, old: 0, new: 0 });
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

    if (!isFF) {
        setProcessing(false, postId);
    }

    if (totalDownloadable > 0) {
        let title = threadTitle.replace(/[\\\/]/g, settings.naming.invalidCharSubstitute);
        const filename = customFilename || `${title} #${postNumber}.zip`;

        log.separator(postId);
        log.post.info(postId, `::Preparing zip::`, postNumber);

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

        let blob = await zip.generateAsync({ type: 'blob' });

        if (isFF) {
            saveAs(blob, filename);
            setProcessing(false, postId);
        }

        if (!isFF && postSettings.zipped) {
            GM_download({
                url: URL.createObjectURL(blob),
                name: `${title}/#${postNumber}.zip`,
                onload: () => {
                    blob = null;
                },
                onerror: response => {
                    console.log(`Error writing file to disk. There may be more details below.`);
                    console.log(response);
                    console.log('Trying to write using JSZip...');
                    saveAs(blob, filename);
                    setProcessing(false, postId);
                    console.log('Done!');
                },
            });
        }

        if (!isFF && !postSettings.zipped) {
            if (postSettings.generateLog || postSettings.generateLinks) {
                let url = URL.createObjectURL(blob);
                GM_download({
                    url,
                    name: `${title}/#${postNumber}/generated.zip`,
                    onload: () => {
                        blob = null;
                    },
                    onerror: response => {
                        console.log(`Error writing file ${fn} to disk. There may be more details below.`);
                        console.log(response);
                    },
                });
            }
        }
    } else {
        setProcessing(false, postId);
    }

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


async function cyberdrop_helper(file) {
    let url_dl;
    let error_resolved = false;
    await new Promise(resolve => setTimeout(resolve, 3500));
    await GM.xmlHttpRequest({
        method: "GET",
        url: file,
        onload: async function(response) {
            if (response.status == 200) {
            const webData = JSON.parse(response.responseText);
            url_dl = webData.url;
            } else {
                error_resolved = true;
            }
        }
    });
    if (error_resolved == true)
    {
        console.log("more tries");
        url_dl = await cyberdrop_helper(file);
        error_resolved = false;
    }

    return url_dl;
  }

const parsedPosts = [];
const selectedPosts = [];

(function () {
    window.addEventListener('beforeunload', e => {
        if (processing.find(p => p.processing)) {
            const message = 'Downloads are in progress. Sure you wanna exit this page?';
            e.returnValue = message;
            return message;
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        const goFileTokenFetchFailedErr = 'Failed to create GoFile token. GoFile albums may not work. Refresh the browser to retry.';

        if (h.isNullOrUndef(settings.hosts.goFile.token) || settings.hosts.goFile.token.trim() === '') {
            // TODO: Persist to local storage
            try {
                console.log('Creating GoFile token');
                const { source } = await h.http.get('https://api.gofile.io/createAccount');
                if (h.isNullOrUndef(source) || source.trim() === '') {
                    console.error(goFileTokenFetchFailedErr);
                } else {
                    const props = JSON.parse(source);
                    if (props.status === 'ok' && props.data) {
                        const token = props.data.token;
                        settings.hosts.goFile.token = token;
                        console.log(`Created GoFile token: ${token}`);
                    } else {
                        console.error(goFileTokenFetchFailedErr);
                    }
                }
            } catch (e) {
                console.error(goFileTokenFetchFailedErr);
            }
        }

        try {
            const { source } = await h.http.get('https://api.redgifs.com/v2/auth/temporary');
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
                verifyBunkrLinks: false,
                output: [],
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

                const summary = `<a id="post-content-${postId}" href="#post-${postId}" style="color: dodgerblue"> ${ellipsedText} </a>`;
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
