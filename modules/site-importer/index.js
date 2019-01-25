// @TODO use a built bundle here instead
( function( $ ) {
	$( function() {
		$( '.jetpack-site-importer__exit' ).on( 'click', function() {
			$( '.jetpack-site-importer' ).fadeOut( 400, function() {
				$( 'table.importers' ).parent().fadeIn();
			} );
		} );
	} );
} )( jQuery );
