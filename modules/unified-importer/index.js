// @TODO use a built bundle here instead
( function( $ ) {
	$( function() {
		$( '.jetpack-unified-importer__exit' ).on( 'click', function() {
			$( '.jetpack-unified-importer' ).fadeOut( 400, function() {
				$( 'table.importers' ).parent().fadeIn();
			} );
		} );
	} );
} )( jQuery );
