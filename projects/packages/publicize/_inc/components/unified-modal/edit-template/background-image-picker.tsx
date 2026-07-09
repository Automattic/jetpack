/**
 * BackgroundImagePicker component for Edit Template Modal
 *
 * Reuses MediaPreview from media-section-v2 for consistent UI.
 */

import { MediaUpload } from '@wordpress/block-editor';
import { Button, Dropdown, MenuGroup, MenuItem, Notice } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image, postFeaturedImage, media as mediaIcon } from '@wordpress/icons';
import useMediaDetails from '../../../hooks/use-media-details';
import { type ImageType } from '../../../hooks/use-sig-preview/utils';
import MediaPreview from '../../media-section-v2/media-preview';
import styles from './styles.module.scss';

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];

interface MenuOption {
	id: string;
	label: string;
	icon: JSX.Element;
}

interface ImageSourceMenuItemProps {
	option: MenuOption;
	isSelected: boolean;
	onSelect: ( optionId: string, onClose: VoidFunction ) => void;
	onClose: VoidFunction;
}

/**
 * ImageSourceMenuItem component
 *
 * @param props            - Component props
 * @param props.option     - Menu option
 * @param props.isSelected - Whether this option is selected
 * @param props.onSelect   - Selection handler
 * @param props.onClose    - Close handler
 * @return MenuItem component
 */
