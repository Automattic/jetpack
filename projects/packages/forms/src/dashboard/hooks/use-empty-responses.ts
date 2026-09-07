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

type EmptyFlow = 'spam' | 'trash';

/**
 * Per-flow settings. Keyed on `flow` so the count, delete status filter, Tracks
 * event, and notice id can't be mixed up (e.g. a spam status on the trash count).
 * The error message is resolved inside the hook because `__()` must run at render
 * time, not module-eval time.
 */
const FLOW_SETTINGS: Record<
	EmptyFlow,
	{
		countKey: 'totalItemsSpam' | 'totalItemsTrash';
		status?: 'spam';
		analyticsEvent: string;
		noticeId: string;
	}
> = {
	spam: {
		countKey: 'totalItemsSpam',
		status: 'spam',
		analyticsEvent: 'jetpack_forms_empty_spam_click',
		noticeId: 'empty-spam',
	},
	trash: {
		countKey: 'totalItemsTrash',
		analyticsEvent: 'jetpack_forms_empty_trash_click',
		noticeId: 'empty-trash',
	},
};

export type UseEmptyResponsesReturn = {
	isConfirmDialogOpen: boolean;
	openConfirmDialog: () => void;
	closeConfirmDialog: () => void;
	onConfirmEmptying: () => Promise< void >;
	isEmpty: boolean;
	isEmptying: boolean;
	totalItems: number;
	selectedResponsesCount: number;
};

/**
 * Shared implementation behind `useEmptySpam` and `useEmptyTrash`. The two flows
 * differ only in the inbox count they watch, the delete status filter, the Tracks
 * event, and the notice copy/id — all derived from `flow`.
 *
 * @param props                - Hook props.
 * @param props.flow           - Which flow to run: `'spam'` or `'trash'`.
 * @param props.totalItemsProp - Optional count override; falls back to the inbox count.
 * @return Object with empty-responses state and handlers.
 */
export default function useEmptyResponses( {
	flow,
	totalItemsProp,
}: {
	flow: EmptyFlow;
	totalItemsProp?: number;
} ): UseEmptyResponsesReturn {
	const { countKey, status, analyticsEvent, noticeId } = FLOW_SETTINGS[ flow ];
	// Keyed lookup rather than a ternary so production minification can't hoist the two
	// calls into a single `__( cond ? … : … )`, which the makepot check rejects.
	const errorMessage = {
		spam: __( 'Could not empty spam.', 'jetpack-forms' ),
		trash: __( 'Could not empty trash.', 'jetpack-forms' ),
	}[ flow ];

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
	const totalItems = totalItemsProp ?? hookData[ countKey ] ?? 0;
	const { selectedResponsesCount } = hookData;

	useEffect( () => {
		setIsEmpty( ! totalItems );
	}, [ totalItems ] );

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		jetpackAnalytics.tracks.recordEvent( analyticsEvent );

		apiFetch( {
			method: 'DELETE',
			path: status ? `/wp/v2/feedback/trash?status=${ status }` : '/wp/v2/feedback/trash',
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

				createSuccessNotice( successMessage, { type: 'snackbar', id: noticeId } );
			} )
			.catch( () => {
				createErrorNotice( errorMessage, {
					type: 'snackbar',
					id: `${ noticeId }-error`,
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
		analyticsEvent,
		closeConfirmDialog,
		createErrorNotice,
		createSuccessNotice,
		errorMessage,
		invalidateResolutionForStoreSelector,
		invalidateCounts,
		isEmpty,
		isEmptying,
		noticeId,
		status,
	] );

	return {
		isConfirmDialogOpen,
		openConfirmDialog,
		closeConfirmDialog,
		onConfirmEmptying,
		isEmpty,
		isEmptying,
		totalItems,
		selectedResponsesCount,
	};
}
