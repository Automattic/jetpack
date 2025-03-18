/**
 * JavaScript for the Pages-Homepage connection banner.
 * Creates and inserts a banner in the Pages admin screen to connect users
 * to homepage editing options when the homepage is controlled by theme settings.
 *
 * @param {object} $ - The jQuery object
 */

/* global jQuery */
( function ( $ ) {
	/**
	 * Create the connection banner element programmatically.
	 *
	 * @return {HTMLElement} The created banner element.
	 */
	function createBannerElement() {
		// Get localized data
		const data = window.wpcomPagesHomepageConnectionBanner || {};

		// Create main container with card class
		const container = document.createElement( 'div' );
		container.className = 'wpcom-homepage-notice card';

		// Create content wrapper
		const content = document.createElement( 'div' );
		content.className = 'wpcom-homepage-notice-content';

		// Create info section
		const info = document.createElement( 'div' );
		info.className = 'wpcom-homepage-notice-info';

		// Create text paragraph
		const text = document.createElement( 'p' );
		text.className = 'wpcom-homepage-notice-text';
		text.textContent = data.text;
		info.appendChild( text );

		// Add the info section to content
		content.appendChild( info );

		// Add edit link if user has permission
		if ( data.canEdit ) {
			const actions = document.createElement( 'div' );
			actions.className = 'wpcom-homepage-notice-actions';

			const link = document.createElement( 'a' );
			link.className = 'wpcom-homepage-notice-edit-link';
			link.href = data.editLink;
			link.textContent = data.editText;

			actions.appendChild( link );
			content.appendChild( actions );
		}

		// Add the content to the container
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
			$tablenav.before( banner );
		}
	} );
} )( jQuery );
