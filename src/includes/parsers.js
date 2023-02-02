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
      const messageContent = post.parentNode.parentNode.querySelector('.message-content > .message-userContent > .message-body');
      const footer = post.parentNode.parentNode.querySelector('footer');
      const messageContentClone = messageContent.cloneNode(true);

      const postIdAnchor = post.querySelector('li:last-of-type > a');
      const postId = /(?<=post-).*/i.exec(postIdAnchor.getAttribute('href'))[0];
      const postNumber = postIdAnchor.textContent.replace('#', '').trim();

      // Remove the following from the post content:
      // 1. Quotes.
      // 2. CodeBlock headers
      // 3. Spoiler button text from each spoiler
      // 2. Icons from un-furled urls (url parser can sometimes match them).
      ['.js-unfurl-figure', '.js-unfurl-favicon', 'blockquote', '.button-text > span']
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
            const pat = `(?<=data-url="|src="|href=")https?:\/\/(www.)?${h.re.toString(pattern)}.*?(?=")|https?:\/\/(www.)?${h.re.toString(
              pattern,
            )}.*?(?=("|<|$|\]|'))`;
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

            return 'Direct Links';
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
