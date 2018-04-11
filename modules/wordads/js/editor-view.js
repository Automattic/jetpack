/* global tinyMCE, QTags, wp */
( function( $, wp ) {
	wp.mce = wp.mce || {};
	if ( 'undefined' === typeof wp.mce.views ) {
		return;
	}

	var $wp_content_wrap = $( '#wp-content-wrap' );
	$( '#insert-jetpack-wordads-inline-ad' ).on( 'click', function( e ) {
		e.preventDefault();
		if ( $wp_content_wrap.hasClass( 'tmce-active' ) ) {
			tinyMCE.execCommand( 'wordads_add_inline_ad' );
		} else if ( $wp_content_wrap.hasClass( 'html-active' ) ) {
			QTags.insertContent( '[wordad]' );
		} else {
			window.console.error( 'Neither TinyMCE nor QuickTags is active. Unable to insert form.' );
		}
	} );
}( jQuery, wp ) );
