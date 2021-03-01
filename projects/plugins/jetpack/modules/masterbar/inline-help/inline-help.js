( function () {
	function init() {
		var fauxInlineHelpButton = document.querySelector( '[data-faux-inline-help]' );
		fauxInlineHelpButton &&
			fauxInlineHelpButton.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				window.open( e.target.href, e.target.target );
			} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
