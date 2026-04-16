/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { formatNumber } from '@automattic/number-formatters';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { store as dashboardStore } from '../store/index';
import useInboxData from './use-inbox-data';

export type EmptySpamScopeMode = 'selection' | 'filtered' | 'all';

type BulkScopeParams = {
	post_ids?: number[];
	search?: string;
	parent?: number;
	source?: number;
	before?: string;
	after?: string;
	is_unread?: boolean;
};

export type EmptySpamScope = {
	mode: EmptySpamScopeMode;
	count: number;
	params: BulkScopeParams;
};

type UseEmptySpamReturn = {
	isConfirmDialogOpen: boolean;
	openConfirmDialog: () => void;
	closeConfirmDialog: () => void;
	onConfirmEmptying: () => Promise< void >;
	isEmpty: boolean;
	isEmptying: boolean;
	totalItemsSpam: number;
	selectedResponsesCount: number;
	scope: EmptySpamScope;
};

const toInt = ( value: unknown ): number | undefined => {
	const n = typeof value === 'string' ? parseInt( value, 10 ) : Number( value );
	return Number.isFinite( n ) && n > 0 ? n : undefined;
};

const nonEmptyString = ( value: unknown ): string | undefined =>
	typeof value === 'string' && value !== '' ? value : undefined;

/**
 * Hook to manage empty spam functionality with scope awareness.
 *
 * The button can act on three different scopes, in priority order:
 * 1. `selection` — explicitly selected rows (`post_ids`).
 * 2. `filtered` — every spam response matching the current search/source/date/read filters.
 * 3. `all` — every spam response (legacy behavior when no selection or filter).
 *
 * @param props                - Optional props.
 * @param props.totalItemsSpam - The total number of spam items (optional, will use hook if not provided).
 * @return Object with empty spam state, scope, and handlers.
 */
export default function useEmptySpam( {
	totalItemsSpam: totalItemsSpamProp,
}: {
	totalItemsSpam?: number;
} = {} ): UseEmptySpamReturn {
	const [ isConfirmDialogOpen, setConfirmDialogOpen ] = useState( false );
	const [ isEmptying, setIsEmptying ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { invalidateResolutionForStoreSelector } = useDispatch( coreStore ) as unknown as {
		invalidateResolutionForStoreSelector: ( selector: string ) => void;
	};
	const { invalidateCounts } = useDispatch( dashboardStore );

	const hookData = useInboxData();
	const totalItemsSpam = totalItemsSpamProp ?? hookData.totalItemsSpam ?? 0;
	const { selectedResponsesCount, currentQuery } = hookData;

	const selectedIds = useSelect(
		select =>
			(
				select( dashboardStore ) as unknown as {
					getSelectedResponsesFromCurrentDataset: () => Array< number | string >;
				}
			 ).getSelectedResponsesFromCurrentDataset(),
		[]
	);

	const scope = useMemo< EmptySpamScope >( () => {
		const normalizedIds = ( selectedIds || [] )
			.map( id => ( typeof id === 'string' ? parseInt( id, 10 ) : id ) )
			.filter( ( id ): id is number => Number.isFinite( id ) && id > 0 );

		if ( normalizedIds.length > 0 ) {
			return {
				mode: 'selection',
				count: normalizedIds.length,
				params: { post_ids: normalizedIds },
			};
		}

		const params: BulkScopeParams = {};
		const search = nonEmptyString( currentQuery?.search );
		if ( search ) {
			params.search = search;
		}
		const parent = toInt( currentQuery?.parent );
		if ( parent ) {
			params.parent = parent;
		}
		const source = toInt( currentQuery?.source );
		if ( source ) {
			params.source = source;
		}
		const before = nonEmptyString( currentQuery?.before );
		if ( before ) {
			params.before = before;
		}
		const after = nonEmptyString( currentQuery?.after );
		if ( after ) {
			params.after = after;
		}
		if ( currentQuery?.is_unread !== undefined ) {
			params.is_unread = Boolean( currentQuery.is_unread );
		}

		const hasFilter = Object.keys( params ).length > 0;
		return {
			mode: hasFilter ? 'filtered' : 'all',
			count: totalItemsSpam,
			params,
		};
	}, [ selectedIds, currentQuery, totalItemsSpam ] );

	const isEmpty = scope.count === 0;

	const openConfirmDialog = useCallback( () => setConfirmDialogOpen( true ), [] );
	const closeConfirmDialog = useCallback( () => setConfirmDialogOpen( false ), [] );

	const onConfirmEmptying = useCallback( async () => {
		if ( isEmptying || isEmpty ) {
			return;
		}

		closeConfirmDialog();
		setIsEmptying( true );

		jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_empty_spam_click', {
			scope: scope.mode,
			count: scope.count,
		} );

		const payload: Record< string, unknown > = { status: 'spam', ...scope.params };

		apiFetch< { deleted?: number } >( {
			method: 'DELETE',
			path: '/wp/v2/feedback/trash',
			data: payload,
		} )
			.then( response => {
				const deleted = response?.deleted ?? 0;
				const message = sprintf(
					/* translators: %s: The number of responses. */
					_n(
						'%s spam response deleted permanently.',
						'%s spam responses deleted permanently.',
						deleted,
						'jetpack-forms'
					),
					formatNumber( deleted )
				);

				createSuccessNotice( message, { type: 'snackbar', id: 'empty-spam' } );
			} )
			.catch( () => {
				createErrorNotice( __( 'Could not empty spam.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: 'empty-spam-error',
				} );
			} )
			.finally( () => {
				setIsEmptying( false );
				invalidateCounts();
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
		scope,
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
		scope,
	};
}
