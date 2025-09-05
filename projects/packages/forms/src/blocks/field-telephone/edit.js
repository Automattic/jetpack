import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { countries } from './country-list';

const EMPTY_ARRAY = [];

export default function PhoneFieldEdit( props ) {
	const { setAttributes, attributes, clientId, isSelected } = props;
	const {
		showCountrySelector,
		width,
		id,
		required,
		requiredText,
		placeholder,
		default: defaultCountry,
	} = attributes;
	const [ countryList, setCountryList ] = useState( EMPTY_ARRAY );

	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx(
			'jetpack-field',
			'jetpack-field-phone',
			'jetpack-field-telephone',
			width ? ` jetpack-field__width-${ width }` : '',
			{
				'is-selected': isSelected || isInnerBlockSelected,
				'has-placeholder': hasPlaceholder,
			}
		),
		style: blockStyle,
	} );

	useFormWrapper( props );

	const countryPairs = useMemo( () => {
		return countries.map( country => ( {
			label: country.country + ' ' + country.label,
			value: country.code,
		} ) );
	}, [] );

	const onChangeShowCountrySelector = value => {
		setAttributes( {
			showCountrySelector: value,
		} );
		setCountryList( value ? countryPairs : EMPTY_ARRAY );
	};

	useEffect( () => {
		if ( showCountrySelector === undefined || showCountrySelector === true ) {
			setAttributes( { showCountrySelector: true, default: defaultCountry || 'US' } );
			setCountryList( countryPairs );
		}
	}, [ showCountrySelector, setAttributes, countryPairs, defaultCountry ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/phone-input' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Phone number', 'jetpack-forms' ),
					placeholder,
					required,
					requiredText,
				},
			],
			[ 'jetpack/phone-input', {} ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	// Handler is provided as context from edit as index.js can't pass it as a prop.
	const onChangeDefaultCountry = useCallback(
		event => {
			const value = event.target.value;
			setAttributes( { default: value } );
		},
		[ setAttributes ]
	);

	return (
		<>
			<BlockContextProvider
				value={ {
					'jetpack/field-prefix-onChange': onChangeDefaultCountry,
					'jetpack/field-prefix-options': countryList,
				} }
			>
				<div { ...innerBlocksProps } />
			</BlockContextProvider>

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<ToggleControl
						label={ __( 'Show country selector', 'jetpack-forms' ) }
						checked={ showCountrySelector || false }
						onChange={ onChangeShowCountrySelector }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>

			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</>
	);
}
