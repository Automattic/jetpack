import apiFetch from '@wordpress/api-fetch';
import domReady from '@wordpress/dom-ready';
import { addQueryArgs } from '@wordpress/url';
import '../css/jetpack-admin-jitm.scss';

domReady( function() {

    // Site ID will be automatically added to the request.
    const JITM_ENDPOINT_URL = `/wpcom/v3/jitm`;

    const templates = {
        default: function(envelope) {
            const EXTERNAL_LINK_ICON = `
                <svg class="gridicon gridicons-external-link" height="17" width="17" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g>
                        <path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z" />
                    </g>
                </svg>
                `;

            const CHECKMARK_ICON = `
                <svg class="gridicon gridicons-checkmark" height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g>
                        <path d="M9 19.414l-6.707-6.707 1.414-1.414L9 16.586 20.293 5.293l1.414 1.414" />
                    </g>
                </svg>`;

            let html =
                '<div class="jitm-card jitm-banner ' +
                (envelope.CTA.message ? 'has-call-to-action' : '') +
                ' is-upgrade-premium ' +
                envelope.content.classes +
                '" data-stats_url="' +
                envelope.jitm_stats_url +
                '">';
            html += '<div class="jitm-banner__background"></div>';
            html += '<div class="jitm-banner__content">';
            html += '<div class="jitm-banner__icon-plan">' + envelope.content.icon + '</div>';
            html += '<div class="jitm-banner__info">';
            html += '<div class="jitm-banner__title">' + envelope.content.message + '</div>';
            if (envelope.content.description && envelope.content.description !== '') {
                html += '<div class="jitm-banner__description">' + envelope.content.description;
                if (envelope.content.list.length > 0) {
                    html += '<ul class="banner__list">';
                    for (let i = 0; i < envelope.content.list.length; i++) {
                        let text = envelope.content.list[i].item;

                        if (envelope.content.list[i].url) {
                            text =
                                '<a href="' +
                                envelope.content.list[i].url +
                                '" target="_blank" rel="noopener noreferrer" data-module="' +
                                envelope.feature_class +
                                '" data-jptracks-name="nudge_item_click" data-jptracks-prop="jitm-' +
                                envelope.id +
                                '">' +
                                text +
                                EXTERNAL_LINK_ICON +
                                '</a>';
                        }

                        html += '<li>' + CHECKMARK_ICON + text + '</li>';
                    }
                }
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '<div class="jitm-banner__buttons_container">';

            if (envelope.activate_module) {
                html += '<div class="jitm-banner__action" id="jitm-banner__activate">';
                html +=
                    '<a href="#" data-module="' +
                    envelope.activate_module +
                    '" data-settings_link="' +
                    envelope.module_settings_link +
                    '" type="button" class="jitm-button is-compact is-primary" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' +
                    envelope.id +
                    '-activate_module" data-jitm-path="' +
                    envelope.message_path +
                    '">' +
                    window.jitm_config.activate_module_text +
                    '</a>';
                html += '</div>';
                if (envelope.module_settings_link) {
                    html +=
                        '<div class="jitm-banner__action" id="jitm-banner__settings" style="display:none;">';
                    html +=
                        '<a href="' +
                        envelope.module_settings_link +
                        '" type="button" class="jitm-button is-compact is-primary" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' +
                        envelope.id +
                        '-settings_link">' +
                        window.jitm_config.settings_module_text +
                        '</a>';
                    html += '</div>';
                }
            }
            if (envelope.CTA.message) {
                let ctaClasses = 'jitm-button is-compact';
                if (envelope.CTA.primary && null === envelope.activate_module) {
                    ctaClasses += ' is-primary';
                } else {
                    ctaClasses += ' is-secondary';
                }

                const ajaxAction = envelope.CTA.ajax_action;
                const externalLink = envelope.CTA.newWindow && !ajaxAction;

                html += '<div class="jitm-banner__action">';
                html +=
                    '<a href="' +
                    (envelope.CTA.hasOwnProperty('link') && envelope.CTA.link.length
                        ? envelope.CTA.link
                        : envelope.url) +
                    '" target="' +
                    (externalLink ? '_blank' : '_self') +
                    '" rel="noopener noreferrer" title="' +
                    envelope.CTA.message +
                    '" data-module="' +
                    envelope.feature_class +
                    '" type="button" class="' +
                    ctaClasses +
                    '" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' +
                    envelope.id +
                    '" data-jitm-path="' +
                    envelope.message_path +
                    '" ' +
                    (ajaxAction ? 'data-ajax-action="' + ajaxAction + '"' : '') +
                    '>' +
                    envelope.CTA.message +
                    (externalLink ? EXTERNAL_LINK_ICON : '') +
                    '</a>';
                html += '</div>';
            }

            html += '</div>';

            if (envelope.is_dismissible) {
                html +=
                    '<a href="#" data-module="' +
                    envelope.feature_class +
                    '" class="jitm-banner__dismiss"></a>';
            }
            html += '</div>';

            const template = document.createElement('div');
            template.innerHTML = html;
            return template.firstChild;
        },
    };

    const setJITMContent = function(el, response, redirect) {
        let template = response.template;

        // if we don't have a template for this version, just use the default template
        if (!template || !templates[template]) {
            template = 'default';
        }

        response.url = response.url + '&redirect=' + encodeURIComponent(redirect);

        const templateEl = templates[template](response);

        // Add dismiss event handler
        const dismissButton = templateEl.querySelector('.jitm-banner__dismiss');
        if (dismissButton) {
            dismissButton.addEventListener('click', function(e) {
                e.preventDefault();
                templateEl.style.display = 'none';

                apiFetch({
                    path: JITM_ENDPOINT_URL,
                    method: 'POST',
                    data: {
                        id: response.id,
                        feature_class: response.feature_class,
                    },
                });
            });
        }

        const adminNotices = document.getElementById('jp-admin-notices');
        if (adminNotices) {
            // Add to Jetpack notices within the Jetpack settings app

            // If we already have a message, replace it
            const existingCard = adminNotices.querySelector('.jitm-card');
            if (existingCard) {
                existingCard.replaceWith(templateEl);
            } else {
                // No existing JITM? Add ours to the top of the Jetpack admin notices
                adminNotices.prepend(templateEl);
            }
        } else {
            // Replace placeholder div on other pages
            el.replaceWith(templateEl);
        }

        // Handle Module activation button if it exists
        const activateButton = templateEl.querySelector('#jitm-banner__activate a');
        if (activateButton) {
            activateButton.addEventListener('click', function(e) {
                e.preventDefault();

                // Do not allow any requests if the button is disabled
                if (activateButton.hasAttribute('disabled')) {
                    return false;
                }

                // Make request to activate module
                fetch(
                    window.jitm_config.api_root +
                    'jetpack/v4/module/' +
                    activateButton.dataset.module +
                    '/active',
                    {
                        method: 'POST',
                        headers: {
                            'X-WP-Nonce': el.dataset.nonce,
                            'Content-Type': 'application/json',
                        },
                        credentials: 'same-origin'
                    }
                ).then(response => {
                    if (response.ok) {
                        // Display the link to settings and hide the activate link
                        activateButton.textContent = window.jitm_config.activated_module_text;
                        activateButton.setAttribute('disabled', true);

                        if (activateButton.dataset.settings_link) {
                            const settingsEl = document.getElementById('jitm-banner__settings');
                            const activateEl = document.getElementById('jitm-banner__activate');

                            if (settingsEl) settingsEl.style.display = 'block';
                            if (activateEl) activateEl.style.display = 'none';
                            return;
                        }

                        // Hide the JITM after 2 seconds
                        setTimeout(function() {
                            templateEl.style.transition = 'opacity 0.5s';
                            templateEl.style.opacity = '0';
                            setTimeout(() => {
                                templateEl.style.display = 'none';
                            }, 500);
                        }, 2000);
                    }
                });
            });
        }

        // Handle CTA ajax actions
        const ajaxButtons = templateEl.querySelectorAll('.jitm-button[data-ajax-action]');
        ajaxButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                button.setAttribute('disabled', true);

                const formData = new FormData();
                formData.append('action', button.dataset.ajaxAction);
                formData.append('_nonce', el.dataset.ajaxNonce);

                fetch(window.ajaxurl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        templateEl.style.transition = 'opacity 0.5s';
                        templateEl.style.opacity = '0';
                        setTimeout(() => {
                            templateEl.style.display = 'none';
                        }, 500);
                    } else {
                        button.removeAttribute('disabled');
                    }
                })
                .catch(() => {
                    button.removeAttribute('disabled');
                });
                return false;
            });
        });

        // Handle tracking for JITM CTA buttons
        const trackButtons = templateEl.querySelectorAll('.jitm-button');
        trackButtons.forEach(button => {
            button.addEventListener('click', function() {
                const eventName = button.getAttribute('data-jptracks-name');
                if (!eventName) {
                    return;
                }

                const jitmName = button.getAttribute('data-jptracks-prop') || false;
                const messagePath = button.getAttribute('data-jitm-path') || false;
                const eventProp = {
                    clicked: jitmName,
                    jitm_message_path: messagePath,
                };

                if (window.jpTracksAJAX) {
                    window.jpTracksAJAX.record_ajax_event(eventName, 'click', eventProp);
                }
            });
        });
    };

    const reFetch = function() {
        document.querySelectorAll('.jetpack-jitm-message').forEach(function(el) {
            let message_path = el.dataset.messagePath;
            const query = el.dataset.query;
            const redirect = el.dataset.redirect;
            let hash = location.hash;

            hash = hash.replace(/#\//, '_');

            // We always include the hash if this is My Jetpack page
            if (message_path.includes('jetpack_page_my-jetpack')) {
                message_path = message_path.replace(
                    'jetpack_page_my-jetpack',
                    'jetpack_page_my-jetpack' + hash
                );
            } else if ('_dashboard' !== hash) {
                message_path = message_path.replace(
                    'toplevel_page_jetpack',
                    'toplevel_page_jetpack' + hash
                );
            }

            const full_jp_logo_exists = document.querySelector('.jetpack-logo__masthead') ? true : false;

            apiFetch({
                path: addQueryArgs(JITM_ENDPOINT_URL, {
                    message_path,
                    query,
                    full_jp_logo_exists,
                }),
                method: 'GET',
            }).then(function(messages) {
                const message = messages?.[0];
                if (message?.content) {
                    setJITMContent(el, message, redirect);
                }
            });
        });
    };

    reFetch();

    window.addEventListener('hashchange', function(e) {
        const newURL = e.newURL;
        const isJetpackPage = [
            'jetpack',
            'my-jetpack',
            'jetpack-backup',
            'jetpack-boost',
            'jetpack-protect',
            'jetpack-search',
            'jetpack-social',
            'jetpack-videopress',
        ].some(str => newURL.includes(`admin.php?page=${str}`));

        if (isJetpackPage) {
            const jitm_card = document.querySelector('.jitm-card');
            if (jitm_card) {
                jitm_card.remove();
            }
            reFetch();
        }
    });
});
