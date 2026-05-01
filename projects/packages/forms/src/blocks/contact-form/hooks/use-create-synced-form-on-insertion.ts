/**
 * Hook to create a synced form when a form variation is inserted via the block inserter.
 *
 * When users insert a form variation directly from the block inserter (e.g., "Contact Form"),
 * WordPress creates the block with innerBlocks immediately, bypassing the VariationPicker.
 * This hook detects that scenario and creates a synced form, setting the ref attribute.
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, type Block } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch, resolveSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedForm } from '../util/create-synced-form.ts';
import variations from '../variations.js';

interface UseCreateSyncedFormOnInsertionProps {
	clientId: string;
	ref: number | undefined;
	innerBlocks: Block[];
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * Hook to create a synced form when a form variation is inserted via the block inserter.
 *
 * @param {UseCreateSyncedFormOnInsertionProps} props - Hook properties.
 */
export function useCreateSyncedFormOnInsertion( {
	clientId,
	ref,
	innerBlocks,
	attributes,
	setAttributes,
}: UseCreateSyncedFormOnInsertionProps ): void {
	const hasAttemptedCreation = useRef( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );

	// Short-circuit store queries after creation has been attempted.
	const { currentPostId, shouldCreate } = useSelect(
		select => {
			if ( hasAttemptedCreation.current ) {
				return { currentPostId: 0, shouldCreate: false };
			}

			const { getCurrentPostType, getCurrentPostId } = select( editorStore );

			return {
				currentPostId: getCurrentPostId(),
				shouldCreate:
					isCentralFormManagementEnabled &&
					!! attributes.variationName &&
					select( blockEditorStore ).wasBlockJustInserted( clientId ) &&
					! ref &&
					innerBlocks?.length > 0 &&
					getCurrentPostType() !== FORM_POST_TYPE,
			};
		},
		[ clientId, ref, innerBlocks, attributes.variationName, isCentralFormManagementEnabled ]
	);

	useEffect( () => {
		if ( hasAttemptedCreation.current || ! shouldCreate ) {
			return;
		}

		hasAttemptedCreation.current = true;

		let cancelled = false;

		( async () => {
			try {
				const name = attributes.variationName as string | undefined;
				const formTitle =
					variations.find( v => v.attributes?.variationName === name )?.title ||
					__( 'Form', 'jetpack-forms' );

				const formBlock = createBlock(
					'jetpack/contact-form',
					attributes as Record< string, unknown >,
					innerBlocks
				);

				const formId = await createSyncedForm( formBlock, formTitle, Number( currentPostId ) );

				if ( cancelled ) {
					return;
				}

				// Best-effort preload of the entity record into the cache before setting ref
				// to prevent the form from showing a loading skeleton.
				try {
					await resolveSelect( coreStore ).getEntityRecord( 'postType', FORM_POST_TYPE, formId );
				} catch {
					// Preload failed; the form will show a brief loading state.
				}

				if ( cancelled ) {
					return;
				}

				setAttributes( { ref: formId } );

				createSuccessNotice( __( 'New form created.', 'jetpack-forms' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			} catch ( error ) {
				if ( cancelled ) {
					return;
				}

				// eslint-disable-next-line no-console
				console.error( 'Failed to create synced form on insertion:', error );
				createErrorNotice(
					__( 'Failed to create form. Using inline form instead.', 'jetpack-forms' ),
					{
						type: 'snackbar',
						isDismissible: true,
					}
				);
			}
		} )();

		return () => {
			cancelled = true;
			hasAttemptedCreation.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
