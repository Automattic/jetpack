/*
 * External dependencies
 */
import {
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	useAiSuggestions,
} from '@automattic/jetpack-ai-client';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState, useRef, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import debugFactory from 'debug';
import React from 'react';
/*
 * Internal dependencies
 */
import useAiFeature from '../hooks/use-ai-feature';
import useAutoScroll from '../hooks/use-auto-scroll';
import { mapInternalPromptTypeToBackendPromptType } from '../lib/prompt/backend-prompt';
import AiAssistantInput from './components/ai-assistant-input';
import AiAssistantExtensionToolbarDropdown from './components/ai-assistant-toolbar-dropdown';
import { getBlockHandler, InlineExtensionsContext } from './get-block-handler';
import { isPossibleToExtendBlock } from './lib/is-possible-to-extend-block';
/*
 * Types
 */
import type {
	AiAssistantDropdownOnChangeOptionsArgProps,
	OnRequestSuggestion,
} from '../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { ExtendedInlineBlockProp } from '../extensions/ai-assistant';
import type { PromptTypeProp } from '../lib/prompt';
import type {
	PromptMessagesProp,
	PromptItemProps,
	RequestingStateProp,
} from '@automattic/jetpack-ai-client';

const debug = debugFactory( 'jetpack-ai-assistant:extensions:with-ai-extension' );

const blockExtensionMapper = {
	'core/heading': 'heading',
	'core/paragraph': 'paragraph',
	'core/list-item': 'list-item',
	'core/list': 'list',
	'jetpack/contact-form': 'form-ai',
};

// Defines where the block controls should be placed in the toolbar
const blockControlsProps = {
	group: 'block' as const,
};

const BLOCK_INPUT_GAP = 16;

type RequestOptions = {
	promptType: PromptTypeProp;
	options?: AiAssistantDropdownOnChangeOptionsArgProps;
	humanText?: string;
	message?: PromptItemProps;
};

type CoreEditorDispatch = { undo: () => Promise< void > };
type CoreEditorSelect = { getCurrentPostId: () => number };

