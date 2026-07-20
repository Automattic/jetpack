import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	BlockControls,
} from '@wordpress/block-editor';
import {
	BaseControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import clsx from 'clsx';
import { getTranslatedCountryName } from '../../util/country-names-translated.js';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.jsx';
import useFieldSelected from '../shared/hooks/use-field-selected.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles.js';
import useSyncRequiredIndicator from '../shared/hooks/use-sync-required-indicator.js';
import { countries } from './country-list.js';

const EMPTY_ARRAY = [];

const isBoolean = value => {
	return value === true || value === false;
};

export default function PhoneFieldEdit( props ) {
	const { setAttributes, attributes, clientId, isSelected } = props;
	const {
		showCountrySelector,
		width,
		id,
		required,
		requiredText,
		placeholder,
		searchPlaceholder,
		default: defaultCountry,
		requiredIndicator,
	} = attributes;
	const [ countryList, setCountryList ] = useState( EMPTY_ARRAY );

	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', 'jetpack-field-phone', 'jetpack-field-telephone', {
			[ `jetpack-field__width-${ width }` ]: width,
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: blockStyle,
	} );

	useFormWrapper( props );

	const countryPairs = useMemo( () => {
		return countries.map( country => ( {
			...country,
			country: getTranslatedCountryName( country.code ),
		} ) );
	}, [] );

	const onChangeShowCountrySelector = value => {
		if ( ! isBoolean( value ) ) {
			// if not a boolean (ie, event object), toggle the value
			value = ! showCountrySelector;
		}
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
					requiredIndicator,
				},
			],
			[ 'jetpack/phone-input', {} ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	useSyncRequiredIndicator( {
		clientId,
		blockName: 'jetpack/field-sync',
		isSynced: attributes?.shareFieldAttributes,
		attributes,
		setAttributes,
	} );

	// Handler is provided as context from edit as index.js can't pass it as a prop.
	const onChangeDefaultCountry = useCallback(
		event => {
			setAttributes( { default: event.target.value } );
		},
		[ setAttributes ]
	);

	return (
		<>
			<BlockContextProvider
				value={ {
					'jetpack/field-prefix-onChange': onChangeDefaultCountry,
					'jetpack/field-prefix-options': countryList,
					'jetpack/field-phone-search-placeholder': searchPlaceholder,
				} }
			>
				<div { ...innerBlocksProps } />
			</BlockContextProvider>

			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Show country selector', 'jetpack-forms' ) }
						icon={ globe }
						onClick={ onChangeShowCountrySelector }
						className={ showCountrySelector ? 'is-pressed' : undefined }
					/>
				</ToolbarGroup>
			</BlockControls>

			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
				extraFieldSettings={ [
					{
						index: 2,
						element: (
							<BaseControl __nextHasNoMarginBottom={ true } key="phoneFieldControls">
								<ToggleControl
									label={ __( 'Show country selector', 'jetpack-forms' ) }
									checked={ showCountrySelector || false }
									onChange={ onChangeShowCountrySelector }
									__nextHasNoMarginBottom={ true }
								/>
								{ showCountrySelector && (
									<TextControl
										label={ __( 'Search placeholder', 'jetpack-forms' ) }
										value={ searchPlaceholder }
										placeholder={ __( 'Search countries…', 'jetpack-forms' ) }
										onChange={ newValue => setAttributes( { searchPlaceholder: newValue } ) }
										__nextHasNoMarginBottom={ true }
										__next40pxDefaultSize={ true }
										help={ __(
											'Set placeholder text shown in the country selector search.',
											'jetpack-forms'
										) }
									/>
								) }
							</BaseControl>
						),
					},
				] }
			/>
		</>
	);
}
