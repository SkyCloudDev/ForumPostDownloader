// ==UserScript==
// @name Forum Post Downloader
// @namespace https://github.com/SkyCloudDev
// @author SkyCloudDev
// @description Downloads images and videos from posts
// @version 2.0
// @updateURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/ForumPostDownloader.user.js
// @downloadURL https://github.com/SkyCloudDev/ForumPostDownloader/raw/main/ForumPostDownloader.user.js
// @icon https://simp4.jpg.church/simpcityIcon192.png
// @license WTFPL; http://www.wtfpl.net/txt/copying/
// @match https://simpcity.su/threads/*
// @require https://code.jquery.com/jquery-3.3.1.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require https://cdn.jsdelivr.net/npm/m3u8-parser@4.5.2/dist/m3u8-parser.min.js
// @connect self
// @connect lovefap.com
// @connect bunkr.is
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect saint.to
// @connect zz.fo
// @connect zz.ht
// @connect sendvid.com
// @connect i.redd.it
// @connect i.ibb.co
// @connect ibb.co
// @connect imagebam.com
// @connect imgur.com
// @connect jpg.church
// @connect imgbox.com
// @connect pixhost.to
// @connect pixl.is
// @connect pixxxels.cc
// @connect postimg.cc
// @connect imagevenue.com
// @connect nhentai-proxy.herokuapp.com
// @connect pbs.twimg.com
// @connect cdn.discordapp.com
// @connect pixeldrain.com
// @connect redgifs.com
// @connect gfycat.com
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log


// ==/UserScript==

// ----- Settings ----- //

var thanks = true;                 //Give thanks to posts?

var cyberdropAlbums = false;       //Download Cyberdrop Albums?
var bunkrAlbums = false;           //Download Bunkr Albums?
var zzAlbums = false;               //Download zz Albums?

var bunkrVideoLinks = true;        //Download Bunkr Video links?
var cyberdropZzVids = true;        //Download Cyberdrop / ZZ video embeds?

// ----- End Settings ----- //



const imgurBase = 'https://i.imgur.com/{hash}.mp4';
/**
* Set to 'true', if you wanna be asked to input zip name on your own.
* If 'false' – name for the zip will be generated automatically(default is 'thread name/post number.zip')
*/
const customName = false;
/**
* If 'true' – trying to get video/gif links from iframes(like sendvid and imgur)
*/
const getIFrames = true;
/**
* Determines if emoji should be allowed in the zip name.
* @type {boolean} If set to true, emoji in thread titles will be allowed in the zip name.
*/
const ALLOW_THREAD_TITLE_EMOJI = false;
/**
* Edit this to change the replacement for illegal characters.
* Bad things may happen if you set this to an empty string, and the
* resulting title after replacement contains illegal characters or phrases.
* @type {string} Illegal characters in the thread title will be replaced with this string.
*/
const ILLEGAL_CHAR_REPLACEMENT = '-';
/**
* Determines if a string is null or empty.
* @param {string} str The string to be tested.
* @returns {boolean} True if the string is null or empty, false if the string is not nul or empty.
*/
const isNullOrEmpty = (str) => {
    return !str;
};
/* globals jQuery JSZip saveAs */
/**
* Gets the thread title, removes illegal characters.
* @returns {string} String containing the thread title with illegal characters replaced.
*/

