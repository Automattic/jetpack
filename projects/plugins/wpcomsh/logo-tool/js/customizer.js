/**
 * IMPORTANT: All changes in this plugin should be synced between wpcom (Simple Sites) and wpcomsh (Atomic Sites).
 */

/* global wp, _LogoTool_ */
/**
 * Logo tool customizer object.
 *
 * @param {object} $        - jQuery.
 * @param {object} wp       - WordPress.
 * @param {object} LogoTool - LogoTool.
 */
( function ( $, wp, LogoTool ) {
	wp.customize.bind( 'ready', function () {
		let logoThumbnail;
		const logoControlId = '#customize-control-' + LogoTool.controlId;

		// Could be a Core custom-logo, Jetpack site-logo, or a theme specific logo that uses the same image control.
		if ( wp.customize( LogoTool.settingId ) ) {
			logoThumbnail = $( logoControlId + ' .thumbnail' );
			wp.customize( LogoTool.settingId ).bind( 'change', function ( to ) {
				if ( ! to ) {
					insertLogoButton( logoControlId );
					showLogoDescription( logoControlId );
				} else {
					// Logo button is removed automatically.
					hideLogoDescription( logoControlId );
				}
			} );

			if ( ! logoThumbnail.length ) {
				insertLogoButton( logoControlId );
				showLogoDescription( logoControlId );
			} else {
				// Logo button is removed automatically.
				hideLogoDescription( logoControlId );
			}
		}
	} );

	/**
	 * Inserts the logo button.
	 *
	 * @param {string} id - the ID of the logo element.
	 */
	function insertLogoButton( id ) {
		const button = $(
			'<a class="button create-logo-button" target="_blank" href="https://wp.me/logo-maker" />'
		).text( LogoTool.l10n.create );

		// Timeout lets us render after the core control finishes.
		setTimeout( function () {
			$( id + ' .actions' ).prepend( button );
		}, 10 );
	}

	/**
	 * Shows logo description.
	 * @param {string} id - description element ID.
	 */
	function showLogoDescription( id ) {
		$( id + ' .description' ).show();
	}

	/**
	 * Hides logo description.
	 * @param {string} id - description element ID.
	 */
	function hideLogoDescription( id ) {
		$( id + ' .description' ).hide();
	}
} )( jQuery, wp, _LogoTool_ );
