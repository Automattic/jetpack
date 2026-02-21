/**
 * Hook to handle AI form generation completion.
 * When AI generates form fields and central form management is enabled,
 * this hook automatically creates a synced form post type.
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedForm } from '../util/create-synced-form.ts';

interface UseAiFormGenerationProps {
	clientId: string;
	hasRef: boolean;
}

/**
 * Hook that sets up AI form generation completion handling.
 * When central form management is enabled, this will automatically
 * create a synced form after AI generates form fields.
 *
 * @param {UseAiFormGenerationProps} props          - Hook properties
 * @param {string}                   props.clientId - The block client ID
 * @param {boolean}                  props.hasRef   - Whether the block already has a ref attribute
 */
export function useAiFormGeneration( { clientId, hasRef }: UseAiFormGenerationProps ): void {
	const isCentralFormManagementEnabled = hasFeatureFlag( 'central-form-management' );

	const { currentPostId, postTitle, currentPostType } = useSelect( select => {
		const { getCurrentPostId, getEditedPostAttribute, getCurrentPostType } = select( editorStore );

		return {
			currentPostId: getCurrentPostId() || 0,
			postTitle: ( getEditedPostAttribute( 'title' ) as string ) || '',
			currentPostType: getCurrentPostType(),
		};
	}, [] );

	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch( blockEditorStore );

	// Use a ref to get the latest block data when the action fires
	const getBlock = useSelect( select => select( blockEditorStore ).getBlock, [] );

	// Use refs to avoid stale closures in the action callback
	const clientIdRef = useRef( clientId );
	const hasRefRef = useRef( hasRef );
	const currentPostTypeRef = useRef( currentPostType );
	const postTitleRef = useRef( postTitle );
	const currentPostIdRef = useRef( currentPostId );

	// Update refs when values change
	useEffect( () => {
		clientIdRef.current = clientId;
		hasRefRef.current = hasRef;
		currentPostTypeRef.current = currentPostType;
		postTitleRef.current = postTitle;
		currentPostIdRef.current = currentPostId;
	}, [ clientId, hasRef, currentPostType, postTitle, currentPostId ] );

	// Callback to create synced form after AI generation
	const handleAiGenerationComplete = useCallback(
		async ( generatedClientId: string, blockName: string ) => {
			// Only handle contact-form blocks
			if ( blockName !== 'jetpack/contact-form' ) {
				return;
			}

			// Only handle this specific block
			if ( generatedClientId !== clientIdRef.current ) {
				return;
			}

			// Don't create synced form if already in form editor
			if ( currentPostTypeRef.current === FORM_POST_TYPE ) {
				return;
			}

			// Don't create synced form if already has a ref
			if ( hasRefRef.current ) {
				return;
			}

			// Get fresh block data
			const block = getBlock( generatedClientId );
			if ( ! block || ! block.innerBlocks?.length ) {
				return;
			}

			// Check again if block has ref (might have been set during generation)
			if ( block.attributes?.ref ) {
				return;
			}

			const formTitle = postTitleRef.current || __( 'AI Generated Form', 'jetpack-forms' );

			try {
				// Create the synced form using the helper function
				const formId = await createSyncedForm(
					{ attributes: block.attributes, innerBlocks: block.innerBlocks },
					formTitle,
					Number( currentPostIdRef.current ) || 0
				);

				if ( ! formId ) {
					return;
				}

				// Clear inner blocks and set ref to the new form
				replaceInnerBlocks( generatedClientId, [], false );

				// Clear all attributes and set only the ref
				const clearedAttributes = Object.keys( block.attributes || {} ).reduce(
					( acc, key ) => ( { ...acc, [ key ]: undefined } ),
					{ ref: formId }
				);
				updateBlockAttributes( generatedClientId, clearedAttributes );
			} catch ( error ) {
				// If synced form creation fails, the inline form remains functional
				// eslint-disable-next-line no-console
				console.error( 'Failed to create synced form:', error );
			}
		},
		[ getBlock, replaceInnerBlocks, updateBlockAttributes ]
	);

	// Subscribe to the AI generation complete action only if central form management is enabled
	useEffect( () => {
		if ( ! isCentralFormManagementEnabled ) {
			return;
		}

		const actionName = 'jetpack_ai_assistant_generation_complete';
		const namespace = `jetpack-forms-${ clientId }`;

		addAction( actionName, namespace, handleAiGenerationComplete );

		return () => {
			removeAction( actionName, namespace );
		};
	}, [ clientId, isCentralFormManagementEnabled, handleAiGenerationComplete ] );
}
