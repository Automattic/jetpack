/**
 * JavaScript for the Pages-Homepage connection banner.
 * Creates and inserts a banner in the Pages admin screen to connect users
 * to homepage editing options when the homepage is controlled by theme settings.
 *
 * @param {object} $ - The jQuery object
 */

/* global jQuery */
( function ( $ ) {
	const trackEvent = ( eventName, eventProperties = {} ) => {
		const currentUser = window.JP_CONNECTION_INITIAL_STATE?.userConnectionData?.currentUser ?? {};
		const blogId = eventProperties.blogId ?? currentUser.blogId;

		window._tkq = window._tkq || [];
		window._tkq.push( [
			'recordEvent',
			eventName,
			{
				...eventProperties,
				blog_id: blogId,
			},
		] );
	};

	/**
	 * Create the connection banner element programmatically.
	 *
	 * @param {object}  data          - The data for configuring the banner.
	 * @param {string}  data.text     - The text to display in the banner.
	 * @param {string}  data.editLink - The URL to the edit page.
	 * @param {string}  data.editText - The text for the edit button.
	 * @param {boolean} data.canEdit  - Whether the user can edit the homepage.
	 * @return {HTMLElement} The created banner element.
	 */
	function createBannerElement( data ) {
		// Create card container
		const container = document.createElement( 'div' );
		container.className = 'wpcom-homepage-notice card';
		if ( data.screenId === 'edit-page' ) {
			container.classList.add( 'is-edit-page' );
		} else if ( data.screenId === 'site-editor' ) {
			container.classList.add( 'is-site-editor' );
		}

		// Crete left column element
		const leftColumn = document.createElement( 'div' );
		leftColumn.className = 'wpcom-homepage-notice-left-column';

		// Create info icon
		const icon = document.createElement( 'span' );
		icon.className = 'dashicons dashicons-info-outline';

		leftColumn.appendChild( icon );

		// Crete right column element
		const rightColumn = document.createElement( 'div' );
		rightColumn.className = 'wpcom-homepage-notice-right-column';

		// Create text paragraph
		const text = document.createElement( 'p' );
		text.className = 'wpcom-homepage-notice-text';
		text.textContent = data.text;

		rightColumn.appendChild( text );

		// Create content wrapper
		const content = document.createElement( 'div' );
		content.className = 'wpcom-homepage-notice-content';

		content.appendChild( leftColumn );
		content.appendChild( rightColumn );

		// Add edit link if user has permission
		if ( data.canEdit ) {
			const btn = document.createElement( 'a' );

			btn.className = 'wpcom-homepage-notice-edit-btn button button-primary';
			btn.href = data.editLink;
			btn.textContent = data.editText;
			btn.onclick = function () {
				if ( data.screenId === 'edit-page' ) {
					trackEvent( 'wpcom_pages_edit_homepage_banner_clicked' );
				} else if ( data.screenId === 'site-editor' ) {
					trackEvent( 'wpcom_site_editor_pages_edit_homepage_banner_clicked' );
				}
			};

			rightColumn.appendChild( btn );
		}

		container.appendChild( content );

		return container;
	}

	/**
	 * Insert the banner at the correct position in the page.
	 */
	$( document ).ready( function () {
		// Get localized data
		const data = window.wpcomPagesHomepageConnectionBanner || {};

		const banner = createBannerElement( data );

		if ( data.screenId === 'edit-page' ) {
			const $tablenav = $( '.tablenav.top' );

			if ( $tablenav.length ) {
				trackEvent( 'wpcom_pages_edit_homepage_banner_shown' );

				$tablenav.before( banner );
			}
		}

		if ( data.screenId === 'site-editor' ) {
			hijackHistory();

			waitForElement( $, '.edit-site-layout__content', function () {
				$( '.edit-site' ).prepend( banner );

				if ( isPagesListPage() ) {
					trackEvent( 'wpcom_site_editor_pages_edit_homepage_banner_shown' );

					banner.classList.add( 'show' );
				}

				window.addEventListener( 'locationchange', function () {
					if ( isPagesListPage() ) {
						trackEvent( 'wpcom_site_editor_pages_edit_homepage_banner_shown' );

						banner.classList.add( 'show' );
					} else {
						banner.classList.remove( 'show' );
					}
				} );
			} );
		}
	} );
} )( jQuery );

const hijackHistory = () => {
	// Save a reference to the original methods
	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;

	// Override pushState
	history.pushState = function () {
		const result = originalPushState.apply( history, arguments );

		window.dispatchEvent( new Event( 'locationchange' ) );
		return result;
	};

	// Override replaceState
	history.replaceState = function () {
		const result = originalReplaceState.apply( history, arguments );

		window.dispatchEvent( new Event( 'locationchange' ) );
		return result;
	};

	// Listen for popstate (for browser back/forward buttons)
	window.addEventListener( 'popstate', function () {
		window.dispatchEvent( new Event( 'locationchange' ) );
	} );
};

const waitForElement = ( $, selector, callback ) => {
	// Check if the element already exists on initial load
	if ( $( selector ).length ) {
		callback();
		return;
	}

	const observer = new MutationObserver( function ( mutationsList, obs ) {
		for ( const mutation of mutationsList ) {
			// Check if the added nodes contain our selector
			if ( mutation.type === 'childList' && $( selector ).length ) {
				obs.disconnect();
				callback();
				return;
			}
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
};

const isPagesListPage = () => {
	const url = new URL( window.location.href );
	const params = new URLSearchParams( url.search );

	return params.get( 'p' ) === '/page';
};
