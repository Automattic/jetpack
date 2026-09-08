import { useEffect, useRef } from 'react';
import { pageViewEventName, recordBoostEvent } from '$lib/utils/analytics';
import type { ModernRoute } from './routes';

/**
 * Map a modern route to the page view it should record.
 *
 * @param route - Route being shown.
 * @return Event name and the path property to send with it.
 */
export function pageViewFor( route: ModernRoute ): { name: string; path: string } {
	if ( route.subpage ) {
		return { name: pageViewEventName( `/${ route.subpage }` ), path: `/${ route.subpage }` };
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

		const { name, path } = pageViewFor( route );
		if ( lastRecorded.current === name ) {
			return;
		}

		lastRecorded.current = name;
		recordBoostEvent( name, { path } );
	}, [ route, enabled ] );
}
