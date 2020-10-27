jQuery( function ( $ ) {
	var $adminbar = $( '#wpadminbar' ),
		$wpwrap = $( '#wpwrap' );

	$adminbar.find( '#wp-admin-bar-blog a' ).attr( 'aria-expanded', 'false' );

	// Toggle sidebar when toggle is clicked.
	$adminbar.on( 'click.wp-responsive', '#wp-admin-bar-blog', function ( event ) {
		event.preventDefault();

		// Close any open toolbar submenus.
		$adminbar.find( '.hover' ).removeClass( 'hover' );

		$wpwrap.toggleClass( 'wp-responsive-open' );
		if ( $wpwrap.hasClass( 'wp-responsive-open' ) ) {
			$( this ).find( 'a' ).attr( 'aria-expanded', 'true' );
			$( '#adminmenu a:first' ).focus();
		} else {
			$( this ).find( 'a' ).attr( 'aria-expanded', 'false' );
		}
	} );
} );
