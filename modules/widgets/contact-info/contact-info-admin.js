(function( $ ) {
	var fieldIds = window.jetpackContactInfoFieldIds,
		$apiKeyField = $( document.getElementById( fieldIds.apikey ) ).closest( 'p' ),
		$showMapInput = $( document.getElementById( fieldIds.showmap ) );

	function toggleVisibility() {
		$apiKeyField.toggle( $showMapInput.is( ':checked' ) );
	}

	$( document ).ready(function() {
		$showMapInput.on( 'change', toggleVisibility );
	});
})( window.jQuery );
