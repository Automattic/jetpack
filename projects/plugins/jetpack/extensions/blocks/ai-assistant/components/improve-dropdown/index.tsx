/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import React from 'react';

export const IMPROVE_KEY_MAKE_LONGER = 'make-longer' as const;
const IMPROVE_SUGGESTION_MAKE_LONGER = 'makeLonger' as const;

export const IMPROVE_KEY_MAKE_SHORTER = 'make-shorter' as const;
const IMPROVE_SUGGESTION_MAKE_SHORTER = 'makeShorter' as const;

export const IMPROVE_KEY_SUMMARIZE = 'summarize' as const;
const IMPROVE_SUGGESTION_SUMMARIZE = 'summarize' as const;

const IMPROVE_KEY_LIST = [
	IMPROVE_KEY_SUMMARIZE,
	IMPROVE_KEY_MAKE_LONGER,
	IMPROVE_KEY_MAKE_SHORTER,
] as const;

const IMPROVE_SUGGESTION_LIST = [
	IMPROVE_SUGGESTION_SUMMARIZE,
	IMPROVE_SUGGESTION_MAKE_LONGER,
	IMPROVE_SUGGESTION_MAKE_SHORTER,
] as const;

type ImproveKeyProp = ( typeof IMPROVE_KEY_LIST )[ number ];
type ImproveSuggestionProp = ( typeof IMPROVE_SUGGESTION_LIST )[ number ];

const quickActionsList = [
	{
		name: __( 'Summarize', 'jetpack' ),
		key: IMPROVE_KEY_SUMMARIZE,
		aiSuggestion: IMPROVE_SUGGESTION_SUMMARIZE,
	},
	{
		name: __( 'Make longer', 'jetpack' ),
		key: IMPROVE_KEY_MAKE_LONGER,
		aiSuggestion: IMPROVE_SUGGESTION_MAKE_LONGER,
	},
	{
		name: __( 'Make shorter', 'jetpack' ),
		key: IMPROVE_KEY_MAKE_SHORTER,
		aiSuggestion: IMPROVE_SUGGESTION_MAKE_SHORTER,
	},
];

type ImproveDropdownProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: ImproveKeyProp;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label: string;

	/*
	 * A list of quick edits to exclude from the dropdown.
	 */
	exclude: ImproveKeyProp[];

	onChange: ( item: ImproveSuggestionProp, options: { contentType: string } ) => void;
};

export default function ImproveDropdown( { key, label, exclude, onChange }: ImproveDropdownProps ) {
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
					<MenuGroup label={ __( 'Improve', 'jetpack' ) }>
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
