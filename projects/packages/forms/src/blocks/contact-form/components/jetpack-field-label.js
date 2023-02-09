import { RichText } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { isNil } from 'lodash';
import { FORM_STYLE } from '../util/form';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const FieldLabel = ( {
	attributes,
	className,
	label,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
	requiredText,
	setAttributes,
} ) => {
	const { labelStyle } = useJetpackFieldStyles( attributes );

	return (
		<div className={ classnames( className, 'jetpack-field-label' ) } style={ labelStyle }>
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

const JetpackFieldLabel = props => {
	const { setAttributes, requiredText, style } = props;

	const classes = classnames( {
		'notched-label__label': style === FORM_STYLE.OUTLINED,
		'animated-label__label': style === FORM_STYLE.ANIMATED,
		'below-label__label': style === FORM_STYLE.BELOW,
	} );

	useEffect( () => {
		if ( isNil( requiredText ) ) {
			setAttributes( { requiredText: __( '(required)', 'jetpack-forms' ) } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

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
