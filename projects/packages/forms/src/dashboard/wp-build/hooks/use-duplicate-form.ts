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
import useConfigValue from '../../../hooks/use-config-value';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';

type DuplicateFormItem = Pick< FormListItem, 'id' > & Partial< Pick< FormListItem, 'title' > >;

type CoreDispatch = {
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
};

type JetpackFormEntityRecord = {
	content?: { raw?: unknown };
};

type UseDuplicateFormReturn = {
	duplicateForm: ( item: DuplicateFormItem ) => Promise< void >;
	isDuplicating: boolean;
};

/**
 * Duplicate a `jetpack_form` post.
 *
 * @return Duplicate handler and in-flight state.
 */
export default function useDuplicateForm(): UseDuplicateFormReturn {
	const [ isDuplicating, setIsDuplicating ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( 'core' ) as unknown as CoreDispatch;
	const adminUrl = useConfigValue( 'adminUrl' ) || '';

	const duplicateForm = useCallback(
		async ( item: DuplicateFormItem ) => {
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
				const raw = ( original as JetpackFormEntityRecord ).content?.raw;
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

				createSuccessNotice( __( 'Form duplicated.', 'jetpack-forms' ), {
					type: 'snackbar',
					actions: [
						{
							label: __( 'Edit', 'jetpack-forms' ),
							onClick: () => {
								if ( adminUrl ) {
									window.location.href = `${ adminUrl }post.php?post=${ createdId }&action=edit&post_type=jetpack_form`;
								}
							},
						},
					],
				} );
			} catch {
				createErrorNotice( __( 'Could not duplicate form. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} finally {
				setIsDuplicating( false );
			}
		},
		[ createErrorNotice, createSuccessNotice, adminUrl, isDuplicating, saveEntityRecord ]
	);

	return { duplicateForm, isDuplicating };
}