// Define file name regexps
const REGEX_EMOJI = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
const REGEX_WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$|([<>:"\/\\|?*])|(\.|\s)$/gi;

var Videos = ['.mpeg', '.avchd', '.webm', '.mpv', '.swf', '.avi', '.m4p', '.wmv', '.mp2', '.m4v', '.qt', '.mpe', '.mp4', '.flv', '.mov', '.mpg', '.ogg', '.MPEG', '.AVCHD', '.WEBM', '.MPV', '.SWF', '.AVI', '.M4P', '.WMV', '.MP2', '.M4V', '.QT', '.MPE', '.MP4', '.FLV', '.MOV', '.MPG', '.OGG'];
var Images = ['.jpg', '.jpeg', '.png', '.gif', '.gif', '.webp', '.jpe', '.svg', '.tif', '.tiff', '.jif', '.JPG', '.JPEG', '.PNG', '.GIF', '.GIF', '.WEBP', '.JPE', '.SVG', '.TIF', '.TIFF', '.JIF'];

const getThreadTitle = () => {

    // Strip label buttons
    let threadTitle = [...document.querySelector('.p-title-value').childNodes].reduce((title, child) => {
        return child.nodeType === 3 && !isNullOrEmpty(child.textContent) ? (title += child.textContent.replace(/\n/g, '')) : '';
    });
    // Check for title in object
    if (typeof threadTitle === "object") {
        threadTitle = threadTitle['wholeText'];
    }
    threadTitle = threadTitle.trim();
    threadTitle = threadTitle.replace(/\n/g, '');
    threadTitle = threadTitle.toString();
    // Remove emoji from title
    if (!ALLOW_THREAD_TITLE_EMOJI) {
        threadTitle = threadTitle.replaceAll(REGEX_EMOJI, ILLEGAL_CHAR_REPLACEMENT);
    }
    threadTitle = threadTitle.replaceAll(REGEX_WINDOWS, ILLEGAL_CHAR_REPLACEMENT);
    threadTitle = threadTitle.trim();
    // Remove illegal chars and names (Windows)
    console.log("Thread Title: " + threadTitle);
    return threadTitle;
};

/**
* Format bytes as human-readable text.
*
* @param bytes Number of bytes.
* @param si True to use metric (SI) units, aka powers of 1000. False to use
* binary (IEC), aka powers of 1024.
* @param dp Number of decimal places to display.
*
* @return Formatted string.
*/

const allowedDataHosts = ['pixeldrain.com', 'ibb.co', 'imagebam.com', 'imagevenue.com', 'saint.to', 'redgifs.com', 'stream.bunkr'];
const allowedDataHostsRx = [/cyberdrop/, /bunkr/, /pixeldrain/, /ibb.co/, /imagebam.com/, /imagevenue.com/, /zz/, /saint.to/, /redgifs.com/, /stream.bunkr/];
var refHeader;
var refUrl;
var albumName;
function humanFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
    return bytes.toFixed(dp) + ' ' + units[u];
}

async function gatherExternalLinks(externalLink, type) {

    if (!type) { return undefined; }
    var resolveCache = [];
    refHeader = externalLink;
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            headers: { 'Referer': externalLink },
            url: externalLink,
            method: "GET",
            responseType: 'document',
            onload: function (response) {
                if (type === "cyberdrop") {

                    var requestResponse = response.response;

                    albumName = requestResponse.getElementsByTagName("h1")[0]["innerText"].replace(/\n\s/g, '').trim();
                    albumName = albumName.replaceAll(REGEX_EMOJI, ILLEGAL_CHAR_REPLACEMENT).replaceAll(REGEX_WINDOWS, ILLEGAL_CHAR_REPLACEMENT);
                    console.log("Album Name: " + albumName);

                    var linkList = requestResponse.querySelectorAll('.image');

                    for (let index = 0; index < linkList.length; index++) {
                        const element = linkList[index];
                        linkElement = element.getAttribute('href');
                        resolveCache.push(linkElement);
                    }
                    resolve(resolveCache);
                }
                if (type === "zz") {

                    var requestResponse = response.response;

                    albumName = requestResponse.getElementsByTagName("h1")[0]["innerText"].replace(/\n\s/g, '').trim();
                    albumName = albumName.replaceAll(REGEX_EMOJI, ILLEGAL_CHAR_REPLACEMENT).replaceAll(REGEX_WINDOWS, ILLEGAL_CHAR_REPLACEMENT);
                    console.log("Album Name: " + albumName);

                    var linkList = requestResponse.querySelectorAll('.image');

                    for (let index = 0; index < linkList.length; index++) {
                        const element = linkList[index];
                        linkElement = element.getAttribute('href');
                        resolveCache.push(linkElement);
                    }
                    resolve(resolveCache);
                }
                if (type === "bunkr") {

                    var requestResponse = response.response;
                    albumName = requestResponse.getElementsByTagName("h1")[0]["innerText"].replace(/\n\s/g, '').trim();
                    albumName = albumName.replaceAll(REGEX_EMOJI, ILLEGAL_CHAR_REPLACEMENT).replaceAll(REGEX_WINDOWS, ILLEGAL_CHAR_REPLACEMENT);
                    console.log("Album Name: " + albumName);

                    var linkList = requestResponse.querySelectorAll('.image');

                    for (let index = 0; index < linkList.length; index++) {
                        const element = linkList[index];
                        linkElement = element.getAttribute('href');
                        resolveCache.push(linkElement);
                    }
                    resolve(resolveCache);
                }
                if (type === "ibb.co") {

                    var requestResponse = response.response;

                    linkElement = requestResponse.querySelectorAll('.header-content-right')[0].getElementsByTagName('a')[0].href;
                    console.log("ibb image url: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
                if (type === "imagebam.com") {

                    var requestResponse = response.response;

                    linkElement = requestResponse.querySelector('.main-image').src;
                    console.log("imagebam image url: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
                if (type === "imagevenue.com") {

                    var requestResponse = response.response;

                    linkElement = requestResponse.querySelector('.col-md-12').getElementsByTagName('a')[0].firstElementChild.src;
                    console.log("imagevenue image url: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
                if (type === "saint.to") {

                    var requestResponse = response.response;


                    linkElement = requestResponse.getElementsByTagName('source')[0].src;
                    console.log("saintly url: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
                if (type === "redgifs.com") {

                    var requestResponse = response.response;
                    linkElement = requestResponse.querySelector("meta[property='og:video']").getAttribute("content");
                    linkElement = linkElement.replace("-mobile", "");
                    console.log("redgifs url: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
                if (type === "stream.bunkr") {

                    var requestResponse = response.response;
                    bunkrMediaInfos = JSON.parse(requestResponse.getElementById('__NEXT_DATA__').firstChild.data);
                    bunkrServer = bunkrMediaInfos.props.pageProps.file.mediafiles;
                    bunkrFileName = bunkrMediaInfos.props.pageProps.file.name;
                    linkElement = bunkrServer.concat("/", bunkrFileName);
                    console.log("bunkr download link: " + linkElement);
                    resolveCache.push(linkElement);
                    resolve(resolveCache);
                }
            }
        });
    });
}

function headerHelper(link, isHLS = false, needsReferrer = false) {
    if (needsReferrer) {
        return `{ 'Referer': ${link}  }`
    }
    if (isHLS) {
        return `{ 'Content-Type': 'application/json' }`
    }
    return null
}

async function download(post, fileName, altFileName) {
    var createZip = true;

    var $text = $(post).children('a');
    var urls = getPostLinks(post, false);
    var albumID = '',
        storePath = '',
        albuminfo = [];
    var postNumber = $(post).parent().find('li:last-child > a').text().trim();
    for (var i = 0, l = urls.length; i < l; i++) {
        if (urls[i].includes('cyberdrop')) {
            if (cyberdropAlbums){
                if (urls[i].includes('/a/')) {
                    albumID = urls[i].split('/a/')[1];
                    console.log("URL: " + urls[i]);
                    console.log("Album ID: " + albumID);
                    createZip = false;
                    var extUrl = await gatherExternalLinks(urls[i], "cyberdrop");
                    if (extUrl.length > 0) {
                        for (let index = 0; index < extUrl.length; index++) {
                            const element = extUrl[index];
                            urls.push(element);
                            albuminfo.push({URL:element, albumName:albumName});
                        }
                    }
                    urls.splice(i, 1);
                }
            }else if (urls[i].includes('/a/')) {
                urls[i] = '';
            }
        }
        if (urls[i].includes('bunkr')) {
            if (bunkrAlbums){
                if (urls[i].includes('/a/')) {
                    refUrl = urls[i];
                    createZip = false;
                    albumID = urls[i].split('/a/')[1];
                    console.log("URL: " + urls[i]);
                    console.log("Album ID: " + albumID);
                    var extUrl = await gatherExternalLinks(urls[i], "bunkr");
                    if (extUrl.length > 0) {
                        for (let index = 0; index < extUrl.length; index++) {
                            var element = extUrl[index];

                            if(Videos.some(s => element.includes(s))) {
                                element = element.replace('//cdn', '//media-files');
                            }

                            urls.push(element);
                            albuminfo.push({URL:element, albumName:albumName});
                        }
                    }
                    urls.splice(i, 1);
                }
            }else if (urls[i].includes('/a/')) {
                urls[i] = '';
            }
        }
        if (zzAlbums){
            if (urls[i].includes('zz')) {
                if (urls[i].includes('/a/')) {
                    albumID = urls[i].split('/a/')[1];
                    console.log("URL: " + urls[i]);
                    console.log("Album ID: " + albumID);
                    createZip = false;
                    var extUrl = await gatherExternalLinks(urls[i], "zz");
                    if (extUrl.length > 0) {
                        for (let index = 0; index < extUrl.length; index++) {
                            const element = extUrl[index];
                            urls.push(element);
                            albuminfo.push({URL:element, albumName:albumName});
                        }
                    }
                    urls.splice(i, 1);
                }
            }else if (urls[i].includes('/a/')) {
                urls[i] = '';
            }
        }
        if (urls[i].includes('ibb.co')) {
            var extUrl = await gatherExternalLinks(urls[i], "ibb.co");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
                urls[i] = '';
        }
        if (urls[i].includes('imagebam.com')) {
            var extUrl = await gatherExternalLinks(urls[i], "imagebam.com");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
                urls[i] = '';
        }
        if (urls[i].includes('imagevenue.com')) {
            var extUrl = await gatherExternalLinks(urls[i], "imagevenue.com");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
                urls[i] = '';
        }
        if (urls[i].includes('saint.to')) {
            var extUrl = await gatherExternalLinks(urls[i], "saint.to");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
            urls[i] = '';
        }
        if (urls[i].includes('redgifs.com')) {
            var extUrl = await gatherExternalLinks(urls[i], "redgifs.com");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
            urls[i] = '';
        }
        if (urls[i].includes('stream.bunkr')) {
            var extUrl = await gatherExternalLinks(urls[i], "stream.bunkr");
            if (extUrl.length > 0) {
                    for (let index = 0; index < extUrl.length; index++) {
                        const element = extUrl[index];
                        urls.push(element);
                }
            }
            urls[i] = '';
        }
    }

    urls = urls.filter(function (e) { return e });   //removes blank entries
    urls = urls.filter(function (v, i) { return urls.indexOf(v) == i; });
    console.log("Download directory: " + fileName)
    if (createZip) {
        var zip = new JSZip(),
            current = 0,
            total = urls.length;
    } else {
        var current = 0,
            total = urls.length;
    }
    function next() {
        if (current < total) {
            const dataText = `Downloading ${current + 1}/${total} (%percent%)`
            const url = urls[current++];
            //const isHLS = url.includes('sendvid.com');
            var needsReferrer = false;
            var userAgent = navigator.userAgent;
            const isHLS = false;
            if (isHLS) {
                console.log(JSON.stringify({ 'url': url.replace('//', '') }))
            }
            $text.text('Downloading...');
            $text.text(dataText.replace('%percent', 0));
            console.log("Downloading: " + url)
            var original_url = url;
            GM_xmlhttpRequest({
                method: isHLS ? 'POST' : 'GET',
                url: isHLS ? 'http://127.0.0.1:5000/json' : url,
                data: isHLS ? JSON.stringify({ 'url': url }) : null,
                headers: {"Referer": url, "user-agent": userAgent},  //headerHelper(refUrl, isHLS, needsReferrer),
                responseType: 'blob',
                onprogress: function (evt) {
                    var percentComplete = (evt.loaded / evt.total) * 100;
                    $text.text(dataText.replace('%percent', evt.total > 0 ? percentComplete.toFixed(0) : humanFileSize(evt.loaded)));
                },
                onload: function (response) {
                    try {
                        var data = response.response;
                        var file_name = response.responseHeaders.match(/^content-disposition.+(?:filename=)(.+)$/mi)[1].replace(/\"/g, '');
                    }
                    catch (err) {
                        file_name = new URL(response.finalUrl).pathname.split('/').pop();
                    } finally {
                        file_name = decodeURIComponent(file_name);
                        if (createZip) {
                            zip.file(file_name, data);
                        } else {
                            if (response.finalUrl.includes('bunkr')) {

                                //look up the URL in the albuminfo list and retrieve the correct album name from that
                                let albumName = albuminfo.filter(item => (original_url.includes(item.URL))).map(item => item.albumName);
                                console.log("bunkr album name: " + albumName);
                                storePath = `${fileName.split('/')[0]}/${albumName} - Bunkr/${file_name}`;

                            } else if (response.finalUrl.includes('cyberdrop')) {

                                //look up the URL in the albuminfo list and retrieve the correct album name from that
                                let albumName = albuminfo.filter(item => (original_url.includes(item.URL))).map(item => item.albumName);
                                console.log("cyberdrop album name: " + albumName);
                                storePath = `${fileName.split('/')[0]}/${albumName} - CyberDrop/${file_name}`;

                            } else if (response.finalUrl.includes('zz')) {

                                //look up the URL in the albuminfo list and retrieve the correct album name from that
                                let albumName = albuminfo.filter(item => (original_url.includes(item.URL))).map(item => item.albumName);
                                console.log("zz album name: " + albumName);
                                storePath = `${fileName.split('/')[0]}/${albumName} - zz/${file_name}`;

                            } else {
                                storePath = `${fileName.split('/')[0]}/${postNumber}/${file_name}`;
                            }
                            var url = URL.createObjectURL(data);
                            GM_download({
                                url: url,
                                name: storePath,
                                onload: function () {
                                    URL.revokeObjectURL(url);
                                    blob = null;
                                },
                                onerror: function (response) {
                                    console.log("Error response: <" + response['error'] + '> for requested URL: ' + url)
                                }
                            });
                        }

                    }
                    next();
                },
                onerror: function (response) {
                    next();
                }
            });
        } else if (total == 0) {
            $text.text((current == 0 ? 'No Downloads!' : ''));
            return;
        } else {
            if (createZip) {
                $text.text('Generating zip...');
                zip.generateAsync({ type: 'blob' })
                    .then(function (blob) {
                        $text.text('Download complete!');
                        if (!GM_download) {
                            saveAs(blob, `${fileName}.zip`);
                        } else {
                            var url = URL.createObjectURL(blob);
                            console.log("url: " + url);
                            console.log("Saved to: " + fileName);
                            GM_download({
                                url: url,
                                name: `${fileName}.zip`,
                                onload: function () {
                                    URL.revokeObjectURL(url);
                                    blob = null;
                                },
                                onerror: function (response) {
                                    console.log("Error response: <" + response['error'] + '> for requested URL: ' + url)
                                }
                            });
                        }
                    });
            } else {
                $text.text('Download complete!');
            }
            if (thanks) {
                //Distribute some love for your downloaded post if it was actually successful
                let likeTag;
                let likeID;
                try {
                    likeTag = post.parentNode.parentNode.parentNode.querySelector('.reaction--imageHidden');
                    likeID = likeTag.getAttribute('href').replace("id=1", "id=33");
                    likeTag.setAttribute("href", likeID);
                    likeTag.click();
                } catch {
                }
            }
        }
    }
    next();
}

function getPostLinks(post) {
    return $(post)
        .parents('.message-main')
        .first()
        .find('.message-userContent')
        .first()
        .find('.js-lbContainer,.js-lbImage,.attachment-icon a,.lbContainer-zoomer,a.link--external img,video,.js-unfurl,.link--external,image-link' + (getIFrames ? ',iframe[src],iframe[data-s9e-mediaembed-src],span[data-s9e-mediaembed][data-s9e-mediaembed-iframe]' : ''))
        .map(function () {
        var $text = $(post).children('a');
        $text.text('Preparing downloads');
            let link;
            if ($(this).is('iframe') || $(this).is('span')) {
                link = getEmbedLink($(this));
            } else if ($(this).has('source').length) {
                //only select visible source link
                if (cyberdropZzVids){
                    link = $(this)[0]["currentSrc"];
                }
            } else {
                link = $(this).is('[data-url]') ? $(this).data('url') : ($(this).is('[href]') ? $(this).attr('href') : $(this).data('src'));
            }

            // filter external links
            if ($(this)[0].classList.contains('link--external') || $(this)[0].classList.contains('js-unfurl')) {
                console.log("External link: " + $(this)[0].href)
                console.log("Host allowed? " + allowedDataHostsRx.some(rx => rx.test($(this)[0].href)))
                // check for valid external hosts
                if ($(this).attr('data-host') !== undefined) {

                    if (!allowedDataHosts.includes($(this).attr('data-host'))) {

                        link = '';

                    }
                } else if (allowedDataHostsRx.some(rx => rx.test($(this)[0].href)) === false) {
                    link = '';
                }
            }
            if (typeof link !== 'undefined' && link) {

                if (link.includes ('wp.com/cyberdrop')){
                    link = "";
                }

                if (link.includes('jpg.church')) {
                    if (!link.includes("/image/")) {
                        link = link.replace('.th.', '.');
                        link = link.replace(".md.", ".");
                    } else {
                        link = "";
                    }
                }
                if (link.includes('pixl.is')) {
                    link = link.replace('.th.', '.');
                    link = link.replace(".md.", ".");
                }

                if (link.includes('pixhost.to')) {
                    link = link.replace('//t', '//img');
                    link = link.replace("thumbs", "images");
                }

                if (link.includes('imgbox.com')) {
                    link = link.replace('//thumbs', '//images');
                    link = link.replace("_t.", "_o.");
                }

                if (link.includes('preview.redd.it')) {
                    link = link.split('?')[0];
                    link = link.replace('preview', 'i');
                }

                if (link.includes('dropbox.com')) {
                    link = link.replace('?dl=0', '?dl=1');
                }
                // bunkr non album implementation
                if (link.includes('.bunkr.')) {
                    if (bunkrVideoLinks){
                        if (!link.includes('/a/')) {
                            if (!link.includes('stream.')) {
                                if(Videos.some(s => link.includes(s))) {
                                    console.log("original link: " + link);
                                    link = link.replace('//cdn', '//media-files');
                                }
                            }
                        }
                    } else{
                        if(!(Images.some(s => link.includes(s)))){
                            link ="";
                        }
                    }
                }
                // ignore ibb thumbnails
                if (link.includes('i.ibb.co')) {
                    link = "";
                }
                // ignore imagebam thumbnails
                if (link.includes('imagebam.com') && link.includes('thumbs')) {
                    link = "";
                }
                // ignore imagevenue thumbnails
                if (link.includes('thumbs.imagevenue.com')) {
                    link = "";
                }
                // pixeldrain implementation
                if (link.includes('pixeldrain.com')) {
                    if (link.includes('/u/')) {
                        link = link.replace('?embed', '');
                        link = link.replace('/u/', '/api/file/');
                        link = link.concat('?download');
                    }

                    if (link.includes('/l/')) {
                        link = link.split('#item')[0];
                        link = link.replace('/l/', '/api/list/');
                        link = link.concat('/zip');
                    }
                }
            } else {

                link = '';
            }

            return link;
        })
        .get();
}

function inputName(post, callback) {
    var postNumber = $(post).parent().find('li:last-child > a').text().trim();
    var threadTitle = getThreadTitle();
    if (customName && confirm('Do you wanna input name for the zip?')) {
        let zipName = prompt('Input name:', GM_getValue('last_name', ''));
        GM_setValue('last_name', zipName);
        callback(post, zipName ? `${threadTitle}/${postNumber}/${zipName}` : (GM_download ? `${threadTitle}/${postNumber}` : threadTitle + ' - ' + postNumber, `${threadTitle}/${postNumber}`));
    } else {
        callback(post, GM_download ? `${threadTitle}/${postNumber}` : threadTitle + ' - ' + postNumber, `${threadTitle}/${postNumber}`);
    }
}

function getEmbedLink($elem) {
    let embed;
    if ($elem.is('span')) {
        const attr = $elem.attr('data-s9e-mediaembed-iframe');
        embed = JSON.parse(attr).pop();
    } else {
        embed = $elem.is('[src]') ? $elem.attr('src') : $elem.data('s9e-mediaembed-src');
    }
    if (embed.includes('redgifs.com/ifr')) {
        const link = embed;
        return link;
    }
    if (embed.includes('gfycat.com/ifr')) {
        const gfycat = embed.replace('//gfycat.com/ifr/', 'https://giant.gfycat.com/').replace('?hd=1&autoplay=0', '');
        const link = gfycat.concat('.mp4');
        return link;
    }
    if (embed.includes('saint.to')) {
        const link = embed;
        return link;
    }
    if (!embed) return null;
}

jQuery(function ($) {
    $('.message-attribution-opposite')
        .map(function () { return $(this).children('li:first'); })
        .each(function () {
            var downloadLink = $('<li><a href="#" class="downloadSinglePost">🡳 Download</a><li>');
            var $text = downloadLink.children('a');
            downloadLink.insertBefore($(this));
            downloadLink.click(function (e) {
                e.preventDefault();
                inputName(this, download);
            });
        });
    // add 'download all' button
    var downloadAllLink = $('<a href="#" class="button--link button rippleButton" ID="downloadAllFiles">🡳 Download All</a>');
    $("div.buttonGroup").css({'display': 'inline-flex', 'flex-wrap': 'wrap', 'align-items': 'center' }).prepend(downloadAllLink);
    //$(".downloadAllFiles").css({ 'padding-right': '12px' });
    // download all files on page
    $(document).on("click", "#downloadAllFiles", function (e) {
        e.preventDefault();
        var singlePosts = document.querySelectorAll(".downloadSinglePost");
        for (let i = 0; i < singlePosts.length; i++) {
            singlePosts[i].click();
        }
    });
});
