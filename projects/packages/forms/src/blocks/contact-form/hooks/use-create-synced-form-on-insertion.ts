/**
 * Hook to create a synced form when a form variation is inserted via the block inserter.
 *
 * When users insert a form variation directly from the block inserter (e.g., "Contact Form"),
 * WordPress creates the block with innerBlocks immediately, bypassing the VariationPicker.
 * This hook detects that scenario and creates a synced form, setting the ref attribute.
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { createBlock, type Block } from '@wordpress/blocks';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedForm } from '../util/create-synced-form.ts';
import variations from '../variations.js';

interface UseCreateSyncedFormOnInsertionProps {
	ref: number | undefined;
	innerBlocks: Block[];
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

/**
 * Get the variation title from attributes or inner blocks structure.
 * If the form matches a known variation template, returns that variation's title.
 * If the form has inner blocks but doesn't match a known template, returns a generic "Form" title.
 * If the form has no inner blocks, returns undefined.
 *
 * @param {Record<string, unknown>} attributes  - Block attributes.
 * @param {Block[]}                 innerBlocks - Inner blocks of the form.
 * @return {string | undefined} The variation title, a generic "Form" title, or undefined when there are no inner blocks.
 */
function getVariationTitleFromAttributes(
	attributes: Record< string, unknown >,
	innerBlocks: Block[]
): string | undefined {
	// First check if there's a variationName attribute that matches a known variation
	const variationName = attributes.variationName as string | undefined;
	if ( variationName ) {
		const matchingVariation = variations.find( v => {
			// Check if the variation's attributes include this variationName
			return (
				v.attributes?.variationName === variationName ||
				( v.name === 'contact-form' && variationName === 'default' )
			);
		} );
		if ( matchingVariation ) {
			return matchingVariation.title;
		}
	}

	// If no variationName, try to match by inner blocks structure
	// This is a simple heuristic based on the number and types of inner blocks
	if ( innerBlocks.length === 0 ) {
		return undefined;
	}

	// Look for specific patterns that identify variations
	const blockNames = innerBlocks.map( b => b.name );

	// Rating field is unique to feedback form
	if ( blockNames.includes( 'jetpack/field-rating' ) ) {
		const feedbackVariation = variations.find( v => v.name === 'feedback-form' );
		return feedbackVariation?.title;
	}

	// Date field is unique to appointment form
	if ( blockNames.includes( 'jetpack/field-date' ) ) {
		const appointmentVariation = variations.find( v => v.name === 'appointment-form' );
		return appointmentVariation?.title;
	}

	// Radio field with name/email suggests RSVP (no date/phone)
	if (
		blockNames.includes( 'jetpack/field-radio' ) &&
		! blockNames.includes( 'jetpack/field-telephone' )
	) {
		const rsvpVariation = variations.find( v => v.name === 'rsvp-form' );
		return rsvpVariation?.title;
	}

	// Phone + select suggests registration form
	if (
		blockNames.includes( 'jetpack/field-telephone' ) &&
		blockNames.includes( 'jetpack/field-select' )
	) {
		const registrationVariation = variations.find( v => v.name === 'registration-form' );
		return registrationVariation?.title;
	}

	// Consent field suggests lead capture
	if ( blockNames.includes( 'jetpack/field-consent' ) ) {
		const leadCaptureVariation = variations.find( v => v.name === 'lead-capture-form' );
		return leadCaptureVariation?.title;
	}

	// Default to contact form for name/email/textarea pattern
	if (
		blockNames.includes( 'jetpack/field-name' ) &&
		blockNames.includes( 'jetpack/field-email' ) &&
		blockNames.includes( 'jetpack/field-textarea' )
	) {
		const contactVariation = variations.find( v => v.name === 'contact-form' );
		return contactVariation?.title;
	}

	// Fallback to generic form title
	return __( 'Form', 'jetpack-forms' );
}

/**
 * Hook to create a synced form when a form variation is inserted via the block inserter.
 *
 * @param {UseCreateSyncedFormOnInsertionProps} props - Hook properties.
 */
export function useCreateSyncedFormOnInsertion( {
	ref,
	innerBlocks,
	attributes,
	setAttributes,
}: UseCreateSyncedFormOnInsertionProps ): void {
	const hasAttemptedCreation = useRef( false );
	const registry = useRegistry();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );

	const { currentPostType, currentPostId } = useSelect( select => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			currentPostType: getCurrentPostType(),
			currentPostId: getCurrentPostId(),
		};
	}, [] );

	const isEditingJetpackFormPost = currentPostType === FORM_POST_TYPE;

	useEffect( () => {
		// Only run this effect once
		if ( hasAttemptedCreation.current ) {
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
				const formTitle = getVariationTitleFromAttributes( attributes, innerBlocks );

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

				// Set the ref attribute to link to the synced form
				registry.batch( () => {
					setAttributes( { ref: formId } );
				} );

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
	}, [
		ref,
		innerBlocks,
		attributes,
		isEditingJetpackFormPost,
		isCentralFormManagementEnabled,
		currentPostId,
		setAttributes,
		registry,
		createSuccessNotice,
		createErrorNotice,
	] );
}
