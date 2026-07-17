/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as dashboardStore } from '../store/index.js';
/**
 * Types
 */
import type { FormResponse } from '../../types/index.ts';

/**
 * Options for the useMarkAsSpam hook.
 */
export type UseMarkAsSpamOptions = {
	/**
	 * Function to check if the mark_as_spam parameter is present in the URL.
	 */
	checkParameter: () => boolean;

	/**
	 * Function to remove the mark_as_spam parameter from the URL when cancelling the confirmation dialog.
	 */
	removeParameter: () => void;

	/**
	 * Function to navigate to the spam view after marking as spam, while also removing the mark_as_spam parameter from the URL.
	 */
	switchToSpam: ( responseId: number | string ) => void;
};

export const useMarkAsSpam = ( response: FormResponse | null, options: UseMarkAsSpamOptions ) => {
	const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { invalidateCounts } = useDispatch( dashboardStore );
	const markAsSpamConfirmationMessage = useMemo(
		() => __( 'Are you sure you want to mark this response as spam?', 'jetpack-forms' ),
		[]
	);

	const { checkParameter, removeParameter, switchToSpam } = options;

	const onConfirmMarkAsSpam = useCallback( async () => {
		if ( ! response ) {
			return;
		}

		try {
			setIsSaving( true );

			await saveEntityRecord( 'postType', 'feedback', {
				id: response.id,
				status: 'spam',
			} );

			await invalidateCounts();

			setIsSaving( false );

			setIsConfirmDialogOpen( false );

			switchToSpam( response.id );
		} catch {
			setIsSaving( false );
		}
	}, [ response, saveEntityRecord, invalidateCounts, switchToSpam ] );

	const hasSpamParameter = useMemo( () => checkParameter(), [ checkParameter ] );

	const onCancelMarkAsSpam = useCallback( () => {
		setIsConfirmDialogOpen( false );

		removeParameter();
	}, [ removeParameter ] );

	// Email links have a query param that triggers the confirmation dialog.
	useEffect( () => {
		if ( hasSpamParameter && response && ! [ 'spam', 'trash' ].includes( response.status ) ) {
			setIsConfirmDialogOpen( true );
		}
	}, [ response?.status, hasSpamParameter, response ] );

	return {
		isConfirmDialogOpen,
		onConfirmMarkAsSpam,
		onCancelMarkAsSpam,
		markAsSpamConfirmationMessage,
		isSaving,
	};
};
