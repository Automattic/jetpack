/*
 * External dependencies
 */
import {
	aiAssistantIcon,
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_MAKE_SHORTER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_USER_PROMPT,
	PROMPT_TYPE_TRANSFORM_LIST_TO_TABLE,
	CORRECT_SPELLING_LABEL,
	SIMPLIFY_LABEL,
	SUMMARIZE_LABEL,
	MAKE_LONGER_LABEL,
	MAKE_SHORTER_LABEL,
	TURN_LIST_INTO_TABLE_LABEL,
	WRITE_POST_FROM_LIST_LABEL,
} from '@automattic/jetpack-ai-client';
import { MenuItem, MenuGroup, Notice } from '@wordpress/components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription, blockTable } from '@wordpress/icons';
import React from 'react';
/**
 * Internal dependencies
 */
import { EXTENDED_BLOCKS } from '../../extensions/text-blocks/constants';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu } from '../tone-dropdown-control';
import './style.scss';
/**
 * Types and constants
 */
import type { ExtendedBlockProp } from '../../extensions/text-blocks/constants';
import type { PromptTypeProp } from '../../lib/prompt';
import type { ToneProp } from '../tone-dropdown-control';
import type { ReactElement } from 'react';

// Quick edits option: "Correct spelling and grammar"
export const QUICK_EDIT_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
export const QUICK_EDIT_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
export const QUICK_EDIT_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Make longer"
export const QUICK_EDIT_KEY_MAKE_LONGER = 'make-longer' as const;

// Quick edits option: "Make longer"
export const QUICK_EDIT_KEY_MAKE_SHORTER = 'make-shorter' as const;

// Ask AI Assistant option
export const KEY_ASK_AI_ASSISTANT = 'ask-ai-assistant' as const;

// Quick edits option: "Turn list into a table"
export const QUICK_EDIT_KEY_TURN_LIST_INTO_TABLE = 'turn-list-into-table' as const;

// Quick edits option: "Write a post from this list"
export const QUICK_EDIT_KEY_WRITE_POST_FROM_LIST = 'write-post-from-list' as const;

