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
			const newCount = parseInt( item.dataset.unreadDiff, 10 ) + count;
			item.textContent = newCount > 0 ? newCount : '';
			item.style.display = newCount > 0 ? '' : 'none';
		} else {
			item.textContent = count > 0 ? count : '';
			item.style.display = count > 0 ? '' : 'none';
		}
	} );
};
