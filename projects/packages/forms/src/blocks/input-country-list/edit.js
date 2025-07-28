import {
	InspectorControls,
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { countryCodes } from '../input-phone-number/country-codes';
import { useSyncedAttributes } from '../shared/hooks/use-synced-attributes';
import useVariationStyleProperties from '../shared/hooks/use-variation-style-properties.js';

const debug = debugFactory( 'jetpack-forms:input-country-list' );

const SYNCED_ATTRIBUTE_KEYS = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

export default function CountryListInputEdit( props ) {
	const { attributes, setAttributes, context, clientId } = props;
	const { defaultCountry, name } = attributes;

	const { 'jetpack/field-share-attributes': isSynced } = context;
	// debug( 'isSynced', isSynced );
	useSyncedAttributes( name, isSynced, SYNCED_ATTRIBUTE_KEYS, attributes, setAttributes );
	const variationProps = useVariationStyleProperties( {
		clientId,
		inputBlockName: name,
		inputBlockAttributes: attributes,
	} );

	// debug( 'variationProps.cssVars', variationProps?.cssVars );
	const blockProps = useBlockProps( {
		className: `jetpack-country-list-input jetpack-field__input`,
		style: variationProps?.cssVars,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	const countryList = useMemo( () => {
		return countryCodes.map( country => ( {
			label: country.label + ' ' + country.country,
			value: country.label,
		} ) );
	}, [] );

	return (
		<>
			<div { ...blockProps }>
				<RichText.Content value={ defaultCountry || '' } />
				<span className="jetpack-field-dropdown__icon" />
			</div>

			<InspectorControls>
				<PanelBody title="Settings">
					<SelectControl
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize
						label={ __( 'Default country', 'jetpack-forms' ) }
						value={ defaultCountry }
						onChange={ value => setAttributes( { defaultCountry: value } ) }
						options={ countryList }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
