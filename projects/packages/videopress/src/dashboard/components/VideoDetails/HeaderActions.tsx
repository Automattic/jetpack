import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download, moreVertical, trash } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	canSave: boolean;
	onSave: () => void;
	onDownload: () => void;
	onDelete: () => void;
};

/**
 * Actions slot for the AdminPage header on the Video details screen.
 * Renders the primary Save button and the ⋯ menu (Download file / Delete
 * video). Save is disabled when the form is clean.
 *
 * @param props            - Component props.
 * @param props.canSave    - Whether the form has unsaved changes.
 * @param props.onSave     - Called when the Save button is activated.
 * @param props.onDownload - Called when "Download file" is selected.
 * @param props.onDelete   - Called when "Delete video" is selected.
 * @return The header-actions element.
 */
export default function HeaderActions( {
	canSave,
	onSave,
	onDownload,
	onDelete,
}: Props ): ReactElement {
	return (
		<Stack direction="row" gap="sm" align="center">
			<Button variant="primary" disabled={ ! canSave } onClick={ onSave }>
				{ __( 'Save', 'jetpack-videopress-pkg' ) }
			</Button>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More actions', 'jetpack-videopress-pkg' ) }
				controls={ [
					{
						title: __( 'Download file', 'jetpack-videopress-pkg' ),
						icon: download,
						onClick: onDownload,
					},
					{
						title: __( 'Delete video', 'jetpack-videopress-pkg' ),
						icon: trash,
						onClick: onDelete,
					},
				] }
			/>
		</Stack>
	);
}
