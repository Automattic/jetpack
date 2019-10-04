/**
 * External dependencies
 */
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/editor';
import { PanelBody, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackField( {
	isSelected,
	type,
	required,
	label,
	setAttributes,
	defaultValue,
	placeholder,
	id,
} ) {
	return (
		<Fragment>
			<div className={ classNames( 'jetpack-field', { 'is-selected': isSelected } ) }>
				<TextControl
					type={ type }
					label={
						<JetpackFieldLabel
							required={ required }
							label={ label }
							setAttributes={ setAttributes }
							isSelected={ isSelected }
						/>
					}
					placeholder={ placeholder }
					value={ placeholder }
					onChange={ value => setAttributes( { placeholder: value } ) }
					title={ __( 'Set the placeholder text', 'jetpack' ) }
				/>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
					<TextControl
						label={ __( 'Default Value', 'jetpack' ) }
						value={ defaultValue }
						onChange={ value => setAttributes( { defaultValue: value } ) }
					/>
					<TextControl
						label={ __( 'ID', 'jetpack' ) }
						value={ id }
						onChange={ value => setAttributes( { id: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}

export default JetpackField;
