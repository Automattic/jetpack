import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cloud, media, pencil } from '@wordpress/icons';
import type { ReactElement } from 'react';

type Props = {
	canSelectFromVideo: boolean;
	canUploadImage: boolean;
	isBusy: boolean;
	onSelectFromVideo: () => void;
	onUploadImage: () => void;
};

/**
 * Overlay button that opens the thumbnail-update menu with two actions:
 * "Select from video" and "Upload image". Uses the same `@wordpress/components`
 * DropdownMenu as the page header's ⋯ menu so both menus share the design
 * system's look — including MenuItem's default right-aligned icons. Sits on
 * top of the video thumbnail inside ThumbnailCard via the
 * `vp-thumbnail-update__trigger` class.
 *
 * @param props                    - Component props.
 * @param props.canSelectFromVideo - Whether the frame-picker action is available.
 * @param props.canUploadImage     - Whether the media-library upload action is available.
 * @param props.isBusy             - When true, the trigger button is disabled.
 * @param props.onSelectFromVideo  - Called when the user chooses "Select from video".
 * @param props.onUploadImage      - Called when the user chooses "Upload image".
 * @return The overlay button element.
 */
export default function ThumbnailUpdateButton( {
	canSelectFromVideo,
	canUploadImage,
	isBusy,
	onSelectFromVideo,
	onUploadImage,
}: Props ): ReactElement {
	return (
		<DropdownMenu
			icon={ pencil }
			label={ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
			className="vp-thumbnail-update__trigger"
			toggleProps={ { size: 'compact', disabled: isBusy } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<MenuItem
						icon={ media }
						disabled={ ! canSelectFromVideo }
						onClick={ () => {
							onSelectFromVideo();
							onClose();
						} }
					>
						{ __( 'Select from video', 'jetpack-videopress-pkg' ) }
					</MenuItem>
					<MenuItem
						icon={ cloud }
						disabled={ ! canUploadImage }
						onClick={ () => {
							onUploadImage();
							onClose();
						} }
					>
						{ __( 'Upload image', 'jetpack-videopress-pkg' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
