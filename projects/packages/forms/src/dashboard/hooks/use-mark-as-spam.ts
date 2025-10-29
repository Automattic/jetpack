/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { store as dashboardStore } from '../store';
/**
 * Types
 */
import type { FormResponse } from '../../types';

export const useMarkAsSpam = ( response: FormResponse ) => {
	const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { invalidateCounts } = useDispatch( dashboardStore );

	const onConfirmMarkAsSpam = useCallback( async () => {
		setIsConfirmDialogOpen( false );

		await saveEntityRecord( 'postType', 'feedback', {
			id: response.id,
			status: 'spam',
		} );

		await invalidateCounts();

		window.location.hash = window.location.hash.replace( 'status=inbox', 'status=spam' );
	}, [ response, saveEntityRecord, invalidateCounts ] );

	const onCancelMarkAsSpam = useCallback( () => {
		setIsConfirmDialogOpen( false );
	}, [ setIsConfirmDialogOpen ] );

	// Email links have a query param that triggers the confirmation dialog.
	useEffect( () => {
		if ( window.location.hash.includes( '&mark_as_spam' ) ) {
			window.location.hash = window.location.hash.replace( '&mark_as_spam', '' );

			if ( ! [ 'spam', 'trash' ].includes( response.status ) ) {
				setIsConfirmDialogOpen( true );
			}
		}
	}, [ response ] );

	return { isConfirmDialogOpen, onConfirmMarkAsSpam, onCancelMarkAsSpam };
};
