document.addEventListener( 'DOMContentLoaded', function () {
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon' )
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
} );
