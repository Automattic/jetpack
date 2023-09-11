/**
 * Social image generator settings modal component.
 *
 * Pulls out the settings from the editor sidebar, and allows
 * them to be experimented with.
 */

import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, SelectControl, Button, TextControl, BaseControl } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../hooks/use-media-details';
import GeneratedImagePreview from '../../generated-image-preview';
import MediaPicker from '../../media-picker';
import TemplatePicker from '../template-picker/picker';
import styles from './styles.module.scss';

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];
const ADD_MEDIA_LABEL = __( 'Choose Image', 'jetpack' );

const SocialImageGeneratorSettingsModal = ( { onClose } ) => {
	const { customText, imageType, imageId, template, updateSettings } = useImageGeneratorConfig();

	const [ localImageId, setEditedImageId ] = useState( imageId );
	const [ localImageType, setEditedImageType ] = useState( imageType || 'featured' );
	const [ localCustomText, setEditedCustomText ] = useState( customText );
	const [ localTemplate, setEditedTemplate ] = useState( template );

	const [ mediaDetails ] = useMediaDetails( localImageId );

	const saveSettings = useCallback( () => {
		//TODO: Commit the settings
		updateSettings( {
			template: localTemplate,
			image_type: localImageType,
			custom_text: localCustomText || '',
			// Only set image_id if it's a custom image
			...( localImageType === 'custom' && { image_id: localImageId } ),
		} );
		onClose();
	}, [ updateSettings, localTemplate, localImageType, localImageId, localCustomText, onClose ] );

	const onCustomImageChange = useCallback(
		media => {
			setEditedImageId( media?.id );
		},
		[ setEditedImageId ]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			<Modal onRequestClose={ onClose }>
				<GeneratedImagePreview
					className={ styles.preview }
					imageId={ localImageId }
					customText={ localCustomText }
					imageType={ localImageType }
					template={ localTemplate }
				/>
				<SelectControl
					label={ __( 'Image Type', 'jetpack' ) }
					value={ localImageType || 'featured' }
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

				{ localImageType === 'custom' && (
					<MediaPicker
						buttonLabel={ ADD_MEDIA_LABEL }
						subTitle={ __( 'Add a custom image', 'jetpack' ) }
						mediaId={ localImageId }
						mediaDetails={ mediaDetails }
						onChange={ onCustomImageChange }
						allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
						wrapperClassName={ styles.mediaPicker }
					/>
				) }
				<TextControl
					className={ styles.customText }
					value={ localCustomText || '' }
					onChange={ setEditedCustomText }
					label={ __( 'Custom Header', 'jetpack' ) }
					help={ __(
						'By default the post title is used for the image. You can use this field to set your own text.',
						'jetpack'
					) }
				/>
				<BaseControl label={ __( 'Templates', 'jetpack' ) } className={ styles.templateControl }>
					<TemplatePicker value={ localTemplate } onTemplateSelected={ setEditedTemplate } />
				</BaseControl>
				<Button onClick={ onClose } variant="tertiary">
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
				<Button onClick={ saveSettings } variant="primary">
					{ __( 'Save', 'jetpack' ) }
				</Button>
			</Modal>
		</ThemeProvider>
	);
};

export default SocialImageGeneratorSettingsModal;
