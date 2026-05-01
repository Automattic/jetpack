/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { formatNumber } from '@automattic/number-formatters';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../store/index';
import useInboxData from './use-inbox-data';

type UseEmptySpamReturn = {
	isConfirmDialogOpen: boolean;
	openConfirmDialog: () => void;
	closeConfirmDialog: () => void;
	onConfirmEmptying: () => Promise< void >;
	isEmpty: boolean;
	isEmptying: boolean;
	totalItemsSpam: number;
	selectedResponsesCount: number;
};

/**
 * Hook to manage empty spam functionality.
 *
 * @param props                - Optional props.
 * @param props.totalItemsSpam - The total number of spam items (optional, will use hook if not provided).
 * @return Object with empty spam state and handlers.
 */
export default function useEmptySpam( {
	totalItemsSpam: totalItemsSpamProp,
}: {
	totalItemsSpam?: number;
} = {} ): UseEmptySpamReturn {
	const [ isConfirmDialogOpen, setConfirmDialogOpen ] = useState( false );
	const [ isEmptying, setIsEmptying ] = useState( false );
	const [ isEmpty, setIsEmpty ] = useState( true );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { invalidateResolutionForStoreSelector } = useDispatch( coreStore ) as unknown as {
		invalidateResolutionForStoreSelector: ( selector: string ) => void;
	};
	const { invalidateCounts } = useDispatch( dashboardStore );

	// Use props if provided, otherwise use hook
	const hookData = useInboxData();
	const totalItemsSpam = totalItemsSpamProp ?? hookData.totalItemsSpam ?? 0;
	const { selectedResponsesCount } = hookData;

	useEffect( () => {
		setIsEmpty( ! totalItemsSpam );
	}, [ totalItemsSpam ] );

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_empty_spam_click' );

		apiFetch( {
			method: 'DELETE',
			path: `/wp/v2/feedback/trash?status=spam`,
		} )
			.then( ( response: { deleted?: number } ) => {
				const deleted = response?.deleted ?? 0;
				const successMessage =
					deleted === 1
						? __( 'Response deleted permanently.', 'jetpack-forms' )
						: sprintf(
								/* translators: %s: The number of responses. */
								_n(
									'%s response deleted permanently.',
									'%s responses deleted permanently.',
									deleted,
									'jetpack-forms'
								),
								formatNumber( deleted )
						  );

				createSuccessNotice( successMessage, { type: 'snackbar', id: 'empty-spam' } );
			} )
			.catch( () => {
				createErrorNotice( __( 'Could not empty spam.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: 'empty-spam-error',
				} );
			} )
			.finally( () => {
				setIsEmptying( false );
				// invalidate counts to refresh the counts across all status tabs
				invalidateCounts();
				// invalidate all entity record resolutions (feedback items, forms list entries_count, etc.)
				invalidateResolutionForStoreSelector( 'getEntityRecords' );
			} );
	}, [
		closeConfirmDialog,
		createErrorNotice,
		createSuccessNotice,
		invalidateResolutionForStoreSelector,
		invalidateCounts,
		isEmpty,
		isEmptying,
	] );

	return {
		isConfirmDialogOpen,
		openConfirmDialog,
		closeConfirmDialog,
		onConfirmEmptying,
		isEmpty,
		isEmptying,
		totalItemsSpam,
		selectedResponsesCount,
	};
}
