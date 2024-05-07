document.addEventListener( 'DOMContentLoaded', function () {
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon, #user_jetpack' )
		.forEach( function ( tooltip ) {
			tooltip.innerHTML += ' [?]';
			tooltip.addEventListener( 'mouseenter', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'block';
			} );
			tooltip.addEventListener( 'mouseleave', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'none';
			} );
		} );
	document.querySelectorAll( '.jetpack-sso-th-tooltip' ).forEach( function ( tooltip_textbox ) {
		const tooltipString = window.Jetpack_SSOTooltip.tooltip_string;
		tooltip_textbox.innerHTML += tooltipString;
	} );
} );
