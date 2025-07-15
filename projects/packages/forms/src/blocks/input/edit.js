import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { clsx } from 'clsx';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';
import { ALLOWED_FORMATS } from '../shared/util/constants.js';

const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

const TEXT_FIELDS = [ 'number', 'text', 'email', 'url', 'tel' ];

const getInputClass = type => {
	if ( type === 'dropdown' ) {
		return 'jetpack-field-dropdown__toggle';
	}
	if ( type && ! TEXT_FIELDS.includes( type ) ) {
		return `jetpack-field__${ type }`;
	}
	return 'jetpack-field__input';
};

const InputEdit = ( { attributes, clientId, isSelected, name, setAttributes, context } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	const { placeholder, type } = attributes;
	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );
	const className = clsx( getInputClass( attributes.type ), {
		inline: type === 'checkbox' || type === 'radio',
	} );
	const blockProps = useBlockProps( { className, style: variationProps?.cssVars } );
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId );

	const onChange = useCallback(
		event => {
			setAttributes( { placeholder: event.target.value } );
		},
		[ setAttributes ]
	);

	if ( type === 'dropdown' ) {
		return (
			<div { ...blockProps }>
				<RichText
					allowedFormats={ ALLOWED_FORMATS }
					onChange={ value => setAttributes( { placeholder: value } ) }
					value={ placeholder ? placeholder : __( 'Select one option', 'jetpack-forms' ) }
					withoutInteractiveFormatting
				/>
				<span className="jetpack-field-dropdown__icon" />
			</div>
		);
	}

	if ( type === 'textarea' ) {
		return <textarea { ...blockProps } onChange={ onChange } value={ placeholder } />;
	}

	return (
		<>
			<input
				{ ...blockProps }
				onChange={ onChange }
				onKeyDown={ onKeyDown }
				type="text"
				value={ isSelected ? placeholder : '' }
				placeholder={ placeholder }
			/>
		</>
	);
};

export default InputEdit;
