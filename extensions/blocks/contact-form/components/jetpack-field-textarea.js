/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, TextareaControl, TextControl } from '@wordpress/components';

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
					<ToggleControl
						label={ __( 'Field is required', 'jetpack' ) }
						className="jetpack-field-label__required"
						checked={ required }
						onChange={ value => setAttributes( { required: value } ) }
						help={ __(
							'Does this field have to be completed for the form to be submitted?',
							'jetpack'
						) }
					/>
					<TextControl
						label={ __( 'Default value', 'jetpack' ) }
						value={ defaultValue }
						onChange={ value => setAttributes( { defaultValue: value } ) }
						help={ __( 'The value of the field if no edits are made.', 'jetpack' ) }
					/>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}

export default JetpackFieldTextarea;
