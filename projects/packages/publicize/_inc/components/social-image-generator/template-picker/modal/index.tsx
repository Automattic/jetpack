import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal, BaseControl, SelectControl } from '@wordpress/components';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useMediaDetails from '../../../../hooks/use-media-details';
import { useSocialImageFontOptions } from '../../../../hooks/use-social-image-font-options';
import MediaPicker from '../../../media-picker';
import TemplatePicker from '../picker';
import styles from './styles.module.scss';

/** @typedef {import('react').JSX.Element} JSXElement */

const ALLOWED_MEDIA_TYPES = [ 'image/jpeg', 'image/png' ];
const ADD_MEDIA_LABEL = __( 'Choose Image', 'jetpack-publicize-pkg' );

/**
 * Wraps the template picker component in a modal, and saves the selected template and image on modal save.
 *
 * @param {object}      props                 - The component props.
 * @param {Function}    props.onSave          - A function that will be called when the modal is saved. Receives an object with template and imageId.
 * @param {Function}    props.render          - A function that will be called with an object containing an "open" function, which can be called to open the template picker.
 * @param {string|null} [props.template=null] - The name of the currently selected template.
 * @param {number|null} [props.imageId=null]  - The ID of the currently selected default image.
 * @param {string}      [props.font='']       - The name of the currently selected font.
 * @return {JSXElement} - The component's rendered output.
 */
const TemplatePickerModal = ( { onSave, render, template = null, imageId = null, font = '' } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ selectedTemplate, setSelectedTemplate ] = useState( template );
	const [ selectedImageId, setSelectedImageId ] = useState( imageId );
	const [ selectedFont, setSelectedFont ] = useState( font );
	const [ mediaDetails, isMediaNotFound ] = useMediaDetails( selectedImageId );

	// Clear selected image if the attachment no longer exists
	useEffect( () => {
		if ( isMediaNotFound ) {
			setSelectedImageId( null );
		}
	}, [ isMediaNotFound ] );

	const openPicker = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const closePicker = useCallback( () => {
		setIsOpen( false );
	}, [ setIsOpen ] );

	const saveAndClosePicker = useCallback( () => {
		onSave( {
			template: selectedTemplate,
			imageId: selectedImageId,
			font: selectedFont,
		} );
		setIsOpen( false );
	}, [ onSave, selectedTemplate, selectedImageId, selectedFont ] );

	const onImageChange = useCallback(
		media => {
			setSelectedImageId( media?.id );
		},
		[ setSelectedImageId ]
	);

	const onFontChange = useCallback(
		newFont => {
			setSelectedFont( newFont );
		},
		[ setSelectedFont ]
	);
	const { isLoading: isLoadingFontOptions, fontOptions } = useSocialImageFontOptions();

	return (
		<ThemeProvider targetDom={ document.body }>
			{ render( { open: openPicker } ) }
			{ isOpen && (
				<Modal
					className={ styles.modal }
					onRequestClose={ closePicker }
					title={ __( 'Set default Template and Image', 'jetpack-publicize-pkg' ) }
				>
					<BaseControl
						__nextHasNoMarginBottom
						id="default-template"
						label={ __( 'Default Template', 'jetpack-publicize-pkg' ) }
					>
						<TemplatePicker value={ selectedTemplate } onTemplateSelected={ setSelectedTemplate } />
					</BaseControl>
					<br />
					<BaseControl
						__nextHasNoMarginBottom
						id="default-image"
						label={ __( 'Default Image', 'jetpack-publicize-pkg' ) }
						help={ __(
							'Choose a default image to use with your new posts',
							'jetpack-publicize-pkg'
						) }
					>
						<MediaPicker
							buttonLabel={ ADD_MEDIA_LABEL }
							mediaId={ selectedImageId }
							mediaDetails={ mediaDetails }
							onChange={ onImageChange }
							allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
							subTitle={ __( 'Add a default image', 'jetpack-publicize-pkg' ) }
							isEditor={ false }
						/>
					</BaseControl>
					<br />
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Font', 'jetpack-publicize-pkg' ) }
						value={ selectedFont ?? '' }
						disabled={ isLoadingFontOptions }
						options={ fontOptions }
						onChange={ onFontChange }
					/>

					<div className={ styles.footer }>
						<Button variant="secondary" onClick={ closePicker }>
							{ __( 'Cancel', 'jetpack-publicize-pkg' ) }
						</Button>
						<Button variant="primary" onClick={ saveAndClosePicker }>
							{ __( 'Save', 'jetpack-publicize-pkg' ) }
						</Button>
					</div>
				</Modal>
			) }
		</ThemeProvider>
	);
};

export default TemplatePickerModal;
