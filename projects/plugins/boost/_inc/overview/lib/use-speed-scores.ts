import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { recordBoostEvent } from '../../../app/assets/src/js/lib/utils/analytics';
import { standardizeError } from '../../../app/assets/src/js/lib/utils/standardize-error';
import type { ScoreRefreshState } from './use-modules-state';

export type SpeedScoresSet = Awaited< ReturnType< typeof requestSpeedScores > >;
export type SpeedScoreState = {
	status: 'loading' | 'loaded' | 'error' | 'offline';
	error?: Error;
	hasScores: boolean;
	scores: SpeedScoresSet;
};

const cornerstonePagesSchema = z.object( { predefined_pages: z.array( z.string() ) } );

export function useSpeedScores( refreshState?: ScoreRefreshState ) {
	const { online } = Jetpack_Boost.site;
	const properties = cornerstonePagesSchema.safeParse(
		window.jetpack_boost_ds?.cornerstone_pages_properties?.value
	);
	const url =
		( properties.success && properties.data.predefined_pages[ 0 ] ) || Jetpack_Boost.site.url;
	const [ state, setState ] = useState< SpeedScoreState >( {
		status: online ? 'loading' : 'offline',
		hasScores: false,
		scores: { current: { mobile: 0, desktop: 0 }, noBoost: null, isStale: false },
	} );
	const requestId = useRef( 0 );
	const lastConfig = useRef< string >();
	const cancelPending = useCallback( () => {
		++requestId.current;
	}, [] );
	const refresh = useCallback(
		async ( regenerate = false ) => {
			if ( ! online ) {
				return;
			}
			const id = ++requestId.current;
			setState( previous => ( { ...previous, status: 'loading', error: undefined } ) );
			try {
				const scores = await requestSpeedScores(
					regenerate,
					wpApiSettings.root,
					url,
					wpApiSettings.nonce
				);
				if ( id === requestId.current ) {
					setState( { status: 'loaded', hasScores: true, scores } );
				}
			} catch ( cause ) {
				if ( id !== requestId.current ) {
					return;
				}
				const error = standardizeError(
					cause ?? {},
					__( 'Error requesting speed scores', 'jetpack-boost' )
				);
				recordBoostEvent( 'speed_score_request_error', { error_message: String( error.message ) } );
				setState( previous => ( { ...previous, status: 'error', error } ) );
			}
		},
		[ online, url ]
	);

	useEffect( () => {
		if ( online ) {
			refresh();
		} else {
			setState( previous => ( { ...previous, status: 'offline', error: undefined } ) );
		}
		return cancelPending;
	}, [ online, refresh, cancelPending ] );

	const config = refreshState?.config;
	const isPending = refreshState?.isPending;
	useEffect( () => {
		if ( config === undefined ) {
			return;
		}
		if ( lastConfig.current === undefined ) {
			lastConfig.current = config;
		}
		if ( ! online || isPending || config === lastConfig.current ) {
			return;
		}
		const timer = window.setTimeout( () => {
			lastConfig.current = config;
			refresh( true );
		}, 2000 );
		return () => window.clearTimeout( timer );
	}, [ config, isPending, online, refresh ] );

	return [ state, refresh ] as const;
}
