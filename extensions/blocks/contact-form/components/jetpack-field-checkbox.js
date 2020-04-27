/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, PanelBody, ToggleControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackFieldCheckbox( props ) {
	const { instanceId, required, label, setAttributes, isSelected, defaultValue } = props;

	return (
		<BaseControl
			id={ `jetpack-field-checkbox-${ instanceId }` }
			className="jetpack-field jetpack-field-checkbox"
			label={
				<>
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
								label={ __( 'Checked by default', 'jetpack' ) }
								checked={ defaultValue }
								onChange={ value => setAttributes( { defaultValue: value } ) }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			}
		/>
	);
}

export default withInstanceId( JetpackFieldCheckbox );
