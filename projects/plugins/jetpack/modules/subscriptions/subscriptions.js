( function () {
	window.addEventListener( 'load', function () {
		var notificationElems = document.getElementsByClassName( 'sub-notification' );
		if ( notificationElems.length > 0 ) {
			notificationElems[ 0 ].scrollIntoView();
		}
	} );
} )();
