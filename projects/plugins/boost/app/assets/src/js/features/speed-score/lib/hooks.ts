import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { recordBoostEvent } from '$lib/utils/analytics';
import { castToString } from '$lib/utils/cast-to-string';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { standardizeError } from '$lib/utils/standardize-error';
import { __ } from '@wordpress/i18n';

type SpeedScoreState = {
	status: 'loading' | 'loaded' | 'error';
	error?: Error;
	scores: {
		current: {
			mobile: number;
			desktop: number;
		};
		noBoost: {
			mobile: number;
			desktop: number;
		} | null;
		isStale: boolean;
	};
};

type RefreshFunction = ( regenerate?: boolean ) => Promise< void >;

/**
 * A hook that gives you the speed scores and a method to refresh them.
 *
 * @param  siteUrl
 * @return {[ SpeedScoreState, RefreshFunction ]} - A tuple with the state and a method to refresh the scores.
 */
export const useSpeedScores = ( siteUrl: string ) => {
	const [ state, updateState ] = useReducer(
		( oldState: SpeedScoreState, newState: Partial< SpeedScoreState > ) =>
			( { ...oldState, ...newState } ) as SpeedScoreState,
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

	const loadScore = useCallback(
		async ( regenerate = false ) => {
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
				const error = standardizeError(
					err,
					__( 'Error requesting speed scores', 'jetpack-boost' )
				);

				recordBoostEvent( 'speed_score_request_error', {
					error_message: castToString( error.message ),
				} );
				updateState( {
					status: 'error',
					error,
				} );
			}
		},
		[ siteUrl ]
	);

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
	const currentConfigString = JSON.stringify( [ moduleStates, criticalCssCreated ] );

	/*
	 * Keep track of the config string that was responsible for the last score refresh.
	 *
	 * By maintaining this value and comparing it to the current config string, we can
	 * avoid refreshing the score when the config change was undone by the user quickly.
	 * Example: The user toggles on a module, then toggles it off again within debounce
	 * duration. We don't want to refresh the score in this case.
	 */
	const lastScoreConfigString = useRef( currentConfigString );

	// Debounced function: Refresh the speed score if the config has changed.
	const debouncedRefreshScore = useDebouncedCallback(
		( newConfig: string, generating: boolean ) => {
			/*
			 * Trigger a refresh if config is different from last speed score refresh.
			 * While critical CSS is currently generating, skip refreshing the score as
			 * the impact of the config change won't be visible until the CSS is done.
			 */
			if ( lastScoreConfigString.current !== newConfig && ! generating ) {
				lastScoreConfigString.current = newConfig;
				loadScore();
			}
		},
		2000
	);

	useEffect( () => {
		debouncedRefreshScore( currentConfigString, criticalCssIsGenerating );
	}, [ currentConfigString, debouncedRefreshScore, criticalCssIsGenerating ] );
};
