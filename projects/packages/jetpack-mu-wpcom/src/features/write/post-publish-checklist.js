/**
 * Write — post-publish next-steps checklist (front-end wiring).
 *
 * Renders on the published post for the author right after a Write-editor publish
 * on a Coming Soon site (gated server-side; see post-publish-checklist.php). Wires
 * the overlay: launch routes to the launchpad, dismiss hides it and cleans the
 * marker from the URL so a refresh or Back doesn't bring it back. Manages focus as
 * an aria-modal dialog should — moves focus in on show, traps Tab, restores it on
 * dismiss.
 */
( function () {
	const config = window.wpcomWritePostPublishChecklist || {};

	/**
	 * Record a Tracks event using the same global queue the Write editor uses.
	 *
	 * @param {string} event - Event name.
	 */
	function recordEvent( event ) {
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', event ] );
	}

	/**
	 * Remove the post-publish marker from the current URL without reloading, so
	 * the overlay doesn't reappear on refresh or back-navigation.
	 */
	function cleanMarkerFromUrl() {
		if ( ! config.marker || ! window.history || ! window.history.replaceState ) {
			return;
		}
		try {
			const url = new URL( window.location.href );
			if ( ! url.searchParams.has( config.marker ) ) {
				return;
			}
			url.searchParams.delete( config.marker );
			window.history.replaceState( null, '', url.href );
		} catch {
			// Leave the URL as-is if it can't be parsed.
		}
	}

	/**
	 * Find the overlay, reveal it, manage focus, and wire its controls.
	 */
	function init() {
		const overlay = document.querySelector( '.wpcom-write-ppc' );
		if ( ! overlay ) {
			return;
		}

		const card = overlay.querySelector( '.wpcom-write-ppc__card' );
		const previouslyFocused = overlay.ownerDocument.activeElement;

		overlay.removeAttribute( 'hidden' );
		recordEvent( 'wpcom_write_post_publish_checklist_shown' );

		// Move focus into the dialog so keyboard/screen-reader users are taken to
		// it. Focus the card (not an action button) so Enter doesn't arm a CTA.
		if ( card ) {
			card.setAttribute( 'tabindex', '-1' );
			card.focus();
		}

		/**
		 * The dialog's focusable controls, in DOM order.
		 *
		 * @return {HTMLElement[]} Enabled buttons within the overlay.
		 */
		function focusable() {
			return Array.prototype.slice.call( overlay.querySelectorAll( 'button:not([disabled])' ) );
		}

		/**
		 * Remove the overlay, tidy the URL, drop listeners, and restore focus.
		 */
		function dismiss() {
			document.removeEventListener( 'keydown', onKeydown );
			if ( overlay.parentNode ) {
				overlay.parentNode.removeChild( overlay );
			}
			cleanMarkerFromUrl();
			if (
				previouslyFocused &&
				typeof previouslyFocused.focus === 'function' &&
				document.contains( previouslyFocused )
			) {
				previouslyFocused.focus();
			}
		}

		/**
		 * Close on Escape and keep Tab focus trapped within the dialog.
		 *
		 * @param {KeyboardEvent} event - The keydown event.
		 */
		function onKeydown( event ) {
			if ( event.key === 'Escape' ) {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
				return;
			}
			if ( event.key !== 'Tab' ) {
				return;
			}
			const items = focusable();
			if ( ! items.length ) {
				return;
			}
			const first = items[ 0 ];
			const last = items[ items.length - 1 ];
			const active = overlay.ownerDocument.activeElement;
			if ( event.shiftKey ) {
				if ( active === first || ! overlay.contains( active ) ) {
					last.focus();
					event.preventDefault();
				}
			} else if ( active === last || ! overlay.contains( active ) ) {
				first.focus();
				event.preventDefault();
			}
		}

		const strings = config.strings || {};

		/**
		 * Whether launch is blocked pending email verification.
		 *
		 * Computed server-side at render and passed in (see post-publish-checklist.php).
		 * A wpcom Simple site serves no REST API at its own hostname, so a same-origin
		 * status fetch would 404; reading the rendered value avoids that round-trip.
		 * The value is a '1'/'0' string because wp_localize_script() stringifies
		 * scalars. Anything other than '1' (absent, '0', '') means not blocked, so the
		 * user proceeds to the launch flow where the back end is the real gate.
		 *
		 * @return {boolean} Whether launch is blocked.
		 */
		function isLaunchBlocked() {
			return config.blocked === '1';
		}

		/**
		 * Navigate to the canonical launch flow.
		 */
		function goToLaunch() {
			if ( config.launchUrl ) {
				window.location.href = config.launchUrl;
			}
		}

		/**
		 * POST an email-verification action to admin-ajax.
		 *
		 * admin-ajax is the transport because a wpcom Simple site serves no REST API
		 * at its own hostname. Resolves to the parsed WP ajax envelope
		 * ({ success, data }); rejects on a network/parse failure.
		 *
		 * @param {string} action - The registered `wp_ajax_` action name.
		 * @return {Promise<Object>} The parsed JSON response.
		 */
		function postVerificationAction( action ) {
			const body = new URLSearchParams();
			body.set( 'action', action );
			body.set( 'nonce', config.nonce || '' );
			return fetch( config.ajaxUrl, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body.toString(),
			} ).then( function ( response ) {
				return response.json();
			} );
		}

		/**
		 * Swap the card's body into the inline "confirm your email" step.
		 *
		 * Replaces the checklist and launch CTA with two controls backed by admin-ajax:
		 * a "Resend verification email" button, and an "I've confirmed — launch" button
		 * that re-checks status before proceeding — so a user who has verified isn't
		 * trapped and one who hasn't can't slip past to the launch flow. The wpcom
		 * back-end gate remains the authoritative enforcement.
		 */
		function showVerifyStep() {
			const launchBtn = card.querySelector( '.wpcom-write-ppc__launch' );
			if ( ! launchBtn ) {
				return;
			}
			const title = card.querySelector( '.wpcom-write-ppc__title' );
			const desc = card.querySelector( '.wpcom-write-ppc__desc' );
			const list = card.querySelector( '.wpcom-write-ppc__list' );
			if ( title ) {
				title.textContent = strings.verifyTitle || title.textContent;
			}
			if ( desc ) {
				desc.textContent = strings.verifyDesc || desc.textContent;
			}
			if ( list ) {
				list.remove();
			}

			// Status line for resend/re-check feedback, announced to screen readers.
			const status = document.createElement( 'p' );
			status.className = 'wpcom-write-ppc__status';
			status.setAttribute( 'role', 'status' );
			status.setAttribute( 'aria-live', 'polite' );

			const confirm = document.createElement( 'button' );
			confirm.type = 'button';
			confirm.className = 'wpcom-write-ppc__launch';
			confirm.textContent = strings.confirmCta || '';

			const resend = document.createElement( 'button' );
			resend.type = 'button';
			resend.className = 'wpcom-write-ppc__resend';
			resend.textContent = strings.resendCta || '';

			/**
			 * Re-check verification and launch only once the email is confirmed.
			 */
			confirm.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_verify_recheck' );
				confirm.disabled = true;
				resend.disabled = true;
				status.textContent = strings.checking || '';
				postVerificationAction( 'wpcom_write_check_email_verification' )
					.then( function ( result ) {
						if ( result && result.success && result.data && result.data.verified ) {
							recordEvent( 'wpcom_write_post_publish_checklist_verify_confirmed' );
							goToLaunch();
							return;
						}
						recordEvent( 'wpcom_write_post_publish_checklist_verify_still_blocked' );
						status.textContent = strings.stillUnverified || '';
						confirm.disabled = false;
						resend.disabled = false;
					} )
					.catch( function () {
						status.textContent = strings.resendError || '';
						confirm.disabled = false;
						resend.disabled = false;
					} );
			} );

			/**
			 * Re-request the verification email without leaving the page.
			 */
			resend.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_resend_click' );
				resend.disabled = true;
				status.textContent = '';
				postVerificationAction( 'wpcom_write_resend_verification_email' )
					.then( function ( result ) {
						status.textContent =
							result && result.success ? strings.resendSent || '' : strings.resendError || '';
						resend.disabled = false;
					} )
					.catch( function () {
						status.textContent = strings.resendError || '';
						resend.disabled = false;
					} );
			} );

			launchBtn.parentNode.insertBefore( confirm, launchBtn );
			confirm.parentNode.insertBefore( resend, confirm.nextSibling );
			resend.parentNode.insertBefore( status, resend.nextSibling );
			launchBtn.remove();
			confirm.focus();
		}

		const launch = overlay.querySelector( '[data-wpcom-write-ppc-launch]' );
		if ( launch ) {
			launch.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_launch_click' );
				if ( ! isLaunchBlocked() ) {
					goToLaunch();
					return;
				}
				recordEvent( 'wpcom_write_post_publish_checklist_verify_shown' );
				showVerifyStep();
			} );
		}

		overlay.querySelectorAll( '[data-wpcom-write-ppc-dismiss]' ).forEach( function ( el ) {
			el.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_post_publish_checklist_dismiss' );
				dismiss();
			} );
		} );

		document.addEventListener( 'keydown', onKeydown );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
