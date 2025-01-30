/*
 * External dependencies
 */
import {
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_MAKE_SHORTER,
	PROMPT_TYPE_SUMMARIZE,
} from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import {
	MenuItem,
	MenuGroup,
	ToolbarDropdownMenu,
	Button,
	Icon,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

export const IMPROVE_KEY_MAKE_LONGER = 'make-longer' as const;
export const IMPROVE_KEY_MAKE_SHORTER = 'make-shorter' as const;
export const IMPROVE_KEY_SUMMARIZE = 'summarize' as const;

type ImproveKeyProp =
	| typeof IMPROVE_KEY_SUMMARIZE
	| typeof IMPROVE_KEY_MAKE_LONGER
	| typeof IMPROVE_KEY_MAKE_SHORTER;
type ImproveSuggestionProp =
	| typeof PROMPT_TYPE_SUMMARIZE
	| typeof PROMPT_TYPE_MAKE_LONGER
	| typeof PROMPT_TYPE_MAKE_SHORTER;

const quickActionsList = [
	{
		name: __( 'Summarize', 'jetpack' ),
		key: IMPROVE_KEY_SUMMARIZE,
		aiSuggestion: PROMPT_TYPE_SUMMARIZE,
	},
	{
		name: __( 'Make longer', 'jetpack' ),
		key: IMPROVE_KEY_MAKE_LONGER,
		aiSuggestion: PROMPT_TYPE_MAKE_LONGER,
	},
	{
		name: __( 'Make shorter', 'jetpack' ),
		key: IMPROVE_KEY_MAKE_SHORTER,
		aiSuggestion: PROMPT_TYPE_MAKE_SHORTER,
	},
];

type ImproveToolbarDropdownMenuProps = {
	/*
	 * Can be used to externally control the value of the control. Optional.
	 */
	key?: ImproveKeyProp;

	/*
	 * The label to use for the dropdown. Optional.
	 */
	label?: string;

	/*
	 * A list of quick edits to exclude from the dropdown. Optional.
	 */
	exclude?: ImproveKeyProp[];

	disabled?: boolean;

	onChange: ( item: ImproveSuggestionProp, options: { contentType: string } ) => void;
};

export default function ImproveToolbarDropdownMenu( {
	key,
	label = __( 'Improve', 'jetpack' ),
	exclude = [],
	onChange,
	disabled = false,
}: ImproveToolbarDropdownMenuProps ) {
	const { tracks } = useAnalytics();

	const toggleHandler = isOpen => {
		if ( isOpen ) {
			tracks.recordEvent( 'jetpack_ai_assistant_block_toolbar_menu_show', { tool: 'improve' } );
		}
	};

	return disabled ? (
		<Tooltip text={ label }>
			<Button disabled>
				<Icon icon={ pencil } />
			</Button>
		</Tooltip>
	) : (
		<ToolbarDropdownMenu
			icon={ pencil }
			label={ label }
			popoverProps={ {
				variant: 'toolbar',
			} }
			onToggle={ toggleHandler }
		>
			{ () => {
				// Exclude quick edits from the list.
				const quickActionsListFiltered = quickActionsList.filter(
					quickAction => ! exclude.includes( quickAction.key )
				);

				return (
					<MenuGroup label={ label }>
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
