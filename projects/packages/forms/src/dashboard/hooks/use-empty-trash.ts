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

type UseEmptyTrashReturn = {
	isConfirmDialogOpen: boolean;
	openConfirmDialog: () => void;
	closeConfirmDialog: () => void;
	onConfirmEmptying: () => Promise< void >;
	isEmpty: boolean;
	isEmptying: boolean;
	totalItemsTrash: number;
	selectedResponsesCount: number;
};

/**
 * Hook to manage empty trash functionality.
 *
 * @param props                 - Optional props.
 * @param props.totalItemsTrash - The total number of trash items (optional, will use hook if not provided).
 * @return Object with empty trash state and handlers.
 */
export default function useEmptyTrash( {
	totalItemsTrash: totalItemsTrashProp,
}: {
	totalItemsTrash?: number;
} = {} ): UseEmptyTrashReturn {
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
	const totalItemsTrash = totalItemsTrashProp ?? hookData.totalItemsTrash ?? 0;
	const { selectedResponsesCount } = hookData;

	useEffect( () => {
		setIsEmpty( ! totalItemsTrash );
	}, [ totalItemsTrash ] );

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_empty_trash_click' );

		apiFetch( {
			method: 'DELETE',
			path: `/wp/v2/feedback/trash`,
		} )
			.then( ( response: { deleted?: number } ) => {
				const deleted = response?.deleted ?? 0;
				const successMessage =
					deleted === 1
						? __( 'Response deleted permanently.', 'jetpack-forms' )
						: sprintf(
								/* translators: %s: the number of responses deleted permanently. */
								_n(
									'%s response deleted permanently.',
									'%s responses deleted permanently.',
									deleted,
									'jetpack-forms'
								),
								formatNumber( deleted )
						  );

				createSuccessNotice( successMessage, { type: 'snackbar', id: 'empty-trash' } );
			} )
			.catch( () => {
				createErrorNotice( __( 'Could not empty trash.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: 'empty-trash-error',
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
		totalItemsTrash,
		selectedResponsesCount,
	};
}
