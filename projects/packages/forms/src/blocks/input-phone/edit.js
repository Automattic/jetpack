import { useBlockProps } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';
import './editor.scss';

const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

const PhoneInputEdit = ( { attributes, clientId, isSelected, name, setAttributes, context } ) => {
	const { 'jetpack/field-share-attributes': isSynced } = context;

	useSyncedAttributes(
		'jetpack/input',
		isSynced,
		SYNCED_ATTRIBUTE_KEYS,
		attributes,
		setAttributes
	);
	const { placeholder } = attributes;
	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );

	const blockProps = useBlockProps( {
		className: 'jetpack-field__input jetpack-field__input-phone',
		style: variationProps?.cssVars,
	} );
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId );

	const onChange = useCallback(
		event => {
			setAttributes( { placeholder: event.target.value } );
		},
		[ setAttributes ]
	);

	// Prefix/Country selector
	const prefixOptions = context?.[ 'jetpack/field-prefix-options' ] || [];
	const defaultPrefix = context?.[ 'jetpack/field-prefix-default' ] || 'US';
	const onChangeDefaultPrefix = context?.[ 'jetpack/field-prefix-onChange' ] || ( () => {} );
	const showCountrySelector = context?.[ 'jetpack/field-phone-country-toggle' ] || false;

	return (
		<>
			<div { ...blockProps }>
				{ showCountrySelector && prefixOptions.length === 1 && (
					<div className="jetpack-field__input-prefix">{ prefixOptions[ 0 ].label }</div>
				) }
				{ showCountrySelector && prefixOptions.length > 1 && (
					<div className="jetpack-field__input-prefix">
						<select
							className="jetpack-field__input-element"
							value={ defaultPrefix }
							onChange={ onChangeDefaultPrefix }
						>
							{ prefixOptions.map( ( { label, value } ) => (
								<option key={ value + label } value={ value }>
									{ label }
								</option>
							) ) }
						</select>
					</div>
				) }
				<input
					className="jetpack-field__input-element"
					onChange={ onChange }
					onKeyDown={ onKeyDown }
					type="text"
					value={ isSelected ? placeholder : '' }
					placeholder={ placeholder }
				/>
			</div>
		</>
	);
};

export default PhoneInputEdit;
