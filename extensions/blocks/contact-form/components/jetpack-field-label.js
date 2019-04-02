/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlainText } from '@wordpress/editor';
import { ToggleControl } from '@wordpress/components';

const JetpackFieldLabel = ( { setAttributes, label, resetFocus, isSelected, required } ) => {
	return (
		<div className="jetpack-field-label">
			<PlainText
				value={ label }
				className="jetpack-field-label__input"
				onChange={ value => {
					resetFocus && resetFocus();
					setAttributes( { label: value } );
				} }
				placeholder={ __( 'Write label…', 'jetpack' ) }
			/>
			{ isSelected && (
				<ToggleControl
					label={ __( 'Required', 'jetpack' ) }
					className="jetpack-field-label__required"
					checked={ required }
					onChange={ value => setAttributes( { required: value } ) }
				/>
			) }
			{ ! isSelected && required && (
				<span className="required">{ __( '(required)', 'jetpack' ) }</span>
			) }
		</div>
	);
};

export default JetpackFieldLabel;
