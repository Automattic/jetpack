/**
 * External dependencies
 */
import { resolveSelect, useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { FORM_SOURCE_META_KEY } from '../../../blocks/shared/util/constants.js';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';

type CoreDispatch = {
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
};

type DuplicateFormQuery = Record< string, unknown >;

type JetpackFormEntityRecord = {
	content?: { raw?: unknown };
};

type UseDuplicateFormArgs = {
	currentQuery: DuplicateFormQuery;
};

type UseDuplicateFormReturn = {
	duplicateForm: ( item: FormListItem ) => Promise< void >;
	isDuplicating: boolean;
};

/**
 * Duplicate a `jetpack_form` post and refresh the current list query.
 *
 * @param params              - Hook params.
 * @param params.currentQuery - The exact core-data query object used for the current Forms list view.
 * @return Duplicate handler and in-flight state.
 */
export default function useDuplicateForm( {
	currentQuery,
}: UseDuplicateFormArgs ): UseDuplicateFormReturn {
	const [ isDuplicating, setIsDuplicating ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, invalidateResolution } = useDispatch(
		'core'
	) as unknown as CoreDispatch;

	const invalidateListQueries = useCallback(
		( query: DuplicateFormQuery ) => {
			// Invalidate list results.
			invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', query ] );
			// Invalidate totals (core-data uses a separate selector under the hood).
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'jetpack_form',
				{ ...query, per_page: 1, _fields: 'id' },
			] );
		},
		[ invalidateResolution ]
	);

	const duplicateForm = useCallback(
		async ( item: FormListItem ) => {
			if ( isDuplicating ) {
				return;
			}
			if ( ! item?.id ) {
				return;
			}

			setIsDuplicating( true );
			try {
				const original: unknown = await resolveSelect( 'core' ).getEntityRecord(
					'postType',
					'jetpack_form',
					item.id,
					{ context: 'edit' }
				);
				if ( ! original ) {
					createErrorNotice(
						__( 'Could not load the form to duplicate. Please try again.', 'jetpack-forms' ),
						{
							type: 'snackbar',
						}
					);
					return;
				}
				const originalRecord = original as JetpackFormEntityRecord | null | undefined;
				const raw = originalRecord?.content?.raw;
				const originalContentRaw = typeof raw === 'string' ? raw : '';

				const originalTitle = item.title || __( 'Untitled Form', 'jetpack-forms' );
				const newTitle = sprintf(
					/* translators: %s: original form title */
					__( '%s Copy', 'jetpack-forms' ),
					originalTitle
				);

				const created = ( await saveEntityRecord(
					'postType',
					'jetpack_form',
					{
						title: newTitle,
						// Duplicate the raw block content so the form is an exact copy.
						content: originalContentRaw,
						status: 'publish',
						meta: {
							[ FORM_SOURCE_META_KEY ]: item.id,
						},
					},
					{ throwOnError: true }
				) ) as { id?: number } | undefined;

				const createdId = created?.id;
				if ( ! createdId ) {
					createErrorNotice( __( 'Could not duplicate form. Please try again.', 'jetpack-forms' ), {
						type: 'snackbar',
					} );
					return;
				}

				invalidateListQueries( currentQuery );

				createSuccessNotice( __( 'Form duplicated.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Could not duplicate form. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} finally {
				setIsDuplicating( false );
			}
		},
		[
			createErrorNotice,
			createSuccessNotice,
			currentQuery,
			invalidateListQueries,
			isDuplicating,
			saveEntityRecord,
		]
	);

	return { duplicateForm, isDuplicating };
}
