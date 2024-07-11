( function ( window, document ) {

	var tlkioOnload = function ( e ) {
		var target_elements  = document.querySelectorAll( '.tlkio-container' );
		for ( var i = 0, len = target_elements.length; i < len; ++i ) {
			var channel_name    = target_elements[i].getAttribute( 'data-channel' ),
			custom_css_path     = target_elements[i].getAttribute( 'data-theme' ),
			nickname            = target_elements[i].getAttribute( 'data-nickname' ),
			iframe              = document.createElement( 'iframe' );

			// var iframe_src = 'http://embed.lvh.me:3000/' + channel_name,
			var iframe_src = '//embed.tlk.io/' + channel_name,
			iframe_query = [];


			if ( custom_css_path && custom_css_path.length > 0 ) {
				iframe_query.push( 'custom_css_path=' + custom_css_path );
			}

			if ( nickname && nickname.length > 0 ) {
				iframe_query.push('nickname=' + nickname );
			}

			if ( iframe_query.length > 0 ) {
				iframe_src += '?' + iframe_query.join ( '&' );
			}

			iframe.setAttribute( 'src', iframe_src );
			iframe.setAttribute( 'width', '100%' );
			iframe.setAttribute( 'height', '100%' );
			iframe.setAttribute( 'frameborder', '0' );
			iframe.setAttribute( 'style', 'margin-bottom: -8px;' );

			var current_style = target_elements[i].getAttribute( 'style' );
			target_elements[i].setAttribute( 'style', 'overflow: auto; -webkit-overflow-scrolling: touch;' + current_style );

			target_elements[i].appendChild( iframe );
		}
	};

	window.addEventListener ? window.addEventListener( 'load', tlkioOnload, false ) : window.attachEvent( 'onload', tlkioOnload );

} )( window, document );
