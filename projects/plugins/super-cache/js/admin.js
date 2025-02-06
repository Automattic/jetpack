/**
 * Handle the buttons for the Boost migration.
 * @param {jQuery} $ - jQuery
 */
( $ => {
	$( document ).ready( function () {
		// Don't run on versions of WordPress too old for the block editor and the translation methods it brings.
		// All the install / activate options are plain links with meaningful destinations anyway.
		if ( ! window.wp || ! window.wp.i18n ) {
			return;
		}

		const { __, sprintf } = window.wp.i18n;
		const ajaxurl = window.ajaxurl;
		const wpscAdmin = window.wpscAdmin;

		const setupBoostButton = $target => {
			if ( ! $target.hasClass( 'wpsc-boost-migration-button' ) ) {
				// eslint-disable-next-line no-console
				console.warn( 'Unexpected button clicked for Boost migration.' );
				return;
			}
			const $label = $target.find( 'label' );
			const $spinner = $target.find( '.spinner' );
			const $errorMessage = $target.prev( '.wpsc-boost-migration-error' );
			const source = $target.attr( 'data-source' );
			const originalText = $label.text();

			// Helper function to show an error.
			const showError = err => {
				reset();

				$errorMessage
					.text(
						err ||
							__( 'An error occurred while trying to activate Jetpack Boost', 'wp-super-cache' )
					)
					.show();
			};
			// Helper function to show Boost Banner work in progress.
			const showBusy = action => {
				$target.attr( 'disabled', true );
				$label.text( action );
				$spinner.addClass( 'is-active' ).show();
			};

			// Helper function to reset Boost Banner button.
			const reset = () => {
				$target.attr( 'disabled', false );
				$label.text( originalText );
				$spinner.removeClass( 'is-active' ).hide();
			};

			// Activate Jetpack Boost.
			const activateBoost = () => {
				showBusy( __( 'Activating…', 'wp-super-cache' ) );

				$.post( ajaxurl, {
					action: 'wpsc_activate_boost',
					_ajax_nonce: wpscAdmin.boostActivateNonce,
					source: source,
				} )
					.done( response => {
						if ( response.success ) {
							$label.text( 'Success! Sending you to Jetpack Boost...' );
							$spinner.hide();
							window.location.href = 'admin.php?page=jetpack-boost';
						} else {
							showError( response.data );
						}
					} )
					.fail( response => {
						showError(
							sprintf(
								/* translators: %d is an HTTP error code */
								__( 'Failed to activate Jetpack Boost: HTTP %d error received', 'wp-super-cache' ),
								response.status
							)
						);
					} );
			};

			const installBoost = () => {
				showBusy( __( 'Installing…', 'wp-super-cache' ) );
				$.post( ajaxurl, {
					action: 'wpsc_install_plugin',
					_ajax_nonce: wpscAdmin.boostInstallNonce,
					slug: 'jetpack-boost',
				} )
					.done( response => {
						if ( response.success ) {
							activateBoost();
						} else {
							showError( response.data );
						}
					} )
					.fail( response => {
						showError(
							sprintf(
								/* translators: %d is an HTTP error code */
								__( 'Failed to install Jetpack Boost: HTTP %d error received', 'wp-super-cache' ),
								response.status
							)
						);
					} );
			};

			return {
				installBoost,
				activateBoost,
			};
		};

		// One-click install for Boost.
		$( '.wpsc-install-boost-button' ).on( 'click', event => {
			event.preventDefault();
			const boostActivation = setupBoostButton( $( event.currentTarget ) );
			boostActivation.installBoost();
		} );

		// Handle activate button click.
		$( '.wpsc-activate-boost-button' ).on( 'click', event => {
			event.preventDefault();
			const boostActivation = setupBoostButton( $( event.currentTarget ) );
			boostActivation.activateBoost();
		} );

		// Dismiss Boost banner.
		$( '.wpsc-boost-dismiss' ).on( 'click', () => {
			$( '.wpsc-boost-banner' ).fadeOut( 'slow' );
			$.post( ajaxurl, {
				action: 'wpsc-hide-boost-banner',
				nonce: wpscAdmin.boostDismissNonce,
			} );
		} );

		// Dismiss admin notice
		$( '.boost-notice' ).on( 'click', '.notice-dismiss', event => {
			event.preventDefault();
			$.post( ajaxurl, {
				action: 'wpsc_dismiss_boost_notice',
				_ajax_nonce: wpscAdmin.boostNoticeDismissNonce,
			} );
		} );
	} );
} )( jQuery );
