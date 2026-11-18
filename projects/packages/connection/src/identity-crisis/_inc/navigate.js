// Separate from admin.jsx because tests cannot stub window.location.

const CLEAR_CONFIRMATION_ARGS = [ 'jetpack_idc_clear_confirmation', '_wpnonce' ];

/**
 * The address to reload, without the admin bar link's arguments.
 *
 * @param {string} href - The current address.
 * @return {string} The address to reload.
 */
export function getReloadUrl( href ) {
	const url = new URL( href );
	// Reloading with these would clear the Safe Mode confirmation again.
	if ( ! CLEAR_CONFIRMATION_ARGS.some( arg => url.searchParams.has( arg ) ) ) {
		return href;
	}
	CLEAR_CONFIRMATION_ARGS.forEach( arg => url.searchParams.delete( arg ) );
	return url.href;
}

/**
 * Reload the page, so Safe Mode's new state shows everywhere on it.
 */
export function reloadPage() {
	const url = getReloadUrl( window.location.href );
	if ( url === window.location.href ) {
		window.location.reload();
	} else {
		window.location.replace( url );
	}
}

/**
 * Leave the page for another address.
 *
 * @param {string} url - The address.
 */
export function goTo( url ) {
	window.location.href = url;
}
