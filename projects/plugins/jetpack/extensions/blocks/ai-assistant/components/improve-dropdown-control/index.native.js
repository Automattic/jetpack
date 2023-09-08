/*
 * External dependencies
 */
import { ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

export const IMPROVE_KEY_MAKE_LONGER = 'make-longer';
const IMPROVE_SUGGESTION_MAKE_LONGER = 'makeLonger';

export const IMPROVE_KEY_MAKE_SHORTER = 'make-shorter';
const IMPROVE_SUGGESTION_MAKE_SHORTER = 'makeShorter';

export const IMPROVE_KEY_SUMMARIZE = 'summarize';
const IMPROVE_SUGGESTION_SUMMARIZE = 'summarize';

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

export default function ImproveToolbarDropdownMenu( { key, label, exclude = [], onChange } ) {
	// Exclude quick edits from the list.
	const quickActionsListFiltered = quickActionsList.filter(
		quickAction => ! exclude.includes( quickAction.key )
	);
	return (
		<ToolbarDropdownMenu
			icon={ pencil }
			label={ label || __( 'Improve', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
			controls={ quickActionsListFiltered.map( quickAction => {
				return {
					title: quickAction.name,
					isActive: key === quickAction.key,
					onClick: () =>
						onChange( quickAction.aiSuggestion, {
							contentType: 'generated',
						} ),
				};
			} ) }
		></ToolbarDropdownMenu>
	);
}
