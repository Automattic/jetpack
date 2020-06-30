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
import JetpackFieldControls from './jetpack-field-controls';

function JetpackFieldCheckbox( props ) {
	const { id, instanceId, required, label, setAttributes, width, defaultValue } = props;

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
					/>
					<JetpackFieldControls
						id={ id }
						required={ required }
						width={ width }
						setAttributes={ setAttributes }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Checkbox Settings', 'jetpack' ) }>
							<ToggleControl
								label={ __( 'Checked by default', 'jetpack' ) }
								checked={ defaultValue }
								onChange={ value => setAttributes( { defaultValue: value ? 'true' : '' } ) }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			}
		/>
	);
}

export default withInstanceId( JetpackFieldCheckbox );
