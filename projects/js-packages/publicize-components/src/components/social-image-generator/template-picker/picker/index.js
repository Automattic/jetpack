import { useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import clsx from 'clsx';
import styles from './styles.module.scss';
import TEMPLATES_DATA from './templates.js';

/** @typedef {import('react').ReactNode} ReactNode */

/**
 *
 * The pure template picker component. Does not save the template changes, just sends it back to the parent component,
 * with the onTemplateSelected callback.
 *
 * @param {{value: string|null, onTemplateSelected: Function}} props - The component props:
 * Value is the name of the currently selected template, onTemplateSelected is a function that
 * will be called when a template is selected. Receives the name of the selected template as an argument.
 * @returns {ReactNode} - The component's rendered output.
 */
const TemplatePicker = ( { value = null, onTemplateSelected = null } ) => {
	const onTemplateClicked = useCallback(
		event => {
			const templateName = event.target.id;
			onTemplateSelected?.( templateName );
		},
		[ onTemplateSelected ]
	);

	return (
		<div className={ styles.templates }>
			{ TEMPLATES_DATA.map( template => (
				<button
					onClick={ onTemplateClicked }
					id={ template.name }
					key={ template.name }
					className={ clsx( styles.template, {
						[ styles[ 'template--active' ] ]: template.name === value,
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
