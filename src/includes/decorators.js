const decorators = {
  bunkr: async (parsedPost) => {
    const { contentContainer } = parsedPost;
    const bunkrLinks = contentContainer.querySelectorAll('a[href^="https://bunkr.su/a/"]');

    if (!bunkrLinks.length) {
      return;
    }

    for (const link of bunkrLinks) {
      const albumLink = link.getAttribute('href');

      const originalText = link.innerText;

      link.innerHTML = `${originalText} <span style="color: #7ab24c; margin-left: 5px">Fetching metadata...</span>`;

      const { dom } = await h.http.get(albumLink);

      // noinspection DuplicatedCode
      const files = [...dom.querySelectorAll('figure.relative')].map((f) => {
        const a = f.querySelector('a');
        const img = f.querySelector('a > img');
        const url = `https://bunkr.su${a.getAttribute('href')}`;

        const src = img?.getAttribute('src');

        let cdn = null;

        if (src) {
          const matches = /i((\d+)?).bunkr/i.exec(src);
          if (matches && matches.length) {
            cdn = matches[1];
          }
        }

        return {
          name: h.basename(url),
          url,
          cdn,
          img: src
        }
      });

      if (!files.length) {
        link.innerHTML = originalText;
        continue;
      }

      if (files.length) {
        const infoContainer = dom.querySelector('h1.text-\\[24px\\]');

        const parts = infoContainer?.outerText.split('\n').map((t) => t.trim()).filter((t) => t !== '');

        const albumName = parts.length ? parts[0].trim() : '';
        const totalFiles = Number(parts.length > 1 ? parts[1] : 0);
        const albumSize = parts.length > 2 ? /(\d+(\.\d+)?)\s\w+/.exec(parts[2].toString())[0] : '0 B';

        if (originalText.replace(' | Bunkr', '').trim() !== albumName) {
          link.innerHTML = `${originalText} 🢒 <span style="color: green; font-weight: bold">${albumName}</span>`;
        } else {
          link.innerHTML = `<span style="color: green; font-weight: bold">${albumName}</span>`;
        }

        const filesHtml = [];

        const getThumbnailURL = (file) => `https://i${file.cdn}.bunkr.ru/thumbs/${file.name.replace(/\.\w+$/, '.png')}`

        files.forEach((file) => {
          let host = `https://media-files${file.cdn}.bunkr.ru`

          if (h.contains('media-files12', host)) {
            host = host.replace('.bunkr.ru', '.bunkr.la');
          }

          filesHtml.push(
            `
            <a
                href="${host}/${file.name}"
                target="_blank"
                class="link link--external"
                rel="noopener"
            >
              <img
                src="${getThumbnailURL(file)}"
                data-url="${getThumbnailURL(file)}"
                class="bbImage"
                loading="lazy"
                style="width: 240px !important; height: 240px !important; object-fit: cover !important;"
                alt
              />
            </a>
            `
          )
        })

        const getSpoilerElement = () => {
          const spoiler = document.createElement('div');
          spoiler.className = 'bbCodeSpoiler';
          spoiler.innerHTML = `
          <button
    type="button"
    class="bbCodeSpoiler-button button--longText button rippleButton"
    data-xf-click="toggle"
    data-xf-init="tooltip"
    data-original-title="Click to reveal or hide spoiler"
  >
    <span class="button-text">
      <span>
        Spoiler: <span style="color: green">${albumName}</span> 🢒 
        <span class="bbCodeSpoiler-button-title">${totalFiles} ${totalFiles === 1 ? 'File' : 'Files'} 🢒 ${albumSize}</span>
      </span>
    </span>
    <div class="ripple-container"></div>
  </button>
  <div class="bbCodeSpoiler-content">
    <div class="bbCodeBlock bbCodeBlock--spoiler">
      <div class="bbCodeBlock-content">
        <div class="bbWrapper">
          ${filesHtml.join('')}
        </div>
      </div>
    </div>
  </div>
          `;
          return spoiler;
        }

        if (link.parentNode.nodeName === 'DIV') {
          link.parentNode.append(getSpoilerElement());
        } else {
          if (h.contains('js-unfurl-title', link.parentNode.getAttribute('class'))) {
            link.parentNode.parentNode.parentNode.parentNode.insertAdjacentElement('afterend', getSpoilerElement());
          }
        }
      }
    }
  },
  goFile: async (parsedPost) => {
    const { spoilers, contentContainer } = parsedPost;
    const goFileLinks = [...contentContainer.querySelectorAll('a[href^="https://gofile.io/d/"]')].reduce((acc, a) => acc.find((c) => c.getAttribute('href') === a.getAttribute('a')) > -1 ? acc : acc.concat(a), []);

    if (!goFileLinks.length) {
      return;
    }

    for (const link of goFileLinks) {
      const albumLink = link.getAttribute('href');
      const contentId = albumLink.split('/').reverse()[0];

      const originalText = link.innerText;

      link.innerHTML = `${originalText} <span style="color: #7ab24c; margin-left: 5px">Fetching metadata...</span>`;

      const resolveAlbum = async (url, spoilers) => {
        const contentId = url.split('/').reverse()[0];

        const apiUrl = `https://api.gofile.io/getContent?contentId=${contentId}&token=${settings.hosts.goFile.token}&websiteToken=12345&cache=true`;

        let { source } = await h.http.get(apiUrl);

        if (!h.contains('"ok"', source)) {
          return null;
        }

        let props = JSON.parse(source?.toString());

        if (h.contains('error-passwordRequired', source) && spoilers.length) {
          for (const spoiler of spoilers) {
            const hash = sha256(spoiler);

            const { source } = await http.get(`${apiUrl}&password=${hash}`);

            props = JSON.parse(source?.toString());
          }
        }

        return props;
      };

      const props = await resolveAlbum(albumLink, spoilers);

      if (!props) {
        link.innerHTML = originalText;
        continue;
      }

      let albumName = contentId;
      let albumSize = 0;

      const files = [];

      const getChildAlbums = async (props, spoilers) => {
        if (!props || props.status !== 'ok' || !props.data || !props.data.childs || !props.data.childs.length) {
          return [];
        }

        const resolved = [];

        albumName = props.data.name;
        albumSize = props.data.totalSize;

        const files = props.data.contents;

        for (const file in files) {
          const obj = files[file];
          if (obj.type === 'file') {
            resolved.push({
              url: files[file].link,
              size: files[file].size,
            });
          } else {
            const folderProps = await resolveAlbum(obj.code, spoilers);
            resolved.push(...(await getChildAlbums(folderProps, spoilers)));
          }
        }

        return resolved;
      };

      files.push(...(await getChildAlbums(props, spoilers)));

      if (!files.length) {
        link.innerHTML = originalText;
        continue;
      }

      link.innerHTML = `${originalText} 🢒 <span style="color: green; font-weight: bold">${albumName}</span>`;

      const filesHtml = [];

      files.forEach((file, i) => {
        filesHtml.push(
          `
            <a
                href="${file.url}"
                target="_blank"
                class="link link--external"
                rel="noopener"
                style="display: block"
            >
                ${i + 1}. ${h.basename(file.url)} 🢒 ${h.prettyBytes(Number(file.size))}
            </a>
            `
        )
      })

      const getSpoilerElement = () => {
        const spoiler = document.createElement('div');
        spoiler.className = 'bbCodeSpoiler';
        spoiler.innerHTML = `
          <button
    type="button"
    class="bbCodeSpoiler-button button--longText button rippleButton"
    data-xf-click="toggle"
    data-xf-init="tooltip"
    data-original-title="Click to reveal or hide spoiler"
  >
    <span class="button-text">
      <span>
        Spoiler: <span style="color: green">${albumName}</span> 🢒 
        <span class="bbCodeSpoiler-button-title">${files.length} ${files.length === 1 ? 'File' : 'Files'} 🢒 ${h.prettyBytes(Number(albumSize))}</span>
      </span>
    </span>
    <div class="ripple-container"></div>
  </button>
  <div class="bbCodeSpoiler-content">
    <div class="bbCodeBlock bbCodeBlock--spoiler">
      <div class="bbCodeBlock-content">
        <div class="bbWrapper">
          ${filesHtml.join('')}
        </div>
      </div>
    </div>
  </div>
          `;
        return spoiler;
      }

      if (link.parentNode.nodeName === 'DIV') {
        link.parentNode.append(getSpoilerElement());
      } else {
        if (h.contains('js-unfurl-title', link.parentNode.getAttribute('class'))) {
          link.parentNode.parentNode.parentNode.parentNode.insertAdjacentElement('afterend', getSpoilerElement());
        }
      }
    }
  }
}