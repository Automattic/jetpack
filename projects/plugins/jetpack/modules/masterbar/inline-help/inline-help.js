( function () {
	var windowObjectReference = null;
	function init() {
		var fauxInlineHelpButton = document.querySelector( '[data-faux-inline-help]' );
		fauxInlineHelpButton &&
			fauxInlineHelpButton.addEventListener( 'click', function ( e ) {
				e.preventDefault();

				if ( windowObjectReference === null || windowObjectReference.closed ) {
					windowObjectReference = window.open( e.target.href, e.target.target );
				} else {
					windowObjectReference.focus();
				}
			} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
