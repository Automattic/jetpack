import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal } from '@wordpress/components';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import classnames from 'classnames';
import React from 'react';
import styles from './styles.module.scss';
import TEMPLATES_DATA from './templates.js';

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
	const [ isOpen, setIsOpen ] = useState( false );
	const [ selectedTemplate, setSelectedTemplate ] = useState( value );

	const openPicker = useCallback( () => setIsOpen( true ), [ setIsOpen ] );
	const closePicker = useCallback( () => {
		setSelectedTemplate( value );
		setIsOpen( false );
	}, [ value, setSelectedTemplate, setIsOpen ] );
	const saveAndClosePicker = useCallback( () => {
		onSelect( selectedTemplate );
		setIsOpen( false );
	}, [ onSelect, setIsOpen, selectedTemplate ] );

	// Add memoized callback function for each template.
	const TEMPLATES = useMemo(
		() =>
			TEMPLATES_DATA.map( template => ( {
				...template,
				onSelect: () => setSelectedTemplate( template.name ),
			} ) ),
		[ setSelectedTemplate ]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			{ render( { open: openPicker } ) }
			{ isOpen && (
				<Modal onRequestClose={ closePicker } title={ __( 'Pick a Template', 'jetpack' ) }>
					<div className={ styles.templates }>
						{ TEMPLATES.map( template => (
							<button
								onClick={ template.onSelect }
								key={ template.name }
								className={ classnames( styles.template, {
									[ styles[ 'template--active' ] ]: template.name === selectedTemplate,
								} ) }
							>
								<img src={ template.image } alt={ template.label } />
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
