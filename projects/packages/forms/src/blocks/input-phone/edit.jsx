import { useBlockProps } from '@wordpress/block-editor';
import { useCallback, useRef, useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SearchableCombobox from '../shared/components/searchable-combobox.jsx';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down.js';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes.jsx';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';
import './editor.scss';
import '../../contact-form/css/combobox.scss';

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
	const [ comboboxOpen, setComboboxOpen ] = useState( false );
	const inputRef = useRef( null );

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
	const defaultPrefix = context?.[ 'jetpack/field-prefix-default' ] || 'US';
	const showCountrySelector = context?.[ 'jetpack/field-phone-country-toggle' ] || false;
	const searchPlaceholder =
		context?.[ 'jetpack/field-phone-search-placeholder' ] ||
		__( 'Search countries…', 'jetpack-forms' );

	const handleChangeDefaultPrefix = useCallback(
		event => {
			const onChangeDefaultPrefix = context?.[ 'jetpack/field-prefix-onChange' ] || ( () => {} );
			onChangeDefaultPrefix( event );
			setComboboxOpen( false );
			// Focus on the input element after closing the combobox
			setTimeout( () => {
				if ( inputRef.current ) {
					inputRef.current.focus();
				}
			}, 0 );
		},
		[ context, setComboboxOpen ]
	);

	// ensure the combobox is closed when the block is not selected
	useEffect( () => {
		if ( isSelected ) {
			return;
		}
		setComboboxOpen( isSelected );
	}, [ isSelected ] );

	const countries = useMemo( () => {
		return context?.[ 'jetpack/field-prefix-options' ] || [];
	}, [ context ] );

	return (
		<>
			<div { ...blockProps }>
				{ showCountrySelector && countries.length > 1 && defaultPrefix && (
					<div className="jetpack-field__input-prefix">
						<SearchableCombobox
							options={ countries }
							selectedOptionCode={ defaultPrefix }
							onOptionChange={ handleChangeDefaultPrefix }
							isOpen={ comboboxOpen }
							onOpenChange={ setComboboxOpen }
							placeholder={ searchPlaceholder }
							parentStyle={ blockProps?.style }
						/>
					</div>
				) }
				<input
					ref={ inputRef }
					className="jetpack-field__input-element"
					onChange={ onChange }
					onKeyDown={ onKeyDown }
					onClick={ () => setComboboxOpen( false ) }
					type="text"
					value={ isSelected ? placeholder : '' }
					placeholder={ placeholder }
				/>
			</div>
		</>
	);
};

export default PhoneInputEdit;
