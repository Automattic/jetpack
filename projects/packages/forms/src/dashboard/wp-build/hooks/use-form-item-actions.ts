/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';
import { getEmbedCode, getShortcode } from '../../../blocks/shared/util/embed-codes';
import { NON_TRASH_FORM_STATUSES } from '../../constants';
import { getFormsListQuery } from '../../hooks/use-forms-data.ts';
import useDuplicateForm from './use-duplicate-form';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';

type FormItem = Pick< FormListItem, 'id' > & Partial< Pick< FormListItem, 'title' | 'status' > >;

type UpdateStatusOptions = {
	invalidateQueries?: Array< Record< string, unknown > >;
};

type UseFormItemActionsReturn = {
	duplicateForm: ( item: FormItem ) => Promise< void >;
	previewForm: ( item: FormItem ) => Promise< void >;
	copyEmbed: ( item: FormItem ) => Promise< void >;
	copyShortcode: ( item: FormItem ) => Promise< void >;
	isDuplicating: boolean;
	isUpdatingStatus: boolean;
	publishForms: ( items: FormItem[], options?: UpdateStatusOptions ) => Promise< void >;
	setFormsToDraft: ( items: FormItem[], options?: UpdateStatusOptions ) => Promise< void >;
};

/**
 * Shared form-level action callbacks (Duplicate, Preview, Copy embed, Copy shortcode, Publish, Unpublish).
 *
 * Each callback accepts a minimal `{ id, title? }` object so it works with both
 * full `FormListItem` records (DataViews table) and a simple form ID + title
 * (single form view header).
 *
 * @return Action callbacks and in-flight state.
 */
