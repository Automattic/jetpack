/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { getBlockContent } from '@wordpress/blocks';
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
import { getRawTextFromHTML } from '../../lib/utils/block-content';
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

const debug = debugFactory( 'jetpack-ai-assistant:dropdown' );

// Quick edits option: "Correct spelling and grammar"
const QUICK_EDIT_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
const QUICK_EDIT_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
const QUICK_EDIT_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Make longer"
const QUICK_EDIT_KEY_MAKE_LONGER = 'make-longer' as const;

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
				userPrompt: 'Write a post based on the list items. Try to use a heading for each entry',
			},
		},
	],
};

export type AiAssistantDropdownOnChangeOptionsArgProps = {
	tone?: ToneProp;
	language?: string;
	userPrompt?: string;
};

type AiAssistantControlComponentProps = {
	/*
	 * The block type. Required.
	 */
	blockType: ExtendedBlockProp;
};

/**
 * Given a list of blocks, it returns their content as a string.
 * @param {Array} blocks - The list of blocks.
 * @returns {string}       The content of the blocks as a string.
 */
export function getBlocksContent( blocks ) {
	return blocks
		.filter( block => block != null ) // Safeguard against null or undefined blocks
		.map( block => getBlockContent( block ) )
		.join( '\n\n' );
}

type AiAssistantDropdownContentProps = {
	onClose: () => void;
	blockType: ExtendedBlockProp;
};

/**
 * The React content of the dropdown.
 * @param {AiAssistantDropdownContentProps} props - The props.
 * @returns {React.ReactNode} The React content of the dropdown.
 */
function AiAssistantDropdownContent( {
	onClose,
	blockType,
}: AiAssistantDropdownContentProps ): React.JSX.Element {
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

	const blockQuickActions = quickActionsList[ blockType ] ?? [];

	return (
		<>
			{ noContent && (
				<Notice status="warning" isDismissible={ false } className="jetpack-ai-assistant__info">
					{ __( 'Add content to activate the tools below', 'jetpack' ) }
				</Notice>
			) }

			<MenuGroup>
				<MenuItem
					icon={ aiAssistantIcon }
					iconPosition="left"
					key="key-ai-assistant"
					onClick={ replaceWithAiAssistantBlock }
					disabled={ noContent }
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
							requestSuggestion( quickAction.aiSuggestion, { ...( quickAction.options ?? {} ) } );
						} }
						disabled={ noContent }
					>
						<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
					</MenuItem>
				) ) }

				<ToneDropdownMenu
					onChange={ tone => {
						requestSuggestion( PROMPT_TYPE_CHANGE_TONE, { tone } );
					} }
					disabled={ noContent }
				/>

				<I18nMenuDropdown
					onChange={ language => {
						requestSuggestion( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
					} }
					disabled={ noContent }
				/>
			</MenuGroup>
		</>
	);
}

export default function AiAssistantDropdown( { blockType }: AiAssistantControlComponentProps ) {
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
						label={ __( 'AI Assistant', 'jetpack' ) }
						icon={ aiAssistantIcon }
					/>
				);
			} }
			onToggle={ toggleHandler }
			renderContent={ ( { onClose: onClose } ) => (
				<AiAssistantDropdownContent onClose={ onClose } blockType={ blockType } />
			) }
		/>
	);
}
