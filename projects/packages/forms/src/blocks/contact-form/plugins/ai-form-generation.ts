/**
 * AI Form Generation Integration
 *
 * This integration module connects the Forms package with the AI Assistant extension.
 * It listens for AI generation completion events and automatically creates synced forms.
 *
 * This script is conditionally loaded by PHP only when:
 * 1. The AI Assistant extension is available
 * 2. The central-form-management feature flag is enabled
 *
 * By gating at the PHP level, we ensure:
 * - No JS is loaded if either condition is not met
 * - Clean separation between Forms and AI Assistant packages
 * - The hook callback only runs when AI actually generates content
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { addAction, hasAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedForm } from '../util/create-synced-form.ts';

/**
 * Handle AI generation completion for contact forms.
 * Creates a synced form when AI generates form fields.
 *
 * @param clientId  - The block client ID that received AI-generated content.
 * @param blockName - The block type name (e.g., 'jetpack/contact-form').
 */
export async function handleAiGenerationComplete(
	clientId: string,
	blockName: string
): Promise< void > {
	// Only handle contact-form blocks
	if ( blockName !== 'jetpack/contact-form' ) {
		return;
	}

	// Don't create synced form if already in form editor
	const editorSelectors = select( editorStore );
	const currentPostType = editorSelectors.getCurrentPostType();
	if ( currentPostType === FORM_POST_TYPE ) {
		return;
	}

	// Get the block data
	const blockEditorSelectors = select( blockEditorStore );
	const block = blockEditorSelectors.getBlock( clientId );
	if ( ! block || ! block.innerBlocks?.length ) {
		return;
	}

	// Don't create synced form if already has a ref (synced form)
	if ( block.attributes?.ref ) {
		return;
	}

	const currentPostId = editorSelectors.getCurrentPostId() || 0;
	const postTitle =
		( editorSelectors.getEditedPostAttribute( 'title' ) as string ) ||
		__( 'Generated Form', 'jetpack-forms' );

	try {
		// Create the synced form
		const formId = await createSyncedForm(
			{ attributes: block.attributes, innerBlocks: block.innerBlocks },
			postTitle,
			Number( currentPostId ) || 0
		);

		if ( ! formId ) {
			return;
		}

		// Re-fetch the block after the async operation to ensure it still exists
		// and hasn't been modified (e.g., by user edits, undo/redo, or another sync).
		const updatedBlock = blockEditorSelectors.getBlock( clientId );
		if ( ! updatedBlock || updatedBlock.attributes?.ref ) {
			return;
		}

		// Set the ref attribute to link to the synced form.
		dispatch( blockEditorStore ).updateBlockAttributes( clientId, { ref: formId } );
	} catch ( error ) {
		// If synced form creation fails, the inline form remains functional
		// eslint-disable-next-line no-console
		console.error( 'Failed to create synced form:', error );
		dispatch( noticesStore ).createErrorNotice(
			__(
				'Failed to save the Generated form. Your form is still available but not synced.',
				'jetpack-forms'
			),
			{ type: 'snackbar' }
		);
	}
}

/**
 * Initialize the AI form generation integration.
 *
 * Sets up a hook listener for AI Assistant generation completion events.
 * This script is only loaded when both the AI Assistant extension is available
 * and central-form-management feature flag is enabled (checked in PHP).
 */
export function initAiFormGenerationIntegration(): void {
	hasAction( 'jetpack_ai_assistant_generation_complete', 'jetpack-forms/ai-integration' ) ||
		addAction(
			'jetpack_ai_assistant_generation_complete',
			'jetpack-forms/ai-integration',
			handleAiGenerationComplete
		);
}

// Auto-initialize when this script is loaded
initAiFormGenerationIntegration();
