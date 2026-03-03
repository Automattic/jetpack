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
 * Get the variation title from the variationName attribute.
 *
 * Returns the matching variation's title if variationName is set and matches a known variation.
 * Returns undefined if variationName is not set or doesn't match any known variation.
 *
 * @param {Record<string, unknown>} attributes - Block attributes.
 * @return {string | undefined} The variation title, or undefined.
 */
function getVariationTitle( attributes: Record< string, unknown > ): string | undefined {
	const variationName = attributes.variationName as string | undefined;
	if ( ! variationName ) {
		return undefined;
	}

	const matchingVariation = variations.find(
		v => v.attributes?.variationName === variationName || v.name === variationName
	);

	return matchingVariation?.title;
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

	const { currentPostType, currentPostId, wasBlockJustInserted } = useSelect(
		select => {
			const { getCurrentPostType, getCurrentPostId } = select( editorStore );
			return {
				currentPostType: getCurrentPostType(),
				currentPostId: getCurrentPostId(),
				wasBlockJustInserted: select( blockEditorStore ).wasBlockJustInserted( clientId ),
			};
		},
		[ clientId ]
	);

	const isEditingJetpackFormPost = currentPostType === FORM_POST_TYPE;

	useEffect( () => {
		// Only run this effect once
		if ( hasAttemptedCreation.current ) {
			return;
		}

		// Skip if block was not just inserted
		if ( ! wasBlockJustInserted ) {
			return;
		}

		// Skip if we already have a ref (already synced)
		if ( ref ) {
			hasAttemptedCreation.current = true;
			return;
		}

		// Skip if no inner blocks (empty form, will show VariationPicker)
		if ( ! innerBlocks || innerBlocks.length === 0 ) {
			return;
		}

		// Skip if editing a jetpack_form post directly
		if ( isEditingJetpackFormPost ) {
			hasAttemptedCreation.current = true;
			return;
		}

		// Skip if central form management is disabled
		if ( ! isCentralFormManagementEnabled ) {
			hasAttemptedCreation.current = true;
			return;
		}

		// Mark that we've attempted creation
		hasAttemptedCreation.current = true;

		// Create the synced form
		const createForm = async () => {
			try {
				// Get the variation title for naming the form
				const formTitle = getVariationTitle( attributes );

				// Create a block with the current attributes and inner blocks
				const formBlock = createBlock(
					'jetpack/contact-form',
					attributes as Record< string, unknown >,
					innerBlocks
				);

				// Create the synced form post
				const formId = await createSyncedForm(
					formBlock,
					formTitle || __( 'Form', 'jetpack-forms' ),
					currentPostId
				);

				// Preload the entity record into the cache before setting ref
				// to prevent the form from showing a loading skeleton.
				await resolveSelect( coreStore ).getEntityRecord( 'postType', FORM_POST_TYPE, formId );

				setAttributes( { ref: formId } );

				createSuccessNotice( __( 'New form created.', 'jetpack-forms' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to create synced form on insertion:', error );
				createErrorNotice(
					__( 'Failed to create form. Using inline form instead.', 'jetpack-forms' ),
					{
						type: 'snackbar',
						isDismissible: true,
					}
				);
				// Form will remain as inline form (no ref)
			}
		};

		createForm();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
