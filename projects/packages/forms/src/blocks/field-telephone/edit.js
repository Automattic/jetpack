import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { countries } from './country-list';
import { getTranslatedCountryName } from './country-names-translated';

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

	// Keep the inner label block's requiredIndicator in sync when it changes
	const labelClientId = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );
			const parentBlock = getBlock( clientId );
			if ( ! parentBlock ) {
				return undefined;
			}
			const labelBlock = parentBlock.innerBlocks.find( block => block.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( labelClientId ) {
			updateBlockAttributes( labelClientId, { requiredIndicator } );
		}
	}, [ labelClientId, requiredIndicator, updateBlockAttributes ] );

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

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
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
						/>
					) }
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
