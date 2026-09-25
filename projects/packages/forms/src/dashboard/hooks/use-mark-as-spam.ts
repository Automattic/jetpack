/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { saveResponse } from '../response-records.ts';
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

			// `throwOnError` matters: without it core-data resolves `undefined` on a
			// failed save instead of rejecting, so the `catch` below never runs and
			// callers act on a change the server refused.
			await saveResponse(
				saveEntityRecord,
				{ id: response.id, status: 'spam' },
				{ throwOnError: true }
			);

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

	// Email links carry a query param that triggers the confirmation dialog. The
	// trigger is consumed exactly once: a response that is already spam or trashed
	// has nothing to confirm, so the param is cleared rather than left armed. On a
	// screen that keeps the user in place, an armed param would re-fire the dialog
	// unprompted as soon as a later action moved the response back to the inbox.
	const hasConsumedSpamParameter = useRef( false );

	useEffect( () => {
		if ( ! hasSpamParameter || ! response || hasConsumedSpamParameter.current ) {
			return;
		}

		hasConsumedSpamParameter.current = true;

		if ( [ 'spam', 'trash' ].includes( response.status ) ) {
			removeParameter();
			return;
		}

		setIsConfirmDialogOpen( true );
	}, [ response?.status, hasSpamParameter, response, removeParameter ] );

	return {
		isConfirmDialogOpen,
		onConfirmMarkAsSpam,
		onCancelMarkAsSpam,
		markAsSpamConfirmationMessage,
		isSaving,
	};
};
