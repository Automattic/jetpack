/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/editor';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

const JetpackFieldCheckbox = ( {
	instanceId,
	required,
	label,
	setAttributes,
	isSelected,
	defaultValue,
	id,
} ) => {
	return (
		<BaseControl
			id={ `jetpack-field-checkbox-${ instanceId }` }
			className="jetpack-field jetpack-field-checkbox"
			label={
				<Fragment>
					<input
						className="jetpack-field-checkbox__checkbox"
						type="checkbox"
						disabled
						checked={ defaultValue }
					/>
					<JetpackFieldLabel
						required={ required }
						label={ label }
						setAttributes={ setAttributes }
						isSelected={ isSelected }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
							<ToggleControl
								label={ __( 'Default Checked State', 'jetpack' ) }
								checked={ defaultValue }
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
			}
		/>
	);
};

export default withInstanceId( JetpackFieldCheckbox );
