import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import classnames from 'classnames';
import React from 'react';
// Template thumbnails
import Dois from '../assets/dois.jpg';
import Edge from '../assets/edge.jpg';
import Fullscreen from '../assets/fullscreen.jpg';
import Highway from '../assets/highway.jpg';
import styles from './styles.module.scss';

const TEMPLATES = [
	{
		name: 'highway',
		label: 'Highway',
		image: Highway,
	},
	{
		name: 'dois',
		label: 'Dois',
		image: Dois,
	},
	{
		name: 'edge',
		label: 'Edge',
		image: Edge,
	},
	{
		name: 'fullscreen',
		label: 'Fullscreen',
		image: Fullscreen,
	},
];

/**
 * A component that displays a modal with a list of templates to choose from.
 *
 * @param {object} props - The component props.
 * @param {Function} props.onSelect - A function that will be called when a template is selected. Receives the name of the selected template as an argument.
 * @param {Function} props.render - A function that will be called with an object containing an "open" function, which can be called to open the template picker.
 * @param {string|null} [props.value=null] - The name of the currently selected template.
 * @returns {React.ReactNode} - The component's rendered output.
 */
const TemplatePicker = ( { onSelect, render, value = null } ) => {
	const [ isOpen, setIsOpen ] = useState( true );
	const [ selectedTemplate, setSelectedTemplate ] = useState( value );

	const openPicker = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const closePicker = useCallback( () => setIsOpen( false ), [ setIsOpen ] );
	const saveAndClosePicker = useCallback( () => {
		onSelect( selectedTemplate );
		setIsOpen( false );
	}, [ onSelect, setIsOpen, selectedTemplate ] );
	const setTemplate = useCallback( template => setSelectedTemplate( template ), [
		setSelectedTemplate,
	] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ render( { open: openPicker } ) }
			{ isOpen && (
				<Modal onRequestClose={ closePicker } title={ __( 'Pick a Template', 'jetpack' ) }>
					<div className={ styles.templates }>
						{ TEMPLATES.map( template => (
							<button
								onClick={ setTemplate( template.name ) }
								key={ template.name }
								className={ classnames( styles.template, {
									[ styles[ 'template--active' ] ]: template.name === selectedTemplate,
								} ) }
							>
								<img src={ template.image } alt="" width={ 600 } height={ 315 } />
								<span className="screen-reader-text">
									{
										/* translators: %s is the name of the template */
										sprintf( __( 'Pick the %s template', 'jetpack' ), template.label )
									}
								</span>
							</button>
						) ) }
					</div>
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

export default TemplatePicker;
