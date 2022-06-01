import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const JetpackFieldLabel = ( {
	setAttributes,
	label,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
} ) => {
	return (
		<div className="jetpack-field-label">
			<RichText
				tagName="label"
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
				placeholder={ placeholder ?? __( 'Add label…', 'jetpack' ) }
				withoutInteractiveFormatting
				allowedFormats={ [ 'core/bold', 'core/italic' ] }
			/>
			{ required && <span className="required">{ __( '(required)', 'jetpack' ) }</span> }
		</div>
	);
};

export default JetpackFieldLabel;
