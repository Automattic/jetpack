jQuery( function ( $ ) {
	const state = jetpackSocialClassicEditorInitialState; // eslint-disable-line no-undef -- This is set by wp_localize_script().
	const form = $( '#publicize-form' );

	if ( state.sharesRemaining > state.numberOfConnections ) {
		return;
	}

	form.click( function ( event ) {
		const target = $( event.target );

		if ( ! target.is( 'input' ) || target.is( ':disabled' ) ) {
			return;
		}

		// If a connection is checked and disabled, it's already been Publicized to, and we don't want to change it.
		const enabledConnections = form.find( 'input[type="checkbox"]:checked:not(:disabled)' );
		const outOfConnections = enabledConnections.length >= state.sharesRemaining;

		$( '#publicize-form' )
			.find( 'input[type="checkbox"]' )
			.each( function () {
				// Don't do anything for the current target.
				if ( this.id === target.attr( 'id' ) ) {
					return true;
				}

				// If it's checked, don't change anything.
				if ( this.checked ) {
					return true;
				}

				$( this ).prop( 'disabled', outOfConnections );
			} );
	} );
} );
