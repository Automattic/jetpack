/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MenuItem, MenuGroup, ToolbarButton, Dropdown, Notice } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription, blockTable } from '@wordpress/icons';
import debugFactory from 'debug';
import React from 'react';
/**
 * Internal dependencies
 */
import { getStoreBlockId } from '../../extensions/ai-assistant/with-ai-assistant';
import {
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_USER_PROMPT,
} from '../../lib/prompt';
import { getBlocksContent, getRawTextFromHTML } from '../../lib/utils/block-content';
import { transformToAIAssistantBlock } from '../../transforms';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu } from '../tone-dropdown-control';
import './style.scss';
/**
 * Types and constants
 */
import type { ExtendedBlockProp } from '../../extensions/ai-assistant';
import type { PromptTypeProp } from '../../lib/prompt';
import type { ToneProp } from '../tone-dropdown-control';
import type { ReactElement } from 'react';

const debug = debugFactory( 'jetpack-ai-assistant:dropdown' );

// Quick edits option: "Correct spelling and grammar"
export const QUICK_EDIT_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
export const QUICK_EDIT_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
export const QUICK_EDIT_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Make longer"
export const QUICK_EDIT_KEY_MAKE_LONGER = 'make-longer' as const;

// Ask AI Assistant option
export const KEY_ASK_AI_ASSISTANT = 'ask-ai-assistant' as const;

const quickActionsList = {
	default: [
		{
			name: __( 'Correct spelling and grammar', 'jetpack' ),
			key: QUICK_EDIT_KEY_CORRECT_SPELLING,
			aiSuggestion: PROMPT_TYPE_CORRECT_SPELLING,
			icon: termDescription,
		},
	],
	'core/paragraph': [
		{
			name: __( 'Simplify', 'jetpack' ),
			key: QUICK_EDIT_KEY_SIMPLIFY,
			aiSuggestion: PROMPT_TYPE_SIMPLIFY,
			icon: post,
		},
		{
			name: __( 'Summarize', 'jetpack' ),
			key: QUICK_EDIT_KEY_SUMMARIZE,
			aiSuggestion: PROMPT_TYPE_SUMMARIZE,
			icon: postExcerpt,
		},
		{
			name: __( 'Expand', 'jetpack' ),
			key: QUICK_EDIT_KEY_MAKE_LONGER,
			aiSuggestion: PROMPT_TYPE_MAKE_LONGER,
			icon: postContent,
		},
	],
	'core/list': [
		{
			name: __( 'Turn list into a table', 'jetpack' ),
			key: 'turn-into-table',
			aiSuggestion: PROMPT_TYPE_USER_PROMPT,
			icon: blockTable,
			options: {
				userPrompt: 'make a table from this list, do not enclose the response in a code block',
			},
		},
		{
			name: __( 'Write a post from this list', 'jetpack' ),
			key: 'write-post-from-list',
			aiSuggestion: PROMPT_TYPE_USER_PROMPT,
			icon: post,
			options: {
				userPrompt:
					'Write a post based on the list items. Include a title as first order heading and try to use secondary headings for each entry',
			},
		},
	],
};

type AiAssistantDropdownOnChangeOptionsArgProps = {
	tone?: ToneProp;
	language?: string;
	userPrompt?: string;
};

type AiAssistantToolbarDropdownContentProps = {
	blockType: ExtendedBlockProp;
	disabled?: boolean;
	onAskAiAssistant: () => void;
	onRequestSuggestion: (
		promptType: PromptTypeProp,
		options?: AiAssistantDropdownOnChangeOptionsArgProps
	) => void;
};

/**
 * The React UI content of the dropdown.
 * @param {AiAssistantToolbarDropdownContentProps} props - The props.
 * @returns {ReactElement} The React content of the dropdown.
 */
