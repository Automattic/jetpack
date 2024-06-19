/**
 * Handle the buttons for the Boost migration.
 */
jQuery( document ).ready( function () {
	// Don't run on versions of WordPress too old for the block editor and the translation methods it brings.
	// All the install / activate options are plain links with meaningful destinations anyway.
	if ( ! window.wp || ! window.wp.i18n ) {
		return;
	}

	const { __, sprintf } = window.wp.i18n;
	const ajaxurl = window.ajaxurl;
	const wpscAdmin = window.wpscAdmin;

	let link, label, spinner, errorMessage, originalText;

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
		link = jQuery( event.currentTarget );
		label = link.find( 'label' );
		originalText = label.text();
		spinner = link.find( '.spinner' );
		errorMessage = link.prev( '.wpsc-boost-migration-error' );

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
		link = jQuery( event.currentTarget );
		label = link.find( 'label' );
		originalText = label.text();
		spinner = link.find( '.spinner' );
		errorMessage = link.prev( '.wpsc-boost-migration-error' );
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
		label.text( originalText );
		spinner.removeClass( 'is-active' ).hide();
	};

	// Helper function to show an error.
	const showBoostBannerError = err => {
		resetBoostBannerButton();

		errorMessage
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

	// Dismiss admin notice
	jQuery( '.boost-notice' ).on( 'click', '.notice-dismiss', event => {
		event.preventDefault();
		jQuery.post( ajaxurl, {
			action: 'wpsc_dismiss_boost_notice',
			_ajax_nonce: wpscAdmin.boostNoticeDismissNonce,
		} );
	} );
} );
