/*
 * External dependencies
 */
import {
	MenuItem,
	MenuGroup,
	ToolbarDropdownMenu,
	CustomSelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription } from '@wordpress/icons';
import React from 'react';
/**
 * Internal dependencies
 */
import AIAssistantIcon from '../../icons/ai-assistant';
import {
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PromptTypeProp,
} from '../../lib/prompt';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu, ToneProp } from '../tone-dropdown-control';
import './style.scss';

// Quick edits option: "Correct spelling and grammar"
const QUICK_EDIT_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
const QUICK_EDIT_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
const QUICK_EDIT_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Make longer"
const QUICK_EDIT_KEY_MAKE_LONGER = 'make-longer' as const;

const QUICK_EDIT_KEY_LIST = [
	QUICK_EDIT_KEY_CORRECT_SPELLING,
	QUICK_EDIT_KEY_SIMPLIFY,
	QUICK_EDIT_KEY_SUMMARIZE,
	QUICK_EDIT_KEY_MAKE_LONGER,
] as const;

type QuickEditsKeyProp = ( typeof QUICK_EDIT_KEY_LIST )[ number ];

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
	contentType: 'generated' | string;
	tone?: ToneProp;
	language?: string;
};

type AiAssistantControlComponentProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: QuickEditsKeyProp | string;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label?: string;

	/*
	 * A list of quick edits to exclude from the dropdown.
	 */
	exclude?: QuickEditsKeyProp[];

	onChange: ( item: PromptTypeProp, options?: AiAssistantDropdownOnChangeOptionsArgProps ) => void;
};

export default function AiAssistantDropdown( {
	key,
	label,
	exclude = [],
	onChange,
}: AiAssistantControlComponentProps ) {
	const quickActionsListFiltered = quickActionsList.filter(
		quickAction => ! exclude.includes( quickAction.key )
	);

	return (
		<ToolbarDropdownMenu
			icon={ AIAssistantIcon }
			label={ label || __( 'AI Assistant', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ ( { onClose: closeDropdown } ) => (
				<MenuGroup label={ label }>
					{ quickActionsListFiltered.map( quickAction => (
						<MenuItem
							icon={ quickAction?.icon }
							iconPosition="left"
							key={ `key-${ quickAction.key }` }
							onClick={ () => {
								onChange( quickAction.aiSuggestion, { contentType: 'generated' } );
								closeDropdown();
							} }
							isSelected={ key === quickAction.key }
						>
							<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
						</MenuItem>
					) ) }

					<ToneDropdownMenu
						onChange={ tone => {
							onChange( PROMPT_TYPE_CHANGE_TONE, { tone, contentType: 'generated' } );
							closeDropdown();
						} }
					/>

					<I18nMenuDropdown
						onChange={ language => {
							onChange( PROMPT_TYPE_CHANGE_LANGUAGE, { language, contentType: 'generated' } );
							closeDropdown();
						} }
					/>
				</MenuGroup>
			) }
		</ToolbarDropdownMenu>
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
