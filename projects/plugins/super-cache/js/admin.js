jQuery( document ).ready( () => {
	// Don't run on versions of WordPress too old for the block editor and the translation methods it brings.
	// All the install / activate options are plain links with meaningful destinations anyway.
	if ( ! window.wp || ! window.wp.i18n ) {
		return;
	}

	const { __, sprintf } = window.wp.i18n;
	const ajaxurl = window.ajaxurl;
	const wpscAdmin = window.wpscAdmin;

	const link = jQuery( '.wpsc-install-action-button' );
	const label = link.find( 'label' );
	const spinner = link.find( '.spinner' );

	// Dismiss Boost banner.
	jQuery( '.wpsc-boost-dismiss' ).on( 'click', function () {
		jQuery( '.wpsc-boost-banner' ).fadeOut( 'slow' );

		jQuery.post( ajaxurl, {
			action: 'wpsc-hide-boost-banner',
			nonce: wpscAdmin.boostDismissNonce,
		} );
	} );

	// One-click install for Boost.
	jQuery( '.wpsc-install-boost-button' ).on( 'click', event => {
		const source = jQuery( event.currentTarget ).attr( 'data-source' );
		event.preventDefault();
		showBoostBannerBusy( __( 'Installing…', 'wp-super-cache' ) );

		jQuery
			.post( ajaxurl, {
				action: 'wpsc_install_plugin',
				_ajax_nonce: wpscAdmin.boostInstallNonce,
				slug: 'jetpack-boost',
			} )
			.done( response => {
				if ( response.success ) {
					activateBoost( source );
				} else {
					showBoostBannerError( response.data );
				}
			} )
			.fail( response => {
				showBoostBannerError(
					sprintf(
						/* translators: %d is an HTTP error code */
						__( 'Failed to install Jetpack Boost: HTTP %d error received', 'wp-super-cache' ),
						response.status
					)
				);
			} );
	} );

	// Handle activate button click.
	jQuery( '.wpsc-activate-boost-button' ).on( 'click', event => {
		const source = jQuery( event.currentTarget ).attr( 'data-source' );
		event.preventDefault();
		activateBoost( source );
	} );

	// Helper function to show Boost Banner work in progress.
	const showBoostBannerBusy = action => {
		link.attr( 'disabled', true );
		label.text( action );
		spinner.addClass( 'is-active' ).show();
	};

	// Helper function to reset Boost Banner button.
	const resetBoostBannerButton = () => {
		link.attr( 'disabled', false );
		jQuery( '#wpsc-activate-boost-button' )
			.find( 'label' )
			.text( __( 'Activate Jetpack Boost', 'wp-super-cache' ) );
		jQuery( '#wpsc-install-boost-button' )
			.find( 'label' )
			.text( __( 'Install Jetpack Boost', 'wp-super-cache' ) );
		spinner.removeClass( 'is-active' ).hide();
	};

	// Helper function to show an error.
	const showBoostBannerError = err => {
		resetBoostBannerButton();

		jQuery( '#wpsc-boost-banner-error' )
			.text(
				err || __( 'An error occurred while trying to activate Jetpack Boost', 'wp-super-cache' )
			)
			.show();
	};

	// Activate Jetpack Boost.
	const activateBoost = source => {
		showBoostBannerBusy( __( 'Activating…', 'wp-super-cache' ) );

		jQuery
			.post( ajaxurl, {
				action: 'wpsc_activate_boost',
				_ajax_nonce: wpscAdmin.boostActivateNonce,
				source: source,
			} )
			.done( response => {
				if ( response.success ) {
					label.text( 'Success! Sending you to Jetpack Boost...' );
					spinner.hide();
					window.location.href = 'admin.php?page=jetpack-boost';
				} else {
					showBoostBannerError( response.data );
				}
			} )
			.fail( response => {
				showBoostBannerError(
					sprintf(
						/* translators: %d is an HTTP error code */
						__( 'Failed to activate Jetpack Boost: HTTP %d error received', 'wp-super-cache' ),
						response.status
					)
				);
			} );
	};
} );
