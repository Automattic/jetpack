/**
 * BackgroundImagePicker component for Edit Template Modal
 *
 * Reuses MediaPreview from media-section-v2 for consistent UI.
 */

import { MediaUpload } from '@wordpress/block-editor';
import { Button, Dropdown, MenuGroup, MenuItem, Notice } from '@wordpress/components';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image, media as mediaIcon } from '@wordpress/icons';
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

	const [ mediaDetails ] = useMediaDetails( displayImageId );
	const imageUrl = mediaDetails?.mediaData?.sourceUrl;
	const isLoading = Boolean( displayImageId ) && ! imageUrl;
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

	// Build menu options (no "No Image" - Remove button handles that)
	const menuOptions = useMemo( () => {
		const options: MenuOption[] = [];

		if ( defaultImageId ) {
			options.push( {
				id: 'default',
				label: __( 'Default Image', 'jetpack-publicize-pkg' ),
				icon: image,
			} );
		}

		options.push( {
			id: 'featured',
			label: __( 'Featured Image', 'jetpack-publicize-pkg' ),
			icon: image,
		} );

		options.push( {
			id: 'custom',
			label: __( 'Media Library', 'jetpack-publicize-pkg' ),
			icon: mediaIcon,
		} );

		return options;
	}, [ defaultImageId ] );

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
		),
		[ menuOptions, imageType, handleOptionSelect ]
	);

	// Render toggle for Select image dropdown
	const renderSelectToggle = useCallback(
		( { onToggle }: { onToggle: () => void } ) => (
			<Button className={ styles.selectButton } variant="secondary" onClick={ onToggle }>
				{ __( 'Select image', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[]
	);

	// Render toggle for preview dropdown (wraps MediaPreview)
	const renderPreviewToggle = useCallback(
		( { onToggle }: { onToggle: () => void } ) => (
			<MediaPreview
				media={ previewData }
				isLoading={ isLoading }
				onReplace={ onToggle }
				onRemove={ handleRemove }
			/>
		),
		[ previewData, isLoading, handleRemove ]
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

			{ /* Image preview - reuses MediaPreview from media-section-v2 */ }
			{ previewData && (
				<Dropdown
					popoverProps={ { placement: 'bottom-start' } }
					renderToggle={ renderPreviewToggle }
					renderContent={ renderDropdownContent }
				/>
			) }

			{ /* Warning notice for missing featured image */ }
			{ showFeaturedImageNotice && (
				<Notice status="warning" isDismissible={ false } className={ styles.notice }>
					{ __( 'Your post does not have a featured image.', 'jetpack-publicize-pkg' ) }
				</Notice>
			) }

			{ /* No image state - show select button */ }
			{ ! previewData && ! isLoading && (
				<Dropdown
					className={ styles.selectDropdown }
					popoverProps={ { placement: 'bottom-start' } }
					renderToggle={ renderSelectToggle }
					renderContent={ renderDropdownContent }
				/>
			) }
		</div>
	);
}
