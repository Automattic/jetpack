import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { clsx } from 'clsx';
import useSyncStyleAttributes from '../shared/hooks/use-sync-style-attributes';
import { ALLOWED_FORMATS, DATE_FORMATS, FORM_STYLE } from '../shared/util/constants.js';
import getBlockStyle from '../shared/util/get-block-style.js';

const SYNCED_ATTRIBUTES = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const WithNotchedWrapper = ( { formStyle, children } ) => {
	if ( formStyle === FORM_STYLE.OUTLINED ) {
		return (
			<div className="notched-label">
				<div className="notched-label__leading" />
				<div className="notched-label__notch">{ children }</div>
				<div className="notched-label__trailing" />
			</div>
		);
	}

	return <>{ children }</>;
};

const LabelEdit = ( { attributes, clientId, name, setAttributes, context } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );

	const {
		'jetpack/form-className': formClassName,
		'jetpack/field-required': required,
		'jetpack/field-dateFormat': dateFormat,
	} = context;
	const { label, defaultLabel, requiredText } = attributes;

	const placeholder = defaultLabel ?? label ?? __( 'Add label…', 'jetpack-forms' );
	const suffix = dateFormat
		? `(${ DATE_FORMATS.find( f => f.value === dateFormat )?.label })`
		: undefined;
	const formStyle = getBlockStyle( formClassName );
	const className = clsx( 'jetpack-field-label', {
		'notched-label__label': formStyle === FORM_STYLE.OUTLINED,
		'animated-label__label': formStyle === FORM_STYLE.ANIMATED,
		'below-label__label': formStyle === FORM_STYLE.BELOW,
	} );
	const blockProps = useBlockProps( { className } );

	return (
		<WithNotchedWrapper formStyle={ formStyle }>
			<div { ...blockProps }>
				<RichText
					allowedFormats={ ALLOWED_FORMATS }
					className="jetpack-field-label__input"
					onChange={ value => setAttributes( { label: value } ) }
					placeholder={ placeholder }
					tagName="label"
					value={ label }
					withoutInteractiveFormatting
				/>
				{ suffix && <span className="jetpack-field-label__suffix">{ suffix }</span> }
				{ required && (
					<RichText
						allowedFormats={ ALLOWED_FORMATS }
						className="required"
						onChange={ value => setAttributes( { requiredText: value } ) }
						tagName="span"
						value={ requiredText || __( '(required)', 'jetpack-forms' ) }
						withoutInteractiveFormatting
					/>
				) }
			</div>
		</WithNotchedWrapper>
	);
};

export default LabelEdit;
