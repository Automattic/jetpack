/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlainText } from '@wordpress/block-editor';

const JetpackFieldLabel = ( { setAttributes, label, labelFieldName, resetFocus, required } ) => {
	return (
		<div className="jetpack-field-label">
			<PlainText
				value={ label }
				className="jetpack-field-label__input"
				onChange={ value => {
					resetFocus && resetFocus();
					if ( labelFieldName ) {
						setAttributes( { [ labelFieldName ]: value } );
						return;
					}
					setAttributes( { label: value } );
				} }
				placeholder={ __( 'Write label…', 'jetpack' ) }
			/>
			{ required && <span className="required">{ __( '(required)', 'jetpack' ) }</span> }
		</div>
	);
};

export default JetpackFieldLabel;
