import { RichText } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isNil } from 'lodash';

const JetpackFieldLabel = ( {
	setAttributes,
	label,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
	requiredText,
} ) => {
	useEffect( () => {
		if ( isNil( requiredText ) ) {
			setAttributes( { requiredText: __( '(required)', 'jetpack' ) } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

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
			{ required && (
				<RichText
					tagName="span"
					value={ requiredText }
					className="required"
					onChange={ value => {
						setAttributes( { requiredText: value } );
					} }
					withoutInteractiveFormatting
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
				/>
			) }
		</div>
	);
};

export default JetpackFieldLabel;
