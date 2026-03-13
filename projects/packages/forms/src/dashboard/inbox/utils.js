import { formatNumber } from '@automattic/number-formatters';

// Function to get the URL of the page or post where the form was submitted.
export const getPath = item => {
	try {
		const url = new URL( item.entry_permalink );
		return url.pathname;
	} catch {
		return '';
	}
};

/**
 * Update `count-0` style CSS class in the unread menu badge with new count like `count-1`.
 *
 * @param {HTMLElement} element - Counter badge element
 * @param {number}      count   - Count to use in new CSS class
 */
function updateBadge( element, count ) {
	const oldClass = [ ...element.classList ].find( c => c.startsWith( 'count-' ) );
	if ( oldClass ) {
		element.classList.replace( oldClass, `count-${ count }` );
	} else {
		element.classList.add( `count-${ count }` );
	}

	element.ariaHidden = count > 0 ? 'false' : 'true';
	element.textContent = formatNumber( count );
}

/**
 * Update the unread count in the admin menu to specific count.
 *
 * @param {number} count - The new unread count.
 */
export const updateMenuCounter = count => {
	// Iterate over all badges with the class 'jp-feedback-unread-counter' and update their count
	document.querySelectorAll( '.jp-feedback-unread-counter' ).forEach( item => {
		// Jetpack menu item has combined count and forms unread counter
		if ( item.dataset.unreadDiff ) {
			const unreadDiff = parseInt( item.dataset.unreadDiff, 10 ) + count;
			updateBadge( item, unreadDiff );
		} else {
			updateBadge( item, count );
		}
	} );
};

/**
 * Update the unread count in the admin menu by addition or substraction, not by knowing the actual count.
 *
 * @param {number} count - By how much we should add or substract from the current sidebar menu count; either positive or negative integer.
 */
export const updateMenuCounterOptimistically = count => {
	// Iterate over all badges with the class 'jp-feedback-unread-counter' and update their count
	document.querySelectorAll( '.jp-feedback-unread-counter' ).forEach( item => {
		let optimisticCount = 0;
		if ( item.textContent !== '' ) {
			// Ensure large formatted numbers like "1,000" are converted to integers properly
			optimisticCount = parseInt( item.textContent.replace( /\D/g, '' ), 10 ) + count;
		}

		if ( optimisticCount >= 0 ) {
			updateBadge( item, optimisticCount );
		}
	} );
};

/**
 * Get the ID of an item.
 *
 * @param {object} item - The item to get the ID of.
 * @return {string} The ID of the item.
 */
export const getItemId = item => item?.id?.toString() ?? '';

/**
 * Wraps a promise with a timeout to ensure it rejects after a reasonable time.
 * This is useful for network requests that might hang when the network is disabled.
 *
 * @param {Promise} promise   - The promise to wrap.
 * @param {number}  timeoutMs - The timeout in milliseconds (default: 30000).
 * @return {Promise} The wrapped promise that will reject on timeout.
 */
export const withTimeout = ( promise, timeoutMs = 30000 ) => {
	return Promise.race( [
		promise,
		new Promise( ( _, reject ) =>
			setTimeout( () => reject( new Error( 'Request timeout' ) ), timeoutMs )
		),
	] );
};
