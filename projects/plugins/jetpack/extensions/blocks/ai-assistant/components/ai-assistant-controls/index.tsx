/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import {
	MenuItem,
	MenuGroup,
	CustomSelectControl,
	ToolbarButton,
	Dropdown,
} from '@wordpress/components';
import { select, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import { ExtendedBlockProp } from '../../extensions/ai-assistant';
import { getBlocksContent } from '../../extensions/ai-assistant/with-ai-assistant';
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

	onChange: ( item: PromptTypeProp, options?: AiAssistantDropdownOnChangeOptionsArgProps ) => void;
};

export default function AiAssistantDropdown( {
	key,
	label,
	blockType,
	exclude = [],
	requestingState,
	disabled,
	onChange,
}: AiAssistantControlComponentProps ) {
	const quickActionsListFiltered = quickActionsList.filter(
		quickAction => ! exclude.includes( quickAction.key )
	);
	const toolbarLabel =
		requestingState === 'suggesting' ? null : label || __( 'AI Assistant', 'jetpack' );

	const { removeBlocks, replaceBlock } = useDispatch( 'core/block-editor' );

	const replaceWithAiAssistantBlock = useCallback( () => {
		const clientIds = select( 'core/block-editor' ).getSelectedBlockClientIds();
		const blocks = select( 'core/block-editor' ).getBlocksByClientId( clientIds );
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
	}, [ blockType, replaceBlock, removeBlocks ] );

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

export function QuickEditsSelectControl( {
	key,
	label,
	exclude = [],
	onChange,
}: AiAssistantControlComponentProps ) {
	// Initial value. If not found, use empty.
	const value = quickActionsList.find( quickAction => quickAction.key === key ) || '';

	// Exclude when required.
	const quickActionsListFiltered = exclude.length
		? quickActionsList.filter( quickAction => ! exclude.includes( quickAction.key ) )
		: quickActionsList;

	return (
		<CustomSelectControl
			label={ label }
			value={ value }
			options={ quickActionsListFiltered }
			onChange={ ( { selectedItem } ) => onChange( selectedItem ) }
		/>
	);
}
