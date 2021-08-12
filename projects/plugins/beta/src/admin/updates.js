/**
 * @param {jQuery}  $ - jQuery object.
 * @param {object}  wp - WP object.
 * @param {object}  i18n - I18n data.
 */
( function ( $, wp, i18n ) {
	const $updateNotices = $( '.jetpack-beta__update-needed' ),
		$document = $( document );

	/**
	 * Success handler for plugin updates.
	 *
	 * @param {object} response - Response object.
	 */
	function onSuccess( response ) {
		// Too bad we can't just use wp.updates.updatePluginSuccess(), but it assumes it's on one of core's pages.
		const $adminBarUpdates = $( '#wp-admin-bar-updates' );
		$adminBarUpdates.removeClass( 'spin' );

		$updateNotices.find( '[data-plugin="' + response.plugin + '"]' ).remove();
		if ( $updateNotices.find( '[data-plugin]' ).length <= 0 ) {
			$updateNotices.remove();
		}

		// Update any version strings that are flagged as being for this slug.
		$( '[data-jpbeta-version-for="' + response.slug + '"]' ).text( response.newVersion );
		// Clear the "active" indicator on all branch cards, then try to set it on a card for the new version.
		const $active = $( '.branch-card-active[data-slug="' + response.slug + '"]' );
		if ( $active.length ) {
			$active.removeClass( 'branch-card-active' );
			$(
				'.branch-card[data-slug="' +
					response.slug +
					'"][data-updater-version="' +
					response.newVersion +
					'"]'
			)
				.first()
				.addClass( 'branch-card-active' );
		}
		// Delete the "Existing Version" branch card for the slug, if any, because we just updated it to
		// some release version card.
		$( '.existing-branch-for-' + response.slug ).remove();

		wp.a11y.speak( wp.i18n.__( 'Update completed successfully.' ) );
		wp.updates.decrementCount( 'plugin' );
		$document.trigger( 'wp-plugin-update-success', response );
	}

	/**
	 * Error handler for plugin updates.
	 *
	 * @param {object} response - Response object.
	 */
	function onError( response ) {
		// Too bad we can't just use wp.updates.updatePluginError(), but it assumes it's on one of core's pages.
		const $adminBarUpdates = $( '#wp-admin-bar-updates' );

		if ( ! wp.updates.isValidResponse( response, 'update' ) ) {
			return;
		}

		if ( wp.updates.maybeHandleCredentialError( response, 'update-plugin' ) ) {
			return;
		}

		let $notice;
		if ( response.plugin ) {
			$notice = $updateNotices.find( '[data-plugin="' + response.plugin + '"]' );
		} else {
			$notice = $updateNotices.find( '[data-slug="' + response.slug + '"]' );
		}
		const $button = $notice.find( '.update-branch' );

		const errorMessage = wp.i18n.sprintf( i18n.failedmsg, response.errorMessage );

		$notice.addClass( 'is-error' );
		$button.removeClass( 'is-disabled' ).addClass( 'is-error' );
		$button.prop( 'disabled', false );
		$button.text( i18n.failed );
		$notice.find( '.error-message' ).remove();
		$notice
			.find( '.dops-foldable-card__main' )
			.first()
			.append( $( '<div class="error-message">' ).html( errorMessage ) );

		$adminBarUpdates.removeClass( 'spin' );

		wp.a11y.speak( errorMessage, 'assertive' );

		$document.trigger( 'wp-plugin-update-error', response );
	}

	/**
	 * Click handler for plugin updates in Jetpack Beta update notices.
	 *
	 * @param {Event} event - Event interface.
	 */
	$updateNotices.on( 'click', '[data-plugin] .update-branch', function ( event ) {
		const $button = $( event.target ),
			$notice = $button.parents( '.dops-card' ),
			$adminBarUpdates = $( '#wp-admin-bar-updates' );

		event.preventDefault();

		if ( $button.hasClass( 'is-disabled' ) ) {
			return;
		}

		$notice.removeClass( 'is-error' );
		$notice.find( '.error-message' ).remove();
		$button.removeClass( 'is-error' ).addClass( 'is-disabled' );
		$button.prop( 'disabled', true );
		$button.text( i18n.updating );

		wp.updates.maybeRequestFilesystemCredentials( event );

		// Too bad we can't just call wp.updates.updatePlugin(), but it assumes it's on one of core's pages.
		$adminBarUpdates.addClass( 'spin' );

		const args = {
			plugin: $notice.data( 'plugin' ),
			slug: $notice.data( 'slug' ),
			success: onSuccess,
			error: onError,
		};

		$document.trigger( 'wp-plugin-updating', args );
		wp.updates.ajax( 'update-plugin', args );
	} );
} )( jQuery, window.wp, window.JetpackBeta );
