/* global gapi */

/**
 * Refresh Google+ Badge in Customizer
 */
(function($){

	$( document ).ready( function() {
		if ( wp && wp.customize && wp.customizerHasPartialWidgetRefresh() ) {
			wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function ( placement ) {
				if ( placement.container && 'object' === typeof gapi && gapi.person && 'function' === typeof gapi.person.go ) {
					gapi.person.go( placement.container[0] );
				}
			} );
		}
	});

})(jQuery);