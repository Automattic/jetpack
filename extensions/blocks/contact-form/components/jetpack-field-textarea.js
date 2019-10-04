/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/editor';
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackFieldTextarea( {
	required,
	label,
	setAttributes,
	isSelected,
	defaultValue,
	placeholder,
	id,
} ) {
	return (
		<Fragment>
			<div className="jetpack-field">
				<TextareaControl
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

export default JetpackFieldTextarea;
