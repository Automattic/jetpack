const POPOVER_ROOT_SELECTOR = '[data-jetpack-search-popover-root]';

/**
 * Determine whether an event originated inside a search popover root.
 *
 * Prefer `composedPath()` because Interactivity API updates can detach the
 * clicked target before the window click handler runs.
 *
 * @param {Event} event - Browser event.
 * @return {boolean} Whether the event started inside a popover root.
 */
export function isEventInsidePopoverRoot( event ) {
	const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
	if ( Array.isArray( path ) && path.some( node => node?.matches?.( POPOVER_ROOT_SELECTOR ) ) ) {
		return true;
	}

	const target = event?.target;
	return !! target?.closest?.( POPOVER_ROOT_SELECTOR );
}
