import { useCallback, useRef } from 'react';
import { CONNECTION_EVENTS, trackIdentityCrisisEvent } from '../../helpers/connection-tracking';
import type { IdentityCrisisContext } from '../../helpers/connection-tracking';
import type { IdentityCrisisState } from '../../types';

interface IdentityCrisisViewOptions {
	context: IdentityCrisisContext;
	/** From `useIdentityCrisisState()`. */
	state: IdentityCrisisState | null;
}

/**
 * Records the screen's view once per mount: the first time any of it is in the viewport while the
 * tab is visible, or on the next `visibilitychange` while it still is.
 *
 * @param options         - Hook options.
 * @param options.context - The screen's `context` prop.
 * @param options.state   - The Safe Mode state; null outside Safe Mode, when nothing is sent.
 * @return A callback ref for the screen's root element.
 */
export default function useIdentityCrisisView( {
	context,
	state,
}: IdentityCrisisViewOptions ): ( node: HTMLElement | null ) => void {
	const isSent = useRef( false );
	const stopWatching = useRef< ( () => void ) | null >( null );

	return useCallback(
		( node: HTMLElement | null ) => {
			stopWatching.current?.();
			stopWatching.current = null;
			// Without IntersectionObserver, no view, as in Boost's `useSettingsExposure()`.
			if ( ! node || ! state || isSent.current || typeof IntersectionObserver === 'undefined' ) {
				return;
			}

			// A notification queued before `disconnect()` still arrives, so each check reads this.
			let isWatching = true;
			let isInViewport = false;
			const record = () => {
				if ( ! isWatching || ! isInViewport || document.visibilityState !== 'visible' ) {
					return;
				}
				isSent.current = true;
				stopWatching.current?.();
				stopWatching.current = null;
				if ( state.canResolve ) {
					trackIdentityCrisisEvent( CONNECTION_EVENTS.idcNoticeView, context, {
						is_development_site: state.isDevelopmentSite,
						dynamic_site_url_detected: state.possibleDynamicSiteUrlDetected,
					} );
				} else {
					trackIdentityCrisisEvent( CONNECTION_EVENTS.idcNonAdminNoticeView, context );
				}
			};
			const observer = new IntersectionObserver( entries => {
				isInViewport = entries.at( -1 )?.isIntersecting ?? false;
				record();
			} );
			observer.observe( node );
			document.addEventListener( 'visibilitychange', record );
			stopWatching.current = () => {
				isWatching = false;
				observer.disconnect();
				document.removeEventListener( 'visibilitychange', record );
			};
		},
		[ context, state ]
	);
}
