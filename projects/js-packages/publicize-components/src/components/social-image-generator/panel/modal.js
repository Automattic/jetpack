/**
 * Social image generator settings modal component.
 *
 * Pulls out the settings from the editor sidebar, and allows
 * them to be experimented with.
 */

import { Modal, SelectControl, Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useMediaDetails from '../../../hooks/use-media-details';
import MediaPicker from '../../media-picker';

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];
const ADD_MEDIA_LABEL = __( 'Choose Image', 'jetpack' );

const SocialImageGeneratorSettingsModal = ( { onClose, setImageType, setImageId, ...props } ) => {
	const [ imageId, setEditedImageId ] = useState( props.imageId );
	const [ imageType, setEditedImageType ] = useState( props.imageType || 'featured' );

	const [ mediaDetails ] = useMediaDetails( imageId );

	const saveSettings = useCallback( () => {
		//TODO: Commit the settings
		setImageType( imageType );
		setImageId( imageId );
		onClose();
	}, [ onClose, setImageType, imageType, setImageId, imageId ] );

	const onCustomImageChange = useCallback(
		media => {
			setEditedImageId( media?.id );
		},
		[ setEditedImageId ]
	);

	const ImageOptions = () => {
		return (
			<>
				<SelectControl
					label={ __( 'Image Type', 'jetpack' ) }
					value={ imageType || 'featured' }
					options={ [
						{
							label: __( 'Featured Image', 'jetpack' ),
							value: 'featured',
						},
						{ label: __( 'Custom Image', 'jetpack' ), value: 'custom' },
						{ label: __( 'No Image', 'jetpack' ), value: 'none' },
					] }
					onChange={ setEditedImageType }
				/>

				{ imageType === 'custom' && (
					<MediaPicker
						buttonLabel={ ADD_MEDIA_LABEL }
						subTitle={ __( 'Add a custom image', 'jetpack' ) }
						mediaId={ imageId }
						mediaDetails={ mediaDetails }
						onChange={ onCustomImageChange }
						allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
					/>
				) }
			</>
		);
	};

	return (
		<Modal onRequestClose={ onClose }>
			<ImageOptions />
			<hr />
			<Button onClick={ onClose } variant="tertiary">
				{ __( 'Cancel', 'jetpack' ) }
			</Button>
			<Button onClick={ saveSettings } variant="primary">
				{ __( 'Save', 'jetpack' ) }
			</Button>
		</Modal>
	);
};

export default SocialImageGeneratorSettingsModal;
