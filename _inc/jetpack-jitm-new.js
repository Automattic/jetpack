jQuery( document ).ready( function( $ ) {
	var templates = {
		'default': function( $el, envelope ) {
			console.log( envelope );
			var html = '<div class="jp-jitm" data-stats_url="' + envelope.jitm_stats_url + '"> \
	<a href="#" data-module="' + envelope.id + '" class="dismiss"><span class="genericon genericon-close"></span></a>' + envelope.content.emblem + ' \
	<p class="msg"> \
		' + envelope.content.message + ' \
	</p> \
	<p> \
		<a href="' + envelope.url + '" target="_blank" title="' + envelope.CTA.message + '" data-module="' + envelope.id + '" data-jptracks-name="nudge_click" data-jptracks-prop="jitm-' + envelope.id + '" class="button button-jetpack launch jptracks">' + envelope.CTA.message + '</a> \
	</p> \
</div> ';
			$el.html( html );
		}
	};

	var setJITMContent = function( $el, response ) {
		var i, template;
		for ( i = 0; i < response.length; i += 1 ) {
			template = response[ i ].template;

			// if we don't have a template for this version, just use the default template
			if ( ! template || ! templates[ template ] ) {
				template = 'default';
			}

			// todo: inject a div to put the template in and pass it to the template
			templates[ template ]( $el, response[ i ] );
		}
	};

	$( '.jetpack-jitm-message' ).each( function() {
		var $el = $( this );

		var message_path = $el.data( 'message-path' );

		$.get( '/wp-json/jetpack/v4/jitm', { message_path: message_path } ).then( function( response ) {
			setJITMContent( $el, response );
		} );
	} );
} );
