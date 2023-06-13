/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import React from 'react';

export const QUICK_EDITS_KEY_MAKE_LONGER = 'make-longer' as const;
const QUICK_EDITS_SUGGESTION_MAKE_LONGER = 'makeLonger' as const;

export const QUICK_EDITS_KEY_MAKE_SHORTER = 'make-shorter' as const;
const QUICK_EDITS_SUGGESTION_MAKE_SHORTER = 'makeShorter' as const;

export const QUICK_EDITS_KEY_SUMMARIZE = 'summarize' as const;
const QUICK_EDITS_SUGGESTION_SUMMARIZE = 'summarize' as const;

const QUICK_EDITS_KEY_LIST = [
	QUICK_EDITS_KEY_SUMMARIZE,
	QUICK_EDITS_KEY_MAKE_LONGER,
	QUICK_EDITS_KEY_MAKE_SHORTER,
] as const;

const QUICK_EDITS_SUGGESTION_LIST = [
	QUICK_EDITS_SUGGESTION_SUMMARIZE,
	QUICK_EDITS_SUGGESTION_MAKE_LONGER,
	QUICK_EDITS_SUGGESTION_MAKE_SHORTER,
] as const;

type QuickEditsKeyProp = ( typeof QUICK_EDITS_KEY_LIST )[ number ];
type QuickEditsSuggestionProp = ( typeof QUICK_EDITS_SUGGESTION_LIST )[ number ];

const quickActionsList = [
	{
		name: __( 'Summarize', 'jetpack' ),
		key: QUICK_EDITS_KEY_SUMMARIZE,
		aiSuggestion: QUICK_EDITS_SUGGESTION_SUMMARIZE,
	},
	{
		name: __( 'Make longer', 'jetpack' ),
		key: QUICK_EDITS_KEY_MAKE_LONGER,
		aiSuggestion: QUICK_EDITS_SUGGESTION_MAKE_LONGER,
	},
	{
		name: __( 'Make shorter', 'jetpack' ),
		key: QUICK_EDITS_KEY_MAKE_SHORTER,
		aiSuggestion: QUICK_EDITS_SUGGESTION_MAKE_SHORTER,
	},
];

type QuickEditsDropdownProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: QuickEditsKeyProp;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label: string;

	/*
	 * A list of quick edits to exclude from the dropdown.
	 */
	exclude: QuickEditsKeyProp[];

	onChange: ( item: QuickEditsSuggestionProp, options: { contentType: string } ) => void;
};

export default function QuickEditsDropdown( {
	key,
	label,
	exclude,
	onChange,
}: QuickEditsDropdownProps ) {
	return (
		<ToolbarDropdownMenu
			icon={ pencil }
			label={ label || __( 'Quick edits', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => {
				// Exclude quick edits from the list.
				const quickActionsListFiltered = quickActionsList.filter(
					quickAction => ! exclude.includes( quickAction.key )
				);

				return (
					<MenuGroup label={ __( 'Quick edits', 'jetpack' ) }>
						{ quickActionsListFiltered.map( quickAction => {
							return (
								<MenuItem
									key={ `key-${ quickAction.key }` }
									onClick={ () =>
										onChange( quickAction.aiSuggestion, { contentType: 'generated' } )
									}
									isSelected={ key === quickAction.key }
								>
									{ quickAction.name }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
