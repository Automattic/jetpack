import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal, BaseControl } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useMediaDetails from '../../../../hooks/use-media-details';
import MediaPicker from '../../../media-picker';
import TemplatePicker from '../picker';
import styles from './styles.module.scss';

/** @typedef {import('react').JSX.Element} JSXElement */

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];
const ADD_MEDIA_LABEL = __( 'Choose Image', 'jetpack-publicize-components' );

/**
 * Wraps the template picker component in a modal, and saves the selected template and image on modal save.
 *
 * @param {object}      props                 - The component props.
 * @param {Function}    props.onSave          - A function that will be called when the modal is saved. Receives an object with template and imageId.
 * @param {Function}    props.render          - A function that will be called with an object containing an "open" function, which can be called to open the template picker.
 * @param {string|null} [props.template=null] - The name of the currently selected template.
 * @param {number|null} [props.imageId=null]  - The ID of the currently selected default image.
 * @return {JSXElement} - The component's rendered output.
 */
const TemplatePickerModal = ( { onSave, render, template = null, imageId = null } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ selectedTemplate, setSelectedTemplate ] = useState( template );
	const [ selectedImageId, setSelectedImageId ] = useState( imageId );
	const [ mediaDetails ] = useMediaDetails( selectedImageId );

	const openPicker = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const closePicker = useCallback( () => {
		setIsOpen( false );
	}, [ setIsOpen ] );

	const saveAndClosePicker = useCallback( () => {
		onSave( {
			template: selectedTemplate,
			imageId: selectedImageId,
		} );
		setIsOpen( false );
	}, [ onSave, selectedTemplate, selectedImageId ] );

	const onImageChange = useCallback(
		media => {
			setSelectedImageId( media?.id );
		},
		[ setSelectedImageId ]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			{ render( { open: openPicker } ) }
			{ isOpen && (
				<Modal
					className={ styles.modal }
					onRequestClose={ closePicker }
					title={ __( 'Set default Template and Image', 'jetpack-publicize-components' ) }
				>
					<BaseControl
						id="default-template"
						label={ __( 'Default Template', 'jetpack-publicize-components' ) }
					>
						<TemplatePicker value={ selectedTemplate } onTemplateSelected={ setSelectedTemplate } />
					</BaseControl>
					<br />
					<BaseControl
						id="default-image"
						label={ __( 'Default Image', 'jetpack-publicize-components' ) }
						help={ __(
							'Choose a default image to use with your new posts',
							'jetpack-publicize-components'
						) }
					>
						<MediaPicker
							buttonLabel={ ADD_MEDIA_LABEL }
							mediaId={ selectedImageId }
							mediaDetails={ mediaDetails }
							onChange={ onImageChange }
							allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
							subTitle={ __( 'Add a default image', 'jetpack-publicize-components' ) }
							isEditor={ false }
						/>
					</BaseControl>

					<div className={ styles.footer }>
						<Button variant="secondary" onClick={ closePicker }>
							{ __( 'Cancel', 'jetpack-publicize-components' ) }
						</Button>
						<Button variant="primary" onClick={ saveAndClosePicker }>
							{ __( 'Save', 'jetpack-publicize-components' ) }
						</Button>
					</div>
				</Modal>
			) }
		</ThemeProvider>
	);
};

export default TemplatePickerModal;
