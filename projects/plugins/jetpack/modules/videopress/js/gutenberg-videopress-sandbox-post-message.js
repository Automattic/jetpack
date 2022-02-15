// A Simple post message repeater for VideoPress Gutenberg blocks that use the <Sandbox> component
( function() {
		window.addEventListener( 'message', function( event ) {
			if (event.data.event === 'videopress_token_request' ) {
				console.log( 'Passing through video player token request to parent' );
				parent.postMessage( event.data, '*' );
			} else if ( event.data.event === 'videopress_token_received' ) {
				console.log( 'Passing down token retrieved event to player iframe' );
				const iframe = document.getElementsByTagName( 'iframe' )[0];
				iframe.contentWindow.postMessage( event.data, '*' );
			}
		} );
} )();
