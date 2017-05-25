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
				html += '<div class="jitm-banner__description">' + envelope.content.description + '</div>';
			}
			html += '</div>';
			if ( envelope.CTA.message ) {
				html += '<div class="jitm-banner__action">';
				html += '<a href="' + envelope.url + '" target="_blank" title="' + envelope.CTA.message + '" data-module="' + envelope.feature_class + '" type="button" class="jitm-button is-compact ' + ( envelope.CTA.primary ? 'is-primary' : '' ) + ' jptracks" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' + envelope.id + '">' + envelope.CTA.message + '</a>';
				html += '</div>';
			}
			html += '<a href="#" data-module="' + envelope.feature_class + '" class="jitm-banner__dismiss"></a>';
			html += '</div>';
			html += '</div>';

			return $( html );
		}
	};

	var setJITMContent = function( $el, response ) {
		var i, template;

		var render = function( index, $my_template ) {
			return function( e ) {
				e.preventDefault();

				$my_template.hide();

				$.ajax( {
					url: window.jitm_config.api_root + 'jetpack/v4/jitm',
					method: 'DELETE',
					data: {
						id: response[ index ].id,
						feature_class: response[ index ].feature_class
					}
				} );
			};
		};

		for ( i = 0; i < response.length; i += 1 ) {
			template = response[ i ].template;

			// if we don't have a template for this version, just use the default template
			if ( ! template || ! templates[ template ] ) {
				template = 'default';
			}

			var $template = templates[ template ]( response[ i ] );
			$template.find( '.jitm-banner__dismiss' ).click( render( i, $template ) );
			$el.append( $template );
		}
	};

	$( '.jetpack-jitm-message' ).each( function() {
		var $el = $( this );

		var message_path = $el.data( 'message-path' );
		var query = $el.data( 'query' );

		$.get( window.jitm_config.api_root + 'jetpack/v4/jitm', {
			message_path: message_path,
			query: query,
			_wpnonce: $el.data( 'nonce' )
		} ).then( function( response ) {
			setJITMContent( $el, response );
		} );
	} );
} );
