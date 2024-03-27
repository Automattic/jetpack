document.addEventListener( 'DOMContentLoaded', function () {
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon, #user_jetpack' )
		.forEach( function ( tooltip ) {
			tooltip.addEventListener( 'mouseenter', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'block';
			} );
			tooltip.addEventListener( 'mouseleave', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'none';
			} );
		} );
} );
