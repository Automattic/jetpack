/**
 * PayPal Payment Buttons — The payment links the account already has.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { useEffect, useState } from '@wordpress/element';
import { API_BASE } from '../utils/api-base';

/**
 * Fetch the account's existing payment links, so a new block can reuse one.
 *
 * One page at the route's maximum: PayPal has no server-side search, and the
 * step filters locally.
 *
 * @param {object}  props         - Hook props.
 * @param {boolean} props.enabled - Whether to fetch at all.
 * @return {{ links: Array, isLoading: boolean }} The links, empty until fetched or when the request fails.
 */
export function useExistingLinks( { enabled } ) {
	const [ links, setLinks ] = useState( [] );
	const [ loaded, setLoaded ] = useState( false );

	// Loading is derived, not set in the effect: with a state flag the render
	// between enabling and the effect would show the form for one frame.
	useEffect( () => {
		if ( ! enabled || loaded ) {
			return;
		}

		let cancelled = false;

		apiFetch( { path: `${ API_BASE }/buttons?page_size=100` } )
			.then( response => {
				if ( ! cancelled ) {
					setLinks( Array.isArray( response?.resources ) ? response.resources : [] );
				}
			} )
			// A failed listing only skips the step; the form still works.
			.catch( () => {
				if ( ! cancelled ) {
					setLinks( [] );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoaded( true );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ enabled, loaded ] );

	return { links: enabled ? links : [], isLoading: enabled && ! loaded };
}
