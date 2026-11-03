import { hasQueryArg, removeQueryArgs } from '@wordpress/url';
import { useEffect, useState } from 'react';
import { getPresetFilters } from '../components/ActivityLog/filters';
import type { Filter } from '@wordpress/dataviews';

/**
 * Read the page URL's filter preset once, then drop it from the address so a
 * reload or "Reset view" doesn't bring it back.
 *
 * @param hasAccess - Whether the site has paid Activity Log access.
 * @return The preset filters, empty when none apply.
 */
export function usePresetFilters( hasAccess: boolean ): Filter[] {
	const [ presetFilters ] = useState( () => getPresetFilters( window.location.href, hasAccess ) );

	useEffect( () => {
		if ( hasQueryArg( window.location.href, 'actor' ) ) {
			window.history.replaceState(
				window.history.state,
				'',
				removeQueryArgs( window.location.href, 'actor' )
			);
		}
	}, [] );

	return presetFilters;
}
