/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { formatNumber } from '@automattic/number-formatters';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { createElement, useState, useCallback, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import DeletingSpinner from '../components/deleting-spinner';
import { store as dashboardStore } from '../store/index';
import useInboxData from './use-inbox-data';

type EmptyFlow = 'spam' | 'trash';

export type EmptyScopeMode = 'selection' | 'filtered' | 'all';

/**
 * What a bulk delete will act on: the mode shown to the user, how many responses it
 * affects, and the params sent to `DELETE /wp/v2/feedback/trash` to select them.
 */
export type EmptyScope = {
	mode: EmptyScopeMode;
	count: number;
	params: Record< string, unknown >;
};

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

/** Responses deleted per request; each request also stops early on a server-side time budget. */
const DELETE_CHUNK_SIZE = 500;

type DeleteChunkResponse = { deleted?: number; has_more?: boolean };

/** `current` counts through the batch in flight, so the first step reads "500 of N", not "0 of N". */
export type EmptyProgress = { current: number; total: number };

/**
 * Button label shown while a chunked delete is running.
 *
 * @param progress - Responses through the current batch, and the total expected.
 * @return Localized label.
 */
export function getDeletingLabel( progress: EmptyProgress ): string {
	return sprintf(
		/* translators: 1: Responses deleted once the current batch finishes. 2: Total responses being deleted. */
		__( 'Deleting %1$s of %2$s…', 'jetpack-forms' ),
		formatNumber( progress.current ),
		formatNumber( progress.total )
	);
}

export type UseEmptyResponsesReturn = {
	isConfirmDialogOpen: boolean;
	openConfirmDialog: () => void;
	closeConfirmDialog: () => void;
	onConfirmEmptying: () => Promise< void >;
	isEmpty: boolean;
	isEmptying: boolean;
	progress: EmptyProgress | null;
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
 * @param props.scope          - Optional scope; when set, only the responses it selects are deleted.
 * @return Object with empty-responses state and handlers.
 */
export default function useEmptyResponses( {
	flow,
	totalItemsProp,
	scope,
}: {
	flow: EmptyFlow;
	totalItemsProp?: number;
	scope?: EmptyScope;
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
	const [ progress, setProgress ] = useState< EmptyProgress | null >( null );
	const { createSuccessNotice, createErrorNotice, createInfoNotice, removeNotice } =
		useDispatch( noticesStore );
	const { invalidateResolutionForStoreSelector } = useDispatch( coreStore ) as unknown as {
		invalidateResolutionForStoreSelector: ( selector: string ) => void;
	};
	const { invalidateCounts } = useDispatch( dashboardStore );

	// Use props if provided, otherwise use hook
	const hookData = useInboxData();
	const totalItems = totalItemsProp ?? hookData[ countKey ] ?? 0;
	const { selectedResponsesCount } = hookData;

	const affectedCount = scope ? scope.count : totalItems;

	useEffect( () => {
		setIsEmpty( ! affectedCount );
	}, [ affectedCount ] );

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		if ( scope ) {
			jetpackAnalytics.tracks.recordEvent( analyticsEvent, {
				scope: scope.mode,
				count: scope.count,
			} );
		} else {
			jetpackAnalytics.tracks.recordEvent( analyticsEvent );
		}

		const total = affectedCount;
		const data = {
			...( scope?.params ?? {} ),
			status: status ?? 'trash',
			limit: DELETE_CHUNK_SIZE,
		};
		let deleted = 0;
		// Same id as the success notice, so the final message replaces this one.
		const showProgress = ( deletedSoFar: number, expected: number ) => {
			const current = Math.min( deletedSoFar + DELETE_CHUNK_SIZE, expected );
			setProgress( { current, total: expected } );
			createInfoNotice(
				sprintf(
					/* translators: 1: Responses deleted once the current batch finishes. 2: Total responses being deleted. */
					__( 'Deleting %1$s of %2$s responses… Keep this page open.', 'jetpack-forms' ),
					formatNumber( current ),
					formatNumber( expected )
				),
				{
					type: 'snackbar',
					id: noticeId,
					explicitDismiss: true,
					// Typed as a string in @wordpress/notices, but Snackbar renders any ReactNode.
					icon: createElement( DeletingSpinner ) as unknown as string,
				}
			);
		};
		// Progress only for bulk deletes; anything that fits in one request just shows the result.
		if ( total > DELETE_CHUNK_SIZE ) {
			showProgress( deleted, total );
		}

		try {
			// Delete in chunks so a large queue never outlives a single request's timeout.
			for (;;) {
				const response = await apiFetch< DeleteChunkResponse >( {
					method: 'DELETE',
					path: '/wp/v2/feedback/trash',
					data,
				} );
				const chunkDeleted = response?.deleted ?? 0;
				deleted += chunkDeleted;

				// Stop on an empty chunk too, so a row that can't be deleted can't spin forever.
				if ( ! response?.has_more || chunkDeleted === 0 ) {
					break;
				}
				showProgress( deleted, Math.max( total, deleted ) );
			}

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
		} catch ( error ) {
			removeNotice( noticeId );
			deleted += ( error as DeleteChunkResponse )?.deleted ?? 0;
			const message =
				deleted > 0
					? sprintf(
							/* translators: %s: The number of responses deleted before the error. */
							_n(
								'%s response was deleted, then an error stopped the rest.',
								'%s responses were deleted, then an error stopped the rest.',
								deleted,
								'jetpack-forms'
							),
							formatNumber( deleted )
						)
					: errorMessage;
			createErrorNotice( message, {
				type: 'snackbar',
				id: `${ noticeId }-error`,
			} );
		} finally {
			setIsEmptying( false );
			setProgress( null );
			// invalidate counts to refresh the counts across all status tabs
			invalidateCounts();
			// invalidate all entity record resolutions (feedback items, forms list entries_count, etc.)
			invalidateResolutionForStoreSelector( 'getEntityRecords' );
		}
	}, [
		affectedCount,
		analyticsEvent,
		closeConfirmDialog,
		createErrorNotice,
		createInfoNotice,
		createSuccessNotice,
		errorMessage,
		invalidateResolutionForStoreSelector,
		invalidateCounts,
		isEmpty,
		isEmptying,
		noticeId,
		removeNotice,
		scope,
		status,
	] );

	return {
		isConfirmDialogOpen,
		openConfirmDialog,
		closeConfirmDialog,
		onConfirmEmptying,
		isEmpty,
		isEmptying,
		progress,
		totalItems,
		selectedResponsesCount,
	};
}
