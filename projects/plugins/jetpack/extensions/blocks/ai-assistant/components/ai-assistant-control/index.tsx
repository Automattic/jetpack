/*
 * External dependencies
 */
import {
	MenuItem,
	MenuGroup,
	CustomSelectControl,
	ToolbarButton,
	Dropdown,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { post, postContent, postExcerpt, termDescription } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../extensions/ai-assistant/ui-context';
import aiAssistant from '../../icons/ai-assistant';
import {
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_MAKE_SHORTER,
	PROMPT_TYPE_SUMMARY_BY_TITLE,
} from '../../lib/prompt';
import { I18nMenuDropdown } from '../i18n-dropdown-control';
import { ToneDropdownMenu } from '../tone-dropdown-control';
import './style.scss';
/**
 * Types and constants
 */
import type { RequestingStateProp } from '../../hooks/use-suggestions-from-ai';
import type { PromptTypeProp } from '../../lib/prompt';
import type { ToneProp } from '../tone-dropdown-control';

// Quick edits option: "Correct spelling and grammar"
const QUICK_EDIT_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
const QUICK_EDIT_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
const QUICK_EDIT_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Summarize based on title"
const QUICK_EDIT_KEY_SUMMARIZE_BASED_ON_TITLE = 'summarize-based-on-title' as const;

// Quick edits option: "Make longer"
const QUICK_EDIT_KEY_MAKE_LONGER = 'make-longer' as const;

// Quick edits option: "Make shorter"
const QUICK_EDIT_KEY_MAKE_SHORTER = 'make-shorter' as const;

// Ask AI Assistant option
export const KEY_ASK_AI_ASSISTANT = 'ask-ai-assistant' as const;

const QUICK_EDIT_KEY_LIST = [
	QUICK_EDIT_KEY_CORRECT_SPELLING,
	QUICK_EDIT_KEY_SIMPLIFY,
	QUICK_EDIT_KEY_SUMMARIZE,
	QUICK_EDIT_KEY_MAKE_LONGER,
	QUICK_EDIT_KEY_MAKE_SHORTER,
	QUICK_EDIT_KEY_SUMMARIZE_BASED_ON_TITLE,
] as const;

type AiAssistantKeyProp = ( typeof QUICK_EDIT_KEY_LIST )[ number ] | typeof KEY_ASK_AI_ASSISTANT;

export const quickActionsList = [
	{
		name: __( 'Summarize based on title', 'jetpack' ),
		key: QUICK_EDIT_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_SUMMARY_BY_TITLE,
		icon: postExcerpt,
	},
	{
		name: __( 'Correct spelling and grammar', 'jetpack' ),
		key: QUICK_EDIT_KEY_CORRECT_SPELLING,
		promptType: PROMPT_TYPE_CORRECT_SPELLING,
		icon: termDescription,
	},
	{
		name: __( 'Simplify', 'jetpack' ),
		key: QUICK_EDIT_KEY_SIMPLIFY,
		promptType: PROMPT_TYPE_SIMPLIFY,
		icon: post,
	},
	{
		name: __( 'Summarize', 'jetpack' ),
		key: QUICK_EDIT_KEY_SUMMARIZE,
		promptType: PROMPT_TYPE_SUMMARIZE,
		icon: postExcerpt,
	},
	{
		name: __( 'Expand', 'jetpack' ),
		key: QUICK_EDIT_KEY_MAKE_LONGER,
		promptType: PROMPT_TYPE_MAKE_LONGER,
		icon: postContent,
	},
	{
		name: __( 'Make shorter', 'jetpack' ),
		key: QUICK_EDIT_KEY_MAKE_SHORTER,
		promptType: PROMPT_TYPE_MAKE_SHORTER,
		icon: postExcerpt,
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
	requestingState?: RequestingStateProp;

	/*
	 * Whether the dropdown is disabled.
	 */
	disabled?: boolean;

	onChange: ( item: PromptTypeProp, options?: AiAssistantDropdownOnChangeOptionsArgProps ) => void;

	onReplace: () => void;
};

export function QuickActionsMenuItems( { actions, selectedKey, onChange } ) {
	return (
		<MenuGroup>
			{ actions.map( quickAction => (
				<MenuItem
					icon={ quickAction?.icon }
					iconPosition="left"
					key={ `key-${ quickAction.key }` }
					onClick={ () => onChange( quickAction ) }
					isSelected={ selectedKey === quickAction.key }
				>
					<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export default function AiAssistantDropdown( {
	key,
	label,
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

	const { showAssistant } = useContext( AiAssistantUiContext );

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
						icon={ aiAssistant }
						disabled={ disabled }
					/>
				);
			} }
			renderContent={ ( { onClose: closeDropdown } ) => (
				<MenuGroup label={ label }>
					{ ! exclude.includes( KEY_ASK_AI_ASSISTANT ) && (
						<MenuItem
							icon={ aiAssistant }
							iconPosition="left"
							key="key-ai-assistant"
							onClick={ () => {
								showAssistant();
								closeDropdown();
							} }
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
								onChange( quickAction.promptType );
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
