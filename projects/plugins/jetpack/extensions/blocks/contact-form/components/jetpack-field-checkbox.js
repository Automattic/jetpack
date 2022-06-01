import { InspectorControls } from '@wordpress/block-editor';
import { BaseControl, PanelBody, ToggleControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

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
