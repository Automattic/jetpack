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
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ENDPOINT = '/wpcom/v2/jetpack-ai/feature-settings';

/**
 * Hook that loads and exposes the Jetpack AI feature settings for the current site.
 *
 * @return {{ isLoading: boolean, savingKeys: Set, settings: Object|null, error: string|null, updateSettings: Function }} Feature settings state and updater.
 */
export function useFeatureSettings() {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ savingKeys, setSavingKeys ] = useState( () => new Set() );
	const [ settings, setSettings ] = useState( null );
	const [ error, setError ] = useState( null );

	useEffect( () => {
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
	}, [] );

	/**
	 * Send a partial settings update.
	 * Only the submitted keys change server-side; the response is the fresh
	 * full settings shape, which replaces local state.
	 *
	 * @param {object} update - Partial payload, e.g. { features: { excerpt: false } } or { master_enabled: false }.
	 * @return {Promise} Resolves when the update is saved.
	 */
	const updateSettings = useCallback( update => {
		// Track which toggles this request touches so only those are disabled.
		const keys = Object.keys( update.features ?? {} );
		if ( update.master_enabled !== undefined ) {
			keys.push( '__master__' );
		}

		setSavingKeys( prev => {
			const next = new Set( prev );
			keys.forEach( key => next.add( key ) );
			return next;
		} );

		return apiFetch( {
			path: ENDPOINT,
			method: 'POST',
			data: update,
		} )
			.then( data => {
				setSettings( prev => data ?? prev );
				setError( null );
			} )
			.catch( err => {
				setError( err?.message ?? __( 'Failed to save AI settings.', 'jetpack' ) );
				throw err;
			} )
			.finally( () => {
				setSavingKeys( prev => {
					const next = new Set( prev );
					keys.forEach( key => next.delete( key ) );
					return next;
				} );
			} );
	}, [] );

	return { isLoading, savingKeys, settings, error, updateSettings };
}
