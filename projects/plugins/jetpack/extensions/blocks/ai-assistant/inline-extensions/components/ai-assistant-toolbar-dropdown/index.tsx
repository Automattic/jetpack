/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ToolbarButton, Dropdown } from '@wordpress/components';
import React, { useCallback, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import AiAssistantToolbarDropdownContent from '../../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import useTransformToAssistant from '../../../hooks/use-transform-to-assistant';
import { InlineExtensionsContext } from '../../get-block-handler';
/*
 * Types
 */
import type {
	AiAssistantDropdownOnChangeOptionsArgProps,
	OnRequestSuggestion,
} from '../../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { ExtendedInlineBlockProp } from '../../../extensions/ai-assistant';
import type { PromptTypeProp } from '../../../lib/prompt';
import type { BlockBehavior } from '../../types';
import type { ReactElement } from 'react';

type AiAssistantExtensionToolbarDropdownContentProps = {
	blockType: ExtendedInlineBlockProp;
	onClose: () => void;
	onAskAiAssistant: () => void;
	onRequestSuggestion: OnRequestSuggestion;
};

/**
 * The dropdown component with logic for the AI Assistant block.
 * @param {AiAssistantExtensionToolbarDropdownContentProps} props - The props.
 * @return {ReactElement} The React content of the dropdown.
 */
function AiAssistantExtensionToolbarDropdownContent( {
	blockType,
	onClose,
	onAskAiAssistant,
	onRequestSuggestion,
}: AiAssistantExtensionToolbarDropdownContentProps ) {
	const { canTransformToAIAssistant, transformToAIAssistant, getSelectedBlockClientIds } =
		useTransformToAssistant();

	const handleToolbarButtonClick = useCallback(
		( request?: {
			promptType: PromptTypeProp;
			options?: AiAssistantDropdownOnChangeOptionsArgProps;
			humanText?: string;
		} ) => {
			const selectedBlockIds = getSelectedBlockClientIds();
			const [ clientId ] = selectedBlockIds;

			if (
				selectedBlockIds.length < 2 ||
				! canTransformToAIAssistant( { clientId, blockName: blockType } )
			) {
				// If there is only one selected block or the block cannot be transformed, proceed to open the extension input.
				if ( request ) {
					onRequestSuggestion?.( request.promptType, request.options, request.humanText );
				} else {
					onAskAiAssistant?.();
				}
				onClose?.();
			} else {
				// If there are multiple blocks selected, replace them with a single AI Assistant block.
				transformToAIAssistant( { request } );
			}
		},
		[
			blockType,
			canTransformToAIAssistant,
			getSelectedBlockClientIds,
			onAskAiAssistant,
			onClose,
			onRequestSuggestion,
			transformToAIAssistant,
		]
	);

	const handleRequestSuggestion: OnRequestSuggestion = ( promptType, options, humanText ) => {
		handleToolbarButtonClick( { promptType, options, humanText } );
	};

	const handleAskAiAssistant = async () => {
		handleToolbarButtonClick();
	};

	return (
		<AiAssistantToolbarDropdownContent
			blockType={ blockType }
			onRequestSuggestion={ handleRequestSuggestion }
			onAskAiAssistant={ handleAskAiAssistant }
			disabled={ false }
		/>
	);
}

type AiAssistantExtensionToolbarDropdownProps = {
	behavior: BlockBehavior;
	blockType: ExtendedInlineBlockProp;
	label?: string;
	onAskAiAssistant: () => void;
	onRequestSuggestion: OnRequestSuggestion;
};

export default function AiAssistantExtensionToolbarDropdown( {
	behavior,
	blockType,
	label = __( 'AI Assistant', 'jetpack' ),
	onAskAiAssistant,
	onRequestSuggestion,
}: AiAssistantExtensionToolbarDropdownProps ): ReactElement {
	const { tracks } = useAnalytics();
	const inlineExtensionsContext = useContext( InlineExtensionsContext );

	const toggleHandler = useCallback(
		( isOpen: boolean ) => {
			if ( isOpen ) {
				tracks.recordEvent( 'jetpack_ai_assistant_extension_toolbar_menu_show', {
					block_type: blockType,
				} );
			}
		},
		[ blockType, tracks ]
	);

	const handleAskAiAssistant = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_prompt_show', {
			block_type: blockType,
		} );

		onAskAiAssistant?.();
	}, [ blockType, onAskAiAssistant, tracks ] );

	const handleRequestSuggestion = useCallback< OnRequestSuggestion >(
		( promptType, options, humanText ) => {
			tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
				suggestion: promptType,
				block_type: blockType,
			} );

			onRequestSuggestion?.( promptType, options, humanText );
		},
		[ blockType, onRequestSuggestion, tracks ]
	);

	return (
		<Dropdown
			popoverProps={ {
				variant: 'toolbar',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const handleClick = () => {
					if ( typeof behavior === 'function' ) {
						behavior( { onToggle, onAskAiAssistant, context: inlineExtensionsContext } );
						return;
					}

					switch ( behavior ) {
						case 'action':
							handleAskAiAssistant();
							break;
						case 'dropdown':
							onToggle();
							break;
					}
				};

				return (
					<ToolbarButton
						className="jetpack-ai-assistant__button"
						showTooltip
						onClick={ handleClick }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						icon={ aiAssistantIcon }
					/>
				);
			} }
			onToggle={ toggleHandler }
			renderContent={ ( { onClose: onClose } ) => (
				<AiAssistantExtensionToolbarDropdownContent
					onClose={ onClose }
					blockType={ blockType }
					onAskAiAssistant={ handleAskAiAssistant }
					onRequestSuggestion={ handleRequestSuggestion }
				/>
			) }
		/>
	);
}
