/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { AiAssistantPopover } from '../../components/ai-assistant-dialog';
import AiAssistantToobarButton from '../../components/ai-assistant-toolbar-control';
import useTextContentFromSelectedBlocks from '../../hooks/use-text-content-from-selected-blocks';
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../lib/prompt';
import { AiAssistantContextProvider } from './context';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '.';
const withAiAssistant = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { isSelected, clientId } = props;
		// AI Assistant component visibility
		const [ isAssistantShown, setAssistantVisibility ] = useState( false );
		const [ isAssistantMenuShown, setAssistantMenuVisibility ] = useState( true );

		// const [ promptValue, setLocalPromptValue ] = useState(
		// 	'Create a three-column. In each column, there should be an empty image, followed by a level 2 heading, and then three paragraph.'
		// );

		// const [ promptValue, setLocalPromptValue ] = useState(
		// 	"I'd like to create a contact form with the following fields: name, email, message. Add a `Contact us` button to submit the form."
		// );

		const [ promptValue, setLocalPromptValue ] = useState( '' );

		// const [ promptValue, setLocalPromptValue ] = useState(
		// 	'create a table with ten of the best video games of the CZSpectrum'
		// );
		const [ generatedContent, setGeneratedContentValue ] = useState( '' );

		// Get the selected block client IDs.
		const { content, clientIds } = useTextContentFromSelectedBlocks();

		const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
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

		const [ firstClientId ] = clientIds;

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

		const userPrompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			customPrompt: promptValue,
			content,
		} );

		// const wrapperBlockHasBeenInserted = useRef( false );
		// // Let's create a core group block to wrap the generated content.
		// const groupBlockWrapper = createBlock(
		// 	'core/group',
		// 	{
		// 		tagName: 'div',
		// 		layout: {
		// 			type: 'constrained',
		// 		},
		// 	},
		// 	[ createBlock( 'core/paragraph' ) ]
		// );
		// Insert after
		// insertAfterBlock( firstClientId, groupBlockWrapper );
		// }, [ firstClientId, groupBlockWrapper, insertAfterBlock ] );

		const setContent = useCallback(
			( newContent: string ) => {
				// const [ firstClientId, ...restClientIds ] = clientIds;
				// if ( ! wrapperBlockHasBeenInserted.current ) {
				// 	wrapperBlockHasBeenInserted.current = true;
				// 	replaceBlock( firstClientId, groupBlockWrapper );
				// }

				const newContentBlocks = parse( newContent );

				// Check if the generated blocks are valid.
				const validBlocks = newContentBlocks.filter( block => {
					return block.isValid && block.name !== 'core/freeform';
				} );

				// Get HTML markup of the generated blocks
				// const html = validBlocks.reduce( ( html, block ) => {
				// 	return html + getBlockContent( block );
				// }, '' );

				// console.log( { html } );

				// Only update the valid blocks
				replaceInnerBlocks( firstClientId, validBlocks );

				// updateBlockAttributes( firstClientId, { content: newContent } );

				// console.log( { newContentBlocks } );

				// replaceBlock( firstClientId, newContentBlocks );

				/*
				 * Update the content of the block
				 * by calling the setAttributes function,
				 * updating the `content` attribute.
				 * It doesn't scale for other blocks.
				 * @todo: find a better way to update the content.
				 */
				// replaceBlock( firstClientId, newContentBlocks );
				// console.log( { firstClientId } );
				// updateBlockAttributes( firstClientId, { content: newContent } );

				// // Remove the rest of the block in case there are more than one.
				// if ( restClientIds.length ) {
				// 	removeBlocks( restClientIds );
				// 	// then( () => {
				// 	// 	clientIdsRef.current = [ firstClientId ];
				// 	// } );
				// }
			},
			[ firstClientId, replaceInnerBlocks ]
		);

		const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );

		const { request: requestSuggestion, requestingState } = useAiSuggestions( {
			// prompt: userPrompt,
			onSuggestion: setContent,
			postId,
			// askQuestionOptions: {
			// 	feature: 'ai-assistant-experimental',
			// },
			// onSuggestion: setGeneratedContent,
			autoRequest: false,
			onDone: doneContent => {
				setContent( doneContent );
				// const newContentBlocks = parse( doneContent );
				// replaceInnerBlocks( groupBlockWrapper.clientId, newContentBlocks );
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
							// console.log( 'promptType: ', promptType );
							// console.log( 'options: ', options );

							const prompt = getPrompt( promptType, { ...options, content } );
							requestSuggestion( prompt );
						} }
						onRequest={ () => {
							requestSuggestion( userPrompt );
							// close the popover after 2 seconds
							setTimeout( () => {
								hideAssistant();
							}, 2000 );
						} }
					/>
				</KeyboardShortcuts>
			</AiAssistantContextProvider>
		);
	};
}, 'withAiAssistant' );

export const withAiAssistantToolbarButton = createHigherOrderComponent(
	BlockEdit => props => {
		const blockControlsProps = {
			group: 'block',
		};
		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls { ...blockControlsProps }>
					<AiAssistantToobarButton requestingState="iddle" />
				</BlockControls>
			</>
		);
	},
	'withAiAssistantToolbarButton'
);

export default withAiAssistant;