const quickActionsList: {
	[ key: string ]: {
		name: string;
		key: string;
		aiSuggestion: PromptTypeProp;
		icon: ReactElement;
		options?: AiAssistantDropdownOnChangeOptionsArgProps;
	}[];
} = {
	default: [
		{
			name: CORRECT_SPELLING_LABEL,
			key: QUICK_EDIT_KEY_CORRECT_SPELLING,
			aiSuggestion: PROMPT_TYPE_CORRECT_SPELLING,
			icon: termDescription,
		},
	],
	'core/paragraph': [
		{
			name: SIMPLIFY_LABEL,
			key: QUICK_EDIT_KEY_SIMPLIFY,
			aiSuggestion: PROMPT_TYPE_SIMPLIFY,
			icon: post,
		},
		{
			name: SUMMARIZE_LABEL,
			key: QUICK_EDIT_KEY_SUMMARIZE,
			aiSuggestion: PROMPT_TYPE_SUMMARIZE,
			icon: postExcerpt,
		},
		{
			name: MAKE_LONGER_LABEL,
			key: QUICK_EDIT_KEY_MAKE_LONGER,
			aiSuggestion: PROMPT_TYPE_MAKE_LONGER,
			icon: postContent,
		},
		{
			name: MAKE_SHORTER_LABEL,
			key: QUICK_EDIT_KEY_MAKE_SHORTER,
			aiSuggestion: PROMPT_TYPE_MAKE_SHORTER,
			icon: postContent,
		},
	],
	'core/list-item': [
		{
			name: SIMPLIFY_LABEL,
			key: QUICK_EDIT_KEY_SIMPLIFY,
			aiSuggestion: PROMPT_TYPE_SIMPLIFY,
			icon: post,
		},
		{
			name: MAKE_LONGER_LABEL,
			key: QUICK_EDIT_KEY_MAKE_LONGER,
			aiSuggestion: PROMPT_TYPE_MAKE_LONGER,
			icon: postContent,
		},
		{
			name: MAKE_SHORTER_LABEL,
			key: QUICK_EDIT_KEY_MAKE_SHORTER,
			aiSuggestion: PROMPT_TYPE_MAKE_SHORTER,
			icon: postContent,
		},
	],
	'core/list': EXTENDED_BLOCKS.includes( 'core/list' )
		? [
				{
					name: SIMPLIFY_LABEL,
					key: QUICK_EDIT_KEY_SIMPLIFY,
					aiSuggestion: PROMPT_TYPE_SIMPLIFY,
					icon: post,
				},
				{
					name: MAKE_LONGER_LABEL,
					key: QUICK_EDIT_KEY_MAKE_LONGER,
					aiSuggestion: PROMPT_TYPE_MAKE_LONGER,
					icon: postContent,
				},
				{
					name: MAKE_SHORTER_LABEL,
					key: QUICK_EDIT_KEY_MAKE_SHORTER,
					aiSuggestion: PROMPT_TYPE_MAKE_SHORTER,
					icon: postContent,
				},
				{
					name: TURN_LIST_INTO_TABLE_LABEL,
					key: QUICK_EDIT_KEY_TURN_LIST_INTO_TABLE,
					aiSuggestion: PROMPT_TYPE_TRANSFORM_LIST_TO_TABLE,
					icon: blockTable,
					options: {
						alwaysTransformToAIAssistant: true,
						rootParentOnly: true,
					},
				},
		  ]
		: [
				// Those actions are transformative in nature and are better suited for the AI Assistant block.
				// TODO: Keep the action, but transforming the block.
				{
					name: WRITE_POST_FROM_LIST_LABEL,
					key: QUICK_EDIT_KEY_WRITE_POST_FROM_LIST,
					aiSuggestion: PROMPT_TYPE_USER_PROMPT,
					icon: post,
					options: {
						userPrompt:
							'Write a post based on the list items. Include a title as first order heading and try to use secondary headings for each entry',
					},
				},
		  ],
};

export type AiAssistantDropdownOnChangeOptionsArgProps = {
	tone?: ToneProp;
	language?: string;
	userPrompt?: string;
	alwaysTransformToAIAssistant?: boolean;
	rootParentOnly?: boolean;
};

export type OnRequestSuggestion = (
	promptType: PromptTypeProp,
	options?: AiAssistantDropdownOnChangeOptionsArgProps
) => void;

type AiAssistantToolbarDropdownContentProps = {
	blockType: ExtendedBlockProp;
	disabled?: boolean;
	onAskAiAssistant: () => void;
	onRequestSuggestion: OnRequestSuggestion;
	clientId: string;
};

/**
 * The React UI content of the dropdown.
 * @param {AiAssistantToolbarDropdownContentProps} props - The props.
 * @return {ReactElement} The React content of the dropdown.
 */
export default function AiAssistantToolbarDropdownContent( {
	blockType,
	clientId,
	disabled = false,
	onAskAiAssistant,
	onRequestSuggestion,
}: AiAssistantToolbarDropdownContentProps ): ReactElement {
	const blockQuickActions = quickActionsList[ blockType ] ?? [];

	const { getBlockParents } = select( 'core/block-editor' ) as unknown as {
		getBlockParents: ( blockId: string ) => string[];
	};
	const blockParents = getBlockParents( clientId );

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

				{ [ ...quickActionsList.default, ...blockQuickActions ]
					.filter(
						quickAction => ! ( quickAction.options?.rootParentOnly && blockParents.length > 0 )
					)
					.map( quickAction => {
						return (
							<MenuItem
								icon={ quickAction?.icon }
								iconPosition="left"
								key={ `key-${ quickAction.key }` }
								onClick={ () => {
									onRequestSuggestion( quickAction.aiSuggestion, {
										...( quickAction.options ?? {} ),
									} );
								} }
								disabled={ disabled }
							>
								<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
							</MenuItem>
						);
					} ) }

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
