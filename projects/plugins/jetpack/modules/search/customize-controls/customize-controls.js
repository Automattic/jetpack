/**
 * Binds iframe messages from the Customizer to SearchApp.
 *
 * @param {boolean} expanded - whether jetpack_search section is expanded and visible.
 */
function postSectionMessage( expanded ) {
	// window.wp.customize.previewer.preview is not available until both customize and customize.previewer are ready.
	window.wp.customize.previewer.preview
		.targetWindow()
		.postMessage( { key: 'jetpackSearchSectionOpen', expanded: expanded } ); // Assume ES5 envorinment.
}

/**
 * Adds functionality for Jetpack Search section detection in the Customizer.
 */
function init() {
	window.wp.customize.bind( 'ready', function () {
		window.wp.customize.previewer.bind( 'ready', function () {
			postSectionMessage( window.wp.customize.section( 'jetpack_search' ).expanded() );
			window.wp.customize.section( 'jetpack_search' ).expanded.bind( postSectionMessage );
			window.wp.customize.state( 'processing' ).bind( function () {
				postSectionMessage( window.wp.customize.section( 'jetpack_search' ).expanded() );
			} );
		} );
	} );
}

if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}