export default function useFormItemActions(): UseFormItemActionsReturn {
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { duplicateForm, isDuplicating } = useDuplicateForm();
	const [ isUpdatingStatus, setIsUpdatingStatus ] = useState( false );
	const isUpdatingStatusRef = useRef( false );
	const { saveEntityRecord, invalidateResolution } = useDispatch( 'core' ) as {
		saveEntityRecord: (
			kind: string,
			name: string,
			record: Record< string, unknown >,
			options?: { throwOnError?: boolean }
		) => Promise< unknown >;
		invalidateResolution: ( selector: string, args: unknown[] ) => void;
	};

	const previewForm = useCallback( async ( item: FormItem ) => {
		try {
			const response = await apiFetch< { preview_url: string } >( {
				path: `/wp/v2/jetpack-forms/${ item.id }/preview-url`,
			} );
			window.open( response.preview_url, '_blank' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to get preview URL:', error );
		}
	}, [] );

	const copyEmbed = useCallback(
		async ( item: FormItem ) => {
			const embedCode = getEmbedCode( item.id );
			try {
				await navigator.clipboard.writeText( embedCode );
				createSuccessNotice( __( 'Embed code copied to clipboard.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to copy embed code. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice, createSuccessNotice ]
	);

	const copyShortcode = useCallback(
		async ( item: FormItem ) => {
			const shortcode = getShortcode( item.id );
			try {
				await navigator.clipboard.writeText( shortcode );
				createSuccessNotice( __( 'Shortcode copied to clipboard.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to copy shortcode. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice, createSuccessNotice ]
	);

	const invalidateListQuery = useCallback(
		( query: Record< string, unknown > ) => {
			invalidateResolution( 'getEntityRecords', [ 'postType', FORM_POST_TYPE, query ] );
			invalidateResolution( 'getEntityRecords', [
				'postType',
				FORM_POST_TYPE,
				{ ...query, per_page: 1, _fields: 'id' },
			] );
		},
		[ invalidateResolution ]
	);

	const updateStatus = useCallback(
		async (
			items: FormItem[],
			nextStatus: 'publish' | 'draft',
			options: UpdateStatusOptions = {}
		) => {
			if ( isUpdatingStatusRef.current || ! items?.length ) {
				return;
			}

			isUpdatingStatusRef.current = true;
			setIsUpdatingStatus( true );
			try {
				// Capture each item's current status before updating so undo can restore it.
				const previousStatuses = new Map( items.map( item => [ item.id, item.status ] ) );
				const promises = await Promise.allSettled(
					items.map( item =>
						saveEntityRecord(
							'postType',
							FORM_POST_TYPE,
							{ id: item.id, status: nextStatus },
							{ throwOnError: true }
						)
					)
				);

				const updatedCount = promises.filter( p => p.status === 'fulfilled' ).length;
				const failedCount = promises.length - updatedCount;

				if ( updatedCount ) {
					const message =
						nextStatus === 'publish'
							? sprintf(
									/* translators: %d: number of forms */
									_n( '%d form published.', '%d forms published.', updatedCount, 'jetpack-forms' ),
									updatedCount
							  )
							: sprintf(
									/* translators: %d: number of forms */
									_n(
										'%d form set to draft.',
										'%d forms set to draft.',
										updatedCount,
										'jetpack-forms'
									),
									updatedCount
							  );
					const fallbackStatus = nextStatus === 'publish' ? 'draft' : 'publish';
					createSuccessNotice( message, {
						type: 'snackbar',
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: async () => {
									if ( isUpdatingStatusRef.current ) {
										return;
									}
									isUpdatingStatusRef.current = true;
									setIsUpdatingStatus( true );
									try {
										await Promise.allSettled(
											items.map( item =>
												saveEntityRecord(
													'postType',
													FORM_POST_TYPE,
													{
														id: item.id,
														status: previousStatuses.get( item.id ) || fallbackStatus,
													},
													{ throwOnError: true }
												)
											)
										);
										// Invalidate list queries to refetch with updated statuses.
										// Individual entity invalidation is unnecessary since saveEntityRecord
										// already updates the record in the store.
										const undoQueries = options.invalidateQueries?.length
											? options.invalidateQueries
											: [
													getFormsListQuery( 1, 20, '', NON_TRASH_FORM_STATUSES ) as Record<
														string,
														unknown
													>,
											  ];
										undoQueries.forEach( invalidateListQuery );
									} finally {
										isUpdatingStatusRef.current = false;
										setIsUpdatingStatus( false );
									}
								},
							},
						],
					} );
				}
				if ( failedCount ) {
					const errorMessage =
						nextStatus === 'publish'
							? sprintf(
									/* translators: %d: number of forms */
									_n(
										'Could not publish %d form.',
										'Could not publish %d forms.',
										failedCount,
										'jetpack-forms'
									),
									failedCount
							  )
							: sprintf(
									/* translators: %d: number of forms */
									_n(
										'Could not set %d form to draft.',
										'Could not set %d forms to draft.',
										failedCount,
										'jetpack-forms'
									),
									failedCount
							  );
					createErrorNotice( errorMessage, {
						type: 'snackbar',
					} );
				}

				const invalidateQueries = options.invalidateQueries?.length
					? options.invalidateQueries
					: [
							getFormsListQuery( 1, 20, '', NON_TRASH_FORM_STATUSES ) as Record< string, unknown >,
					  ];
				invalidateQueries.forEach( invalidateListQuery );
			} finally {
				isUpdatingStatusRef.current = false;
				setIsUpdatingStatus( false );
			}
		},
		[ createErrorNotice, createSuccessNotice, invalidateListQuery, saveEntityRecord ]
	);

	const publishForms = useCallback(
		async ( items: FormItem[], options?: UpdateStatusOptions ) => {
			await updateStatus( items, 'publish', options );
		},
		[ updateStatus ]
	);

	const setFormsToDraft = useCallback(
		async ( items: FormItem[], options?: UpdateStatusOptions ) => {
			await updateStatus( items, 'draft', options );
		},
		[ updateStatus ]
	);

	return {
		duplicateForm,
		previewForm,
		copyEmbed,
		copyShortcode,
		isDuplicating,
		isUpdatingStatus,
		publishForms,
		setFormsToDraft,
	};
}
