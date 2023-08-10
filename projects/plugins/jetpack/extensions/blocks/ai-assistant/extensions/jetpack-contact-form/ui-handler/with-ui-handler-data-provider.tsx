/**
 * External dependencies
 */
import { useAiContext } from '@automattic/jetpack-ai-client';
import { parse } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
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
 * Add the `jetpack-ai-assistant-bar-is-fixed` class to the body
 * when the toolbar is fixed and the AI Assistant is visible.
 *
 * @param {boolean} isFixed - Is the toolbar fixed?
 * @param {boolean} isVisible - Is the AI Assistant visible?
 * @returns {void}
 */
export function handleAiExtensionsBarBodyClass( isFixed: boolean, isVisible: boolean ): void {
	if ( isFixed && isVisible ) {
		return document.body.classList.add( 'jetpack-ai-assistant-bar-is-fixed' );
	}

	document.body.classList.remove( 'jetpack-ai-assistant-bar-is-fixed' );
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
		 * Select the Jetpack Form block
		 *
		 * @returns {void}
		 */
		const selectFormBlock = useCallback( () => {
			dispatch( 'core/block-editor' ).selectBlock( props.clientId );
		}, [ props.clientId ] );

		const { createNotice } = useDispatch( noticesStore );

		/**
		 * Show the error notice
		 *
		 * @param {RequestingErrorProps} suggestionError
		 * @returns {void}
		 */
		const showSuggestionError = useCallback(
			( { severity, message }: RequestingErrorProps ) => {
				createNotice( severity, message, {
					isDismissible: true,
					id: AI_ASSISTANT_JETPACK_FORM_NOTICE_ID,
				} );
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
			} ),
			[ inputValue, setInputValue, isVisible, show, hide, toggle, isFixed, setAssistantFixed ]
		);

		const setContent = useCallback(
			( newContent: string ) => {
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
					return block.isValid && block.name !== 'core/freeform';
				} );

				// Only update the blocks when the valid list changed, meaning a new block arrived.
				if ( validBlocks.length !== currentListOfValidBlocks.current.length ) {
					// Only update the valid blocks
					replaceInnerBlocks( clientId, validBlocks );

					// Update the list of current valid blocks
					currentListOfValidBlocks.current = validBlocks;
				}
			},
			[ clientId, replaceInnerBlocks ]
		);

		useAiContext( {
			askQuestionOptions: { postId },
			onDone: setContent,
			onSuggestion: setContent,
			onError: showSuggestionError,
		} );

		/*
		 * Ensure to provide data context,
		 * and the AI Assistant component (popover)
		 * only if is't possible to extend the block.
		 */
		if ( ! isPossibleToExtendJetpackFormBlock( props.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': () => {
							toggle();
							selectFormBlock();
						},
					} }
				>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
