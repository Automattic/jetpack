import { useEffect } from 'react';

const BODY_CLASS = 'jb-subpage-active';

// The chassis turns `.admin-ui-page > [body slot]` (the only element that
// isn't the page header or the footer) into the scroll container — see
// `boost-page.scss` for the rule. We reset that container's scrollTop on
// mount, plus the window for the legacy / no-chassis case.
const CHASSIS_SCROLL_SELECTOR =
	'.admin-ui-page > :not(.admin-ui-page__header):not(.jetpack-footer)';

/**
 * Mark <body> as being on a Boost sub-page while the calling component is
 * mounted. Adds `jb-subpage-active` to <body>, scrolls to top on mount,
 * and cleans up on unmount.
 *
 * Used by sub-page routes (e.g. /cache-debug-log, /critical-css-advanced)
 * to signal that the wp-build chassis's Page header + tab row should be
 * hidden via :global() CSS rules in each sub-page's SCSS module, and to
 * land the user at the top of the breadcrumb header instead of mid-page.
 */
export default function useEnterSubPage(): void {
	useEffect( () => {
		document.body.classList.add( BODY_CLASS );

		window.scrollTo( 0, 0 );
		const scrollEl = document.querySelector( CHASSIS_SCROLL_SELECTOR );
		if ( scrollEl instanceof HTMLElement ) {
			scrollEl.scrollTop = 0;
		}

		return () => {
			document.body.classList.remove( BODY_CLASS );
		};
	}, [] );
}
