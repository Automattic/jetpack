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
import React from 'react';
/**
 * Internal dependencies
 */
import AIAssistantIcon from '../../icons/ai-assistant';
import './style.scss';

export const QUICK_EDIT_KEY_SUMMARIZE = 'correct-spelling' as const;
const QUICK_EDIT_SUGGESTION_SUMMARIZE = 'correctSpelling' as const;

const QUICK_EDIT_KEY_LIST = [ QUICK_EDIT_KEY_SUMMARIZE ] as const;

const QUICK_EDIT_SUGGESTION_LIST = [ QUICK_EDIT_SUGGESTION_SUMMARIZE ] as const;

type QuickEditsKeyProp = ( typeof QUICK_EDIT_KEY_LIST )[ number ];
type QuickEditsSuggestionProp = ( typeof QUICK_EDIT_SUGGESTION_LIST )[ number ];

const quickActionsList = [
	{
		name: __( 'Correct spelling and grammar', 'jetpack' ),
		key: QUICK_EDIT_KEY_SUMMARIZE,
		aiSuggestion: QUICK_EDIT_SUGGESTION_SUMMARIZE,
	},
];

type AiAssistantControlComponentProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: QuickEditsKeyProp;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label?: string;

	/*
	 * A list of quick edits to exclude from the dropdown.
	 */
	exclude?: QuickEditsKeyProp[];

	onChange: ( item: QuickEditsSuggestionProp, options?: { contentType: string } ) => void;
};

const QuickEditsMenuGroup = ( {
	key,
	exclude,
	label,
	onChange,
}: AiAssistantControlComponentProps ) => {
	// Exclude quick edits from the list.
	const quickActionsListFiltered = quickActionsList.filter(
		quickAction => ! exclude.includes( quickAction.key )
	);

	return (
		<MenuGroup label={ label }>
			{ quickActionsListFiltered.map( quickAction => (
				<MenuItem
					key={ `key-${ quickAction.key }` }
					onClick={ () => onChange( quickAction.aiSuggestion, { contentType: 'generated' } ) }
					isSelected={ key === quickAction.key }
				>
					<div className="jetpack-ai-assistant__menu-item">{ quickAction.name }</div>
				</MenuItem>
			) ) }
		</MenuGroup>
	);
};

export default function AiAssistantDropdown( {
	key,
	label,
	exclude = [],
	onChange,
}: AiAssistantControlComponentProps ) {
	return (
		<ToolbarDropdownMenu
			icon={ AIAssistantIcon }
			label={ label || __( 'AI Assistant', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => (
				<>
					<QuickEditsMenuGroup key={ key } exclude={ exclude } onChange={ onChange } />
				</>
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
