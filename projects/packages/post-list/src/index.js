import { __ } from '@wordpress/i18n';

/**
 * Closure function to copy the link to the clipboard.
 *
 * @return {Function} The click event handler.
 */
function copyLinkQuickAction() {
	let timoutId;
	/**
	 * Copy the link to the clipboard.
	 * @param {object} event - The event object.
	 */
	function onClick( event ) {
		event.preventDefault();
		clearTimeout( timoutId );
		window.navigator.clipboard.writeText( event.target.getAttribute( 'href' ) ).then( () => {
			event.target.textContent = __( 'Copied!', 'jetpack-post-list' );
			timoutId = setTimeout( () => {
				event.target.textContent = __( 'Copy link', 'jetpack-post-list' );
			}, 2000 );
		} );
	}
	return onClick;
}

/**
 * Handle thumbnail column visibility based on title column width.
 */
function handleThumbnailVisibility() {
	// Minimum width threshold for the title column (in pixels)
	const minTitleWidth = 200;

	// Get the table
	const table = document.querySelector( '.wp-list-table' );
	if ( ! table ) return;

	// First, determine if we need to hide thumbnails based on title width
	const titleHeader = table.querySelector( 'thead tr .column-title' );
	if ( ! titleHeader ) return;

	const shouldHideThumbnails = titleHeader.offsetWidth < minTitleWidth;

	// Get all thumbnail cells (both header and data cells)
	const thumbnailCells = table.querySelectorAll( '.column-thumbnail' );

	// Apply visibility to all thumbnail cells
	thumbnailCells.forEach( cell => {
		// Use direct style manipulation to ensure it works
		cell.style.display = shouldHideThumbnails ? 'none' : '';

		// Also add/remove the hidden class for CSS that depends on it
		if ( shouldHideThumbnails ) {
			cell.classList.add( 'hidden' );
		} else {
			cell.classList.remove( 'hidden' );
		}
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '.jetpack-post-list__copy-link-action' ).forEach( node => {
		node.addEventListener( 'click', copyLinkQuickAction() );
	} );

	// Hide the thumbnail column if the title column is too narrow and setup
	// several listeners that might effect the width of the title column.
	handleThumbnailVisibility();

	window.addEventListener( 'resize', () => {
		// Use requestAnimationFrame to limit how often this runs during resize
		window.requestAnimationFrame( handleThumbnailVisibility );
	} );

	document.addEventListener( 'ajaxComplete', handleThumbnailVisibility );

	// Listen for changes to the column checkboxes in screen options
	const columnCheckboxes = document.querySelectorAll( '.metabox-prefs input[type="checkbox"]' );
	columnCheckboxes.forEach( checkbox => {
		checkbox.addEventListener( 'change', () => {
			// Wait a bit for the column to be shown/hidden and then check visibility
			setTimeout( handleThumbnailVisibility, 300 );
		} );
	} );
} );
