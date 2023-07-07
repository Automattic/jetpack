import { useState, useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import classnames from 'classnames';
import React from 'react';
import styles from './styles.module.scss';
import TEMPLATES_DATA from './templates.js';

/**
 *
 * The pure template picker component. Does not save the template changes, just sends it back to the parent component,
 * with the onTemplateSelected callback.
 *
 * @param {{value: string|null, onTemplateSelected: Function}} props - The component props:
 * Value is the name of the currently selected template, onTemplateSelected is a function that
 * will be called when a template is selected. Receives the name of the selected template as an argument.
 * @returns {React.ReactNode} - The component's rendered output.
 */
const TemplatePicker = ( { value = null, onTemplateSelected = null } ) => {
	const [ selectedTemplate, setSelectedTemplate ] = useState( value );

	// Add memoized callback function for each template.
	const TEMPLATES = useMemo(
		() =>
			TEMPLATES_DATA.map( template => ( {
				...template,
				onSelect: () => {
					setSelectedTemplate( template.name );
					if ( onTemplateSelected ) {
						onTemplateSelected( template.name );
					}
				},
			} ) ),
		[ setSelectedTemplate, onTemplateSelected ]
	);

	return (
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
	);
};

export default TemplatePicker;
