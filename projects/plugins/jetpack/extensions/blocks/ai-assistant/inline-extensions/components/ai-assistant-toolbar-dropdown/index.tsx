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
import { InlineExtensionsContext } from '../../get-block-handler';
/*
 * Types
 */
import type { OnRequestSuggestion } from '../../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { ExtendedInlineBlockProp } from '../../../extensions/ai-assistant';
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
 * @returns {ReactElement} The React content of the dropdown.
 */
function AiAssistantExtensionToolbarDropdownContent( {
	blockType,
	onClose,
	onAskAiAssistant,
	onRequestSuggestion,
}: AiAssistantExtensionToolbarDropdownContentProps ) {
	const handleRequestSuggestion: OnRequestSuggestion = ( ...args ) => {
		onRequestSuggestion?.( ...args );
		onClose?.();
	};

	const handleAskAiAssistant = () => {
		onAskAiAssistant?.();
		onClose?.();
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
