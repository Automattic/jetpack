import { useEffect } from 'react';

const BODY_CLASS = 'jb-subpage-active';

/**
 * Add `jb-subpage-active` to <body> while the calling sub-page is mounted.
 *
 * Used by sub-page routes (e.g. /cache-debug-log, /critical-css-advanced)
 * to signal that the wp-build chassis's Page header + tab row should be
 * hidden in favor of the sub-page's own breadcrumb header. CSS rules in
 * each sub-page's SCSS module hide the chassis chrome via :global()
 * selectors when this class is present.
 */
export default function useHideChassisChrome(): void {
	useEffect( () => {
		document.body.classList.add( BODY_CLASS );
		return () => {
			document.body.classList.remove( BODY_CLASS );
		};
	}, [] );
}
