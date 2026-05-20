import { __ } from '@wordpress/i18n';
import { cloud, Icon, media, pencil } from '@wordpress/icons';
import { Button, Popover, VisuallyHidden } from '@wordpress/ui';
import { useState, type ReactElement } from 'react';

type Props = {
	canSelectFromVideo: boolean;
	canUploadImage: boolean;
	isBusy: boolean;
	onSelectFromVideo: () => void;
	onUploadImage: () => void;
};

/**
 * Overlay button that opens a small popover menu with two actions:
 * "Select from video" and "Upload image". Intended to sit on top of the
 * video thumbnail inside ThumbnailCard so the user can update the poster.
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
	const [ open, setOpen ] = useState( false );

	return (
		<Popover.Root open={ open } onOpenChange={ setOpen }>
			<Popover.Trigger
				aria-label={ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
				disabled={ isBusy }
				className="vp-thumbnail-update__trigger"
			>
				<Icon icon={ pencil } />
			</Popover.Trigger>
			<Popover.Popup className="vp-thumbnail-update__menu">
				<VisuallyHidden>
					<Popover.Title>{ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }</Popover.Title>
				</VisuallyHidden>
				<Button
					role="menuitem"
					variant="minimal"
					disabled={ ! canSelectFromVideo }
					focusableWhenDisabled={ false }
					onClick={ () => {
						setOpen( false );
						onSelectFromVideo();
					} }
				>
					<Icon icon={ media } />
					{ __( 'Select from video', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button
					role="menuitem"
					variant="minimal"
					disabled={ ! canUploadImage }
					focusableWhenDisabled={ false }
					onClick={ () => {
						setOpen( false );
						onUploadImage();
					} }
				>
					<Icon icon={ cloud } />
					{ __( 'Upload image', 'jetpack-videopress-pkg' ) }
				</Button>
			</Popover.Popup>
		</Popover.Root>
	);
}
