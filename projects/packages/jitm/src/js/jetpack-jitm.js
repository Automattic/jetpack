import jQuery from 'jquery';

import '../css/jetpack-admin-jitm.scss';

jQuery( document ).ready( function ( $ ) {
	var templates = {
		default: function ( envelope ) {
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

			var html =
				'<div class="jitm-card jitm-banner ' +
				( envelope.CTA.message ? 'has-call-to-action' : '' ) +
				' is-upgrade-premium ' +
				envelope.content.classes +
				'" data-stats_url="' +
				envelope.jitm_stats_url +
				'">';
			html += '<div class="jitm-banner__content">';
			html += '<div class="jitm-banner__icon-plan">' + envelope.content.icon + '</div>';
			html += '<div class="jitm-banner__info">';
			html += '<div class="jitm-banner__title">' + envelope.content.message + '</div>';
			if ( envelope.content.description && envelope.content.description !== '' ) {
				html += '<div class="jitm-banner__description">' + envelope.content.description;
				if ( envelope.content.list.length > 0 ) {
					html += '<ul class="banner__list">';
					for ( var i = 0; i < envelope.content.list.length; i++ ) {
						var text = envelope.content.list[ i ].item;

						if ( envelope.content.list[ i ].url ) {
							text =
								'<a href="' +
								envelope.content.list[ i ].url +
								'" target="_blank" rel="noopener noreferrer" data-module="' +
								envelope.feature_class +
								'" data-jptracks-name="nudge_item_click" data-jptracks-prop="jitm-' +
								envelope.id +
								'">' +
								text +
								EXTERNAL_LINK_ICON +
								'</a>';
						}

						html +=
							'<li>' +
							CHECKMARK_ICON +
							text +
							'</li>';
					}
				}
				html += '</div>';
			}
			html += '</div>';
			html += '</div>';

			html += '<div class="jitm-banner__buttons_container">';

			if ( envelope.activate_module ) {
				html += '<div class="jitm-banner__action" id="jitm-banner__activate">';
				html +=
					'<a href="#" data-module="' +
					envelope.activate_module +
					'" data-settings_link="' + envelope.module_settings_link +
					'" type="button" class="jitm-button is-compact is-primary" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' +
					envelope.id +
					'-activate_module" data-jitm-path="' +
					envelope.message_path +
					'">' +
					window.jitm_config.activate_module_text +
					'</a>';
				html += '</div>';
				if ( envelope.module_settings_link){
					html += '<div class="jitm-banner__action" id="jitm-banner__settings" style="display:none;">';
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
			if ( envelope.CTA.message ) {
				var ctaClasses = 'jitm-button is-compact';
				if ( envelope.CTA.primary && null === envelope.activate_module ) {
					ctaClasses += ' is-primary';
				} else {
					ctaClasses += ' is-secondary';
				}

				var ajaxAction = envelope.CTA.ajax_action;
				var externalLink = envelope.CTA.newWindow && ! ajaxAction;

				html += '<div class="jitm-banner__action">';
				html +=
					'<a href="' +
					( envelope.CTA.hasOwnProperty( 'link' ) && envelope.CTA.link.length
						? envelope.CTA.link
						: envelope.url ) +
					'" target="' +
					( externalLink ? '_blank' : '_self' ) +
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
					( ajaxAction ? 'data-ajax-action="' + ajaxAction + '"' : '' ) +
					'>' +
					envelope.CTA.message +
					( externalLink ? EXTERNAL_LINK_ICON : '' )
					'</a>';
				html += '</div>';
			}

			html += '</div>';

			if ( envelope.is_dismissible ) {
				html +=
					'<a href="#" data-module="' +
					envelope.feature_class +
					'" class="jitm-banner__dismiss"></a>';
			}
			html += '</div>';

			return $( html );
		},
	};

	var setJITMContent = function ( $el, response, redirect ) {
		var template;

		var render = function ( $my_template ) {
			return function ( e ) {
				e.preventDefault();

				$my_template.hide();

				$.ajax( {
					url: window.jitm_config.api_root + 'jetpack/v4/jitm',
					method: 'POST', // using DELETE without permalinks is broken in default nginx configuration
					beforeSend: function ( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', window.jitm_config.nonce );
					},
					data: {
						id: response.id,
						feature_class: response.feature_class,
					},
				} );
			};
		};

		template = response.template;

		// if we don't have a template for this version, just use the default template
		if ( ! template || ! templates[ template ] ) {
			template = 'default';
		}

		response.url = response.url + '&redirect=' + redirect;

		var $template = templates[ template ]( response );
		$template.find( '.jitm-banner__dismiss' ).on( 'click', render( $template ) );

		if ( $( '#jp-admin-notices' ).length > 0 ) {
			// Add to Jetpack notices within the Jetpack settings app.
			$el.innerHTML = $template;

			// If we already have a message, replace it.
			if ( $( '#jp-admin-notices' ).find( '.jitm-card' ) ) {
				$( '.jitm-card' ).replaceWith( $template );
			}

			// No existing JITM? Add ours to the top of the Jetpack admin notices.
			$template.prependTo( $( '#jp-admin-notices' ) );
		} else {
			// Replace placeholder div on other pages.
			$el.replaceWith( $template );
		}

		// Handle Module activation button if it exists.
		$template.find( '#jitm-banner__activate a' ).on( 'click', function () {
			var $activate_button = $( this );

			// Do not allow any requests if the button is disabled.
			if ( $activate_button.attr( 'disabled' ) ) {
				return false;
			}

			// Make request to activate module.
			$.ajax( {
				url:
					window.jitm_config.api_root +
					'jetpack/v4/module/' +
					$activate_button.data( 'module' ) +
					'/active',
				method: 'POST',
				beforeSend: function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', $el.data( 'nonce' ) );

					// Change the button status to disabled as the change is in progress.
					$( '#jitm-banner__activate a' ).text( window.jitm_config.activating_module_text );
					$( '#jitm-banner__activate a' ).attr( 'disabled', true );
				},
			} ).done( function () {
				// Display the link to settings and hide the activate link
				$( '#jitm-banner__activate a' ).text( window.jitm_config.activated_module_text );
				$( '#jitm-banner__activate a' ).attr( 'disabled', true );

				if ( $activate_button.data( 'settings_link' ) ) {
					$( '#jitm-banner__settings' ).show();
					$( '#jitm-banner__activate' ).hide();
					return;
				}

				// Hide the JITM after 2 seconds.
				setTimeout( function () {
					$template.fadeOut( 'slow' );
				}, 2000 );
			} );
		} );

		// Handle CTA ajax actions.
		$template.find( '.jitm-button[data-ajax-action]' ).on( 'click', function ( e ) {
			e.preventDefault();
			var button = $( this );
			button.attr( 'disabled', true );
			$.post( window.ajaxurl, {
				action: button.data( 'ajax-action' ),
				_nonce: $el.data( 'ajax-nonce' ),
			} )
				.done( function () {
					$template.fadeOut( 'slow' );
				} )
				.fail( function () {
					button.attr( 'disabled', false );
				} );
			return false;
		} );

		// Handle tracking for JITM CTA buttons
		$template.find( '.jitm-button' ).on( 'click', function ( e ) {

			var button = $( this );
			var eventName = button.attr( 'data-jptracks-name' );
			if ( undefined === eventName ) {
				return;
			}

			var jitmName = button.attr( 'data-jptracks-prop' ) || false;
			var messagePath = button.attr( 'data-jitm-path' ) || false;
			var eventProp = {
				clicked: jitmName,
				jitm_message_path: messagePath,
			};

			if ( window.jpTracksAJAX ) {
				window.jpTracksAJAX.record_ajax_event(eventName, 'click', eventProp);
			}
		} );
	};

	var reFetch = function () {
		$( '.jetpack-jitm-message' ).each( function () {
			var $el = $( this );

			var message_path = $el.data( 'message-path' );
			var query = $el.data( 'query' );
			var redirect = $el.data( 'redirect' );
			var hash = location.hash;

			hash = hash.replace( /#\//, '_' );

			// We always include the hash if this is My Jetpack page
			if ( message_path.includes( 'jetpack_page_my-jetpack' )) {
				message_path = message_path.replace(
					'jetpack_page_my-jetpack',
					'jetpack_page_my-jetpack' + hash
				);
			} else if ( '_dashboard' !== hash ) {
				message_path = message_path.replace(
					'toplevel_page_jetpack',
					'toplevel_page_jetpack' + hash
				);
			}

			var full_jp_logo_exists = $( '.jetpack-logo__masthead' ).length ? true : false;

			$.get( window.jitm_config.api_root + 'jetpack/v4/jitm', {
				message_path: message_path,
				query: query,
				full_jp_logo_exists: full_jp_logo_exists,
				_wpnonce: $el.data( 'nonce' ),
			} ).then( function ( response ) {
				if ( 'object' === typeof response && response[ '1' ] ) {
					response = [ response[ '1' ] ];
				}

				// properly handle the case of an empty array or no content set
				if ( 0 === response.length || ! response[ 0 ].content ) {
					return;
				}

				// for now, always take the first response
				setJITMContent( $el, response[ 0 ], redirect );
			} );
		} );
	};

	reFetch();

	$( window ).on( 'hashchange', function ( e ) {
		const newURL = e.originalEvent.newURL;
		const isJetpackPage = [
			'jetpack',
			'my-jetpack',
			'jetpack-backup',
			'jetpack-boost',
			'jetpack-protect',
			'jetpack-search',
			'jetpack-social',
			'jetpack-videopress',
		].some( str => newURL.includes( `admin.php?page=${ str }` ) );

		if ( isJetpackPage ) {
			var jitm_card = document.querySelector( '.jitm-card' );
			if ( jitm_card ) {
				jitm_card.remove();
			}
			reFetch();
		}
	} );
} );
