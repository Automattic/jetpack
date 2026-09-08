import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Width of the wp-admin sidebar, in px, or 0 when there is none.
 *
 * Whatever `#wpcontent` does not occupy is the sidebar: measured rather than
 * enumerated, so the fold, nav-unification and RTL cases need no table here.
 * Viewport-positioned overlays need it, or they tuck under the menu.
 *
 * @return The sidebar's current width in px.
 */
export default function useAdminMenuWidth(): number {
	const [ width, setWidth ] = useState( 0 );

	const measure = useCallback( () => {
		const content = document.getElementById( 'wpcontent' );
		if ( ! content ) {
			setWidth( 0 );
			return;
		}
		// The room left over, not the inline-start offset: in RTL the menu is on
		// the other edge and that offset is zero while the menu is still there.
		const room = document.documentElement.clientWidth - content.getBoundingClientRect().width;
		setWidth( Math.max( 0, room ) );
	}, [] );

	useEffect( () => {
		measure();
		const content = document.getElementById( 'wpcontent' );
		if ( ! content ) {
			return;
		}
		// Folding the menu resizes this element, so one observer covers both
		// the fold and the window resize; there is no event for the former.
		const observer = new ResizeObserver( measure );
		observer.observe( content );
		return () => observer.disconnect();
	}, [ measure ] );

	return width;
}
