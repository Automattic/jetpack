import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { getPreloaded, writePreloaded } from './get-preloaded';

export type TabDataStatus = 'ready' | 'loading' | 'error';

export interface TabDataSpec {
	/** The REST path to ensure is available before the tab renders. */
	path: string;
	/**
	 * Apply a freshly-fetched body to the tab's data store, when it uses one.
	 * Stores seed their initial state from the preload at module load, so a path
	 * recovered later must be pushed into the store for the form to pick it up.
	 */
	seed?: ( body: unknown ) => void;
}

// Background retries attempted before surfacing the error state. Smooths over the
// most transient blips (a momentarily stale page snapshot) while the user sees
// only the loading skeleton.
const SILENT_RETRIES = 2;

/**
 * Ensure a tab's bootstrap data is available before its screen renders.
 *
 * On a normal load every path is already preloaded onto the page, so this
 * resolves to `ready` synchronously — no request, no flash. When a path is
 * missing (a stale or incomplete page snapshot, the cause of the old
 * "Unable to load…" dead-end) it's fetched from its REST route, retried silently
 * a couple of times, cached back onto the page, and applied to its store; then
 * the screen renders. Only a genuinely failed fetch surfaces `error`, with
 * `retry` to re-attempt in place — no full page reload.
 *
 * @param specs - The paths (and optional store seeders) the tab needs.
 * @return The load status and a `retry` to re-attempt after an error.
 */
export default function useEnsureTabData( specs: TabDataSpec[] ): {
	status: TabDataStatus;
	retry: () => void;
} {
	const allPreloaded = specs.every( spec => getPreloaded( spec.path ) !== undefined );
	const [ status, setStatus ] = useState< TabDataStatus >( allPreloaded ? 'ready' : 'loading' );
	const [ attempt, setAttempt ] = useState( 0 );

	// Read the latest specs inside the effect without making it a dependency
	// (callers pass a fresh array each render).
	const specsRef = useRef( specs );
	specsRef.current = specs;

	useEffect( () => {
		if ( allPreloaded ) {
			return;
		}

		let cancelled = false;
		setStatus( 'loading' );

		const fetchOne = async ( spec: TabDataSpec ): Promise< void > => {
			let lastError: unknown;
			for ( let i = 0; i <= SILENT_RETRIES; i++ ) {
				try {
					const body = await apiFetch( { path: spec.path } );
					writePreloaded( spec.path, body );
					spec.seed?.( body );
					return;
				} catch ( error ) {
					lastError = error;
				}
			}
			throw lastError;
		};

		Promise.all(
			specsRef.current.filter( spec => getPreloaded( spec.path ) === undefined ).map( fetchOne )
		)
			.then( () => {
				if ( ! cancelled ) {
					setStatus( 'ready' );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setStatus( 'error' );
				}
			} );

		return () => {
			cancelled = true;
		};
		// `attempt` re-runs the effect on retry; `allPreloaded` short-circuits once
		// every path is cached. `specs` is read via the ref to avoid re-fetching on
		// each render.
	}, [ allPreloaded, attempt ] );

	const retry = useCallback( () => {
		setStatus( 'loading' );
		setAttempt( prev => prev + 1 );
	}, [] );

	return { status, retry };
}