// HOC to populate the block's edit component with the AI Assistant control inpuit and toolbar button.
const blockEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { clientId, isSelected, name: blockName } = props;
		// Ref to the control wrapper, its height and its ResizeObserver, for positioning adjustments.
		const controlRef: React.MutableRefObject< HTMLDivElement | null > = useRef( null );
		const controlHeight = useRef< number >( 0 );
		const controlObserver = useRef< ResizeObserver | null >( null );
		// Ref to the original block padding to reset it when the AI Control is closed.
		const blockOriginalPaddingBottom = useRef< string >( '' );
		// Ref to the input element to focus on it when the AI Control is displayed or when a request is done.
		// Also used to determine the ownerDocument, as the editor can be in an iframe.
		const inputRef: React.MutableRefObject< HTMLInputElement | null > = useRef( null );
		const ownerDocument = useRef< Document >( document );
		// Ref to the chat history to keep track of the messages that were sent and the assistant responses.
		const chatHistory = useRef< PromptMessagesProp >( [] );
		// A human-readable action to be displayed in the input when a toolbar suggestion is requested, like "Translate: Japanese".
		const [ action, setAction ] = useState< string >( '' );
		// The last request made by the user, to be used when the user clicks the "Try Again" button.
		const lastRequest = useRef< RequestOptions | null >( null );
		// Ref to the requesting state to use it in the hideOnBlockFocus effect.
		const requestingStateRef = useRef< RequestingStateProp | null >( null );
		// Data and functions from the editor.
		const { undo } = useDispatch( 'core/editor' ) as CoreEditorDispatch;
		const { postId } = useSelect( select => {
			const { getCurrentPostId } = select( 'core/editor' ) as CoreEditorSelect;

			return { postId: getCurrentPostId() };
		}, [] );
		// The block's id to find it in the DOM for the positioning adjustments
		// The classname is used by nested blocks to determine which block's toolbar to display when the input is focused.
		const { id, className } = useBlockProps( {
			className: clsx( { [ blockName?.replace?.( '/', '-' ) ]: true } ),
		} );

		// Jetpack AI Assistant feature functions.
		const { increaseRequestsCount, dequeueAsyncRequest, requireUpgrade } = useAiFeature();

		// Auto-scroll
		const { snapToBottom, enableAutoScroll, disableAutoScroll } = useAutoScroll(
			{
				current: ownerDocument?.current?.getElementById( id ),
			},
			undefined,
			true
		);

		const focusInput = useCallback( () => {
			inputRef.current?.focus();
		}, [] );

		// Data and functions with block-specific implementations.
		const {
			onSuggestion: onBlockSuggestion,
			onDone: onBlockDone,
			getContent,
			behavior,
			isChildBlock,
			feature,
			adjustPosition,
			startOpen,
			hideOnBlockFocus,
		} = useMemo( () => getBlockHandler( blockName, clientId ), [ blockName, clientId ] );

		// State to display the AI Control or not.
		const [ showAiControl, setShowAiControl ] = useState( startOpen );

		// Called when the user clicks the "Ask AI Assistant" button.
		const handleAskAiAssistant = useCallback( () => {
			setShowAiControl( current => ! current );
		}, [] );

		// Function to get the messages array for the request.
		const getRequestMessages = useCallback(
			( {
				promptType,
				options,
			}: {
				promptType: PromptTypeProp;
				options?: AiAssistantDropdownOnChangeOptionsArgProps;
			} ) => {
				const blockContent = getContent();

				const extension = blockExtensionMapper[ blockName ];

				return [
					...chatHistory.current,
					{
						role: 'jetpack-ai' as const,
						context: {
							type: mapInternalPromptTypeToBackendPromptType( promptType, extension ),
							content: blockContent,
							request: options?.userPrompt,
							tone: options?.tone,
							language: options?.language,
							is_follow_up: chatHistory.current.length > 0,
						},
					},
				];
			},
			[ blockName, getContent ]
		);

		const adjustBlockPadding = useCallback(
			( blockElement?: HTMLElement | null ) => {
				const block = blockElement || ownerDocument.current.getElementById( id );

				if ( block && controlRef.current ) {
					// The gap between the input and the block's bottom is set at BLOCK_INPUT_GAP, regardless of the theme
					block.style.setProperty(
						'padding-bottom',
						`calc(${ controlHeight.current + BLOCK_INPUT_GAP }px + ${
							blockOriginalPaddingBottom.current || '0px'
						} )`,
						'important'
					);
				}
			},
			[ id ]
		);

		// Called when a suggestion chunk is received.
		const onSuggestion = useCallback(
			( suggestion: string ) => {
				onBlockSuggestion( suggestion );

				// Make sure the block element has the necessary bottom padding, as it can be replaced or changed
				if ( adjustPosition ) {
					adjustBlockPadding();
				}

				// Scroll to the bottom when a new suggestion is received.
				snapToBottom();
			},
			[ onBlockSuggestion, adjustPosition, snapToBottom, adjustBlockPadding ]
		);

		// Called after the last suggestion chunk is received.
		const onDone = useCallback(
			( suggestion: string ) => {
				disableAutoScroll();
				onBlockDone( suggestion );
				increaseRequestsCount();
				setAction( '' );

				if ( lastRequest.current?.message ) {
					const assistantMessage = {
						role: 'assistant' as const,
						content: getContent(),
					};

					chatHistory.current.push( lastRequest.current.message, assistantMessage );

					// Limit the messages to 20 items.
					if ( chatHistory.current.length > 20 ) {
						chatHistory.current.splice( 0, chatHistory.current.length - 20 );

						// Make sure the first message is a 'jetpack-ai' message and not marked as a follow-up.
						const firstJetpackAiMessageIndex = chatHistory.current.findIndex(
							message => message.role === 'jetpack-ai'
						);

						if ( firstJetpackAiMessageIndex !== -1 ) {
							chatHistory.current = chatHistory.current.slice( firstJetpackAiMessageIndex );

							chatHistory.current[ 0 ].context = {
								...chatHistory.current[ 0 ].context,
								is_follow_up: false,
							};
						}
					}
				}

				lastRequest.current = null;

				// Make sure the block element has the necessary bottom padding, as it can be replaced or changed
				setTimeout( () => {
					if ( adjustPosition ) {
						adjustBlockPadding();
					}
					focusInput();
				}, 100 );
			},
			[
				disableAutoScroll,
				onBlockDone,
				increaseRequestsCount,
				getContent,
				adjustPosition,
				focusInput,
				adjustBlockPadding,
			]
		);

		// Called when an error is received.
		const onError = useCallback(
			error => {
				disableAutoScroll();
				setAction( '' );

				debug( 'Request error', error );

				// Increase the AI Suggestion counter only for valid errors.
				if ( error.code === ERROR_NETWORK || error.code === ERROR_QUOTA_EXCEEDED ) {
					return;
				}

				increaseRequestsCount();
			},
			[ disableAutoScroll, increaseRequestsCount ]
		);

		const {
			request,
			stopSuggestion,
			requestingState,
			error,
			reset: resetSuggestions,
		} = useAiSuggestions( {
			onSuggestion,
			onDone,
			onError,
			askQuestionOptions: {
				postId,
				feature,
			},
		} );

		// Save the requesting state to use it in the hideOnBlockFocus effect.
		useEffect( () => {
			requestingStateRef.current = requestingState;
		}, [ requestingState ] );

		// Called when a suggestion from the toolbar is requested, like "Change tone".
		const handleRequestSuggestion = useCallback< OnRequestSuggestion >(
			( promptType, options, humanText ) => {
				setShowAiControl( true );

				// If the user needs to upgrade, don't make the request, but show the input with the upgrade message.
				if ( requireUpgrade ) {
					return;
				}

				if ( humanText ) {
					setAction( humanText );
				}

				const messages = getRequestMessages( { promptType, options } );

				debug( 'Request suggestion', promptType, options );

				const lastMessage = messages[ messages.length - 1 ];
				lastRequest.current = { promptType, options, humanText, message: lastMessage };

				/*
				 * Always dequeue/cancel the AI Assistant feature async request,
				 * in case there is one pending,
				 * when performing a new AI suggestion request.
				 */
				dequeueAsyncRequest();

				enableAutoScroll();

				request( messages );
			},
			[ dequeueAsyncRequest, enableAutoScroll, getRequestMessages, request, requireUpgrade ]
		);

		// Called when the user types a custom prompt.
		const handleUserRequest = useCallback(
			( userPrompt: string ) => {
				const promptType = 'userPrompt';
				const options = { userPrompt };

				enableAutoScroll();
				handleRequestSuggestion( promptType, options );
			},
			[ enableAutoScroll, handleRequestSuggestion ]
		);

		// Called when the user clicks the "Stop" button in the input.
		const handleStopSuggestion = useCallback( () => {
			disableAutoScroll();
			stopSuggestion();

			focusInput();
		}, [ disableAutoScroll, stopSuggestion, focusInput ] );

		// Called when the user clicks the "Try Again" button in the input error message.
		const handleTryAgain = useCallback( () => {
			if ( lastRequest.current ) {
				handleRequestSuggestion(
					lastRequest.current.promptType,
					lastRequest.current.options,
					lastRequest.current.humanText
				);
			}
		}, [ lastRequest, handleRequestSuggestion ] );

		// Cleanup function.
		const handleClose = useCallback( () => {
			setShowAiControl( false );
			resetSuggestions();
			setAction( '' );
			lastRequest.current = null;
			chatHistory.current = [];
		}, [ resetSuggestions ] );

		// Called when the user clicks the "Undo" button after a successful request.
		const handleUndo = useCallback( async () => {
			await undo();

			handleClose();
		}, [ undo, handleClose ] );

		// Closes the AI Control if the block is deselected.
		useEffect( () => {
			if ( ! isSelected ) {
				handleClose();
			}
		}, [ isSelected, handleClose ] );

		// Focus the input when the AI Control is displayed and set the ownerDocument.
		useEffect( () => {
			if ( inputRef.current ) {
				// Save the block's ownerDocument to use it later, as the editor can be in an iframe.
				ownerDocument.current = inputRef.current.ownerDocument;
				// Focus the input when the AI Control is displayed.
				focusInput();
			}
		}, [ showAiControl, focusInput ] );

		// Adjusts the input position in the editor by increasing the block's bottom-padding
		// and setting the control's margin-top, "wrapping" the input with the block.
		useEffect( () => {
			let block = ownerDocument.current.getElementById( id );

			if ( ! block ) {
				return;
			}

			if ( ! adjustPosition ) {
				return;
			}

			// Once when the AI Control is displayed
			if ( showAiControl && ! controlObserver.current && controlRef.current ) {
				// Save the block bottom padding to reset it later.
				blockOriginalPaddingBottom.current = block.style.paddingBottom;

				// Observe the control's height to adjust the block's bottom padding.
				controlObserver.current = new ResizeObserver( ( [ entry ] ) => {
					// The block element can be replaced or changed, so we need to get it again.
					block = ownerDocument.current.getElementById( id );
					controlHeight.current = entry.contentRect.height;

					if ( block && controlRef.current && controlHeight.current > 0 ) {
						adjustBlockPadding( block );

						const { marginBottom } = getComputedStyle( block );
						const bottom = parseFloat( marginBottom );

						// The control's margin-top is the negative of the control's height plus the block's bottom margin, to end up with the intended gap.
						// P2 uses "!important", so we need to add it to override the theme's styles.
						controlRef.current.style.setProperty(
							'margin-top',
							`-${ controlHeight.current + bottom }px`,
							'important'
						);

						// The control's bottom margin is set to at least the same value as the block's bottom margin, to keep the distance to the next block.
						// The gap height is added for a bit more space on themes with a smaller bottom margin.
						controlRef.current.style.setProperty(
							'margin-bottom',
							`${ bottom + BLOCK_INPUT_GAP }px`,
							'important'
						);
					}
				} );

				controlObserver.current.observe( controlRef.current );
			} else if ( controlObserver.current ) {
				block.style.paddingBottom = blockOriginalPaddingBottom.current;

				controlObserver.current.disconnect();
				controlObserver.current = null;
				controlHeight.current = 0;
			}

			return () => {
				if ( controlObserver.current ) {
					controlObserver.current.disconnect();
				}
			};
		}, [ adjustBlockPadding, adjustPosition, clientId, controlObserver, id, showAiControl ] );

		// Hide the AI Control when the block is focused.
		useEffect( () => {
			if ( ! hideOnBlockFocus ) {
				return;
			}

			if ( showAiControl ) {
				const element = ownerDocument.current.getElementById( id );

				const handleFocusInBlock = () => {
					// If the AI Control is requesting or suggesting, don't hide it, as the block focus is programmatic.
					if ( [ 'requesting', 'suggesting' ].includes( requestingStateRef.current as string ) ) {
						return;
					}

					setShowAiControl( false );
					element?.removeEventListener( 'focusin', handleFocusInBlock );
				};

				element?.addEventListener( 'focusin', handleFocusInBlock );

				return () => {
					element?.removeEventListener( 'focusin', handleFocusInBlock );
				};
			}
		}, [ hideOnBlockFocus, showAiControl, id ] );

		const aiInlineExtensionContent = (
			<>
				<BlockEdit { ...props } />

				{ showAiControl && (
					<AiAssistantInput
						className={ className }
						requestingState={ requestingState }
						requestingError={ error }
						wrapperRef={ controlRef }
						inputRef={ inputRef }
						action={ action }
						blockType={ blockName }
						feature={ feature }
						request={ handleUserRequest }
						stopSuggestion={ handleStopSuggestion }
						close={ handleClose }
						undo={ handleUndo }
						tryAgain={ handleTryAgain }
					/>
				) }

				<BlockControls { ...blockControlsProps }>
					<AiAssistantExtensionToolbarDropdown
						blockType={ blockName }
						onAskAiAssistant={ handleAskAiAssistant }
						onRequestSuggestion={ handleRequestSuggestion }
						behavior={ behavior }
					/>
				</BlockControls>
			</>
		);

		if ( isChildBlock ) {
			return aiInlineExtensionContent;
		}

		const ProviderProps = {
			value: { [ blockName ]: { handleAskAiAssistant, handleRequestSuggestion } },
		};

		return (
			<InlineExtensionsContext.Provider { ...ProviderProps }>
				{ aiInlineExtensionContent }
			</InlineExtensionsContext.Provider>
		);
	};
}, 'blockEditWithAiComponents' );

/**
 * Function used to extend the registerBlockType settings.
 * Populates the block edit component with the AI Assistant bar and button.
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object}          The extended block settings.
 */
function blockWithInlineExtension( settings, name: ExtendedInlineBlockProp ) {
	// Only extend the allowed block types and when AI is enabled
	const possibleToExtendBlock = isPossibleToExtendBlock( name );

	if ( ! possibleToExtendBlock ) {
		return settings;
	}

	return {
		...settings,
		edit: blockEditWithAiComponents( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support/with-ai-extension',
	blockWithInlineExtension,
	100
);
