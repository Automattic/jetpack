/**
 * Actions slot for the AdminPage header on the Studio editor screen: Undo /
 * Redo icon buttons, the outline Discard button, the primary Save button, and
 * an overflow menu with "Restore original…" (shown only when the server
 * reports a restorable original). All enable/disable logic lives in the
 * editor screen; this component is purely presentational.
 */
import { Button as IconButton, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, redo as redoIcon, undo as undoIcon } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
	canDiscard: boolean;
	onDiscard: () => void;
	canSave: boolean;
	onSave: () => void;
	canRestoreOriginal: boolean;
	onRestoreOriginal: () => void;
};

/**
 * The Studio editor's header actions.
 *
 * @param props                    - Component props.
 * @param props.canUndo            - Whether an undo entry is available.
 * @param props.canRedo            - Whether a redo entry is available.
 * @param props.onUndo             - Called when Undo is activated.
 * @param props.onRedo             - Called when Redo is activated.
 * @param props.canDiscard         - Whether there are unsaved edits to discard.
 * @param props.onDiscard          - Called when Discard is activated.
 * @param props.canSave            - Whether Save is actionable (dirty, job idle).
 * @param props.onSave             - Called when Save is activated.
 * @param props.canRestoreOriginal - Whether "Restore original…" is offered.
 * @param props.onRestoreOriginal  - Called when "Restore original…" is selected.
 * @return The header-actions element.
 */
export default function StudioEditorHeaderActions( {
	canUndo,
	canRedo,
	onUndo,
	onRedo,
	canDiscard,
	onDiscard,
	canSave,
	onSave,
	canRestoreOriginal,
	onRestoreOriginal,
}: Props ): ReactElement {
	return (
		<Stack direction="row" gap="sm" align="center">
			<IconButton
				size="compact"
				icon={ undoIcon }
				label={ __( 'Undo', 'jetpack-videopress-pkg' ) }
				disabled={ ! canUndo }
				accessibleWhenDisabled
				onClick={ onUndo }
			/>
			<IconButton
				size="compact"
				icon={ redoIcon }
				label={ __( 'Redo', 'jetpack-videopress-pkg' ) }
				disabled={ ! canRedo }
				accessibleWhenDisabled
				onClick={ onRedo }
			/>
			<Button size="compact" variant="outline" disabled={ ! canDiscard } onClick={ onDiscard }>
				{ __( 'Discard', 'jetpack-videopress-pkg' ) }
			</Button>
			<Button size="compact" disabled={ ! canSave } onClick={ onSave }>
				{ __( 'Save', 'jetpack-videopress-pkg' ) }
			</Button>
			{ canRestoreOriginal && (
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'More actions', 'jetpack-videopress-pkg' ) }
					toggleProps={ { size: 'compact' } }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem
								isDestructive
								onClick={ () => {
									onRestoreOriginal();
									onClose();
								} }
							>
								{ __( 'Restore original…', 'jetpack-videopress-pkg' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
		</Stack>
	);
}
