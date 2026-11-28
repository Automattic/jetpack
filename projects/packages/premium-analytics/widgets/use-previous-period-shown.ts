/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback } from 'react';

/**
 * Whether the reader switched the previous period on from a chart's legend.
 *
 * @param key - The dashboard preference the chart keeps it under.
 * @return Tuple `[ shown, setShown ]`; unset means off.
 */
export function usePreviousPeriodShown( key: string ): [ boolean, ( shown: boolean ) => void ] {
	const shown = useSelect(
		select => select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, key ) === true,
		[ key ]
	);

	const { set } = useDispatch( preferencesStore );

	const setShown = useCallback(
		( next: boolean ) => {
			if ( next !== shown ) {
				void set( DASHBOARD_PREFERENCES_SCOPE, key, next );
			}
		},
		[ shown, set, key ]
	);

	return [ shown, setShown ];
}
