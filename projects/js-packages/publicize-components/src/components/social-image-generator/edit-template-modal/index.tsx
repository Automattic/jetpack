/**
 * Edit Social Template Modal
 *
 * Modal for editing Social Image Generator template settings
 * with a two-column layout: controls on left, live preview on right.
 */

import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import { type ImageType } from '../../../hooks/use-sig-preview/utils';
import { Content } from './content';
import { Sidebar } from './sidebar';
import styles from './styles.module.scss';

interface EditTemplateModalProps {
	onClose: () => void;
}

/**
 * Get initial image type based on available images
 *
 * @param featuredImageId  - Featured image ID
 * @param defaultImageId   - Default image ID
 * @param currentImageType - Current image type from settings
 * @return Initial image type
 */
const getInitialImageType = (
	featuredImageId: number | null,
	defaultImageId: number | null,
	currentImageType: ImageType | null
): ImageType => {
	if ( currentImageType ) {
		return currentImageType;
	}
	if ( ! featuredImageId && defaultImageId ) {
		return 'default';
	}
	return 'featured';
};

/**
 * Edit Template Modal component
 *
 * @param {EditTemplateModalProps} props - Component props
 * @return {JSX.Element} - Modal component
 */
export default function EditTemplateModal( { onClose }: EditTemplateModalProps ) {
	const featuredImageId = useFeaturedImage();
	const { customText, imageType, imageId, defaultImageId, template, font, updateSettings } =
		useImageGeneratorConfig();

	// Local state for all editable fields
	const [ localImageType, setLocalImageType ] = useState< ImageType >(
		getInitialImageType( featuredImageId, defaultImageId, imageType as ImageType | null )
	);
	const [ localImageId, setLocalImageId ] = useState< number | null >( imageId );
	const [ localCustomText, setLocalCustomText ] = useState( customText || '' );
	const [ localTemplate, setLocalTemplate ] = useState( template );
	const [ localFont, setLocalFont ] = useState( font || '' );

	const handleSave = useCallback( () => {
		updateSettings( {
			template: localTemplate,
			font: localFont,
			image_type: localImageType,
			custom_text: localCustomText,
			// Only set image_id if it's a custom image
			...( localImageType === 'custom' && { image_id: localImageId } ),
		} );
		onClose();
	}, [
		updateSettings,
		localTemplate,
		localFont,
		localImageType,
		localCustomText,
		localImageId,
		onClose,
	] );

	return (
		<ThemeProvider targetDom={ document.body }>
			<Modal
				className={ styles.modal }
				onRequestClose={ onClose }
				title={ __( 'Edit social template', 'jetpack-publicize-components' ) }
			>
				<div className={ styles.layout }>
					<Sidebar
						imageType={ localImageType }
						imageId={ localImageId }
						customText={ localCustomText }
						template={ localTemplate }
						font={ localFont }
						defaultImageId={ defaultImageId }
						featuredImageId={ featuredImageId }
						onImageTypeChange={ setLocalImageType }
						onImageIdChange={ setLocalImageId }
						onCustomTextChange={ setLocalCustomText }
						onTemplateChange={ setLocalTemplate }
						onFontChange={ setLocalFont }
					/>
					<Content
						imageType={ localImageType }
						imageId={ localImageId }
						customText={ localCustomText }
						template={ localTemplate }
						font={ localFont }
					/>
				</div>
				<div className={ styles.footer }>
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel', 'jetpack-publicize-components' ) }
					</Button>
					<Button variant="primary" onClick={ handleSave }>
						{ __( 'Save changes', 'jetpack-publicize-components' ) }
					</Button>
				</div>
			</Modal>
		</ThemeProvider>
	);
}
