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
 * Update the unread count in the admin menu.
 *
 * @param {number} count - The new unread count.
 */
export const updateMenuCounter = count => {
	// iterate over all elements with the class 'jp-feedback-unread-counter' and update their text content
	document.querySelectorAll( '.jp-feedback-unread-counter' ).forEach( item => {
		if ( item.dataset.unreadDiff ) {
			const unreadDiff = parseInt( item.dataset.unreadDiff, 10 ) + count;
			item.textContent = unreadDiff > 0 ? unreadDiff : '';
			item.style.display = unreadDiff > 0 ? '' : 'none';
		} else {
			item.textContent = count > 0 ? count : '';
			item.style.display = count > 0 ? '' : 'none';
		}
	} );
};

/**
 *
 * Update the unread count in the admin menu by addition or substraction, not by knowing the actual count.
 * @param {number} count - By how much we should add or substract from the current sidebar menu count; either positive or negative integer.
 */
export const updateMenuCounterOptimistically = count => {
	// iterate over all elements with the class 'jp-feedback-unread-counter' and update their text content
	document.querySelectorAll( '.jp-feedback-unread-counter' ).forEach( item => {
		let optimisticCount = 0;
		if ( item.textContent !== '' ) {
			optimisticCount = parseInt( item.textContent, 10 ) + count;
		}

		item.textContent = optimisticCount > 0 ? optimisticCount : '';
		item.style.display = optimisticCount > 0 ? '' : 'none';
	} );
};
