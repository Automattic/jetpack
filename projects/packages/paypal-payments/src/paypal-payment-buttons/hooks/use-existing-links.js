/**
 * PayPal Payment Buttons — The payment links the account already has.
 *
 * @package
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from '@wordpress/element';
import {
	deleteExistingLink,
	getExistingLinks,
	loadExistingLinks,
	subscribeToExistingLinks,
} from '../utils/existing-links';

/**
 * The account's existing payment links, so a new block can reuse one, and a way to
 * delete one.
 *
 * @param {object}  props         - Hook props.
 * @param {boolean} props.enabled - Whether this block needs the list. Reads it if no block has yet.
 * @param {boolean} props.showing - Whether this block shows a picker. Reads the list again if it is dirty.
 * @return {{ links: Array, isLoading: boolean, deleteLink: Function, isDeleting: boolean }} The links, empty until read, and the delete.
 */
export function useExistingLinks( { enabled, showing } ) {
	const snapshot = useSyncExternalStore( subscribeToExistingLinks, getExistingLinks );
	const [ isDeleting, setIsDeleting ] = useState( false );

	/**
	 * Delete a link, showing this block's picker as busy until it is done.
	 *
	 * @param {string} id - The resource id.
	 * @return {Promise} Settles once the list is updated.
	 */
	const deleteLink = useCallback( id => {
		setIsDeleting( true );
		return deleteExistingLink( id ).finally( () => setIsDeleting( false ) );
	}, [] );

	// Loading is derived, not set in the effect: with a state flag the render
	// between enabling and the effect would show the form for one frame. Also runs on
	// each new snapshot, so a list forgotten on reconnect is read again.
	useEffect( () => {
		if ( enabled && ! snapshot.loaded ) {
			loadExistingLinks();
		}
	}, [ enabled, snapshot ] );

	// Runs only when a picker opens, so a failed read is retried on the next open.
	useEffect( () => {
		if ( showing ) {
			loadExistingLinks();
		}
	}, [ showing ] );

	return {
		links: snapshot.links,
		isLoading: enabled && ! snapshot.loaded,
		deleteLink,
		isDeleting,
	};
}
