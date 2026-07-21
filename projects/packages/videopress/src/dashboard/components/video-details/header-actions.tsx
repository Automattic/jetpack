import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download, moreVertical, trash } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	canSave: boolean;
	onSave: () => void;
	onManageCaptions: () => void;
	onDownload: () => void;
	onDelete: () => void;
};

/**
 * Actions slot for the AdminPage header on the Video details screen.
 * Renders the primary Save button and the ⋯ menu (Download file / Delete
 * video). Save is disabled when the form is clean. Delete uses MenuItem's
 * built-in `isDestructive` flag so the design-system surfaces the
 * red destructive treatment without a CSS override.
 *
 * @param props                  - Component props.
 * @param props.canSave          - Whether the form has unsaved changes.
 * @param props.onSave           - Called when the Save button is activated.
 * @param props.onManageCaptions - Called when "Manage subtitles" is selected.
 * @param props.onDownload       - Called when "Download file" is selected.
 * @param props.onDelete         - Called when "Delete video" is selected.
 * @return The header-actions element.
 */
export default function HeaderActions( {
	canSave,
	onSave,
	onManageCaptions,
	onDownload,
	onDelete,
}: Props ): ReactElement {
	return (
		<Stack direction="row" gap="sm" align="center">
			<Button size="compact" disabled={ ! canSave } onClick={ onSave }>
				{ __( 'Save', 'jetpack-videopress-pkg' ) }
			</Button>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More actions', 'jetpack-videopress-pkg' ) }
				toggleProps={ { size: 'compact' } }
			>
				{ ( { onClose } ) => (
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								onManageCaptions();
								onClose();
							} }
						>
							{ __( 'Manage subtitles', 'jetpack-videopress-pkg' ) }
						</MenuItem>
						<MenuItem
							icon={ download }
							onClick={ () => {
								onDownload();
								onClose();
							} }
						>
							{ __( 'Download file', 'jetpack-videopress-pkg' ) }
						</MenuItem>
						<MenuItem
							isDestructive
							icon={ trash }
							onClick={ () => {
								onDelete();
								onClose();
							} }
						>
							{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
		</Stack>
	);
}
