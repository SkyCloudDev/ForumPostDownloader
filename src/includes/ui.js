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

                    const totalResources = parsedHosts
                      .reduce((acc, host) => acc + host.resources.length, 0);

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
