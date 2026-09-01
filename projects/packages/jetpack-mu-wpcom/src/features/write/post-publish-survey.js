/**
 * Write — one-question post-publish survey (front-end wiring).
 *
 * Gated server-side; see post-publish-survey.php. Choosing an answer records it to
 * Tracks at once and opens an optional free-text box; the stored response is
 * written once, on send or on the way out, so an answer is never lost to a writer
 * who types nothing and closes the card.
 *
 * On a Coming Soon site the post-publish checklist owns this screen first, so the
 * survey waits for that card to go away rather than stacking on top of it.
 */
( function () {
	const config = window.wpcomWritePostPublishSurvey || {};
	const CHECKLIST_SELECTOR = '.wpcom-write-ppc';

	/**
	 * Record a Tracks event using the same global queue the Write editor uses.
	 *
	 * @param {string} event   - Event name.
	 * @param {object} [props] - Optional event properties.
	 */
	function recordEvent( event, props ) {
		const payload = Object.assign( {}, props );
		// Atomic front-end events carry no blogid column, so pass it as a property.
		if ( config.blogId ) {
			payload.blog_id = config.blogId;
		}
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', event, payload ] );
	}

	/**
	 * Run a callback once the post-publish checklist is off the screen.
	 *
	 * The checklist removes its overlay on dismiss, so watching for that removal is
	 * enough.
	 *
	 * @param {Function} callback - Invoked when the screen is free.
	 */
	function whenChecklistDismissed( callback ) {
		const checklist = document.querySelector( CHECKLIST_SELECTOR );
		if ( ! checklist || typeof MutationObserver === 'undefined' ) {
			callback();
			return;
		}

		const observer = new MutationObserver( function () {
			if ( ! document.querySelector( CHECKLIST_SELECTOR ) ) {
				observer.disconnect();
				callback();
			}
		} );
		observer.observe( document.body, { childList: true, subtree: true } );
	}

	/**
	 * Find the card, wire its controls, and reveal it at the right moment.
	 */
	function init() {
		const overlay = document.querySelector( '.wpcom-write-pps' );
		if ( ! overlay ) {
			return;
		}

		const card = overlay.querySelector( '.wpcom-write-pps__card' );
		const commentWrap = overlay.querySelector( '.wpcom-write-pps__comment' );
		const commentInput = overlay.querySelector( '.wpcom-write-pps__comment-input' );
		const thanks = overlay.querySelector( '.wpcom-write-pps__thanks' );
		const previouslyFocused = overlay.ownerDocument.activeElement;

		let selectedAnswer = '';
		let submitted = false;

		/**
		 * POST to admin-ajax. Fire-and-forget: a failed write costs one survey
		 * answer and must never block the card.
		 *
		 * @param {URLSearchParams} body           - Form body; the nonce is added here.
		 * @param {boolean}         [duringUnload] - Use keepalive, for a send on the way out.
		 * @return {Promise<Response>|null} The in-flight request, or null if it couldn't start.
		 */
		function post( body, duringUnload ) {
			body.set( 'nonce', config.nonce || '' );
			try {
				return fetch( config.ajaxUrl, {
					method: 'POST',
					credentials: 'same-origin',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: body.toString(),
					keepalive: !! duringUnload,
				} );
			} catch {
				return null;
			}
		}

		/**
		 * Close the once-per-user gate, now that the card is on screen.
		 */
		function markShown() {
			const body = new URLSearchParams();
			body.set( 'action', 'wpcom_write_survey_shown' );
			const request = post( body );
			if ( request ) {
				// Losing this costs one repeat showing, which the submit guard absorbs.
				request.catch( function () {} );
			}
		}

		/**
		 * Store the chosen answer and any free text, at most once.
		 *
		 * @param {boolean} [duringUnload] - Use keepalive, for a send on the way out.
		 */
		function submitResponse( duringUnload ) {
			if ( submitted || ! selectedAnswer ) {
				return;
			}
			submitted = true;

			const body = new URLSearchParams();
			body.set( 'action', 'wpcom_write_submit_survey' );
			body.set( 'answer', selectedAnswer );
			body.set( 'comment', commentInput ? commentInput.value : '' );
			body.set( 'response_id', config.responseId || '' );
			body.set( 'source', config.source || '' );

			const request = post( body, duringUnload );
			if ( ! request ) {
				return;
			}

			// Only the browser can see a request that never arrived; a request that
			// arrived and failed to store is recorded server-side, which does not
			// depend on this page still being open when the response lands.
			request.catch( function () {
				recordEvent( 'wpcom_write_first_publish_survey_store_failed', {
					reason: 'network',
					response_id: config.responseId || '',
				} );
			} );
		}

		/**
		 * Remove the card, tidy the URL, drop listeners, and restore focus.
		 */
		function dismiss() {
			document.removeEventListener( 'keydown', onKeydown );
			window.removeEventListener( 'pagehide', onPageHide );
			if ( overlay.parentNode ) {
				overlay.parentNode.removeChild( overlay );
			}
			if (
				previouslyFocused &&
				typeof previouslyFocused.focus === 'function' &&
				document.contains( previouslyFocused )
			) {
				previouslyFocused.focus();
			}
		}

		/**
		 * Flush any chosen answer before the card goes away.
		 */
		function submitAndDismiss() {
			submitResponse();
			dismiss();
		}

		/**
		 * Catch an answer chosen but never sent, when the writer navigates away.
		 */
		function onPageHide() {
			submitResponse( true );
		}

		/**
		 * The card's focusable controls, in DOM order.
		 *
		 * @return {HTMLElement[]} Enabled buttons and inputs within the card.
		 */
		function focusable() {
			return Array.prototype.slice
				.call( overlay.querySelectorAll( 'button:not([disabled]), textarea:not([disabled])' ) )
				.filter( function ( el ) {
					return el.offsetParent !== null;
				} );
		}

		/**
		 * Close on Escape and keep Tab focus trapped within the dialog.
		 *
		 * @param {KeyboardEvent} event - The keydown event.
		 */
		function onKeydown( event ) {
			if ( event.key === 'Escape' ) {
				recordEvent( 'wpcom_write_first_publish_survey_dismissed', {
					answered: selectedAnswer ? '1' : '0',
				} );
				submitAndDismiss();
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

		overlay.querySelectorAll( '[data-wpcom-write-pps-answer]' ).forEach( function ( button ) {
			button.addEventListener( 'click', function () {
				selectedAnswer = button.getAttribute( 'data-wpcom-write-pps-answer' ) || '';

				overlay.querySelectorAll( '[data-wpcom-write-pps-answer]' ).forEach( function ( other ) {
					other.classList.toggle( 'is-selected', other === button );
					other.setAttribute( 'aria-pressed', other === button ? 'true' : 'false' );
				} );

				// Recorded the moment it's made: this half segments against the
				// wpcom_write_editor_* funnel and can't wait on the writer typing.
				recordEvent( 'wpcom_write_first_publish_survey_response', {
					answer: selectedAnswer,
					variant: config.variant || '',
					entry_point: config.source || '',
					response_id: config.responseId || '',
				} );

				if ( commentWrap ) {
					commentWrap.removeAttribute( 'hidden' );
				}
				if ( commentInput ) {
					commentInput.focus();
				}
			} );
		} );

		const send = overlay.querySelector( '[data-wpcom-write-pps-send]' );
		if ( send ) {
			send.addEventListener( 'click', function () {
				// Send is reachable with an empty box, and an empty comment is not
				// stored — so firing this unconditionally would over-count prose.
				if ( commentInput && commentInput.value.trim() ) {
					recordEvent( 'wpcom_write_first_publish_survey_comment_sent', {
						response_id: config.responseId || '',
					} );
				}
				submitResponse();
				if ( thanks ) {
					thanks.removeAttribute( 'hidden' );
				}
				if ( commentWrap ) {
					commentWrap.setAttribute( 'hidden', '' );
				}
				window.setTimeout( dismiss, 1200 );
			} );
		}

		overlay.querySelectorAll( '[data-wpcom-write-pps-dismiss]' ).forEach( function ( el ) {
			el.addEventListener( 'click', function () {
				recordEvent( 'wpcom_write_first_publish_survey_dismissed', {
					answered: selectedAnswer ? '1' : '0',
				} );
				submitAndDismiss();
			} );
		} );

		whenChecklistDismissed( function () {
			overlay.removeAttribute( 'hidden' );
			markShown();
			recordEvent( 'wpcom_write_first_publish_survey_shown', {
				variant: config.variant || '',
				entry_point: config.source || '',
				response_id: config.responseId || '',
			} );

			// Focus the card rather than an answer button, so Enter doesn't arm a choice.
			if ( card ) {
				card.setAttribute( 'tabindex', '-1' );
				card.focus();
			}

			document.addEventListener( 'keydown', onKeydown );
			window.addEventListener( 'pagehide', onPageHide );
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
