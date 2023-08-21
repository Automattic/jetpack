/**
 * External dependencies
 */
import { ERROR_QUOTA_EXCEEDED, useAiContext } from '@automattic/jetpack-ai-client';
import { createBlock } from '@wordpress/blocks';
import { parse } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { fixIncompleteHTML } from '../../../lib/utils/fix-incomplete-html';
import { AiAssistantUiContextProvider } from './context';
/**
 * Types
 */
import type { RequestingErrorProps } from '@automattic/jetpack-ai-client';

// An identifier to use on the extension error notices,
export const AI_ASSISTANT_JETPACK_FORM_NOTICE_ID = 'ai-assistant';

/**
 * Select the Jetpack Form block,
 * based on the block client ID.
 * Then, run the function passed as parameter (optional).
 *
 * @param {string} clientId - The block client ID.
 * @param {Function} fn     - The function to run after selecting the block.
 * @returns {void}
 */
export function selectFormBlock( clientId: string, fn: () => void ): void {
	dispatch( 'core/block-editor' ).selectBlock( clientId ).then( fn );
}

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { clientId, isSelected } = props;

		// AI Assistant input value
		const [ inputValue, setInputValue ] = useState( '' );

		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( true );

		// AI Assistant component is-fixed state
		const [ isFixed, setAssistantFixed ] = useState( false );

		const [ assistantAnchor, setAssistantAnchor ] = useState< HTMLElement | null >( null );

		// Keep track of the current list of valid blocks between renders.
		const currentListOfValidBlocks = useRef( [] );

		const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
		const coreEditorSelect = useSelect( select => select( 'core/editor' ), [] ) as {
			getCurrentPostId: () => number;
		};
		const postId = coreEditorSelect.getCurrentPostId();

		/**
		 * Show the AI Assistant
		 *
		 * @returns {void}
		 */
		const show = useCallback( () => {
			setAssistantVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant
		 *
		 * @returns {void}
		 */
		const hide = useCallback( () => {
			setAssistantVisibility( false );
		}, [] );

		/**
		 * Toggle the AI Assistant visibility
		 *
		 * @returns {void}
		 */
		const toggle = useCallback( () => {
			setAssistantVisibility( ! isVisible );
		}, [ isVisible ] );

		/**
		 * Set the AI Assistant anchor
		 *
		 * @param {HTMLElement} anchor
		 */
		const setAnchor = useCallback( ( anchor: HTMLElement | null ) => {
			setAssistantAnchor( anchor );
		}, [] );

		const { createNotice } = useDispatch( noticesStore );

		/**
		 * Show the error notice
		 *
		 * @param {RequestingErrorProps} suggestionError
		 * @returns {void}
		 */
		const showSuggestionError = useCallback(
			( { severity, message, code }: RequestingErrorProps ) => {
				if ( code !== ERROR_QUOTA_EXCEEDED ) {
					createNotice( severity, message, {
						isDismissible: true,
						id: AI_ASSISTANT_JETPACK_FORM_NOTICE_ID,
					} );
				}
			},
			[ createNotice ]
		);

		// Show/hide the assistant based on the block selection.
		useEffect( () => {
			if ( isSelected ) {
				return;
			}
			hide();
		}, [ isSelected, hide ] );

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				// Value of the input element.
				inputValue,
				setInputValue,

				// Assistant bar visibility.
				isVisible,
				show,
				hide,
				toggle,

				// Assistant bar position and size.
				isFixed,
				setAssistantFixed,

				// Assistant bar anchor.
				assistantAnchor,
				setAnchor,
			} ),
			[ inputValue, isVisible, show, hide, toggle, isFixed, assistantAnchor, setAnchor ]
		);

		const setContent = useCallback(
			( newContent: string, isRequestDone = false ) => {
				// Remove the Jetpack Form block from the content.
				const processedContent = newContent.replace(
					/<!-- (\/)*wp:jetpack\/(contact-)*form ({.*} )*(\/)*-->/g,
					''
				);

				// Fix HTML tags that are not closed properly.
				const fixedContent = fixIncompleteHTML( processedContent );

				const newContentBlocks = parse( fixedContent );

				// Check if the generated blocks are valid.
				const validBlocks = newContentBlocks.filter( block => {
					return block.isValid && block.name !== 'core/freeform' && block.name !== 'core/missing';
				} );

				// Only update the blocks when the valid list changed, meaning a new block arrived.
				if ( validBlocks.length !== currentListOfValidBlocks.current.length ) {
					// Only update the valid blocks
					replaceInnerBlocks( clientId, validBlocks );

					// Update the list of current valid blocks
					currentListOfValidBlocks.current = validBlocks;
				}

				// Final form adjustments (only when the request is done)
				if ( isRequestDone ) {
					/*
					 * Inspect generated blocks list,
					 * checking if the jetpack/button block:
					 * - if it exists twice or more, remove the first one.
					 * - if it does not exist, create one.
					 */
					const allButtonBlocks = validBlocks.filter( block => block.name === 'jetpack/button' );
					currentListOfValidBlocks.current = currentListOfValidBlocks.current || [];
					if ( allButtonBlocks.length > 1 ) {
						// Remove all button blocks, less the last one.
						let buttonCounter = 0;
						currentListOfValidBlocks.current = currentListOfValidBlocks.current.filter( block => {
							if ( block.name !== 'jetpack/button' ) {
								return true;
							}

							buttonCounter++;
							if ( buttonCounter === allButtonBlocks.length ) {
								return true;
							}
							return false;
						} );

						replaceInnerBlocks( clientId, currentListOfValidBlocks.current );
					} else if ( allButtonBlocks.length === 0 ) {
						// One button block is required.
						replaceInnerBlocks( clientId, [
							...currentListOfValidBlocks.current,
							createBlock( 'jetpack/button', {
								label: __( 'Submit', 'jetpack' ),
								element: 'button',
								text: __( 'Submit', 'jetpack' ),
								borderRadius: 8,
								lock: {
									remove: true,
								},
							} ),
						] );
					}
				}
			},
			[ clientId, replaceInnerBlocks ]
		);

		useAiContext( {
			askQuestionOptions: { postId },
			onDone: finalContent => {
				setContent( finalContent, true );
				setInputValue( '' );
			},
			onSuggestion: setContent,
			onError: showSuggestionError,
		} );

		/*
		 * Ensure to provide data context,
		 * and the AI Assistant component (popover)
		 * only if is't possible to extend the block.
		 */
		if ( ! isPossibleToExtendJetpackFormBlock( props.name, { clientId: props.clientId } ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': () => selectFormBlock( clientId, show ),
					} }
				>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
