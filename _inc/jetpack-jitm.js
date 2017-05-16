jQuery( document ).ready( function( $ ) {
	var templates = {
		'default': function( envelope ) {
			var html = '<div class="jp-jitm" data-stats_url="' + envelope.jitm_stats_url + '"> ' +
	'<a href="#" data-module="' + envelope.feature_class + '" class="dismiss"><span class="genericon genericon-close"></span></a>' + envelope.content.icon +
	'<p class="msg">' +
		envelope.content.message +
	'</p>';
			if ( envelope.CTA.message ) {
				html += '<p>' +
		'<a href="' + envelope.url + '" target="_blank" title="' + envelope.CTA.message + '" data-module="' + envelope.id + '" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' + envelope.id + '" class="button button-jetpack launch jptracks">' + envelope.CTA.message + '</a>' +
	'</p>';
			}
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
			$template.find( '.dismiss' ).click( render( i, $template ) );
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