function AiAssistantToolbarDropdownContent( {
	blockType,
	disabled = false,
	onAskAiAssistant,
	onRequestSuggestion,
}: AiAssistantToolbarDropdownContentProps ): ReactElement {
	const blockQuickActions = quickActionsList[ blockType ] ?? [];

	return (
		<>
			{ disabled && (
				<Notice status="warning" isDismissible={ false } className="jetpack-ai-assistant__info">
					{ __( 'Add content to activate the tools below', 'jetpack' ) }
				</Notice>
			) }

			<MenuGroup>
				<MenuItem
					icon={ aiAssistantIcon }
					iconPosition="left"
					key="key-ai-assistant"
					onClick={ onAskAiAssistant }
					disabled={ disabled }
				>
					<div className="jetpack-ai-assistant__menu-item">
						{ __( 'Ask AI Assistant', 'jetpack' ) }
					</div>
				</MenuItem>

				{ [ ...quickActionsList.default, ...blockQuickActions ].map( quickAction => (
					<MenuItem
						icon={ quickAction?.icon }
						iconPosition="left"
						key={ `key-${ quickAction.key }` }
						onClick={ () => {
							onRequestSuggestion( quickAction.aiSuggestion, { ...( quickAction.options ?? {} ) } );
						} }
						disabled={ disabled }
					>
						<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
					</MenuItem>
				) ) }

				<ToneDropdownMenu
					onChange={ tone => {
						onRequestSuggestion( PROMPT_TYPE_CHANGE_TONE, { tone } );
					} }
					disabled={ disabled }
				/>

				<I18nMenuDropdown
					onChange={ language => {
						onRequestSuggestion( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
					} }
					disabled={ disabled }
				/>
			</MenuGroup>
		</>
	);
}

type AiAssistantBlockToolbarDropdownContentProps = {
	onClose: () => void;
	blockType: ExtendedBlockProp;
};

/**
 * The dropdown component with logic for the AI Assistant block.
 * @param {AiAssistantBlockToolbarDropdownContentProps} props - The props.
 * @returns {ReactElement} The React content of the dropdown.
 */
function AiAssistantBlockToolbarDropdownContent( {
	onClose,
	blockType,
}: AiAssistantBlockToolbarDropdownContentProps ) {
	// Set the state for the no content info.
	const [ noContent, setNoContent ] = useState( false );

	/*
	 * Let's disable the eslint rule for this line.
	 * @todo: fix by using StoreDescriptor, or something similar
	 */
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { getSelectedBlockClientIds, getBlocksByClientId } = useSelect( 'core/block-editor' );
	const { removeBlocks, replaceBlock } = useDispatch( 'core/block-editor' );

	// Store the current content in a local state
	useEffect( () => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		const rawContent = getRawTextFromHTML( content );

		// Set no content condition to show the Notice info message.
		return setNoContent( ! rawContent.length );
	}, [ getBlocksByClientId, getSelectedBlockClientIds ] );

	const { tracks } = useAnalytics();

	const requestSuggestion = (
		promptType: PromptTypeProp,
		options: AiAssistantDropdownOnChangeOptionsArgProps = {}
	) => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		onClose();
		debug( 'requestSuggestion', promptType, options );
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: promptType,
			block_type: blockType,
		} );

		const [ firstBlock ] = blocks;
		const [ firstClientId, ...otherBlocksIds ] = clientIds;

		const extendedBlockAttributes = {
			...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
			content,
		};

		const newAIAssistantBlock = transformToAIAssistantBlock( blockType, extendedBlockAttributes );

		/*
		 * Store in the local storage the client id
		 * of the block that need to auto-trigger the AI Assistant request.
		 * @todo: find a better way to update the content,
		 * probably using a new store triggering an action.
		 */

		// Storage client Id, prompt type, and options.
		const storeObject = {
			clientId: firstClientId,
			type: promptType,
			options: { ...options, contentType: 'generated', fromExtension: true }, // When converted, the original content must be treated as generated
		};

		localStorage.setItem(
			getStoreBlockId( newAIAssistantBlock.clientId ),
			JSON.stringify( storeObject )
		);

		/*
		 * Replace the first block with the new AI Assistant block instance.
		 * This block contains the original content,
		 * even for multiple blocks selection.
		 */
		replaceBlock( firstClientId, newAIAssistantBlock );

		// It removes the rest of the blocks in case there are more than one.
		removeBlocks( otherBlocksIds );
	};

	const replaceWithAiAssistantBlock = () => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		const [ firstClientId, ...otherBlocksIds ] = clientIds;
		const [ firstBlock ] = blocks;

		const extendedBlockAttributes = {
			...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
			content,
		};

		replaceBlock(
			firstClientId,
			transformToAIAssistantBlock( blockType, extendedBlockAttributes )
		);

		removeBlocks( otherBlocksIds );
		tracks.recordEvent( 'jetpack_ai_assistant_prompt_show', { block_type: blockType } );
	};

	return (
		<AiAssistantToolbarDropdownContent
			blockType={ blockType }
			onRequestSuggestion={ requestSuggestion }
			onAskAiAssistant={ replaceWithAiAssistantBlock }
			disabled={ noContent }
		/>
	);
}

type AiAssistantBlockToolbarDropdownProps = {
	blockType: ExtendedBlockProp;
	label?: string;
};

/**
 * The AI Assistant dropdown component.
 * @param {AiAssistantBlockToolbarDropdownProps} props - The props.
 * @returns {ReactElement} The AI Assistant dropdown component.
 */
export default function AiAssistantBlockToolbarDropdown( {
	blockType,
	label = __( 'AI Assistant', 'jetpack' ),
}: AiAssistantBlockToolbarDropdownProps ) {
	const { tracks } = useAnalytics();

	const toggleHandler = isOpen => {
		if ( isOpen ) {
			tracks.recordEvent( 'jetpack_ai_assistant_extension_toolbar_menu_show', {
				block_type: blockType,
			} );
		}
	};

	return (
		<Dropdown
			popoverProps={ {
				variant: 'toolbar',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				return (
					<ToolbarButton
						className="jetpack-ai-assistant__button"
						showTooltip
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						icon={ aiAssistantIcon }
					/>
				);
			} }
			onToggle={ toggleHandler }
			renderContent={ ( { onClose: onClose } ) => (
				<AiAssistantBlockToolbarDropdownContent onClose={ onClose } blockType={ blockType } />
			) }
		/>
	);
}
