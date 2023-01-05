import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const JetpackFieldLabel = ( {
	setAttributes,
	label,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
	attributes,
} ) => {
	const labelStyle = {
		lineHeight: attributes.lineHeight,
		color: attributes.labelColor,
		fontSize: attributes.labelFontSize,
	};

	return (
		<div className="jetpack-field-label">
			<div style={ labelStyle }>
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
					placeholder={ placeholder || __( 'Add label…', 'jetpack' ) }
					withoutInteractiveFormatting
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
				/>
				{ required && <span className="required">{ __( '(required)', 'jetpack' ) }</span> }
			</div>
		</div>
	);
};

export default JetpackFieldLabel;
