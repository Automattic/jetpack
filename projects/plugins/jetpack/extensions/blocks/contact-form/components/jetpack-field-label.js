import { RichText } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { isNil } from 'lodash';
import { FORM_STYLE } from '../util/form';

const FieldLabel = ( {
	className,
	label,
	labelFieldName,
	placeholder,
	resetFocus,
	required,
	requiredText,
	setAttributes,
} ) => {
	return (
		<div className={ classnames( className, 'jetpack-field-label' ) }>
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

const JetpackFieldLabel = props => {
	const { setAttributes, requiredText, style } = props;

	useEffect( () => {
		if ( isNil( requiredText ) ) {
			setAttributes( { requiredText: __( '(required)', 'jetpack' ) } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	if ( style === FORM_STYLE.OUTLINED ) {
		return (
			<div className="notched-label">
				<div className="notched-label__leading" />
				<div className="notched-label__notch">
					<FieldLabel className="notched-label__label" { ...props } />
				</div>
				<div className="notched-label__trailing" />
			</div>
		);
	}

	if ( style === FORM_STYLE.ANIMATED ) {
		return <FieldLabel className="animated-label__label" { ...props } />;
	}

	return <FieldLabel { ...props } />;
};

export default JetpackFieldLabel;
