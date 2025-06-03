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

type PendingState = {
	isPending: boolean;
	timestamp?: number;
};

type RefreshDependencies = {
	moduleStates: Array< boolean >;
	pendingStates: Record< string, PendingState >;
};

/**
 * Watches the dependencies and refreshes the speed score when needed.
 *
 * @param {RefreshDependencies}          dependencies               - The dependencies to watch.
 * @param {Array<boolean>}               dependencies.moduleStates  - An array of booleans that represent the state of the modules.
 * @param {Record<string, PendingState>} dependencies.pendingStates - A record of pending states and their timestamps.
 * @param {RefreshFunction}              loadScore                  - The method to refresh the speed score.
 */
export const useDebouncedRefreshScore = (
	{ moduleStates, pendingStates }: RefreshDependencies,
	loadScore: RefreshFunction
) => {
	// Create a config string that includes all relevant state
	const currentConfigString = JSON.stringify( [
		moduleStates,
		// Include timestamps of all pending states to track when they complete
		Object.entries( pendingStates ).map( ( [ key, state ] ) => ( {
			key,
			timestamp: state.timestamp,
		} ) ),
	] );

	const lastScoreConfigString = useRef( currentConfigString );

	// Debounced function: Refresh the speed score if the config has changed.
	const debouncedRefreshScore = useDebouncedCallback(
		( newConfig: string, hasPendingStates: boolean ) => {
			/*
			 * Trigger a refresh if config is different from last speed score refresh
			 * and there are no pending states that would affect the score.
			 */
			if ( lastScoreConfigString.current !== newConfig && ! hasPendingStates ) {
				lastScoreConfigString.current = newConfig;
				loadScore();
			}
		},
		2000
	);

	useEffect( () => {
		const hasPendingStates = Object.values( pendingStates ).some( state => state.isPending );
		debouncedRefreshScore( currentConfigString, hasPendingStates );
	}, [ currentConfigString, debouncedRefreshScore, pendingStates ] );
};
