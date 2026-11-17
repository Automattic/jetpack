import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store } from './store';
import type { FeatureAction } from './api';
import type { Feature } from '../types';

export type { FeatureAction };

/**
 * "Switch to the … block" and "Turn on …".
 *
 * @return Run function, and whether this instance's action is in flight.
 */
export function useFeatureAction() {
	const { runFeatureAction } = useDispatch( store );
	const [ pending, setPending ] = useState( 0 );

	const run = useCallback(
		( feature: Feature, action: FeatureAction ) => {
			setPending( count => count + 1 );
			( runFeatureAction( feature, action ) as Promise< void > ).finally( () =>
				setPending( count => count - 1 )
			);
		},
		[ runFeatureAction ]
	);

	return { run, isPending: pending > 0 };
}
