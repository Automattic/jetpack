/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { MenuItem, MenuGroup, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription, blockTable } from '@wordpress/icons';
import React from 'react';
/**
 * Internal dependencies
 */
import {
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_USER_PROMPT,
} from '../../lib/prompt';
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

export type AiAssistantDropdownOnChangeOptionsArgProps = {
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
export default function AiAssistantToolbarDropdownContent( {
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
