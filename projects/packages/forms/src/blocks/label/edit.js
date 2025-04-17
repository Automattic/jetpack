import { RichText, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { clsx } from 'clsx';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import { ALLOWED_FORMATS, DATE_FORMATS, FORM_STYLE } from '../shared/util/constants.js';
import getBlockStyle from '../shared/util/get-block-style.js';

const SYNCED_ATTRIBUTE_KEYS = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const emptyToNull = str => ( str === '' ? null : str );
const getLabelOrFallback = ( label, placeholder ) => {
	if ( label === '' ) {
		return placeholder;
	}

	return label ?? placeholder;
};

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

const LabelEdit = ( { attributes, name, setAttributes, context } ) => {
	const {
		'jetpack/form-className': formClassName,
		'jetpack/field-required': required,
		'jetpack/field-dateFormat': dateFormat,
		'jetpack/field-share-attributes': isSynced,
	} = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );

	const { label, defaultLabel, requiredText } = attributes;

	const defaultPlaceholder = __( 'Add label…', 'jetpack-forms' );
	const placeholder = emptyToNull( defaultLabel ) ?? emptyToNull( label ) ?? defaultPlaceholder;
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

	// The label value to use for the RichText field must manually fall back to the
	// placeholder to be rendered in previews.
	const isPreviewMode = useSelect( select => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );
	const labelValue = isPreviewMode ? getLabelOrFallback( label, defaultPlaceholder ) : label;

	return (
		<WithNotchedWrapper formStyle={ formStyle }>
			<div { ...blockProps }>
				<RichText
					allowedFormats={ ALLOWED_FORMATS }
					className="jetpack-field-label__input"
					onChange={ value => setAttributes( { label: value } ) }
					placeholder={ placeholder }
					tagName="label"
					value={ labelValue }
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
