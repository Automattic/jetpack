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
import { dispatch, select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import debugFactory from 'debug';
import React from 'react';
/*
 * Internal dependencies
 */
import { EXTENDED_INLINE_BLOCKS } from '../extensions/ai-assistant';
import { BuildPromptOptionsProps, buildPromptForExtensions } from '../lib/prompt';
import { blockHandler } from './block-handler';
import AiAssistantInput from './components/ai-assistant-input';
import AiAssistantExtensionToolbarDropdown from './components/ai-assistant-toolbar-dropdown';
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

const debug = debugFactory( 'jetpack-ai-assistant:extensions:with-ai-extension' );

// HOC to populate the block's edit component with the AI Assistant bar and button.
const blockEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { clientId, isSelected, name: blockName } = props;
		const controlRef: React.MutableRefObject< HTMLDivElement | null > = useRef( null );
		const controlHeight = useRef< number >( 0 );
		const inputRef: React.MutableRefObject< HTMLInputElement | null > = useRef( null );
		const controlObserver = useRef< ResizeObserver | null >( null );
		const blockStyle = useRef< string >( '' );
		const ownerDocument = useRef< Document >( document );
		const [ action, setAction ] = useState< string >( '' );
		const [ requestCount, setRequestCount ] = useState( 0 );

		// Only extend the allowed block types.
		const possibleToExtendBlock = isPossibleToExtendBlock( {
			blockName,
			clientId,
		} );

		const [ showAiControl, setShowAiControl ] = useState( false );

		const { getCurrentPostId } = select( 'core/editor' );
		const postId = getCurrentPostId();

		const { increaseAiAssistantRequestsCount } = useDispatch( 'wordpress-com/plans' );

		const onDone = useCallback( () => {
			increaseAiAssistantRequestsCount();
			setRequestCount( count => count + 1 );
		}, [ increaseAiAssistantRequestsCount ] );

		const onError = useCallback(
			error => {
				// Increase the AI Suggestion counter only for valid errors.
				if ( error.code === ERROR_NETWORK || error.code === ERROR_QUOTA_EXCEEDED ) {
					return;
				}

				increaseAiAssistantRequestsCount();
			},
			[ increaseAiAssistantRequestsCount ]
		);

		const { id } = useBlockProps();

		// Data and functions with block-specific implementations.
		const { onSuggestion: onBlockSuggestion, getContent } = blockHandler( blockName, clientId );

		const onSuggestion = useCallback(
			( suggestion: string ) => {
				onBlockSuggestion( suggestion );

				// Make sure the block element has the necessary bottom padding, as it can be replaced or changed
				const block = ownerDocument.current.getElementById( id );
				if ( block && controlRef.current ) {
					block.style.paddingBottom = `${ controlHeight.current + 16 }px`;
				}
			},
			[ id, onBlockSuggestion ]
		);

		const {
			request,
			stopSuggestion,
			requestingState,
			error,
			suggestion,
			reset: resetSuggestions,
		} = useAiSuggestions( {
			onSuggestion,
			onDone,
			onError,
			askQuestionOptions: {
				postId,
				feature: 'ai-assistant',
			},
		} );

		useEffect( () => {
			if ( inputRef.current ) {
				// Save the block's ownerDocument to use it later, as the editor can be in an iframe.
				ownerDocument.current = inputRef.current.ownerDocument;
				// Focus the input when the AI Control is displayed.
				inputRef.current.focus();
			}
		}, [ showAiControl ] );

		useEffect( () => {
			let block = ownerDocument.current.getElementById( id );

			if ( ! block ) {
				return;
			}

			// Once when the AI Control is displayed
			if ( showAiControl && ! controlObserver.current && controlRef.current ) {
				// Save the block and control styles to adjust them later.
				blockStyle.current = block.style.cssText;

				// Observe the control's height to adjust the block's bottom-padding.
				controlObserver.current = new ResizeObserver( ( [ entry ] ) => {
					// The block element can be replaced or changed, so we need to get it again.
					block = ownerDocument.current.getElementById( id );
					controlHeight.current = entry.contentRect.height;

					if ( block && controlRef.current && controlHeight.current > 0 ) {
						block.style.paddingBottom = `${ controlHeight.current + 16 }px`;
						controlRef.current.style.marginTop = `-${ controlHeight.current }px`;
					}
				} );

				controlObserver.current.observe( controlRef.current );
			} else if ( controlObserver.current ) {
				// Reset the block's bottom-padding.
				block.setAttribute( 'style', blockStyle.current );

				controlObserver.current.disconnect();
				controlObserver.current = null;
				controlHeight.current = 0;
			}
		}, [ clientId, controlObserver, id, showAiControl ] );

		// Only extend the target block.
		if ( ! possibleToExtendBlock ) {
			return <BlockEdit { ...props } />;
		}

		// Defines where the block controls should be placed in the toolbar
		const blockControlsProps = {
			group: 'block' as const,
		};

		const onAskAiAssistant = () => {
			setShowAiControl( true );
		};

		const getRequestMessages = ( {
			promptType,
			options,
			userPrompt,
		}: {
			promptType: PromptTypeProp;
			options?: AiAssistantDropdownOnChangeOptionsArgProps;
			userPrompt?: string;
		} ) => {
			const blockContent = getContent();

			const promptOptions: BuildPromptOptionsProps = {
				tone: options?.tone,
				language: options?.language,
				fromExtension: true,
			};

			return buildPromptForExtensions( {
				blockContent,
				options: promptOptions,
				type: promptType,
				userPrompt,
			} );
		};

		const onRequestSuggestion: OnRequestSuggestion = ( promptType, options, humanText ) => {
			setShowAiControl( true );

			if ( humanText ) {
				setAction( humanText );
			}

			const messages = getRequestMessages( { promptType, options } );

			debug( 'onRequestSuggestion', promptType, options );

			request( messages );
		};

		const onClose = useCallback( () => {
			setShowAiControl( false );
			resetSuggestions();
			setAction( '' );
			setRequestCount( 0 );
		}, [ resetSuggestions ] );

		const onUserRequest = ( userPrompt: string ) => {
			const promptType = 'userPrompt';
			const options = {};
			const messages = getRequestMessages( { promptType, options, userPrompt } );

			request( messages );
		};

		// Close the AI Control if the block is deselected.
		useEffect( () => {
			if ( ! isSelected ) {
				onClose();
			}
		}, [ isSelected, onClose ] );

		const onUndo = async () => {
			for ( let i = 0; i < requestCount; i++ ) {
				await dispatch( 'core/editor' ).undo();
			}

			onClose();
		};

		return (
			<>
				<BlockEdit { ...props } />

				{ showAiControl && (
					<AiAssistantInput
						clientId={ clientId }
						postId={ postId }
						requestingState={ requestingState }
						requestingError={ error }
						suggestion={ suggestion }
						wrapperRef={ controlRef }
						inputRef={ inputRef }
						action={ action }
						request={ onUserRequest }
						stopSuggestion={ stopSuggestion }
						close={ onClose }
						undo={ onUndo }
					/>
				) }

				<BlockControls { ...blockControlsProps }>
					<AiAssistantExtensionToolbarDropdown
						blockType={ blockName }
						onAskAiAssistant={ onAskAiAssistant }
						onRequestSuggestion={ onRequestSuggestion }
					/>
				</BlockControls>
			</>
		);
	};
}, 'blockEditWithAiComponents' );

/**
 * Function used to extend the registerBlockType settings.
 * Populates the block edit component with the AI Assistant bar and button.
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @returns {object}          The extended block settings.
 */
function blockWithInlineExtension( settings, name: ExtendedInlineBlockProp ) {
	// Only extend the allowed block types.
	if ( ! EXTENDED_INLINE_BLOCKS.includes( name ) ) {
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
