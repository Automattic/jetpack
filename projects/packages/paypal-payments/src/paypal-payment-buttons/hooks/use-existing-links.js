/**
 * PayPal Payment Buttons — The payment links the account already has.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { API_BASE } from '../utils/api-base';
import { isNotFound } from '../utils/sync-on-save';
import { toast } from '../utils/toast';
import { getUserFriendlyError } from '../utils/validation';

/**
 * Fetch the account's existing payment links, so a new block can reuse one, and
 * delete one from that list.
 *
 * One page at the route's maximum: PayPal has no server-side search, and the
 * step filters locally.
 *
 * @param {object}  props         - Hook props.
 * @param {boolean} props.enabled - Whether to fetch at all.
 * @return {{ links: Array, isLoading: boolean, deleteLink: Function, isDeleting: boolean }} The links, empty until fetched or when the request fails, and the delete.
 */
export function useExistingLinks( { enabled } ) {
	const [ links, setLinks ] = useState( [] );
	const [ loaded, setLoaded ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );

	/**
	 * Delete a link from PayPal and drop it from the list. Reports in the snackbar.
	 *
	 * @param {string} id - The resource id.
	 * @return {Promise} Settles once the list is updated.
	 */
	const deleteLink = useCallback( id => {
		setIsDeleting( true );
		const drop = message => {
			setLinks( current => current.filter( link => link.id !== id ) );
			toast( 'success', message );
		};
		return apiFetch( { path: `${ API_BASE }/buttons/${ id }`, method: 'DELETE' } )
			.then( () => drop( __( 'Payment link deleted.', 'jetpack-paypal-payments' ) ) )
			.catch( err => {
				// Already gone from PayPal, so the list is stale rather than the delete failed.
				if ( isNotFound( err ) ) {
					drop(
						__( 'The payment link was already removed from PayPal.', 'jetpack-paypal-payments' )
					);
				} else {
					toast( 'error', getUserFriendlyError( err ) );
				}
			} )
			.finally( () => setIsDeleting( false ) );
	}, [] );

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

	return { links: enabled ? links : [], isLoading: enabled && ! loaded, deleteLink, isDeleting };
}
