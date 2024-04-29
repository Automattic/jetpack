/*
 * External dependencies
 */
import {
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	useAiSuggestions,
} from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import debugFactory from 'debug';
import React from 'react';
/*
 * Internal dependencies
 */
import { EXTENDED_INLINE_BLOCKS } from '../extensions/ai-assistant';
import { blockHandler } from './block-handler';
import AiAssistantInput from './components/ai-assistant-input';
import AiAssistantExtensionToolbarDropdown from './components/ai-assistant-toolbar-dropdown';
import { isPossibleToExtendBlock } from './lib/is-possible-to-extend-block';
/*
 * Types
 */
import type { OnRequestSuggestion } from '../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { ExtendedInlineBlockProp } from '../extensions/ai-assistant';

const debug = debugFactory( 'jetpack-ai-assistant:extensions:with-ai-extension' );

// HOC to populate the block's edit component with the AI Assistant bar and button.
const blockEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { clientId, isSelected, name: blockName } = props;

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

		// Suggestions are handled by the block handler for specific implementations.
		const { onSuggestion } = blockHandler( blockName, clientId );

		const { request, stopSuggestion, requestingState, error, suggestion } = useAiSuggestions( {
			onSuggestion,
			onDone,
			onError,
			askQuestionOptions: {
				postId,
				feature: 'ai-assistant',
			},
		} );

		// Close the AI Control if the block is deselected.
		useEffect( () => {
			if ( ! isSelected ) {
				setShowAiControl( false );
				// TODO: reset all extension data.
			}
		}, [ isSelected ] );

		// Only extend the target block.
		if ( ! possibleToExtendBlock ) {
			return <BlockEdit { ...props } />;
		}

		const blockControlsProps = {
			group: 'block' as const,
		};

		const onAskAiAssistant = () => {
			setShowAiControl( true );
		};

		const onRequestSuggestion: OnRequestSuggestion = ( promptType, options ) => {
			setShowAiControl( true );
			// TODO: handle the promptType and options to request the suggestion.
			debug( 'onRequestSuggestion', promptType, options );
		};

		const onClose = () => {
			setShowAiControl( false );
		};

		const onUndo = () => {
			// TODO: handle the undo action.
			debug( 'onUndo' );
		};

		return (
			<>
				<div className="jetpack-ai-extension--wrapper">
					<BlockEdit { ...props } />
					{ showAiControl && (
						<AiAssistantInput
							clientId={ clientId }
							postId={ postId }
							requestingState={ requestingState }
							requestingError={ error }
							suggestion={ suggestion }
							request={ request }
							stopSuggestion={ stopSuggestion }
							close={ onClose }
							undo={ onUndo }
						/>
					) }
				</div>

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
