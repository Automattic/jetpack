import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { recordBoostEvent } from '$lib/utils/analytics';
import { castToString } from '$lib/utils/cast-to-string';
import debounce from '$lib/utils/debounce';
import { useState, useCallback, useEffect, useMemo, useReducer } from 'react';

const siteIsOnline = Jetpack_Boost.site.online;
const siteUrl = Jetpack_Boost.site.url;

type SpeedScoreState = {
	status: 'loading' | 'loaded' | 'error';
	error?: Error;
	scores: {
		current: {
			mobile: number;
			desktop: number;
		};
		noBoost: null | {
			mobile: number;
			desktop: number;
		};
		isStale: boolean;
	};
};

type RefreshFunction = ( regenerate?: boolean ) => Promise< void >;

/**
 * A hook that gives you the speed scores and a method to refresh them.
 *
 * @return {[ SpeedScoreState, RefreshFunction ]} - A tuple with the state and a method to refresh the scores.
 */
export const useSpeedScores = () => {
	const [ state, updateState ] = useReducer(
		( oldState, newState ) => ( { ...oldState, ...newState } ),
		{
			status: 'loading', // 'loading' | 'loaded' | 'error'
			error: undefined,
			scores: {
				current: { mobile: 0, desktop: 0 },
				noBoost: null,
				isStale: false,
			},
		}
	);

	const loadScore = useCallback( async ( regenerate = false ) => {
		// Don't run in offline mode.
		if ( ! siteIsOnline ) {
			return;
		}

		try {
			updateState( {
				status: 'loading',
			} );
			const results = await requestSpeedScores(
				regenerate,
				wpApiSettings.root,
				siteUrl,
				wpApiSettings.nonce
			);
			updateState( {
				scores: results,
				status: 'loaded',
			} );
		} catch ( err ) {
			recordBoostEvent( 'speed_score_request_error', {
				error_message: castToString( err.message ),
			} );
			updateState( {
				status: 'error',
				error: err,
			} );
		}
	}, [] );

	return [ state as SpeedScoreState, loadScore as RefreshFunction ] as const;
};

type RefreshDependencies = {
	moduleStates: Array< boolean >;
	criticalCssCreated: number;
	criticalCssIsGenerating: boolean;
};

/**
 * Watches the dependencies and refreshes the speed score when needed.
 *
 * @param {RefreshDependencies} dependencies                         - The dependencies to watch.
 * @param {Array<boolean>}      dependencies.moduleStates            - An array of booleans that represent the state of the modules.
 * @param {number}              dependencies.criticalCssCreated      - The timestamp of when the critical CSS was created.
 * @param {boolean}             dependencies.criticalCssIsGenerating - Whether the critical CSS is currently generating.
 * @param {RefreshFunction}     loadScore                            - The method to refresh the speed score.
 */
export const useDebouncedRefreshScore = (
	{ moduleStates, criticalCssCreated, criticalCssIsGenerating }: RefreshDependencies,
	loadScore: RefreshFunction
) => {
	const [ scoreConfigString, setScoreConfigString ] = useState(
		JSON.stringify( [ moduleStates, criticalCssCreated ] )
	);

	// Debounced function: Refresh the speed score if the config has changed.
	const debouncedRefreshScore = useMemo(
		() =>
			debounce( async ( newConfig, oldConfig ) => {
				if ( oldConfig !== newConfig ) {
					setScoreConfigString( newConfig );
					await loadScore( true );
				}
			}, 2000 ),
		[ loadScore, setScoreConfigString ]
	);

	useEffect( () => {
		if ( ! criticalCssIsGenerating ) {
			const newScoreConfigString = JSON.stringify( [ moduleStates, criticalCssCreated ] );
			debouncedRefreshScore( newScoreConfigString, scoreConfigString );
		}
	}, [
		moduleStates,
		criticalCssCreated,
		criticalCssIsGenerating,
		debouncedRefreshScore,
		scoreConfigString,
	] );
};
