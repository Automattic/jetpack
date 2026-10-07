import { useEffect, useState } from '@wordpress/element';

/**
 * Whatever `#wpcontent` does not occupy is the sidebar: measured rather than
 * enumerated, so the fold, nav-unification and RTL cases need no table here.
 *
 * @return The sidebar's current width in px, or 0 when there is none.
 */
function measureAdminMenuWidth(): number {
	const content = document.getElementById( 'wpcontent' );
	if ( ! content ) {
		return 0;
	}
	// The room left over, not the inline-start offset: in RTL the menu is on
	// the other edge and that offset is zero while the menu is still there.
	const room = document.documentElement.clientWidth - content.getBoundingClientRect().width;
	return Math.max( 0, room );
}

/**
 * Width of the wp-admin sidebar, in px, or 0 when there is none.
 *
 * Viewport-positioned overlays need it, or they tuck under the menu.
 *
 * @return The sidebar's current width in px.
 */
export default function useAdminMenuWidth(): number {
	// Measured during render, not in an effect: otherwise a dialog's first frame
	// centres on the whole viewport, then jumps by half the menu.
	const [ width, setWidth ] = useState( measureAdminMenuWidth );

	useEffect( () => {
		const content = document.getElementById( 'wpcontent' );
		if ( ! content ) {
			return;
		}
		// Folding the menu resizes this element, so one observer covers both
		// the fold and the window resize; there is no event for the former.
		const observer = new ResizeObserver( () => setWidth( measureAdminMenuWidth() ) );
		observer.observe( content );
		return () => observer.disconnect();
	}, [] );

	return width;
}
