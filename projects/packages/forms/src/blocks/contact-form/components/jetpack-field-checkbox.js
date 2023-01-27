import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';

/**
 *
 * @param props
 */
function JetpackFieldCheckbox( props ) {
	const {
		id,
		instanceId,
		required,
		requiredText,
		label,
		setAttributes,
		width,
		defaultValue,
	} = props;

	return (
		<div
			id={ `jetpack-field-checkbox-${ instanceId }` }
			className="jetpack-field jetpack-field-checkbox"
		>
			<input
				className="jetpack-field-checkbox__checkbox"
				type="checkbox"
				disabled
				checked={ defaultValue }
			/>
			<JetpackFieldLabel
				required={ required }
				requiredText={ requiredText }
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
		</div>
	);
}

export default withInstanceId( JetpackFieldCheckbox );
