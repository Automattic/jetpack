/**
 * External dependencies
 */
import { useAiContext } from '@automattic/jetpack-ai-client';
import { parse } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { AiAssistantPopover } from '../components/ai-assistant-popover';
import { AiAssistantUiContextProps, AiAssistantUiContextProvider } from './context';
/**
 * Types
 */
import type { RequestingErrorProps } from '@automattic/jetpack-ai-client';

// An identifier to use on the extension error notices,
const AI_ASSISTANT_JETPACK_FORM_NOTICE_ID = 'ai-assistant';

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { clientId, isSelected } = props;

		// AI Assistant input value
		const [ inputValue, setInputValue ] = useState( '' );

		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( false );

		// AI Assistant width
		const [ width, setWidth ] = useState( 400 );

		// AI Assistant popover props
		const [ popoverProps, setPopoverProps ] = useState<
			AiAssistantUiContextProps[ 'popoverProps' ]
		>( {
			anchor: null,
			placement: 'bottom-start',
			offset: 12,
		} );

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

		/*
		 * Set the anchor element for the popover.
		 * For now, let's use the block representation in the canvas,
		 * but we can change it in the future.
		 */
		useEffect( () => {
			if ( ! clientId ) {
				return;
			}

			const idAttribute = `block-${ clientId }`;

			/*
			 * Get the DOM element of the block,
			 * keeping in mind that the block element is rendered into the `editor-canvas` iframe.
			 */
			const iFrame: HTMLIFrameElement = document.querySelector( 'iframe[name="editor-canvas"]' );
			const iframeDocument = iFrame && iFrame.contentWindow.document;
			if ( ! iframeDocument ) {
				return;
			}

			const blockDomElement = iframeDocument.getElementById( idAttribute );
			if ( ! blockDomElement ) {
				return;
			}

			setPopoverProps( prev => ( { ...prev, anchor: blockDomElement } ) );
			setWidth( blockDomElement?.getBoundingClientRect?.()?.width );
		}, [ clientId ] );

		// Show/hide the assistant based on the block selection.
		useEffect( () => {
			if ( isSelected ) {
				return;
			}
			hide();
		}, [ isSelected, hide ] );

		// Update width when the anchor resize change.
		useEffect( () => {
			if ( ! popoverProps.anchor ) {
				return;
			}

			const resizeObserver = new ResizeObserver( () => {
				setWidth( popoverProps.anchor?.getBoundingClientRect?.()?.width );
			} );

			resizeObserver.observe( popoverProps.anchor );

			return () => {
				resizeObserver.disconnect();
			};
		}, [ popoverProps.anchor ] );

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				inputValue,
				isVisible,
				popoverProps,
				width,

				setInputValue,
				show,
				hide,
				toggle,
				setPopoverProps,
			} ),
			[ inputValue, isVisible, popoverProps, width, show, hide, toggle ]
		);

		const setContent = useCallback(
			( newContent: string ) => {
				// Remove the Jetpack Form block from the content.
				const processedContent = newContent.replace(
					/<!-- (\/)*wp:jetpack\/(contact-)*form ({.*} )*(\/)*-->/g,
					''
				);
				const newContentBlocks = parse( processedContent );

				// Check if the generated blocks are valid.
				const validBlocks = newContentBlocks.filter( block => {
					return block.isValid && block.name !== 'core/freeform';
				} );
				// Only update the valid blocks
				replaceInnerBlocks( clientId, validBlocks );
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
					<AiAssistantPopover clientId={ clientId } />
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
