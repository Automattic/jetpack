/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';

const PREFERENCES_STORE = 'core/preferences';
const PREVIOUS_PERIOD_KEY = 'trafficChartPreviousPeriod';

type PreferencesSelectors = {
	get: ( scope: string, name: string ) => unknown;
};

type PreferencesActions = {
	set: ( scope: string, name: string, value: boolean ) => void;
};

/**
 * Whether the reader switched the previous period on from the chart legend.
 *
 * @return Tuple `[ shown, setShown ]`; unset means off.
 */
export function usePreviousPeriodShown(): [ boolean, ( shown: boolean ) => void ] {
	const shown = useSelect( select => {
		const preferences = select( PREFERENCES_STORE ) as unknown as PreferencesSelectors | undefined;
		return preferences?.get( DASHBOARD_PREFERENCES_SCOPE, PREVIOUS_PERIOD_KEY ) === true;
	}, [] );

	const { set } = useDispatch( PREFERENCES_STORE ) as unknown as PreferencesActions;

	const setShown = useCallback(
		( next: boolean ) => {
			void set( DASHBOARD_PREFERENCES_SCOPE, PREVIOUS_PERIOD_KEY, next );
		},
		[ set ]
	);

	return [ shown, setShown ];
}
