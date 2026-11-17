/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback } from 'react';

const PREVIOUS_PERIOD_KEY = 'trafficChartPreviousPeriod';

/**
 * Whether the reader switched the previous period on from the chart legend.
 *
 * @return Tuple `[ shown, setShown ]`; unset means off.
 */
export function usePreviousPeriodShown(): [ boolean, ( shown: boolean ) => void ] {
	const shown = useSelect(
		select =>
			select( preferencesStore ).get( DASHBOARD_PREFERENCES_SCOPE, PREVIOUS_PERIOD_KEY ) === true,
		[]
	);

	const { set } = useDispatch( preferencesStore );

	const setShown = useCallback(
		( next: boolean ) => {
			if ( next !== shown ) {
				void set( DASHBOARD_PREFERENCES_SCOPE, PREVIOUS_PERIOD_KEY, next );
			}
		},
		[ shown, set ]
	);

	return [ shown, setShown ];
}
