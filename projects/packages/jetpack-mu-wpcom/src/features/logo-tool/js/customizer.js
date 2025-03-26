/* global wp, _LogoTool_ */
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
	 * Insert the logo creation button.
	 *
	 * @param {string} id - The control ID.
	 */
	function insertLogoButton( id ) {
		const externalIcon =
			'<svg class="external-link-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.97949 2.91699H4.91699C3.81242 2.91699 2.91699 3.81242 2.91699 4.91699V9.08366C2.91699 10.1882 3.81242 11.0837 4.91699 11.0837H9.08366C10.1882 11.0837 11.0837 10.1882 11.0837 9.08366V7.79431" stroke="#6BA774"/><path d="M8.68922 2.20873L11.9253 2.19411M11.9253 2.19411L11.8976 5.41706M11.9253 2.19411C10.5504 3.56904 8.76465 5.35476 7.44471 6.67469" stroke="#6BA774"/></svg>';
		const button = $(
			'<a class="button create-logo-button" target="_blank" href="' + LogoTool.referralLink + '" />'
		).text( LogoTool.l10n.create );
		button.prepend( externalIcon );
		// Timeout lets us render after the core control finishes.
		setTimeout( function () {
			$( id + ' .actions' ).prepend( button );
		}, 10 );
	}

	/**
	 * Show the logo description.
	 *
	 * @param {string} id - The control ID.
	 */
	function showLogoDescription( id ) {
		$( id + ' .description' ).show();
	}

	/**
	 * Hide the logo description.
	 *
	 * @param {string} id - The control ID.
	 */
	function hideLogoDescription( id ) {
		$( id + ' .description' ).hide();
	}
} )( jQuery, wp, _LogoTool_ );
