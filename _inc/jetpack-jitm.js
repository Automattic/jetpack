jQuery( document ).ready( function( $ ) {
	var templates = {
		'default': function( envelope ) {
			var html = '<div class="jitm-card jitm-banner ' + (
					envelope.CTA.message ? 'has-call-to-action' : ''
				) + ' is-upgrade-premium ' + envelope.content.classes + '" data-stats_url="' + envelope.jitm_stats_url + '">';
			html += '<div class="jitm-banner__icon-plan">' + envelope.content.icon + '</div>';
			html += '<div class="jitm-banner__content">';
			html += '<div class="jitm-banner__info">';
			html += '<div class="jitm-banner__title">' + envelope.content.message + '</div>';
			if ( envelope.content.description && envelope.content.description !== '' ) {
				html += '<div class="jitm-banner__description">' + envelope.content.description;
				if ( envelope.content.list.length > 0 ) {
					html += '<ul class="banner__list">';
					for ( var i = 0; i < envelope.content.list.length; i++ ) {

						var text = envelope.content.list[ i ].item;

						if ( envelope.content.list[ i ].url ) {
							text = '<a href="' + envelope.content.list[ i ].url + '" target="_blank" rel="noopener noreferrer" data-module="' + envelope.feature_class + '" data-jptracks-name="nudge_item_click" data-jptracks-prop="jitm-' + envelope.id + '">' +
								text + '</a>';
						}

						html += '<li>' +
							'<svg class="gridicon gridicons-checkmark" height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g>' +
							'<path d="M9 19.414l-6.707-6.707 1.414-1.414L9 16.586 20.293 5.293l1.414 1.414" /></g></svg>' +
							text +
							'</li>';
					}
				}
				html += '</div>';
			}
			html += '</div>';
			if ( envelope.CTA.message ) {
				html += '<div class="jitm-banner__action">';
				html += '<a href="' + envelope.url + '" target="' + ( envelope.CTA.newWindow === false ? '_self' : '_blank') + '" rel="noopener noreferrer" title="' + envelope.CTA.message + '" data-module="' + envelope.feature_class + '" type="button" class="jitm-button is-compact ' + ( envelope.CTA.primary ? 'is-primary' : '' ) + ' jptracks" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' + envelope.id + '">' + envelope.CTA.message + '</a>';
				html += '</div>';
			}
			html += '<a href="#" data-module="' + envelope.feature_class + '" class="jitm-banner__dismiss"></a>';
			html += '</div>';
			html += '</div>';

			return $( html );
		}
	};

	var setJITMContent = function( $el, response, redirect ) {
		var template;

		var render = function( $my_template ) {
			return function( e ) {
				e.preventDefault();

				$my_template.hide();

				$.ajax( {
					url: window.jitm_config.api_root + 'jetpack/v4/jitm',
					method: 'POST', // using DELETE without permalinks is broken in default nginx configuration
					data: {
						id: response.id,
						feature_class: response.feature_class
					}
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
		$template.find( '.jitm-banner__dismiss' ).click( render( $template ) );

		$el.replaceWith( $template );

		// Add to Jetpack notices within the Jetpack settings app.
		$template.prependTo( $( '#jp-admin-notices' ) );
	};

	$( '.jetpack-jitm-message' ).each( function() {
		var $el = $( this );

		var message_path = $el.data( 'message-path' );
		var query = $el.data( 'query' );
		var redirect = $el.data( 'redirect' );

		$.get( window.jitm_config.api_root + 'jetpack/v4/jitm', {
			message_path: message_path,
			query: query,
			_wpnonce: $el.data( 'nonce' )
		} ).then( function( response ) {
			if ( 'object' === typeof response && response['1'] ) {
				response = [ response['1'] ];
			}

			// properly handle the case of an empty array or no content set
			if ( 0 === response.length || ! response[ 0 ].content ) {
				return;
			}

			// for now, always take the first response
			setJITMContent( $el, response[ 0 ], redirect );
		} );
	} );
} );
