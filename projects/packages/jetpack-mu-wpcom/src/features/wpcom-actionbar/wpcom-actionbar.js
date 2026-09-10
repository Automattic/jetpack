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
			_wpnonce: fbd.nonce,
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

	// Show status message if available
	if ( fbd.statusMessage ) {
		showActionBarStatusMessage( fbd.statusMessage );
	}

	// *** Actions *****************

	let isFollowBubbleOpen = false;

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
		follow && follow.setAttribute( 'aria-expanded', 'true' );
		isFollowBubbleOpen = true;
	}

	/**
	 * Hide the Subscribe popover.
	 *
	 * @param {boolean} returnFocus - Put focus back on the Subscribe button.
	 */
	function closeFollowBubble( returnFocus ) {
		if ( followItem ) {
			followItem.classList.add( 'actnbr-hidden' );
		}
		follow && follow.setAttribute( 'aria-expanded', 'false' );
		isFollowBubbleOpen = false;
		if ( returnFocus && follow ) {
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
	const instantlyOption = actionbar.querySelector( '.frequency-instantly' );
	const dailyOption = actionbar.querySelector( '.frequency-daily' );
	const weeklyOption = actionbar.querySelector( '.frequency-weekly' );

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
			e.preventDefault();
			const isEnabling = e.target.parentElement.classList.toggle( 'is-checked' );
			e.target.setAttribute( 'aria-checked', isEnabling ? 'true' : 'false' );
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
			e.preventDefault();
			const isEnabling = e.target.parentElement.classList.toggle( 'is-checked' );
			e.target.setAttribute( 'aria-checked', isEnabling ? 'true' : 'false' );
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
			e.preventDefault();
			const isEnabling = e.target.parentElement.classList.toggle( 'is-checked' );
			e.target.setAttribute( 'aria-checked', isEnabling ? 'true' : 'false' );
			const restPath = `/read/site/${ fbd.siteID }/comment_email_subscriptions/${
				isEnabling ? 'new' : 'delete'
			}`;
			postToApi( restPath, 'rest/v1.2' );
		} );
	}
	if ( privacyButton ) {
		/*
		 * The PHP code will add the class 'actnbr-has-actions' to the actionbar if there are visible actions.
		 * This does NOT include the privacy button. The privacy button is displayed when it satisfies both of
		 * the following conditions:
		 *
		 * 1. the checks in PHP plugin code AND
		 * 2. window.__tcfapi exists in the window object.
		 *
		 * If the JS thinks it should render the privacy button and there are no other actions
		 * then it needs to add the class 'actnbr-has-actions' to the actionbar.
		 * This is to style the ellipsis button and hide the expand/collapse button
		 * (which shouldn't display if there are no visible actions).
		 */
		if ( ! actionbar.classList.contains( 'actnbr-has-actions' ) && ! window.__tcfapi ) {
			actionbar.classList.remove( 'actnbr-has-actions' );
		}
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
		frequencyOptions.forEach( opt => {
			opt.parentElement.classList.remove( 'is-selected' );
			opt.setAttribute( 'aria-checked', 'false' );
		} );
		option.parentElement.classList.add( 'is-selected' );
		option.setAttribute( 'aria-checked', 'true' );
	}

	const onFrequencyOptionClick = ( e, frequencyKey ) => {
		selectFrequencyOption( e.target );
		const restPath = `/read/site/${ fbd.siteID }/post_email_subscriptions/update`;
		postToApi( restPath, 'rest/v1.2', { delivery_frequency: frequencyKey } );
	};

	if ( frequencyOptions.length > 0 ) {
		// Check to make sure elements exist
		instantlyOption.addEventListener( 'click', e => onFrequencyOptionClick( e, 'instantly' ) );
		dailyOption.addEventListener( 'click', e => onFrequencyOptionClick( e, 'daily' ) );
		weeklyOption.addEventListener( 'click', e => onFrequencyOptionClick( e, 'weekly' ) );

		// Arrow keys move between the radios, as in a native group.
		frequencyOptions.forEach( ( opt, i ) => {
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
	}

	if ( follow ) {
		follow.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();

			openFollowBubble();

			if ( fbd.isLoggedIn ) {
				showActionBarStatusMessage( `<div class="actnbr-reader">${ fbd.i18n.followedText }</div>` );
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

				notifyPostsToggle && notifyPostsToggle.click();

				// Keyboard users land on the first setting.
				if ( e.detail === 0 && notifyPostsToggle ) {
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
			const followNotificationCheckedToggles = actionbar.querySelectorAll(
				'.actnbr-site-settings__toggle.is-checked'
			);
			followNotificationCheckedToggles.forEach( t => {
				t.classList.remove( 'is-checked' );
				const input = t.querySelector( 'input' );
				input && input.setAttribute( 'aria-checked', 'false' );
			} );
		} );
	}

	// Dismiss follow bubble when clicking on document
	document.addEventListener( 'click', e => {
		const isClickInPopup = !! e.target.closest( '#follow-bubble' );

		if ( isClickInPopup ) {
			return;
		}
		if ( isFollowBubbleOpen ) {
			closeFollowBubble( false );
		}
	} );

	// Show shortlink prompt
	const shortlink = actionbar.querySelector( 'a.actnbr-shortlink' );
	/**
	 * Show the "copied" state on the shortlink item for six seconds.
	 *
	 * @param {Element} link                 - The shortlink anchor.
	 * @param {Element} shortlinkTextElement - Its label element.
	 * @param {string}  originalText         - Label to restore afterwards.
	 */
	function shortLinkUpdateText( link, shortlinkTextElement, originalText ) {
		shortlinkTextElement.textContent = fbd.i18n.shortLinkCopied;
		announce( fbd.i18n.shortLinkCopied );
		link.classList.add( 'actnbr-shortlink__copied' );
		setTimeout( () => {
			shortlinkTextElement.textContent = originalText;
			link.classList.remove( 'actnbr-shortlink__copied' );
		}, 6000 );
	}
	/**
	 * Copy the shortlink to the clipboard, falling back to a prompt.
	 *
	 * @param {Element} link                 - The shortlink anchor.
	 * @param {Element} shortlinkTextElement - Its label element.
	 * @param {string}  shortlinkText        - The URL to copy.
	 * @param {string}  originalText         - Label to restore afterwards.
	 */
	function shortLinkCopyTextToClipboard( link, shortlinkTextElement, shortlinkText, originalText ) {
		if (
			! link ||
			! shortlinkTextElement ||
			shortlinkTextElement.textContent === fbd.i18n.shortLinkCopied
		) {
			return;
		}
		if ( navigator.clipboard ) {
			// Use the Clipboard API if available
			navigator.clipboard
				.writeText( shortlinkText )
				.then( () => {
					shortLinkUpdateText( link, shortlinkTextElement, originalText );
				} )
				.catch( () => {
					// eslint-disable-next-line no-alert
					window.prompt( 'Shortlink: ', shortlinkText );
				} );
		} else {
			// Fallback for older browsers
			const textArea = document.createElement( 'textarea' );
			textArea.value = shortlinkText;
			link.appendChild( textArea );
			textArea.focus();
			textArea.select();
			try {
				document.execCommand( 'copy' );
				shortLinkUpdateText( link, shortlinkTextElement, originalText );
			} catch {
				// eslint-disable-next-line no-alert
				window.prompt( 'Shortlink: ', shortlinkText );
			}
			link.removeChild( textArea );
		}
		// Record stats on shortlink dialog.
		bumpStat( 'copied_shortlink' );
	}

	if ( shortlink ) {
		const shortlinkTextElement = actionbar.querySelector( '.actnbr-shortlink__text' );
		shortlink.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopPropagation();
			const shortlinkText = fbd.shortlink;
			const originalText = shortlinkTextElement.textContent;
			shortLinkCopyTextToClipboard( shortlink, shortlinkTextElement, shortlinkText, originalText );
		} );
	}

	// More menu: a button toggles it, arrow keys move through it, Escape closes it.
	const ellipsis = actionbar.querySelector( '.actnbr-ellipsis' );
	const menuToggle = ellipsis && ellipsis.querySelector( '.actnbr-more-toggle' );
	const menu = ellipsis && ellipsis.querySelector( '.actnbr-menu' );
	let isMenuOpen = false;

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
		// Let the opening click finish bubbling before the document listener may close it.
		setTimeout( () => {
			isMenuOpen = true;
		}, 10 );
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
		if ( ! ellipsis || ! menuToggle ) {
			return;
		}
		ellipsis.classList.add( 'actnbr-hidden' );
		menuToggle.setAttribute( 'aria-expanded', 'false' );
		isMenuOpen = false;
		if ( returnFocus ) {
			menuToggle.focus();
		}
	}

	if ( menuToggle && menu ) {
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

		// Dismiss menu when clicking on document
		document.addEventListener( 'click', () => {
			if ( isMenuOpen ) {
				closeMenu( false );
			}
		} );
	}

	// Fold/Unfold
	const fold = actionbar.querySelector( '.actnbr-fold' );
	if ( fold ) {
		// Hide fold button if actions or privacy button are not present.
		if ( ! actionbar.classList.contains( 'actnbr-has-actions' ) && ! window.__tcfapi ) {
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

	// Show/Hide actionbar on scroll.
	/**
	 * Slide the bar off-screen while scrolling down and back on scrolling up.
	 */
	function handleScroll() {
		const scrollTop = window.scrollY || window.pageYOffset || 0;
		const isHidden = actionbar.classList.contains( 'actnbr-hidden' );

		// Scrolling Up.
		if ( scrollTop < lastScrollTop ) {
			actionbar.classList.remove( 'actnbr-hidden' );
			// Scrolling Down.
		} else if (
			! isHidden &&
			document.querySelectorAll( '#actionbar > ul > li:not(.actnbr-hidden) > .actnbr-popover' )
				.length === 0
		) {
			// Only hide the bar when no popover is open.
			actionbar.classList.add( 'actnbr-hidden' );

			// Hide any menus.
			actionbar.querySelectorAll( 'li' ).forEach( item => item.classList.add( 'actnbr-hidden' ) );
			if ( menuToggle ) {
				menuToggle.setAttribute( 'aria-expanded', 'false' );
				isMenuOpen = false;
			}
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
				const newEvent = new event.constructor( event.type, event );
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
		const form = actionbar.querySelector( '.actnbr-follow-bubble form' );
		form.removeAttribute( 'style' );

		setTimeout( () => {
			actionbar.querySelector( '.actnbr-email-field' ).focus();
		}, 10 );
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
} )();
