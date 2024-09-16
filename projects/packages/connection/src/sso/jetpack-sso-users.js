document.addEventListener( 'DOMContentLoaded', function () {
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon:not(.sso-disconnected-user)' )
		.forEach( function ( tooltip ) {
			tooltip.innerHTML += ' [?]';

			const tooltipTextbox = document.createElement( 'span' );
			tooltipTextbox.classList.add( 'jetpack-sso-invitation-tooltip', 'jetpack-sso-th-tooltip' );

			const tooltipString = window.Jetpack_SSOTooltip.tooltipString;
			tooltipTextbox.innerHTML += tooltipString;

			tooltip.addEventListener( 'mouseenter', appendTooltip );
			tooltip.addEventListener( 'focus', appendTooltip );
			tooltip.addEventListener( 'mouseleave', removeTooltip );
			tooltip.addEventListener( 'blur', removeTooltip );

			/**
			 * Display the tooltip textbox.
			 */
			function appendTooltip() {
				tooltip.appendChild( tooltipTextbox );
				tooltipTextbox.style.display = 'block';
			}

			/**
			 * Remove the tooltip textbox.
			 */
			function removeTooltip() {
				// Only remove tooltip if the element isn't currently active.
				if ( tooltip.ownerDocument.activeElement === tooltip ) {
					return;
				}
				tooltip.removeChild( tooltipTextbox );
			}
		} );
	document
		.querySelectorAll( '.jetpack-sso-invitation-tooltip-icon:not(.jetpack-sso-status-column)' )
		.forEach( function ( tooltip ) {
			tooltip.addEventListener( 'mouseenter', appendSSOInvitationTooltip );
			tooltip.addEventListener( 'focus', appendSSOInvitationTooltip );
			tooltip.addEventListener( 'mouseleave', removeSSOInvitationTooltip );
			tooltip.addEventListener( 'blur', removeSSOInvitationTooltip );
		} );

	/**
	 * Display the SSO invitation tooltip textbox.
	 */
	function appendSSOInvitationTooltip() {
		this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'block';
	}

	/**
	 * Remove the SSO invitation tooltip textbox.
	 *
	 * @param {Event} event - Triggering event.
	 */
	function removeSSOInvitationTooltip( event ) {
		if ( event.target.ownerDocument.activeElement === event.target ) {
			return;
		}
		this.querySelector( '.jetpack-sso-invitation-tooltip' ).style.display = 'none';
	}
} );
