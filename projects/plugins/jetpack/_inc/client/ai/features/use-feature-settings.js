/**
 * Custom hook for fetching and updating Jetpack AI feature settings via the
 * wpcom/v2/jetpack-ai/feature-settings endpoint.
 *
 * The endpoint reads and writes site-local options, so it behaves the same on
 * Simple, Atomic, and self-hosted sites. GET returns the gate state (host
 * support, connection, plan) together with the master switch and per-feature
 * toggles; POST accepts a partial update and returns the fresh settings shape.
 */

import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ENDPOINT = '/wpcom/v2/jetpack-ai/feature-settings';

/**
 * Hook that loads and exposes the Jetpack AI feature settings for the current site.
 *
 * @param {boolean} enabled Whether the gated AI views can use these settings.
 * @return {{ isLoading: boolean, savingKeys: Set, settings: Object|null, error: string|null, updateSettings: Function }} Feature settings state and updater. `error` reports a load failure only.
 */
export function useFeatureSettings( enabled = true ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ savingKeys, setSavingKeys ] = useState( () => new Set() );
	const [ settings, setSettings ] = useState( null );
	const [ error, setError ] = useState( null );
	// Saves queue behind this promise so only one POST is ever in flight.
	const saveQueue = useRef( Promise.resolve() );
	// Multiple queued saves can touch the same key; a bare Set would re-enable
	// the row when the FIRST save settles while a later one is still queued.
	const pendingKeyCounts = useRef( new Map() );

	useEffect( () => {
		if ( ! enabled ) {
			setIsLoading( false );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		apiFetch( { path: ENDPOINT } )
			.then( data => {
				if ( ! cancelled ) {
					setSettings( data ?? null );
					setError( null );
				}
			} )
			.catch( err => {
				if ( ! cancelled ) {
					setError( err?.message ?? __( 'Failed to load AI settings.', 'jetpack' ) );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ enabled ] );

	/**
	 * Send a partial settings update.
	 * Only the submitted keys change server-side; the response is the fresh
	 * full settings shape, which replaces local state.
	 *
	 * @param {object} update - Partial payload, e.g. { features: { image_editor: false } } or { master_enabled: false }.
	 * @return {Promise} Resolves when the update is saved; rejects on failure, which the caller surfaces.
	 */
	const updateSettings = useCallback( update => {
		// Track which toggles this request touches so only those are disabled.
		const keys = Object.keys( update.features ?? {} );
		if ( update.master_enabled !== undefined ) {
			keys.push( '__master__' );
		}

		keys.forEach( key => {
			const counts = pendingKeyCounts.current;
			counts.set( key, ( counts.get( key ) ?? 0 ) + 1 );
		} );

		setSavingKeys( prev => {
			const next = new Set( prev );
			keys.forEach( key => next.add( key ) );
			return next;
		} );

		// Saves are serialized: every response is a full settings snapshot, so
		// with concurrent POSTs a slow earlier response arriving last would
		// overwrite a later save with stale values. One request in flight at a
		// time means the server applies writes in dispatch order and each
		// snapshot reflects every earlier save.
		const request = saveQueue.current.then( () =>
			apiFetch( {
				path: ENDPOINT,
				method: 'POST',
				data: update,
			} )
		);
		// The queue advances when this save settles; a failure must not block
		// the saves queued behind it.
		saveQueue.current = request.then(
			() => {},
			() => {}
		);

		return (
			request
				.then( data => {
					setSettings( prev => data ?? prev );
					setError( null );
				} )
				// No catch: the rejection propagates to the caller, which owns the
				// save-error notice. Setting the hook-level `error` here would read
				// as a load failure and unmount the whole Features view.
				.finally( () => {
					const counts = pendingKeyCounts.current;
					const released = keys.filter( key => {
						const remaining = ( counts.get( key ) ?? 1 ) - 1;
						if ( remaining > 0 ) {
							counts.set( key, remaining );
							return false;
						}
						counts.delete( key );
						return true;
					} );
					if ( released.length ) {
						setSavingKeys( prev => {
							const next = new Set( prev );
							released.forEach( key => next.delete( key ) );
							return next;
						} );
					}
				} )
		);
	}, [] );

	return { isLoading, savingKeys, settings, error, updateSettings };
}
