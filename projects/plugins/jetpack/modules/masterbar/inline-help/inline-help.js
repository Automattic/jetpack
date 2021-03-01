( function () {
	var windowObjectReference = null;
	function init() {
		document.addEventListener( 'click', function ( e ) {
			if ( e.target.dataset.fauxInlineHelp !== undefined ) {
				e.preventDefault();

				if ( windowObjectReference === null || windowObjectReference.closed ) {
					windowObjectReference = window.open( e.target.href, e.target.target );
				} else {
					windowObjectReference.focus();
				}
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
