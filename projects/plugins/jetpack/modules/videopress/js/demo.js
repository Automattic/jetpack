( function ( $ ) {
	$( document ).ready( function ( $ ) {
		console.log( 'hi' );
		setTimeout( function () {
			var videoBlocks = $( 'iframe[src*="videopress.com"]' );
			console.log( videoBlocks.attr( 'src' ) );
			videoBlocks.each( function ( i, iframeElement ) {
				console.log( i, iframeElement.src );

				var src = iframeElement.src;
				iframeElement.src = '';
				var data = {
					action: 'videopress-get-playback-jwt',
					src: src,
				};
				// We can also pass the url value separately from ajaxurl for front end AJAX implementations
				jQuery.post( videopressAjax.ajaxUrl, data, function ( response ) {
					console.log( 'Got this from the server: ', response );
					if ( !! response.success && response.data ) {
						iframeElement.src = response.data.src;
					}
				} );
				// console.log($(iframeElement).attr('src'))
				// ajax for jwt,
				//
				//.then().(function () {
				//iframeElement.src = //
				// })
			} );
		}, 1000 );
	} );
} )( jQuery );
