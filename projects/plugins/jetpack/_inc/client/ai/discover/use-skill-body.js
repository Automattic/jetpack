/**
 * Loads one skill's instructions, which the page's skill index leaves out.
 */

import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

const ENDPOINT = '/wpcom/v2/jetpack-ai/skills/';

// Bodies already loaded this page view, so reopening a panel doesn't refetch.
const bodies = new Map();

/**
 * Drop the loaded bodies. For tests.
 */
export function resetSkillBodies() {
	bodies.clear();
}

/**
 * A skill's instructions.
 *
 * @param {string} slug - The skill's slug.
 * @return {{body: string, isLoading: boolean, hasError: boolean}} The body, once loaded.
 */
export default function useSkillBody( slug ) {
	const [ state, setState ] = useState( () => ( { slug, hasError: false } ) );

	useEffect( () => {
		if ( ! slug || bodies.has( slug ) ) {
			return;
		}
		let cancelled = false;
		setState( { slug, hasError: false } );
		apiFetch( { path: ENDPOINT + encodeURIComponent( slug ) } )
			.then( data => {
				if ( typeof data?.body !== 'string' ) {
					throw new Error( 'Malformed skill body' );
				}
				bodies.set( slug, data.body );
				if ( ! cancelled ) {
					setState( { slug, hasError: false } );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setState( { slug, hasError: true } );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ slug ] );

	const isLoaded = bodies.has( slug );
	const hasError = ! isLoaded && state.slug === slug && state.hasError;
	return { body: bodies.get( slug ) ?? '', isLoading: ! isLoaded && ! hasError, hasError };
}
