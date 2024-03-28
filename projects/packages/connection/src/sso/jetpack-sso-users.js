jQuery( document ).ready( $ => {
	$( '.jetpack-sso-invitation-tooltip-icon, #user_jetpack' ).hover(
		function () {
			$( this ).find( '.jetpack-sso-invitation-tooltip' ).show();
		},
		function () {
			$( this ).find( '.jetpack-sso-invitation-tooltip' ).hide();
		}
	);
} );
