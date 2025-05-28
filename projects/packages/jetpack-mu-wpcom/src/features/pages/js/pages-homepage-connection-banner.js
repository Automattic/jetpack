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
	 * @return {HTMLElement} The created banner element.
	 */
	function createBannerElement() {
		// Get localized data
		const data = window.wpcomPagesHomepageConnectionBanner || {};

		// Create card container
		const container = document.createElement( 'div' );
		container.className = 'wpcom-homepage-notice card';

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
				trackEvent( 'wpcom_pages_edit_homepage_banner_clicked' );
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
		const banner = createBannerElement();
		const $tablenav = $( '.tablenav.top' );

		if ( $tablenav.length ) {
			trackEvent( 'wpcom_pages_edit_homepage_banner_shown' );

			$tablenav.before( banner );
		}
	} );
} )( jQuery );
