import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
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
	const { max, min, placeholder, type } = attributes;
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
			{ type === 'number' && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
						<NumberControl
							key="min"
							label={ __( 'Minimum value', 'jetpack-forms' ) }
							value={ min }
							onChange={ value => setAttributes( { min: value } ) }
							max={ max }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
							help={ __(
								'The minimum value to accept in the input. Leaving empty allows any negative and positive values.',
								'jetpack-forms'
							) }
						/>
						<NumberControl
							key="max"
							label={ __( 'Maximum value', 'jetpack-forms' ) }
							value={ attributes.max }
							onChange={ value =>
								setAttributes( {
									max: value,
								} )
							}
							min={ min }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
							help={ __( 'The maximum value to accept in the input.', 'jetpack-forms' ) }
						/>
					</PanelBody>
				</InspectorControls>
			) }
		</>
	);
};

export default InputEdit;
