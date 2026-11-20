/**
 * Loads the abilities this site publishes through the WP Abilities API.
 */

import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

// Core's collection cap; a full page is the only sign there may be more.
const PER_PAGE = 100;
const MAX_PAGES = 3;

/**
 * Fetch the site's ability catalog, one page at a time.
 *
 * @return {Promise<Array>} Published abilities.
 */
export async function fetchSiteAbilities() {
	const abilities = [];
	for ( let page = 1; page <= MAX_PAGES; page++ ) {
		const data = await apiFetch( {
			path: addQueryArgs( '/wp-abilities/v1/abilities', {
				per_page: PER_PAGE,
				page,
				_locale: 'user',
			} ),
		} );
		if ( ! Array.isArray( data ) ) {
			break;
		}
		abilities.push( ...data );
		if ( data.length < PER_PAGE ) {
			break;
		}
	}
	return abilities;
}

/**
 * Hook that loads the site's published abilities.
 *
 * @param {object}  options         - Hook options.
 * @param {boolean} options.enabled - Skip the request unless true.
 * @return {{abilities: Array, isLoading: boolean, isError: boolean}} Catalog state.
 */
export default function useSiteAbilities( { enabled } ) {
	const [ state, setState ] = useState( { abilities: [], isLoading: enabled, isError: false } );

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}
		let cancelled = false;
		setState( { abilities: [], isLoading: true, isError: false } );
		fetchSiteAbilities().then(
			abilities => ! cancelled && setState( { abilities, isLoading: false, isError: false } ),
			() => ! cancelled && setState( { abilities: [], isLoading: false, isError: true } )
		);
		return () => {
			cancelled = true;
		};
	}, [ enabled ] );

	return state;
}
