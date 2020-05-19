/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { TextControl, Disabled } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldControls from './jetpack-field-controls';

export default function JetpackField( props ) {
	const { id, isSelected, type, required, label, setAttributes, placeholder } = props;

	return (
		<Fragment>
			<div className={ classNames( 'jetpack-field', { 'is-selected': isSelected } ) }>
				<JetpackFieldLabel
					required={ required }
					label={ label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
				/>
				<Disabled>
					<TextControl
						type={ type }
						placeholder={ placeholder }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						title={ __( 'Set the placeholder text', 'jetpack' ) }
					/>
				</Disabled>
			</div>

			<JetpackFieldControls id={ id } required={ required } setAttributes={ setAttributes } />
		</Fragment>
	);
}
