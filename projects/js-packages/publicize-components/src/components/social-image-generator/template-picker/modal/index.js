import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TemplatePicker from '../picker';
import styles from './styles.module.scss';

/** @typedef {import('react').JSX.Element} JSXElement */

/**
 * Wraps the template picker component in a modal, and saves the selected template on modal save.
 *
 * @param {object} props - The component props.
 * @param {Function} props.onSelect - A function that will be called when a template is selected. Receives the name of the selected template as an argument.
 * @param {Function} props.render - A function that will be called with an object containing an "open" function, which can be called to open the template picker.
 * @param {string|null} [props.value=null] - The name of the currently selected template.
 * @returns {JSXElement} - The component's rendered output.
 */
const TemplatePickerModal = ( { onSelect, render, value = null } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ selectedTemplate, setSelectedTemplate ] = useState( value );

	const openPicker = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const closePicker = useCallback( () => {
		setIsOpen( false );
	}, [ setIsOpen ] );
	const saveAndClosePicker = useCallback( () => {
		onSelect( selectedTemplate );
		setIsOpen( false );
	}, [ onSelect, setIsOpen, selectedTemplate ] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ render( { open: openPicker } ) }
			{ isOpen && (
				<Modal onRequestClose={ closePicker } title={ __( 'Pick a Template', 'jetpack' ) }>
					<TemplatePicker value={ selectedTemplate } onTemplateSelected={ setSelectedTemplate } />
					<div className={ styles.footer }>
						<Button variant="tertiary" onClick={ closePicker }>
							{ __( 'Cancel', 'jetpack' ) }
						</Button>
						<Button variant="primary" onClick={ saveAndClosePicker }>
							{ __( 'Save', 'jetpack' ) }
						</Button>
					</div>
				</Modal>
			) }
		</ThemeProvider>
	);
};

export default TemplatePickerModal;
