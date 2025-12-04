/**
 * MediaSourceMenu component
 * Displays a dropdown menu with grouped media source options
 */

import { AiSVG } from '@automattic/jetpack-ai-client';
import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image, video, starEmpty, media as mediaIcon } from '@wordpress/icons';
import styles from './styles.module.scss';
import { MediaSourceMenuProps, MediaSourceOption, MediaSourceType } from './types';

/**
 * Available media source options with their metadata
 */
const MEDIA_SOURCE_OPTIONS: MediaSourceOption[] = [
	{
		id: 'featured-image',
		label: __( 'Featured Image', 'jetpack-publicize-components' ),
		description: __( 'You are using your post featured image', 'jetpack-publicize-components' ),
		icon: image,
		group: 'link-preview',
		attachmentDescription: __(
			'Shares your image as a regular post, without a link preview card, for higher engagement.',
			'jetpack-publicize-components'
		),
	},
	{
		id: 'sig',
		label: __( 'Social Image Template', 'jetpack-publicize-components' ),
		description: __( 'You are using the template', 'jetpack-publicize-components' ),
		icon: starEmpty,
		group: 'link-preview',
		attachmentDescription: __(
			'Shares your template as an attached image, without a link preview card, for higher engagement.',
			'jetpack-publicize-components'
		),
	},
	{
		id: 'media-library',
		label: __( 'Media Library', 'jetpack-publicize-components' ),
		description: __( 'You are using a custom image.', 'jetpack-publicize-components' ),
		icon: mediaIcon,
		group: 'attachment',
	},
	{
		id: 'upload-video',
		label: __( 'Upload video', 'jetpack-publicize-components' ),
		description: __( 'Upload a video file', 'jetpack-publicize-components' ),
		icon: video,
		group: 'attachment',
	},
	{
		id: 'ai-image',
		label: __( 'Generate image', 'jetpack-publicize-components' ),
		description: __( 'You are using an AI-generated image.', 'jetpack-publicize-components' ),
		icon: AiSVG,
		group: 'attachment',
		attachmentDescription: __(
			'Shares your AI-generated image as an attachment for higher engagement.',
			'jetpack-publicize-components'
		),
	},
];

/**
 * Get the description for a media source
 *
 * @param {string} sourceType - Media source type
 * @return {string} Description for the media source
 */
export function getMediaSourceDescription( sourceType: MediaSourceType ): string {
	if ( ! sourceType ) {
		return __( "Your post won't show an image.", 'jetpack-publicize-components' );
	}
	const option = MEDIA_SOURCE_OPTIONS.find( opt => opt.id === sourceType );
	return (
		option?.description || __( "Your post won't show an image.", 'jetpack-publicize-components' )
	);
}

/**
 * Get the attachment toggle description for a media source
 *
 * @param {string} sourceType - Media source type
 * @return {string|undefined} Attachment description for the media source
 */
export function getAttachmentDescription( sourceType: MediaSourceType ): string | undefined {
	if ( ! sourceType ) {
		return undefined;
	}
	const option = MEDIA_SOURCE_OPTIONS.find( opt => opt.id === sourceType );
	return option?.attachmentDescription;
}

/**
 * Props for MediaSourceMenuItem component
 */
interface MediaSourceMenuItemProps {
	option: MediaSourceOption;
	isSelected: boolean;
	onSelect: ( optionId: MediaSourceType ) => void;
	onClose: () => void;
	onMediaLibraryClick?: () => void;
	onAiImageClick?: () => void;
}

/**
 * MediaSourceMenuItem component
 *
 * @param {object}   props                     - Component props
 * @param {object}   props.option              - Menu option data
 * @param {boolean}  props.isSelected          - Whether this option is selected
 * @param {Function} props.onSelect            - Selection handler
 * @param {Function} props.onClose             - Close dropdown handler
 * @param {Function} props.onMediaLibraryClick - Media library click handler
 * @param {Function} props.onAiImageClick      - AI image generation click handler
 * @return {object} MediaSourceMenuItem component
 */
function MediaSourceMenuItem( {
	option,
	isSelected,
	onSelect,
	onClose,
	onMediaLibraryClick,
	onAiImageClick,
}: MediaSourceMenuItemProps ) {
	const handleClick = useCallback( () => {
		if ( option.id === 'media-library' ) {
			onMediaLibraryClick?.();
		} else if ( option.id === 'ai-image' ) {
			onAiImageClick?.();
		} else {
			onSelect( option.id );
		}
		onClose();
	}, [ option.id, onSelect, onClose, onMediaLibraryClick, onAiImageClick ] );

	return (
		<MenuItem
			key={ option.id }
			icon={ option.icon }
			isSelected={ isSelected }
			onClick={ handleClick }
		>
			{ option.label }
		</MenuItem>
	);
}

/**
 * MediaSourceMenu component
 *
 * @param {object}   props                     - Component props
 * @param {string}   props.currentSource       - Currently selected media source
 * @param {Function} props.onSelect            - Callback when a source is selected
 * @param {Function} props.onMediaLibraryClick - Callback when Media Library option is clicked
 * @param {Function} props.onAiImageClick      - Callback when Generate with AI option is clicked
 * @param {boolean}  props.disabled            - Whether the menu is disabled
 * @param {Function} props.children            - Optional children render function that receives open function
 * @return {object} MediaSourceMenu component
 */
export default function MediaSourceMenu( {
	currentSource,
	onSelect,
	onMediaLibraryClick,
	onAiImageClick,
	disabled = false,
	children,
}: MediaSourceMenuProps ) {
	// Group options by category
	const linkPreviewOptions = MEDIA_SOURCE_OPTIONS.filter( opt => opt.group === 'link-preview' );
	const attachmentOptions = MEDIA_SOURCE_OPTIONS.filter( opt => opt.group === 'attachment' );

	const renderToggle = useCallback(
		( { isOpen, onToggle }: { isOpen: boolean; onToggle: () => void } ) => (
			<>
				{ ! children && (
					<Button
						className={ styles.selectButton }
						variant="secondary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
					>
						{ __( 'Select', 'jetpack-publicize-components' ) }
					</Button>
				) }
				{ children && children( { open: onToggle } ) }
			</>
		),
		[ children, disabled ]
	);

	const renderContent = useCallback(
		( { onClose }: { onClose: () => void } ) => (
			<>
				<MenuGroup label={ __( 'Link Preview', 'jetpack-publicize-components' ) }>
					{ linkPreviewOptions.map( option => (
						<MediaSourceMenuItem
							key={ option.id }
							option={ option }
							isSelected={ currentSource === option.id }
							onSelect={ onSelect }
							onClose={ onClose }
						/>
					) ) }
				</MenuGroup>
				<MenuGroup label={ __( 'Attachment', 'jetpack-publicize-components' ) }>
					{ attachmentOptions.map( option => (
						<MediaSourceMenuItem
							key={ option.id }
							option={ option }
							isSelected={ currentSource === option.id }
							onSelect={ onSelect }
							onClose={ onClose }
							onMediaLibraryClick={ onMediaLibraryClick }
							onAiImageClick={ onAiImageClick }
						/>
					) ) }
				</MenuGroup>
			</>
		),
		[
			linkPreviewOptions,
			attachmentOptions,
			currentSource,
			onSelect,
			onMediaLibraryClick,
			onAiImageClick,
		]
	);

	return (
		<Dropdown
			className={ styles.dropdownMenu }
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ renderToggle }
			renderContent={ renderContent }
		/>
	);
}
