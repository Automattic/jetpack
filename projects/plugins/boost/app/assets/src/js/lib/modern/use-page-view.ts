import { useEffect, useRef } from 'react';
import { getPageViewEventName, recordBoostEvent } from '$lib/utils/analytics';
import type { ModernRoute } from './routes';

/**
 * Derive the page-view event to record for a route.
 *
 * @param route - Route being shown.
 * @return Event name and the path property to send with it.
 */
function getPageViewEvent( route: ModernRoute ): { name: string; path: string } {
	if ( route.subpage ) {
		const path = `/${ route.subpage }`;

		return { name: getPageViewEventName( path ), path };
	}

	return {
		name: route.tab === 'settings' ? 'page_view_settings' : 'page_view_overview',
		path: '/',
	};
}

/**
 * Record one page view per visible route activation.
 *
 * @param route   - Route being shown.
 * @param enabled - False while a redirect is pending, so the route the user
 *                never sees is not recorded.
 */
export function usePageView( route: ModernRoute, enabled: boolean ): void {
	const lastRecorded = useRef< string | null >( null );

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		const { name, path } = getPageViewEvent( route );
		if ( lastRecorded.current === name ) {
			return;
		}

		lastRecorded.current = name;
		recordBoostEvent( name, { path } );
	}, [ route, enabled ] );
}
