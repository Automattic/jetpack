import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FORM_STYLE } from '../util/form';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const FieldLabel = ( {
	attributes,
	className,
	label,
	suffix,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
	requiredText,
	setAttributes,
} ) => {
	const { labelStyle } = useJetpackFieldStyles( attributes );

	return (
		<div className={ clsx( className, 'jetpack-field-label' ) } style={ labelStyle }>
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
				placeholder={ placeholder ?? __( 'Add label…', 'jetpack-forms' ) }
				withoutInteractiveFormatting
				allowedFormats={ [ 'core/bold', 'core/italic' ] }
			/>
			{ suffix && <span className="jetpack-field-label__suffix">{ suffix }</span> }
			{ required && (
				<RichText
					tagName="span"
					value={ requiredText || __( '(required)', 'jetpack-forms' ) }
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

const JetpackFieldLabel = props => {
	const { style } = props;

	const classes = clsx( {
		'notched-label__label': style === FORM_STYLE.OUTLINED,
		'animated-label__label': style === FORM_STYLE.ANIMATED,
		'below-label__label': style === FORM_STYLE.BELOW,
	} );

	if ( style === FORM_STYLE.OUTLINED ) {
		return (
			<div className="notched-label">
				<div className="notched-label__leading" />
				<div className="notched-label__notch">
					<FieldLabel className={ classes } { ...props } />
				</div>
				<div className="notched-label__trailing" />
			</div>
		);
	}

	return <FieldLabel className={ classes } { ...props } />;
};

export default JetpackFieldLabel;
