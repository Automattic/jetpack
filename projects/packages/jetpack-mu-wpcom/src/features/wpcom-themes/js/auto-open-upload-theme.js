document.addEventListener( 'DOMContentLoaded', function () {
	console.log( 'auto-open-upload-theme.js loaded' );
	const uploadButton = document.querySelector( '.upload-view-toggle' );
	if ( uploadButton ) {
		uploadButton.click();
	}
} );
