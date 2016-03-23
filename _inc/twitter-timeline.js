/* global twttr */

/* jshint ignore:start */
!function(d,s,id){
	var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';
	if(!d.getElementById(id)){
		js=d.createElement(s);
		js.id=id;js.src=p+"://platform.twitter.com/widgets.js";
		fjs.parentNode.insertBefore(js,fjs);
	}
}(document,"script","twitter-wjs");
/* jshint ignore:end */

jQuery( function() {
	var hasSelectiveRefresh = (
		'undefined' !== typeof wp &&
		wp.customize &&
		wp.customize.selectiveRefresh &&
		wp.customize.widgetsPreview &&
		wp.customize.widgetsPreview.WidgetPartial
	);
	if ( ! hasSelectiveRefresh ) {
		return;
	}

	// Re-load Twitter widgets when a partial is rendered.
	wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
		if ( placement.container ) {
			twttr.widgets.load( placement.container[0] );
		}
	} );

	// Refresh a moved partial containing a Twitter timeline iframe, since it has to be re-built.
	wp.customize.selectiveRefresh.bind( 'partial-content-moved', function( placement ) {
		if ( placement.container && placement.container.find( 'iframe.twitter-timeline:not([src]):first' ).length ) {
			placement.partial.refresh();
		}
	} );
} );
