import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { useCallback, useEffect, useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MOCK_SCORES, isMockMode } from './mock-mode';

export type SpeedScores = {
	mobile: number;
	desktop: number;
};

export type SpeedScoresSet = {
	current: SpeedScores;
	noBoost: SpeedScores | null;
	isStale: boolean;
};

export type SpeedScoreState = {
	status: 'idle' | 'loading' | 'loaded' | 'error';
	error?: Error;
	scores: SpeedScoresSet;
};

export type RefreshSpeedScores = ( regenerate?: boolean ) => Promise< void >;

const initialScores: SpeedScoresSet = {
	current: { mobile: 0, desktop: 0 },
	noBoost: null,
	isStale: false,
};

declare global {
	// Boost localizes these onto `wpApiSettings` and `Jetpack_Boost.site.url` at request time.
	const wpApiSettings: { root: string; nonce: string };

	const Jetpack_Boost: { site: { url: string; online?: boolean } };
}

/**
 * Fetches and exposes the current speed scores plus a `refresh()` action.
 *
 * Wraps `requestSpeedScores` from `@automattic/jetpack-boost-score-api` — the
 * same entry the legacy dashboard uses — but keeps the state machine local to
 * the modernized Overview tab so we don't drag the legacy `$features/*` store
 * graph into the wp-build bundle. The hook auto-fires once on mount; the
 * Refresh action calls back in with `regenerate: true` to force a re-run on
 * the API side.
 *
 * @param siteUrl - URL to test (defaults to the plugin's localized site URL).
 * @return `[ state, refresh ]` tuple.
 */
export function useSpeedScores( siteUrl?: string ): [ SpeedScoreState, RefreshSpeedScores ] {
	const targetUrl = siteUrl || Jetpack_Boost?.site?.url || '';

	const [ state, updateState ] = useReducer(
		( prev: SpeedScoreState, patch: Partial< SpeedScoreState > ): SpeedScoreState => ( {
			...prev,
			...patch,
		} ),
		{
			status: 'idle',
			error: undefined,
			scores: initialScores,
		}
	);

	const refresh = useCallback< RefreshSpeedScores >(
		async ( _regenerate = false ) => {
			if ( isMockMode() ) {
				// Short fake loading state so the Refresh button still
				// feels alive in mock mode, then settle on the canned set.
				updateState( { status: 'loading', error: undefined } );
				await new Promise( resolve => setTimeout( resolve, 400 ) );
				updateState( { status: 'loaded', scores: { ...MOCK_SCORES } } );
				return;
			}
			if ( ! targetUrl ) {
				return;
			}
			updateState( { status: 'loading', error: undefined } );
			try {
				const next = await requestSpeedScores(
					_regenerate,
					wpApiSettings.root,
					targetUrl,
					wpApiSettings.nonce
				);
				updateState( { status: 'loaded', scores: next } );
			} catch ( err ) {
				const error =
					err instanceof Error
						? err
						: new Error( __( 'Error requesting speed scores', 'jetpack-boost' ) );
				updateState( { status: 'error', error } );
			}
		},
		[ targetUrl ]
	);

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	return [ state, refresh ];
}
