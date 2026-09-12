/**
 * WordPress.com Action Bar front-end behavior.
 *
 * Reads its config from `window.actionbardata`, localized by wpcom-actionbar.php.
 */
( function () {
	const wpcom = window.wpcom || {};
	wpcom.actionbar = {};
	wpcom.actionbar.data = window.actionbardata;

	const fbd = wpcom.actionbar.data;

	/**
	 * Post an action to the admin AJAX endpoint, with the bar's nonce attached.
	 *
	 * @param {object}   params   - Request body; must include `action`.
	 * @param {Function} callback - Called with the fetch Response.
	 */
	function postAction( params = {}, callback = () => {} ) {
		if ( ! params.action ) {
			return;
		}

		fetch( fbd.xhrURL, {
			method: 'POST',
			body: new URLSearchParams( { _wpnonce: fbd.nonce, ...params } ),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'X-Requested-With': 'XMLHttpRequest',
			},
		} ).then( callback );
	}

	let wpcomProxyPromise;

	/**
	 * Load the WordPress.com proxy request script once and resolve with its global.
	 *
	 * @return {Promise<Function>} Resolves with `window.WPCOM_Proxy_Request`.
	 */
	function wpcomProxyLoader() {
		if ( ! wpcomProxyPromise ) {
			wpcomProxyPromise = new Promise( ( resolve, reject ) => {
				if ( window.WPCOM_Proxy_Request ) {
					resolve( window.WPCOM_Proxy_Request );
				} else {
					const proxyScript = document.createElement( 'script' );
					proxyScript.src = fbd.proxyScriptUrl;
					proxyScript.async = true;
					document.body.appendChild( proxyScript );
					proxyScript.addEventListener( 'load', () => resolve( window.WPCOM_Proxy_Request ) );
					proxyScript.addEventListener( 'error', error => reject( error ) );
				}
			} );
		}
		return wpcomProxyPromise;
	}

	/**
	 * POST to the WordPress.com REST API through the proxy.
	 *
	 * @param {string} path      - API path.
	 * @param {string} namespace - API namespace, e.g. `wpcom/v2`.
	 * @param {object} body      - Request body.
	 */
	function postToApi( path, namespace, body = {} ) {
		const request = {
			path,
			body,
			method: 'POST',
			apiNamespace: namespace,
		};
		wpcomProxyLoader().then( proxy => proxy( request ) );
	}

	/**
	 * Bump an MC stat by name.
	 *
	 * @param {string}   stat     - Stat name; must be in the PHP whitelist.
	 * @param {Function} callback - Called once the request completes.
	 */
	function bumpStat( stat, callback ) {
		postAction(
			{
				action: 'actionbar_stats',
				stat,
			},
			callback
		);
	}

	/**
	 * Subscribe to or unsubscribe from the site.
	 *
	 * @param {string} action - `ab_subscribe_to_blog` or `ab_unsubscribe_from_blog`.
	 */
	function followRequest( action ) {
		postAction( {
			action,
			source: 'actionbar',
			blog_id: fbd.siteID,
		} );
	}

	let lastScrollTop = window.scrollY || window.pageYOffset || 0;

	// Don't show actionbar when iframed
	if ( window !== window.top ) {
		return;
	}

	// Display server-side-generated actionbar.
	const actionbar = document.querySelector( '#actionbar' );

	if ( ! actionbar ) {
		// End script execution if the action bar wasn't generated on the server side.
		return;
	}

	actionbar.removeAttribute( 'style' );

	const liveRegion = actionbar.querySelector( '.actnbr-live' );

	/**
	 * Announce a message to screen readers.
	 *
	 * @param {string} text - Plain text to announce.
	 */
	function announce( text ) {
		if ( liveRegion ) {
			liveRegion.textContent = '';
			liveRegion.textContent = text;
		}
	}

	// Links that act as buttons should also respond to Space.
	actionbar.addEventListener( 'keydown', e => {
		if ( e.key === ' ' && e.target.matches( 'a[role="button"], a[role="radio"]' ) ) {
			e.preventDefault();
			e.target.click();
		} else if ( e.key === 'Enter' && e.target.matches( 'a[role="radio"]' ) ) {
			e.preventDefault();
			e.target.click();
		}
	} );

	// A bar that slid away on scroll comes back when keyboard focus lands in it.
	actionbar.addEventListener( 'focusin', () => {
		actionbar.classList.remove( 'actnbr-hidden' );
	} );

	// *** Actions *****************

	// Follow Site
	const follow = actionbar.querySelector( '.actnbr-actn-follow' );
	// The bar item that owns the Subscribe button and its popover.
	const followItem = follow ? follow.closest( '.actnbr-btn' ) : null;
	const followBubble = actionbar.querySelector( '#follow-bubble' );
	const reblog = actionbar.querySelector( '.actnbr-actn-reblog' );

	/**
	 * Reveal the Subscribe popover, closing the ⋯ menu if it is open.
	 */
	function openFollowBubble() {
		if ( ! followItem ) {
			return;
		}
		closeMenu( false );
		followItem.classList.remove( 'actnbr-hidden' );
		follow.setAttribute( 'aria-expanded', 'true' );
	}

	/**
	 * Hide the Subscribe popover.
	 *
	 * @param {boolean} returnFocus - Put focus back on the Subscribe button.
	 */
	function closeFollowBubble( returnFocus ) {
		if ( ! followItem ) {
			return;
		}
		followItem.classList.add( 'actnbr-hidden' );
		follow.setAttribute( 'aria-expanded', 'false' );
		if ( returnFocus ) {
			follow.focus();
		}
	}

	if ( followBubble ) {
		followBubble.addEventListener( 'keydown', e => {
			if ( e.key === 'Escape' ) {
				e.preventDefault();
				closeFollowBubble( true );
			}
		} );
	}

	// Comment
	const commentButton = actionbar.querySelector( '.actnbr-actn-comment' );
	const commentForm = document.querySelector( '#commentform' );

	// Privacy settings
	const privacyButton = actionbar.querySelector( '.actnbr-actn-privacy' );

	// Handle notification toggles on follow popover
	const notifyPostsToggle = actionbar.querySelector( '#toggle-input-notify-posts' );
	const emailPostsToggle = actionbar.querySelector( '#toggle-input-email-posts' );
	const emailCommentsToggle = actionbar.querySelector( '#toggle-input-email-comments' );

	const frequencyOptions = actionbar.querySelectorAll( '.segmented-control__link' );

	if ( reblog ) {
		reblog.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();

			// bump reblog_source stat
			const stat = 'reblog_source';
			const statValue = 'actionbar';
			new Image().src = `${
				document.location.protocol
			}//pixel.wp.com/g.gif?v=wpcom-no-pv&x_${ stat }=${ statValue }&baba=${ Math.random() }`;

			recordTracksEvent( 'wpcom_actionbar_post_reblogged', {
				url: fbd.siteURL,
				blog_id: fbd.siteID,
				post_id: fbd.postID,
			} );
			const objId = fbd.siteID + '-' + fbd.postID;

			const wpcomReblog = window.wpcom_reblog;
			if ( wpcomReblog && typeof wpcomReblog.toggle_reblog_box_flair === 'function' ) {
				wpcomReblog.toggle_reblog_box_flair( objId, fbd.postID );
			}
		} );
	}

	if ( commentButton ) {
		if ( ! commentForm ) {
			commentButton.parentNode.classList.add( 'no-display' );
		}
		commentButton.addEventListener( 'click', () => {
			bumpStat( 'comment_clicked' );
			recordTracksEvent( 'wpcom_actionbar_comment_click', {
				url: fbd.siteURL,
				blog_id: fbd.siteID,
				post_id: fbd.postID,
			} );
		} );
	}
	if ( notifyPostsToggle ) {
		notifyPostsToggle.addEventListener( 'click', e => {
			const isEnabling = e.target.checked;
			const restPath = `/read/sites/${ fbd.siteID }/notification-subscriptions/${
				isEnabling ? 'new' : 'delete'
			}`;
			postToApi( restPath, 'wpcom/v2' );

			recordTracksEvent( 'wpcom_actionbar_site_notifications', {
				enabling: isEnabling,
				follow_source: 'actionbar',
				url: fbd.siteURL,
			} );
		} );
	}
	if ( emailPostsToggle ) {
		emailPostsToggle.addEventListener( 'click', e => {
			const isEnabling = e.target.checked;
			const restPath = `/read/site/${ fbd.siteID }/post_email_subscriptions/${
				isEnabling ? 'new' : 'delete'
			}`;
			const body = {};
			if ( isEnabling ) {
				body.delivery_frequency = fbd.subsEmailDefault;
				const defaultOption = actionbar.querySelector( `.frequency-${ fbd.subsEmailDefault }` );
				defaultOption && selectFrequencyOption( defaultOption );
			}
			actionbar
				.querySelector( '#email-new-posts-details' )
				.classList.toggle( 'is-visible', isEnabling );
			postToApi( restPath, 'rest/v1.2', body );
		} );
	}
	if ( emailCommentsToggle ) {
		emailCommentsToggle.addEventListener( 'click', e => {
			const isEnabling = e.target.checked;
			const restPath = `/read/site/${ fbd.siteID }/comment_email_subscriptions/${
				isEnabling ? 'new' : 'delete'
			}`;
			postToApi( restPath, 'rest/v1.2' );
		} );
	}
	if ( privacyButton ) {
		// The consent UI only exists when the CMP script defined window.__tcfapi.
		if ( window.__tcfapi ) {
			privacyButton.parentNode.classList.remove( 'no-display' );
		}
		privacyButton.addEventListener( 'click', e => {
			e.preventDefault();
			bumpStat( 'privacy_clicked' );
			recordTracksEvent( 'wpcom_actionbar_privacy_click', {
				url: fbd.siteURL,
				blog_id: fbd.siteID,
				post_id: fbd.postID,
			} );
		} );
	}

	// Handle notification frequency selector clicks
	/**
	 * Mark one frequency option as the selected radio.
	 *
	 * @param {Element} option - The option's link.
	 */
	function selectFrequencyOption( option ) {
		frequencyOptions.forEach( opt => opt.setAttribute( 'aria-checked', 'false' ) );
		option.setAttribute( 'aria-checked', 'true' );
	}

	frequencyOptions.forEach( ( opt, i ) => {
		opt.addEventListener( 'click', () => {
			selectFrequencyOption( opt );
			const restPath = `/read/site/${ fbd.siteID }/post_email_subscriptions/update`;
			postToApi( restPath, 'rest/v1.2', { delivery_frequency: opt.dataset.frequency } );
		} );

		// Arrow keys move between the radios, as in a native group.
		opt.addEventListener( 'keydown', e => {
			const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ e.key ];
			if ( delta ) {
				e.preventDefault();
				const next =
					frequencyOptions[ ( i + delta + frequencyOptions.length ) % frequencyOptions.length ];
				next.focus();
				next.click();
			}
		} );
	} );

	if ( follow ) {
		follow.addEventListener( 'click', e => {
			e.preventDefault();

			openFollowBubble();

			if ( fbd.isLoggedIn ) {
				showActionBarStatusMessage( fbd.i18n.followedText );
				bumpStat( 'followed' );
				recordTracksEvent( 'wpcom_actionbar_site_followed', {
					follow_source: 'actionbar',
					url: fbd.siteURL,
				} );

				followRequest( 'ab_subscribe_to_blog' );
				const defaultEmailFrequency = fbd.subsEmailDefault;
				if ( defaultEmailFrequency !== 'never' ) {
					emailPostsToggle.click();
				}

				notifyPostsToggle.click();

				// Keyboard users land on the first setting.
				if ( e.detail === 0 ) {
					notifyPostsToggle.focus();
				}
			} else {
				showActionBarFollowForm();
			}
		} );
	}

	// Unfollow site
	const unfollow = actionbar.querySelector( '.actnbr-actn-following' );
	if ( unfollow ) {
		unfollow.addEventListener( 'click', e => {
			e.preventDefault();
			unfollow.classList.add( 'no-display' );
			follow.classList.remove( 'no-display' );

			bumpStat( 'unfollowed' );
			recordTracksEvent( 'wpcom_actionbar_site_unfollowed', {
				follow_source: 'actionbar',
				url: fbd.siteURL,
			} );

			followRequest( 'ab_unsubscribe_from_blog' );

			closeFollowBubble( false );
			actionbar.querySelectorAll( '.actnbr-site-settings__toggle__input' ).forEach( input => {
				input.checked = false;
			} );
		} );
	}

	// Copy shortlink
	const shortlink = actionbar.querySelector( 'a.actnbr-shortlink' );
	const shortlinkText = shortlink && shortlink.querySelector( '.actnbr-shortlink__text' );

	/**
	 * Show the "copied" state on the shortlink item for six seconds.
	 *
	 * @param {string} originalText - Label to restore afterwards.
	 */
	function shortLinkUpdateText( originalText ) {
		shortlinkText.textContent = fbd.i18n.shortLinkCopied;
		announce( fbd.i18n.shortLinkCopied );
		shortlink.classList.add( 'actnbr-shortlink__copied' );
		setTimeout( () => {
			shortlinkText.textContent = originalText;
			shortlink.classList.remove( 'actnbr-shortlink__copied' );
		}, 6000 );
	}

	/**
	 * Copy the shortlink to the clipboard, falling back to a prompt.
	 */
	function shortLinkCopyTextToClipboard() {
		const originalText = shortlinkText.textContent;
		if ( originalText === fbd.i18n.shortLinkCopied ) {
			return;
		}
		if ( navigator.clipboard ) {
			navigator.clipboard
				.writeText( fbd.shortlink )
				.then( () => shortLinkUpdateText( originalText ) )
				.catch( () => {
					// eslint-disable-next-line no-alert
					window.prompt( 'Shortlink: ', fbd.shortlink );
				} );
		} else {
			// Fallback for older browsers
			const textArea = document.createElement( 'textarea' );
			textArea.value = fbd.shortlink;
			shortlink.appendChild( textArea );
			textArea.focus();
			textArea.select();
			try {
				document.execCommand( 'copy' );
				shortLinkUpdateText( originalText );
			} catch {
				// eslint-disable-next-line no-alert
				window.prompt( 'Shortlink: ', fbd.shortlink );
			}
			shortlink.removeChild( textArea );
		}
		bumpStat( 'copied_shortlink' );
	}

	if ( shortlink ) {
		shortlink.addEventListener( 'click', e => {
			e.preventDefault();
			shortLinkCopyTextToClipboard();
		} );
	}

	// More menu: a button toggles it, arrow keys move through it, Escape closes it.
	const ellipsis = actionbar.querySelector( '.actnbr-ellipsis' );
	const menuToggle = ellipsis.querySelector( '.actnbr-more-toggle' );
	const menu = ellipsis.querySelector( '.actnbr-menu' );

	/**
	 * The menu's visible items, in DOM order.
	 *
	 * @return {Element[]} Elements with role=menuitem.
	 */
	function menuItems() {
		return Array.from( menu.querySelectorAll( '[role="menuitem"]' ) ).filter(
			item => item.offsetParent !== null
		);
	}

	/**
	 * Open the menu.
	 *
	 * @param {boolean} focusFirst - Move focus to the first item, for keyboard users.
	 */
	function openMenu( focusFirst ) {
		closeFollowBubble( false );
		ellipsis.classList.remove( 'actnbr-hidden' );
		menuToggle.setAttribute( 'aria-expanded', 'true' );
		bumpStat( 'show_more_menu' );
		if ( focusFirst ) {
			const items = menuItems();
			items.length && items[ 0 ].focus();
		}
	}

	/**
	 * Close the menu.
	 *
	 * @param {boolean} returnFocus - Put focus back on the toggle button.
	 */
	function closeMenu( returnFocus ) {
		ellipsis.classList.add( 'actnbr-hidden' );
		menuToggle.setAttribute( 'aria-expanded', 'false' );
		if ( returnFocus ) {
			menuToggle.focus();
		}
	}

	menuToggle.addEventListener( 'click', e => {
		if ( ellipsis.classList.contains( 'actnbr-hidden' ) ) {
			// detail is 0 when the button was activated from the keyboard.
			openMenu( e.detail === 0 );
		} else {
			closeMenu( false );
		}
	} );

	menuToggle.addEventListener( 'keydown', e => {
		if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
			e.preventDefault();
			openMenu( true );
		}
	} );

	menu.addEventListener( 'keydown', e => {
		const items = menuItems();
		const index = items.indexOf( menu.ownerDocument.activeElement );
		switch ( e.key ) {
			case 'ArrowDown':
				e.preventDefault();
				items[ ( index + 1 ) % items.length ].focus();
				break;
			case 'ArrowUp':
				e.preventDefault();
				items[ ( index - 1 + items.length ) % items.length ].focus();
				break;
			case 'Home':
				e.preventDefault();
				items[ 0 ].focus();
				break;
			case 'End':
				e.preventDefault();
				items[ items.length - 1 ].focus();
				break;
			case 'Escape':
				e.preventDefault();
				closeMenu( true );
				break;
			case 'Tab':
				closeMenu( false );
				break;
			default:
		}
	} );

	// A click anywhere outside the two popovers (and their buttons) closes both.
	document.addEventListener( 'click', e => {
		if ( ellipsis.contains( e.target ) || ( followItem && followItem.contains( e.target ) ) ) {
			return;
		}
		closeMenu( false );
		closeFollowBubble( false );
	} );

	// Fold/Unfold
	const fold = actionbar.querySelector( '.actnbr-fold' );
	if ( fold ) {
		// Nothing to fold when the bar has no visible buttons.
		if ( ! actionbar.querySelector( 'li.actnbr-btn:not(.no-display)' ) ) {
			fold.classList.add( 'no-display' );
		}
		fold.addEventListener( 'click', e => {
			e.preventDefault();
			const link = fold.querySelector( '.actnbr-menu__label' );

			if ( actionbar.classList.contains( 'actnbr-folded' ) ) {
				link.textContent = fbd.i18n.foldBar;
				actionbar.classList.remove( 'actnbr-folded' );
				postAction( { action: 'unfold_actionbar' } );
			} else {
				link.textContent = fbd.i18n.unfoldBar;
				actionbar.classList.add( 'actnbr-folded' );
				postAction( { action: 'fold_actionbar' } );
			}
			closeMenu( true );
		} );
	}

	/**
	 * Bump a stat when the element matching a selector is clicked.
	 *
	 * @param {string}   selector         - Selector inside the bar.
	 * @param {string}   stat             - Stat name.
	 * @param {Function} additionalEffect - Optional callback after the stat is bumped.
	 */
	function statsOnClick( selector, stat, additionalEffect ) {
		actionbar.querySelectorAll( selector ).forEach( el => {
			el.addEventListener( 'click', createStatsBumperEventHandler( stat, additionalEffect ) );
		} );
	}

	// Record stats for clicks
	statsOnClick( 'a.actnbr-sitename', 'clicked_site_title' );
	statsOnClick( 'a.actnbr-theme', 'explored_theme' );
	statsOnClick( '.actnbr-edit a', 'edited' );
	statsOnClick( '.actnbr-stats a', 'clicked_stats' );
	statsOnClick( 'a.flb-report', 'reported_content' );
	statsOnClick( 'a.actnbr-follows', 'managed_following' );
	statsOnClick( '.actnbr-login-nudge a', 'clicked_login_nudge' );
	statsOnClick( 'a.actnbr-signup', 'clicked_signup_link' );
	statsOnClick( 'a.actnbr-login', 'clicked_login_link' );
	statsOnClick( 'a.actnbr-subs', 'clicked_manage_subs_link' );
	statsOnClick( 'a.actnbr-reader', 'view_reader' );

	// Record stats on submit
	const bubbleForm = actionbar.querySelector( '.actnbr-follow-bubble form' );
	if ( bubbleForm ) {
		bubbleForm.addEventListener(
			'submit',
			createStatsBumperEventHandler( 'submit_follow_form', () => {
				const button = bubbleForm.querySelector( 'button' );
				if ( button ) {
					button.setAttribute( 'disabled', true );
				}
			} )
		);
	}

	/**
	 * Whether the menu or the Subscribe popover is showing.
	 *
	 * @return {boolean} True while either is open.
	 */
	function isPopoverOpen() {
		return (
			! ellipsis.classList.contains( 'actnbr-hidden' ) ||
			( !! followItem && ! followItem.classList.contains( 'actnbr-hidden' ) )
		);
	}

	/**
	 * Slide the bar off-screen while scrolling down and back on scrolling up, unless a popover is open.
	 */
	function handleScroll() {
		const scrollTop = window.scrollY || window.pageYOffset || 0;
		const isHidden = actionbar.classList.contains( 'actnbr-hidden' );

		// Scrolling Up.
		if ( scrollTop < lastScrollTop ) {
			actionbar.classList.remove( 'actnbr-hidden' );
			// Scrolling Down.
		} else if ( ! isHidden && ! isPopoverOpen() ) {
			actionbar.classList.add( 'actnbr-hidden' );
		}

		lastScrollTop = scrollTop;
	}

	document.addEventListener( 'scroll', handleScroll, { passive: true } );

	/**
	 * Queue a Tracks event.
	 *
	 * @param {string} eventName  - Event name.
	 * @param {object} eventProps - Event properties.
	 */
	function recordTracksEvent( eventName, eventProps ) {
		eventProps = eventProps || {};
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', eventName, eventProps ] );
	}

	/**
	 * Build a click handler that bumps a stat first and only then re-dispatches the event, so the stat
	 * request is not cancelled by the navigation.
	 *
	 * @param {string}   stat             - The name of the stat to bump.
	 * @param {Function} additionalEffect - Called after the stat is bumped and the event re-dispatched.
	 * @return {Function} The event handler.
	 */
	function createStatsBumperEventHandler( stat, additionalEffect ) {
		const completedEvents = {};

		return function eventHandler( event ) {
			if ( completedEvents[ event.timeStamp ] ) {
				delete completedEvents[ event.timeStamp ];

				// hack-around to submit forms, dispatching "submit" event is not enough for them
				if ( event.type === 'submit' ) {
					event.target.submit();
				}

				if ( typeof additionalEffect === 'function' ) {
					return additionalEffect( event );
				}

				return true;
			}

			event.preventDefault();
			event.stopPropagation();

			/**
			 * Re-dispatch the intercepted event now that the stat has been sent.
			 */
			function dispatchOriginalEvent() {
				const EventClass = event.constructor;
				const newEvent = new EventClass( event.type, event );
				completedEvents[ newEvent.timeStamp ] = true;
				event.target.dispatchEvent( newEvent );
			}

			bumpStat( stat, dispatchOriginalEvent );
		};
	}

	/**
	 * Open the logged-out email subscribe form and focus its field.
	 */
	function showActionBarFollowForm() {
		actionbar.querySelector( '.actnbr-follow-bubble form' ).classList.remove( 'no-display' );
		actionbar.querySelector( '.actnbr-email-field' ).focus();
	}

	/**
	 * Flip the button to Subscribed and open the follow popover with a message.
	 *
	 * @param {string} message - HTML to show inside the popover.
	 */
	function showActionBarStatusMessage( message ) {
		const followLink = actionbar.querySelector( '.actnbr-actn-follow' );
		const unfollowLink = actionbar.querySelector( '.actnbr-actn-following' );

		followLink && followLink.classList.add( 'no-display' );
		unfollowLink && unfollowLink.classList.remove( 'no-display' );

		const msgEl = actionbar.querySelector( '.actnbr-follow-bubble .actnbr-message' );

		if ( msgEl ) {
			msgEl.classList.remove( 'no-display' );
			msgEl.innerHTML = message;
		}

		openFollowBubble();
	}

	// Message from the subscribe.wordpress.com redirect, once every handler above exists.
	if ( fbd.statusMessage ) {
		showActionBarStatusMessage( fbd.statusMessage );
	}
} )();
