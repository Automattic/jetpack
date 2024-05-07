document.addEventListener( 'DOMContentLoaded', function () {
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon:not(.sso-disconnected-user-icon)' )
		.forEach( function ( tooltip ) {
			tooltip.innerHTML += ' [?]';

			const tooltipTextbox = document.createElement( 'span' );
			tooltipTextbox.classList.add( 'jetpack-sso-invitation-tooltip', 'jetpack-sso-th-tooltip' );

			const tooltipString = window.Jetpack_SSOTooltip.tooltipString;
			tooltipTextbox.innerHTML += tooltipString;

			tooltip.addEventListener( 'mouseenter', function () {
				tooltip.appendChild( tooltipTextbox );
				tooltipTextbox.style.display = 'block';
			} );
			tooltip.addEventListener( 'mouseleave', function () {
				tooltip.removeChild( tooltipTextbox );
			} );
		} );
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon:not(.jetpack-sso-status-column)' )
		.forEach( function ( tooltip ) {
			tooltip.addEventListener( 'mouseenter', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'block';
			} );
			tooltip.addEventListener( 'mouseleave', function () {
				this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'none';
			} );
		} );
} );
