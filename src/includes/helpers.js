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
        http({
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
            }
            callbacks && callbacks.onStateChange && callbacks.onStateChange(response);
          },
          onprogress: response => {
            callbacks && callbacks.onProgress && callbacks.onProgress(response);
          },
          onload: response => {
            const { responseText } = response;
            const dom = response?.response;
            callbacks && callbacks.onLoad && callbacks.onLoad(response);
            resolve({ source: responseText, dom, responseHeaders });
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
      return h.promise(resolve => resolve(h.http.base('GET', url, callbacks, headers, {}, responseType)));
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
