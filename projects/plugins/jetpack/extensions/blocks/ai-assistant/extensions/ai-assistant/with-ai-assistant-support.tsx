/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { rawHandler, pasteHandler } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
import MarkdownIt from 'markdown-it';
/**
 * Internal dependencies
 */
import { AiAssistantPopover } from '../../components/ai-assistant-dialog';
import AiAssistantToobarButton from '../../components/ai-assistant-toolbar-control';
import { PROMPT_TYPE_USER_PROMPT, getPrompt } from '../../lib/prompt';
import { getTextContentFromSelectedBlocks } from '../../lib/utils/block-content';
import { AiAssistantContextProvider } from './context';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '.';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

const withAiAssistant = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { isSelected, clientId } = props;

		// AI Assistant component visibility
		const [ isAssistantShown, setAssistantVisibility ] = useState( false );
		const [ isAssistantMenuShown, setAssistantMenuVisibility ] = useState( true );

		const [ promptValue, setLocalPromptValue ] = useState( '' );

		// const [ promptValue, setLocalPromptValue ] = useState(
		// 	'create a table with ten of the best video games of the CZSpectrum'
		// );
		const [ generatedContent, setGeneratedContentValue ] = useState( '' );

		// Get the selected block client IDs.
		const { content, clientIds } = getTextContentFromSelectedBlocks();

		const { updateBlockAttributes, removeBlocks, replaceBlock, insertBlockAfter } =
			useDispatch( 'core/block-editor' );
		/**
		 * Show the AI Assistant
		 *
		 * @returns {void}
		 */
		const showAssistant = useCallback( () => {
			setAssistantVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant
		 *
		 * @returns {void}
		 */
		const hideAssistant = useCallback( () => {
			setAssistantVisibility( false );
		}, [] );

		/**
		 * Toggle the AI Assistant visibility
		 *
		 * @returns {void}
		 */
		const toggleAssistant = useCallback( () => {
			setAssistantVisibility( ! isAssistantShown );
		}, [ isAssistantShown ] );

		/**
		 * Show the AI Assistant menu
		 *
		 * @returns {void}
		 */
		const showAssistantMenu = useCallback( () => {
			setAssistantMenuVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant menu
		 *
		 * @returns {void}
		 */
		const hideAssistantMenu = useCallback( () => {
			setAssistantMenuVisibility( false );
		}, [] );

		/**
		 * Set the prompt value
		 *
		 * @param {string} value - Prompt value
		 * @returns {void}
		 */
		const setPromptValue = useCallback( value => {
			setLocalPromptValue( value );
		}, [] );

		/**
		 * Store in a local state the generated content
		 * provided by the AI server response.
		 *
		 * @param {string} value - Generated content
		 * @returns {void}
		 */
		const setGeneratedContent = useCallback( value => {
			setGeneratedContentValue( value );
		}, [] );

		/*
		 * Pick the DOM element of the block,
		 * to anchor the AI Assistant popover.
		 */
		const blockDomReference = useRef< HTMLElement >();
		useEffect( () => {
			// if ( ! clientIds?.length ) {
			// 	return;
			// }

			if ( ! clientId ) {
				return;
			}

			// Get the last selected block.
			// const clientId = clientIds[ clientIds.length - 1 ];
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

			blockDomReference.current = blockDomElement;
		}, [ clientId ] );

		const [ firstClientId, ...restClientIds ] = clientIds;

		/*
		 * Hide the Assistant when
		 * - unmounting,
		 * - block is not deselected.
		 */
		useEffect( () => {
			if ( isSelected ) {
				return;
			}

			hideAssistant();

			return () => {
				hideAssistant();
			};
		}, [ hideAssistant, isSelected, firstClientId ] ); // Addind firstClientId as a dependency helps to hide the assistant when the block is unselcted.

		const userPrompt = getPrompt( PROMPT_TYPE_USER_PROMPT, {
			customPrompt: promptValue,
			content,
		} );

		const setContent = useCallback(
			( newContent: string ) => {
				// const [ firstClientId, ...restClientIds ] = clientIds;

				// const newContentBlocks = pasteHandler( {
				// 	HTML: newContent,
				// } );

				/*
				 * Update the content of the block
				 * by calling the setAttributes function,
				 * updating the `content` attribute.
				 * It doesn't scale for other blocks.
				 * @todo: find a better way to update the content.
				 */
				// replaceBlock( firstClientId, newContentBlocks );
				// console.log( { firstClientId } );
				updateBlockAttributes( firstClientId, { content: newContent } );

				// // Remove the rest of the block in case there are more than one.
				// if ( restClientIds.length ) {
				// 	removeBlocks( restClientIds );
				// 	// then( () => {
				// 	// 	clientIdsRef.current = [ firstClientId ];
				// 	// } );
				// }
			},
			[ firstClientId, removeBlocks, restClientIds, updateBlockAttributes ]
		);

		const { request: requestSuggestion, requestingState } = useAiSuggestions( {
			// prompt: userPrompt,
			onSuggestion: setContent,
			// onSuggestion: setGeneratedContent,
			autoRequest: false,
			onDone: doneContent => {
				console.log( 'onDone: ', doneContent );
			},
		} );

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				promptValue,
				setPromptValue,

				generatedContent,
				setGeneratedContent,

				isAssistantShown,
				showAssistant,
				hideAssistant,
				toggleAssistant,

				isAssistantMenuShown,
				showAssistantMenu,
				hideAssistantMenu,

				requestSuggestion,
				requestingState,
			} ),
			[
				promptValue,
				setPromptValue,
				generatedContent,
				setGeneratedContent,
				isAssistantShown,
				showAssistant,
				hideAssistant,
				toggleAssistant,
				isAssistantMenuShown,
				showAssistantMenu,
				hideAssistantMenu,
				requestSuggestion,
				requestingState,
			]
		);

		if ( ! isPossibleToExtendBlock() ) {
			return <BlockListBlock { ...props } />;
		}

		// Check if the block is listed to be extended.
		if ( EXTENDED_BLOCKS.indexOf( props.name ) === -1 ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': () => {
							toggleAssistant();
							showAssistantMenu();
						},
					} }
				>
					<BlockListBlock { ...props } />

					<AiAssistantPopover
						anchor={ blockDomReference?.current }
						show={ isAssistantShown }
						promptValue={ promptValue }
						onPromptChange={ ( promptType, options = {} ) => {
							console.log( 'promptType: ', promptType );
							console.log( 'options: ', options );

							const prompt = getPrompt( promptType, { ...options, content } );
							requestSuggestion( prompt );
						} }
						onRequest={ () => requestSuggestion( userPrompt ) }
					/>
				</KeyboardShortcuts>
			</AiAssistantContextProvider>
		);
	};
}, 'withAiAssistant' );

export const withAiAssistantToolbarButton = createHigherOrderComponent(
	BlockEdit => props => {
		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls group="block">
					<AiAssistantToobarButton requestingState="iddle" />
				</BlockControls>
			</>
		);
	},
	'withAiAssistantToolbarButton'
);

export default withAiAssistant;
