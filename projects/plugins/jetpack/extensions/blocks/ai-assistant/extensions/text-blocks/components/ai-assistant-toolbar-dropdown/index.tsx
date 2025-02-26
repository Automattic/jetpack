/*
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import AiAssistantToolbarDropdownContent from '../../../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import useTransformToAssistant from '../../../../hooks/use-transform-to-assistant';
import AiAssistantToolbarDropdown from '../../../components/ai-assistant-toolbar-dropdown';
import { InlineExtensionsContext } from '../../get-block-handler';
/*
 * Types
 */
import type {
	AiAssistantDropdownOnChangeOptionsArgProps,
	OnRequestSuggestion,
} from '../../../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { PromptTypeProp } from '../../../../lib/prompt';
import type { BlockBehavior } from '../../../types';
import type { ExtendedBlockProp } from '../../constants';
import type { ReactElement } from 'react';

type AiAssistantExtensionToolbarDropdownContentProps = {
	blockType: ExtendedBlockProp;
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
		} ) => {
			const selectedBlockIds = getSelectedBlockClientIds();
			const [ clientId ] = selectedBlockIds;
			const alwaysTransform = request?.options?.alwaysTransformToAIAssistant || false;

			if (
				( selectedBlockIds.length < 2 ||
					! canTransformToAIAssistant( { clientId, blockName: blockType } ) ) &&
				! alwaysTransform
			) {
				// If there is only one selected block or the block cannot be transformed, proceed to open the extension input.
				if ( request ) {
					onRequestSuggestion?.( request.promptType, request.options );
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

	const handleRequestSuggestion: OnRequestSuggestion = ( promptType, options ) => {
		handleToolbarButtonClick( { promptType, options } );
	};

	const handleAskAiAssistant = async () => {
		handleToolbarButtonClick();
	};

	const [ clientId ] = getSelectedBlockClientIds();

	return (
		<AiAssistantToolbarDropdownContent
			blockType={ blockType }
			clientId={ clientId }
			onRequestSuggestion={ handleRequestSuggestion }
			onAskAiAssistant={ handleAskAiAssistant }
			disabled={ false }
		/>
	);
}

type AiAssistantExtensionToolbarDropdownProps = {
	behavior: BlockBehavior;
	blockType: ExtendedBlockProp;
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
		( promptType, options ) => {
			tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
				suggestion: promptType,
				block_type: blockType,
			} );

			onRequestSuggestion?.( promptType, options );
		},
		[ blockType, onRequestSuggestion, tracks ]
	);

	return (
		<AiAssistantToolbarDropdown
			label={ label }
			behavior={ behavior }
			onAction={ handleAskAiAssistant }
			onDropdownToggle={ toggleHandler }
			renderContent={ ( { onClose } ) => (
				<AiAssistantExtensionToolbarDropdownContent
					blockType={ blockType }
					onClose={ onClose }
					onAskAiAssistant={ handleAskAiAssistant }
					onRequestSuggestion={ handleRequestSuggestion }
				/>
			) }
			behaviorContext={ inlineExtensionsContext }
		/>
	);
}
