/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import React from 'react';

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
	exclude = [],
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
					<MenuGroup>
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
