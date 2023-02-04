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
  ['simpcity.su:Attachments', [/simpcity.su\/attachments/]],
  ['anonfiles.com:', [/anonfiles.com/]],
  ['coomer.party:Profiles', [/coomer.party\/[~an@._-]+\/user/]],
  ['coomer.party:image', [/(\w+\.)?coomer.party\/(data|thumbnail)/]],
  ['jpg.church:image', [/simp(\d+.)?jpg.church\/(?!(banner-c\.png|img\/))/, /jpg.church\/a\/[~an@-_.]+<no_qs>/]],
  ['kemono.party:direct link', [/.{2,6}\.kemono.party\/data\//]],
  ['postimg.cc:image', [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]], //[/!!https?:\/\/(www.)?postimg.cc\/(.{8})/]],
  [
    'ibb.co:image',
    [
      /!!((?<=href="|data-src="))https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
      /ibb.co\/album\/[~an@_.-]+/,
    ],
  ],
  ['imagevenue.com:image', [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
  ['img.kiwi:image', [/img.kiwi\/image\//, /img.kiwi\/album\//]],
  ['imgbox.com:image', [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
  [
    'imgur.com:Media',
    [
      /!!https:(\/|\\\/){2}s9e.github.io(\/|\\\/)iframe(\/|\\\/)2(\/|\\\/)imgur.*?(?="|&quot;)|(?<=")https:\/\/(www.)?imgur.(com|io).*?(?=")/,
    ],
  ],
  ['onlyfans.com:image', [/public.onlyfans.com\/files/]],
  ['dailystar.co.uk:image', [/i(\d+)?-prod\.dailystar.co.uk\/.*?\.(jpg|jpeg|png)/]],
  ['pinuderest.com:image', [/pinuderest.com\/wp-content\/.*?\.(jpg|jpeg|png)/]],
  ['imgur.com:image', [/\w+\.imgur.(com|io)/]],
  ['reddit.com:image', [/(\w+)?.redd.it/]],
  ['instagram.com:Media', [/!!https:(\/|\\\/){2}s9e.github.io(\/|\\\/)iframe(\/|\\\/)2(\/|\\\/)instagram.*?(?="|&quot;)/]],
  ['instagram.com:Profile', [/!!instagram.com\/[~an@_.-]+|((instagram|insta):(\s+)?)@?[a-zA-Z0-9_.-]+/]],
  ['nitter:image', [/nitter\.(.{1,20})\/pic/]],
  ['twitter.com:image', [/([~an@.]+)?twimg.com\//]],
  ['pixl.li:image', [/([a-z](\d+)?\.)pixl.(li|is)\/((img|image)\/)?/, /pixl.(li|is)\/album\//]],
  ['pixhost.to:image', [/t(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
  ['imagebam.com:image', [/imagebam.com\/(view|gallery)/]],
  ['saint.to:video', [/(saint.to\/embed\/|([~an@]+\.)?saint.to\/videos)/]],
  ['redgifs.com:video', [/!!redgifs.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
  ['gfycat.com:video', [/!!gfycat.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
  [
    'bunkr.su:',
    [
      /!!(?<=href=")https:\/\/(stream|cdn(\d+)?).*?(?=")|(?<=(href="|src="))https:\/\/i(\d+)?.bunkr.(ru|su)\/(v\/)?.*?(?=")/,
      /bunkr.(ru|su)\/a\//,
    ],
  ],
  ['give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
  ['zippyshare.com:', [/(\w+\.)?zippyshare.com\/v\//]],
  ['pixeldrain.com:', [/pixeldrain.com\/[lu]\//]],
  ['gofile.com:', [/gofile.io\/d/]],
  ['erome.com:', [/erome.com\/a\//]],
  ['box.com:', [/m\.box\.com\//]],
  ['yandex.ru:', [/(disk\.)?yandex\.[a-z]+/]],
  ['cyberfile.su:', [/!!https:\/\/cyberfile.su\/\w+(\/)?(?=")/, /cyberfile.su\/folder\//]],
  ['cyberdrop.me:', [/fs-\d+.cyberdrop.(me|to|cc|nl)\//, /cyberdrop.(me|to|cc|nl)\/a\//]],
  ['pornhub.com:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
  ['noodlemagazine.com:video', [/(adult.)?noodlemagazine.com\/watch\//]],
  ['spankbang.com:video', [/spankbang.com\/.*?\/video/]],
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
  [
    [/coomer.party\/(data|thumbnail)/], url => url,
  ],
  [
    [/coomer.party/, /:!coomer.party\/(data|thumbnail)/],
    async (url, http) => {
      const host = `https://coomer.party`;

      const profileId = url.replace(/\?.*/, '').split('/').reverse()[0];

      let finalURL = url.replace(/\?.*/, '');

      let nextPage = null;

      const posts = [];

      console.log(`[coomer.party] Resolving profile: ${profileId}`);

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

        console.log(`[coomer.party] Resolved page: ${page}`);

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

        console.log(`[coomer.party] Resolved post ${index} / ${posts.length}`);

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
  [[/kemono.party\/data/], url => url],
  [[/jpg.church\//i, /:!jpg.church\/a\//i], url => url.replace('.th.', '.').replace('.md.', '.')],
  [
    [/jpg.church\/a\//i],
    async (url, http) => {
      url = url.replace(/\?.*/, '');

      const { source, dom } = await http.get(url);

      const resolvePageImages = async dom => {
        const images = [...dom.querySelectorAll('.list-item-image > a > img')]
          .map(img => img.getAttribute('src'))
          .map(url => url.replace('.md.', '.').replace('.th.', '.'));

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
    [/([a-z](\d+)?\.)?ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
    async (url, http) => {
      const { dom } = await http.get(url);
      return dom.querySelector('.header-content-right > a').getAttribute('href');
    },
  ],
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
  [[/([a-z](\d+)?\.)pixl.(li|is)\/((img|image)\/)?/, /:!pixl.(li|is)\/album\//], url => url.replace('.th.', '.').replace('.md.', '.')],
  [
    [/pixl.(li|is)\/album\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);

      const extractImages = dom => {
        return [...dom.querySelectorAll('.image-container > img')]
          .map(img => img.getAttribute('src'))
          .map(url => url.replace('.th.', '.').replace('.md.', '.'));
      };

      let resolved = extractImages(dom);

      let nextPage = dom.querySelector('.pagination-next > a')?.getAttribute('href');

      while (nextPage) {
        const { dom } = await http.get(nextPage);
        resolved = resolved.concat(extractImages(dom));
        nextPage = dom.querySelector('.pagination-next > a')?.getAttribute('href');
      }

      return {
        dom,
        source,
        folderName: dom.querySelector('meta[property="og:title"]').content.trim(),
        resolved,
      };
    },
  ],
  [[/t(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//], url => url.replace(/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/')],
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
    [/(stream|cdn(\d+)?|i(\d+)?).bunkr.(ru|su)\/(v\/)?/i, /:!bunkr.(ru|su)\/a\//],
    async (url, http) => {
      url = /(\.zip|\.pdf)/i.test(url) ? url.replace(/cdn\d+/, 'files') : url;

      for (const ext of settings.extensions.image) {
        if (new RegExp(`\.${ext}$`).test(url.toLowerCase())) {
          return url.replace(/cdn(\d+)?/, 'i$1');
        }
      }

      const { dom } = await http.get(url);

      try {
        const __NEXT_DATA__ = JSON.parse(dom?.querySelector('#__NEXT_DATA__')?.innerHTML || {});

        const buildId = __NEXT_DATA__.buildId;

        if (
          __NEXT_DATA__.props &&
          __NEXT_DATA__.props.pageProps &&
          __NEXT_DATA__.props.pageProps.file &&
          __NEXT_DATA__.props.pageProps.file.name
        ) {
          return `${__NEXT_DATA__.props.pageProps.file.mediafiles}/${__NEXT_DATA__.props.pageProps.file.name}`;
        }

        const filename = h.basename(url).replace(/&amp;/g, '&');
        const apiUrl = `https://stream.bunkr.su/_next/data/${buildId}/v/${filename}.json`;

        const { source: apiSource } = await http.get(apiUrl);

        const _PROPS = JSON.parse(apiSource.toString());

        if (_PROPS.pageProps && _PROPS.pageProps.file && _PROPS.pageProps.file.name) {
          return `${_PROPS.pageProps.file.mediafiles}/${_PROPS.pageProps.file.name}`;
        }

        return null;
      } catch (e) {
        return null;
      }
    },
  ],
  [
    [/bunkr.(ru|su)\/a\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);

      let resolved = [];

      const props = JSON.parse(dom?.querySelector('#__NEXT_DATA__')?.innerHTML || {});

      if (props.props && props.props.pageProps && props.props.pageProps.album && props.props.pageProps.album.files) {
        resolved = props.props.pageProps.album.files.map(file => `${file.cdn.replace('cdn', 'media-files')}/${file.name}`);
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
    [/zippyshare.com\//],
    async (url, http) => {
      const { source } = await http.get(url);
      const expr = h.re
        .match(/(?<=\('dlbutton'\).href\s=\s).*?(?=;)/i, source)
        .replace(/"(.*?)"/g, `new String("$1")`)
        .replace('/', '\\/');
      const subDomain = h.re.match(/ww\w+/, url);
      return `https://${subDomain}.zippyshare.com${eval(expr)}`;
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
    [/anonfiles.com\//],
    async (url, http) => {
      const { dom } = await http.get(url);
      return dom.querySelector('#download-url').getAttribute('href');
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

        const apiUrl = `https://api.gofile.io/getContent?contentId=${contentId}&token=${settings.hosts.goFile.token}&websiteToken=12345&cache=true`;

        let { source } = await http.get(apiUrl);

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
        if (!props || props.status !== 'ok' || !props.data || !props.data.childs || !props.data.childs.length) {
          return [];
        }

        const resolved = [];

        folderName = props.data.name;

        const files = props.data.contents;

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
    [/erome.com\/a\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);

      const resolved = [];

      dom?.querySelectorAll('.media-group').forEach(mediaGroup => {
        const imgSource = mediaGroup.querySelector('.img-front')?.getAttribute('data-src');
        const videoSource = mediaGroup.querySelector('source')?.getAttribute('src');
        resolved.push(imgSource || videoSource || null);
      });

      return {
        dom,
        source,
        folderName: dom.querySelector('.col-sm-12.page-content > h1')?.innerText,
        resolved,
      };
    },
  ],
  [
    [/cyberfile.su\//, /:!cyberfile.su\/folder\//],
    async (url, http) => {
      const { source } = await http.get(url);
      const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
      const { source: response } = await http.post(
        'https://cyberfile.su/account/ajax/file_details',
        `u=${u}`,
        {},
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      );
      return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\\//gi, '/');
    },
  ],
  [
    [/cyberfile.su\/folder\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);

      const script = [...dom.querySelectorAll('script')].map(s => s.innerText).filter(s => h.contains('data-toggle="tab"', s))[0];

      const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script);

      const { source: response } = await http.post(
        'https://cyberfile.su/account/ajax/load_files',
        `pageType=folder&nodeId=${nodeId}`,
        {},
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      );

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
            'https://cyberfile.su/account/ajax/file_details',
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
  [[/([~an@]+\.)?saint.to\/videos/], async url => url],
  [[/public.onlyfans.com\/files/], async url => url],
  [[/dailystar.co.uk\//], async url => url],
  [[/pinuderest.com\//], async url => url],
  [
    [/saint.to\/embed/],
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
  [[/fs-\d+.cyberdrop.(me|to|cc|nl)\//, /:!cyberdrop.(me|to|cc|nl)\/a\//], url => url.replace(/(fs|img)-\d+/i, 'fs-01')],
  [
    [/cyberdrop.me\/a\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);

      let resolved = [...dom?.querySelectorAll('#file')].map(file => file.getAttribute('href').replace(/fs-\d+/is, 'fs-01'));

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
  [
    [/img.kiwi\/image\//, /:!img.kiwi\/album\//],
    async (url, http) => {
      const { dom } = await http.get(url);
      return dom?.querySelector('meta[property="og:image"]')?.content;
    },
  ],
  [
    [/img.kiwi\/album\//],
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
  [[/simpcity.su\/attachments/], url => url],
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
    [/gfycat.com(\/|\\\/)/],
    async (url, http) => {
      url = `https://gfycat.com/${url.replace(/&amp;/g, '&').split('/').reverse()[0].replace(/\?.*/is, '')}?hd=1`;
      const { dom } = await http.get(url);
      return [...dom.querySelectorAll('source')].map(el => el.getAttribute('src')).filter(src => src && h.contains('giant.gfycat', src))[0];
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
    [/imgur\.min\.|imgur.(com|io)/, /:!\w+\.imgur.(com|io)/],
    async (url, http) => {
      url = url.replace(/\\\//, '/');

      let id;
      let type = 'single';

      if (h.contains('s9e.github.io', url)) {
        id = h.re.matchAll(/(?<=#).*/gis, url)[0];
        if (id[0] === 'a') {
          type = 'album';
          id = id.substring(2);
        }
      } else {
        if (h.contains(url, 'a/')) {
          type = 'album';
        }
        id = url.split('/').reverse()[0];
      }

      if (type === 'album') {
        const { source } = await http.get(`https://api.imgur.com/3/album/${id}.json`);

        const props = JSON.parse(source);

        if (props.data && props.data.images) {
          const resolved = [];
          for (const image of props.data.images) {
            resolved.push(image.link);
          }
          return {
            dom: null,
            source: null,
            folderName: null,
            resolved,
          };
        }

        return null;
      } else {
        const { source, dom } = await http.get(`https://imgur.com/${id}`);
        return h.contains('og:video', source)
          ? dom?.querySelector('meta[property="og:video"]')?.content
          : dom?.querySelector('meta[property="og:image"]')?.content;
      }
    },
  ],
  [[/\w+\.imgur.(com|io)/], url => url],
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
  [
    [/instagram\.min/],
    async (url, http) => {
      const id = url
        .replace(/#theme.*/gis, '')
        .split('#')
        .reverse()[0];

      const { source, dom } = await http.get(`https://www.instagram.com/p/${id}/embed`);
      const script = [...dom.querySelectorAll('script')].map(s => s.innerText).filter(s => h.contains('shortcode_media', s))[0];

      const resolved = [];

      if (script) {
        if (h.contains('"is_video":true', script)) {
          let videoUrls = h.re.matchAll(/(?<=video_url":").*?(?=")/gis, script);
          videoUrls.forEach(v => {
            resolved.push(v.replace(/\\u0026/g, '&'));
          });
        }
      }

      if (!resolved.length) {
        return null;
      }

      if (resolved.length > 1) {
        return {
          dom,
          source,
          folderName: null,
          resolved,
        };
      }

      return resolved[0];
    },
  ],
  [
    [/instagram.com\/[a-zA-Z0-9_.-]+|((instagram|insta):(\s+)?)@?[a-zA-Z0-9_.-]+/i],
    async (url, http) => {
      let id;

      if (/(instagram|insta):/is.test(url)) {
        id = h.re
          .matchAll(/@?.*/gis, url)[0]
          .replace('@', '')
          .replace(/(instagram:|insta:)/is, '')
          .trim();
      } else {
        id = url.split('/').reverse()[0];
      }

      const headers = { 'User-Agent': 'Instagram 219.0.0.12.117 Android' };

      const { source, dom } = await http.get(`https://instagram.com/${id}`, {}, headers);

      const profileId = h.re.matchAll(/(?<="profile_id":")\d+/gis, source)[0];

      const apiBaseUrl = `https://www.instagram.com/api/v1/feed/user/`;

      const { source: response } = await h.http.get(`${apiBaseUrl}${profileId}/?count=100`, {}, headers);

      const collect = async response => {
        const props = JSON.parse(response);
        const resolved = [];
        if (props && props.status === 'ok' && props.num_results > 0) {
          const items = Object.values(props.items);
          for (const item of items) {
            if (item.product_type === 'feed') {
              resolved.push(item.image_versions2.candidates[0].url);
            } else if (item.product_type === 'carousel_container') {
              resolved.push(...item.carousel_media.map(m => m.image_versions2.candidates[0].url));
            } else if (item.product_type === 'clips') {
              resolved.push(item.video_versions[0].url);
            }
          }

          if (props.more_available === true && props.next_max_id) {
            await h.delayedResolve(3000);
            const { source } = await h.http.get(`${apiBaseUrl}/${profileId}/?count=100&max_id=${props.next_max_id}`, {}, headers);
            resolved.push(...(await collect(source)));
          }
        }

        return resolved;
      };

      const resolved = await collect(response);

      const props = JSON.parse(response);

      const folderName = props && props.user ? props.user.full_name : id;

      if (resolved.length > 1) {
        return {
          dom,
          source,
          folderName,
          resolved: resolved.map(url => url.replace(/\\u0026/g, '&')),
        };
      }
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
          r = await h.promise(resolve => resolve(resolverCB(resource, h.http, passwords, postId)));
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

        console.log(r);

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

    const batchLength = 2;

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
        const ellipsedUrl = h.limit(url, 80);

        log.post.info(postId, `::Downloading::: ${url}`, postNumber);
        const request = GM_xmlhttpRequest({
          url,
          headers: {
            Referer: original,
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

            if (url.includes('https://pixeldrain.com/')) {
              basename = response.responseHeaders.match(/^content-disposition.+(?:filename=)(.+)$/im)[1].replace(/\"/g, '');
            } else if (url.includes('https://simpcity.su/attachments/')) {
              basename = filename ? filename.name : h.basename(url).replace(/(.*)-(.{3,4})\.\d*$/i, '$1.$2');
            } else if (url.includes('kemono.party')) {
              basename = filename
                ? filename.name
                : h
                    .basename(url)
                    .replace(/(.*)\?f=(.*)/, '$2')
                    .replace('%20', ' ');
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
              fn = `#${postNumber}/${fn}`;
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
        zipped: false,
        flatten: false,
        generateLinks: false,
        generateLog: false,
        skipDuplicates: false,
        skipDownload: false,
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