function ImageSourceMenuItem( {
	option,
	isSelected,
	onSelect,
	onClose,
}: ImageSourceMenuItemProps ) {
	const handleClick = useCallback( () => {
		onSelect( option.id, onClose );
	}, [ option.id, onSelect, onClose ] );

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
 * Menu item for removing the background image.
 *
 * @param {object}   root0            - Component props.
 * @param {boolean}  root0.isSelected - Whether this option is currently active.
 * @param {Function} root0.onRemove   - Callback to clear the image.
 * @param {Function} root0.onClose    - Callback to close the dropdown.
 * @return {JSX.Element} NoImageMenuItem component.
 */
function NoImageMenuItem( {
	isSelected,
	onRemove,
	onClose,
}: {
	isSelected: boolean;
	onRemove: () => void;
	onClose: VoidFunction;
} ) {
	const handleClick = useCallback( () => {
		onRemove();
		onClose();
	}, [ onRemove, onClose ] );

	return (
		<MenuGroup>
			<MenuItem isSelected={ isSelected } onClick={ handleClick }>
				{ __( 'No image', 'jetpack-publicize-pkg' ) }
			</MenuItem>
		</MenuGroup>
	);
}

interface BackgroundImagePickerProps {
	imageType: ImageType;
	imageId: number | null;
	defaultImageId: number | null;
	featuredImageId: number | null;
	onImageTypeChange: ( value: ImageType ) => void;
	onImageIdChange: ( id: number | null ) => void;
}

/**
 * Get the label describing the current image source
 *
 * @param imageType - Current image type
 * @return Description label
 */
function getImageSourceLabel( imageType: ImageType ): string {
	switch ( imageType ) {
		case 'default':
			return __( 'You are using the default image', 'jetpack-publicize-pkg' );
		case 'featured':
			return __( 'You are using your post featured image', 'jetpack-publicize-pkg' );
		case 'custom':
			return __( 'You are using a custom image', 'jetpack-publicize-pkg' );
		case 'none':
			return __( 'No background image', 'jetpack-publicize-pkg' );
		default:
			return __( 'You are using your post featured image', 'jetpack-publicize-pkg' );
	}
}

/**
 * Get the image ID to display based on the current image type
 *
 * @param imageType       - Current image type
 * @param customImageId   - Custom image ID
 * @param featuredImageId - Featured image ID
 * @param defaultImageId  - Default image ID
 * @return Image ID to display
 */
function getDisplayImageId(
	imageType: ImageType,
	customImageId: number | null,
	featuredImageId: number | null,
	defaultImageId: number | null
): number | null {
	switch ( imageType ) {
		case 'default':
			return defaultImageId;
		case 'featured':
			return featuredImageId;
		case 'custom':
			return customImageId;
		case 'none':
			return null;
		default:
			return featuredImageId;
	}
}

/**
 * BackgroundImagePicker component
 *
 * @param props                   - Component props
 * @param props.imageType         - Current image type
 * @param props.imageId           - Custom image ID
 * @param props.defaultImageId    - Default image ID
 * @param props.featuredImageId   - Featured image ID
 * @param props.onImageTypeChange - Image type change handler
 * @param props.onImageIdChange   - Image ID change handler
 * @return BackgroundImagePicker component
 */
export function BackgroundImagePicker( {
	imageType,
	imageId,
	defaultImageId,
	featuredImageId,
	onImageTypeChange,
	onImageIdChange,
}: BackgroundImagePickerProps ) {
	// Ref to store the MediaUpload open function
	const openMediaLibraryRef = useRef< () => void >( () => {} );

	// Get the image ID to display
	const displayImageId = useMemo(
		() => getDisplayImageId( imageType, imageId, featuredImageId, defaultImageId ),
		[ imageType, imageId, featuredImageId, defaultImageId ]
	);

	const [ mediaDetails, isMediaNotFound ] = useMediaDetails( displayImageId );
	// Only make a separate call for the default image if it differs from the displayed image
	const [ , isDefaultImageOnlyNotFound ] = useMediaDetails(
		displayImageId !== defaultImageId ? defaultImageId : null
	);
	const isDefaultImageNotFound =
		displayImageId === defaultImageId ? isMediaNotFound : isDefaultImageOnlyNotFound;
	const imageUrl = mediaDetails?.mediaData?.sourceUrl;
	const isLoading = Boolean( displayImageId ) && ! imageUrl && ! isMediaNotFound;
	const showFeaturedImageNotice = imageType === 'featured' && ! featuredImageId;

	// Build preview data for MediaPreview component
	const previewData = useMemo( () => {
		if ( ! imageUrl && ! isLoading ) {
			return null;
		}
		return {
			id: displayImageId || 0,
			url: imageUrl || '',
			type: 'image' as const,
		};
	}, [ imageUrl, isLoading, displayImageId ] );

	// If default image was selected but no longer exists, fall back to 'none'
	useEffect( () => {
		if ( imageType === 'default' && isDefaultImageNotFound ) {
			onImageTypeChange( 'none' );
		}
	}, [ imageType, isDefaultImageNotFound, onImageTypeChange ] );

	// Build menu options
	const hasValidDefaultImage = Boolean( defaultImageId ) && ! isDefaultImageNotFound;
	const menuOptions = useMemo( () => {
		const options: MenuOption[] = [];

		if ( hasValidDefaultImage ) {
			options.push( {
				id: 'default',
				label: __( 'Default Image', 'jetpack-publicize-pkg' ),
				icon: image,
			} );
		}

		options.push( {
			id: 'featured',
			label: __( 'Featured Image', 'jetpack-publicize-pkg' ),
			icon: postFeaturedImage,
		} );

		options.push( {
			id: 'custom',
			label: __( 'Media Library', 'jetpack-publicize-pkg' ),
			icon: mediaIcon,
		} );

		return options;
	}, [ hasValidDefaultImage ] );

	// Handle media library selection
	const handleMediaSelect = useCallback(
		( media: { id: number } ) => {
			onImageTypeChange( 'custom' );
			onImageIdChange( media?.id || null );
		},
		[ onImageTypeChange, onImageIdChange ]
	);

	const handleMediaLibraryClick = useCallback( () => {
		setTimeout( () => {
			openMediaLibraryRef.current();
		}, 0 );
	}, [] );

	const renderMediaUpload = useCallback( ( { open }: { open: VoidFunction } ) => {
		openMediaLibraryRef.current = open;
		return null;
	}, [] );

	// Handle menu item selection
	const handleOptionSelect = useCallback(
		( optionId: string, onClose: VoidFunction ) => {
			if ( optionId === 'custom' ) {
				handleMediaLibraryClick();
			} else {
				onImageTypeChange( optionId as ImageType );
			}
			onClose();
		},
		[ onImageTypeChange, handleMediaLibraryClick ]
	);

	// Handle remove - set to 'none'
	const handleRemove = useCallback( () => {
		onImageTypeChange( 'none' );
		onImageIdChange( null );
	}, [ onImageTypeChange, onImageIdChange ] );

	const renderDropdownContent = useCallback(
		( { onClose }: { onClose: VoidFunction } ) => (
			<>
				<MenuGroup>
					{ menuOptions.map( option => (
						<ImageSourceMenuItem
							key={ option.id }
							option={ option }
							isSelected={ imageType === option.id }
							onSelect={ handleOptionSelect }
							onClose={ onClose }
						/>
					) ) }
				</MenuGroup>
				<NoImageMenuItem
					isSelected={ imageType === 'none' }
					onRemove={ handleRemove }
					onClose={ onClose }
				/>
			</>
		),
		[ menuOptions, imageType, handleOptionSelect, handleRemove ]
	);

	// Render toggle for Select image dropdown
	const renderSelectToggle = useCallback(
		( { onToggle }: { onToggle: () => void } ) => (
			<Button
				__next40pxDefaultSize
				className={ styles.selectButton }
				variant="secondary"
				onClick={ onToggle }
			>
				{ __( 'Select image', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[]
	);

	return (
		<div className={ styles.backgroundPicker }>
			{ /* Hidden MediaUpload component */ }
			<MediaUpload
				title={ __( 'Select Background Image', 'jetpack-publicize-pkg' ) }
				onSelect={ handleMediaSelect }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				render={ renderMediaUpload }
			/>

			{ /* Source label */ }
			<p className={ styles.sourceLabel }>{ getImageSourceLabel( imageType ) }</p>

			{ /* Image preview */ }
			{ previewData && <MediaPreview media={ previewData } isLoading={ isLoading } /> }

			{ /* Warning notice for missing featured image */ }
			{ showFeaturedImageNotice && (
				<Notice status="warning" isDismissible={ false } className={ styles.notice }>
					{ __( 'Your post does not have a featured image.', 'jetpack-publicize-pkg' ) }
				</Notice>
			) }

			{ /* Select image dropdown */ }
			<Dropdown
				className={ styles.selectDropdown }
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ renderSelectToggle }
				renderContent={ renderDropdownContent }
			/>
		</div>
	);
}
