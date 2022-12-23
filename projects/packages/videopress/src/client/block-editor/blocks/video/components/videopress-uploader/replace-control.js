/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import {
	FormFileUpload,
	NavigableMenu,
	MenuItem,
	ToolbarButton,
	Dropdown,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { postFeaturedImage, upload, media as mediaIcon } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import './style.scss';

const noop = () => {};
let uniqueId = 0;

const MediaReplaceFlow = ( {
	mediaId,
	mediaIds,
	allowedTypes,
	accept,
	onSelect,
	onToggleFeaturedImage,
	useFeaturedImage,
	onFilesUpload = noop,
	name = __( 'Replace', 'jetpack-videopress-pkg' ),
	removeNotice,
	children,
	multiple = false,
	addToGallery,
	handleUpload = true,
} ) => {
	const editMediaButtonRef = useRef();
	const errorNoticeID = `block-editor/media-replace-flow/error-notice/${ ++uniqueId }`;

	const selectMedia = ( media, closeMenu ) => {
		if ( useFeaturedImage && onToggleFeaturedImage ) {
			onToggleFeaturedImage();
		}
		closeMenu();
		// Calling `onSelect` after the state update since it might unmount the component.
		onSelect( media );
		speak( __( 'The media file has been replaced', 'jetpack-videopress-pkg' ) );
		removeNotice( errorNoticeID );
	};

	const uploadFiles = ( event, closeMenu ) => {
		const files = event.target.files;
		if ( ! handleUpload ) {
			closeMenu();
			return onSelect( files );
		}
		onFilesUpload( files );
	};

	const openOnArrowDown = event => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.target.click();
		}
	};

	const onlyAllowsImages = () => {
		if ( ! allowedTypes || allowedTypes.length === 0 ) {
			return false;
		}

		return allowedTypes.every(
			allowedType => allowedType === 'image' || allowedType.startsWith( 'image/' )
		);
	};

	const gallery = multiple && onlyAllowsImages();

	const POPOVER_PROPS = {
		variant: 'toolbar',
	};

	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			contentClassName="block-editor-media-replace-flow__options"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					ref={ editMediaButtonRef }
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					onKeyDown={ openOnArrowDown }
				>
					{ name }
				</ToolbarButton>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
						<>
							<MediaUpload
								gallery={ gallery }
								addToGallery={ addToGallery }
								multiple={ multiple }
								value={ multiple ? mediaIds : mediaId }
								onSelect={ media => selectMedia( media, onClose ) }
								allowedTypes={ allowedTypes }
								render={ ( { open } ) => (
									<MenuItem icon={ mediaIcon } onClick={ open }>
										{ __( 'Open Media Library', 'jetpack-videopress-pkg' ) }
									</MenuItem>
								) }
							/>
							<MediaUploadCheck>
								<FormFileUpload
									onChange={ event => {
										uploadFiles( event, onClose );
									} }
									accept={ accept }
									multiple={ multiple }
									render={ ( { openFileDialog } ) => {
										return (
											<MenuItem
												icon={ upload }
												onClick={ () => {
													openFileDialog();
												} }
											>
												{ __( 'Upload', 'jetpack-videopress-pkg' ) }
											</MenuItem>
										);
									} }
								/>
							</MediaUploadCheck>
						</>
						{ onToggleFeaturedImage && (
							<MenuItem
								icon={ postFeaturedImage }
								onClick={ onToggleFeaturedImage }
								isPressed={ useFeaturedImage }
							>
								{ __( 'Use featured image', 'jetpack-videopress-pkg' ) }
							</MenuItem>
						) }
						{ children }
					</NavigableMenu>
				</>
			) }
		/>
	);
};
const ReplaceControl = ( { onUploadFileStart } ) => {
	/**
	 * Uploading file handler.
	 *
	 * @param {File} media - media file to upload
	 * @returns {void}
	 */
	function onSelectVideo( media ) {
		/*
		 * Allow uploading only (the first) one file
		 * @todo: Allow uploading multiple files
		 */
		media = media?.[ 0 ] ? media[ 0 ] : media;

		const isFileUploading = media instanceof File;
		if ( ! isFileUploading ) {
			return;
		}

		onUploadFileStart( media );
	}

	return (
		<MediaReplaceFlow
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
			onFilesUpload={ onSelectVideo }
		/>
	);
};

export default ReplaceControl;
