/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MenuItem, MenuGroup, ToolbarButton, Dropdown } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import { ExtendedBlockProp } from '../../extensions/ai-assistant';
import { getBlocksContent, getStoreBlockId } from '../../extensions/ai-assistant/with-ai-assistant';
import {
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
} from '../../lib/prompt';
import { transformToAIAssistantBlock } from '../../transforms';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu } from '../tone-dropdown-control';
import './style.scss';
/**
 * Types and constants
 */
import type { PromptTypeProp } from '../../lib/prompt';
import type { ToneProp } from '../tone-dropdown-control';

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

const QUICK_EDIT_KEY_LIST = [
	QUICK_EDIT_KEY_CORRECT_SPELLING,
	QUICK_EDIT_KEY_SIMPLIFY,
	QUICK_EDIT_KEY_SUMMARIZE,
	QUICK_EDIT_KEY_MAKE_LONGER,
] as const;

type AiAssistantKeyProp = ( typeof QUICK_EDIT_KEY_LIST )[ number ] | typeof KEY_ASK_AI_ASSISTANT;

const quickActionsList = [
	{
		name: __( 'Correct spelling and grammar', 'jetpack' ),
		key: QUICK_EDIT_KEY_CORRECT_SPELLING,
		aiSuggestion: PROMPT_TYPE_CORRECT_SPELLING,
		icon: termDescription,
	},
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
];

export type AiAssistantDropdownOnChangeOptionsArgProps = {
	tone?: ToneProp;
	language?: string;
};

type AiAssistantControlComponentProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: AiAssistantKeyProp | string;

	/*
	 * The block type. Required.
	 */
	blockType: ExtendedBlockProp;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label?: string;

	/*
	 * A list of quick edits to exclude from the dropdown.
	 */
	exclude?: AiAssistantKeyProp[];

	/*
	 * Whether the dropdown is requesting suggestions from AI.
	 */
	requestingState?: string;

	/*
	 * Whether the dropdown is disabled.
	 */
	disabled?: boolean;
};

export default function AiAssistantDropdown( {
	key,
	label,
	blockType,
	exclude = [],
	requestingState,
	disabled,
}: AiAssistantControlComponentProps ) {
	const quickActionsListFiltered = quickActionsList.filter(
		quickAction => ! exclude.includes( quickAction.key )
	);
	const toolbarLabel =
		requestingState === 'suggesting' ? null : label || __( 'AI Assistant', 'jetpack' );

	/*
	 * Let's disable the eslint rule for this line.
	 * @todo: fix by using StoreDescriptor, or something similar
	 */
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { getSelectedBlockClientIds, getBlocksByClientId } = useSelect( 'core/block-editor' );
	const { removeBlocks, replaceBlock } = useDispatch( 'core/block-editor' );

	const { tracks } = useAnalytics();

	const requestSuggestion = useCallback(
		( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
			const clientIds = getSelectedBlockClientIds();
			const blocks = getBlocksByClientId( clientIds );
			const content = getBlocksContent( blocks );

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
		},
		[ getSelectedBlockClientIds, getBlocksByClientId, blockType, replaceBlock, removeBlocks ]
	);

	const onChange = useCallback(
		( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
			tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
				suggestion: promptType,
				block_type: blockType,
			} );

			requestSuggestion( promptType, options );
		},
		[ tracks, requestSuggestion, blockType ]
	);
	const replaceWithAiAssistantBlock = useCallback( () => {
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
	}, [ getSelectedBlockClientIds, getBlocksByClientId, replaceBlock, blockType, removeBlocks ] );

	return (
		<Dropdown
			popoverProps={ {
				variant: 'toolbar',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				return (
					<ToolbarButton
						className={ classNames( 'jetpack-ai-assistant__button', {
							[ `is-${ requestingState }` ]: true,
						} ) }
						showTooltip
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ toolbarLabel }
						icon={ aiAssistantIcon }
						disabled={ disabled }
					/>
				);
			} }
			renderContent={ ( { onClose: closeDropdown } ) => (
				<MenuGroup label={ label }>
					{ ! exclude.includes( KEY_ASK_AI_ASSISTANT ) && (
						<MenuItem
							icon={ aiAssistantIcon }
							iconPosition="left"
							key="key-ai-assistant"
							onClick={ replaceWithAiAssistantBlock }
							isSelected={ key === 'key-ai-assistant' }
						>
							<div className="jetpack-ai-assistant__menu-item">
								{ __( 'Ask AI Assistant', 'jetpack' ) }
							</div>
						</MenuItem>
					) }

					{ quickActionsListFiltered.map( quickAction => (
						<MenuItem
							icon={ quickAction?.icon }
							iconPosition="left"
							key={ `key-${ quickAction.key }` }
							onClick={ () => {
								onChange( quickAction.aiSuggestion );
								closeDropdown();
							} }
							isSelected={ key === quickAction.key }
						>
							<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
						</MenuItem>
					) ) }

					<ToneDropdownMenu
						onChange={ tone => {
							onChange( PROMPT_TYPE_CHANGE_TONE, { tone } );
							closeDropdown();
						} }
					/>

					<I18nMenuDropdown
						onChange={ language => {
							onChange( PROMPT_TYPE_CHANGE_LANGUAGE, { language } );
							closeDropdown();
						} }
					/>
				</MenuGroup>
			) }
		/>
	);
}
