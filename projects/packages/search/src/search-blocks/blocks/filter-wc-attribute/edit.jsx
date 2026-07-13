/**
 * Editor preview for jetpack-search/filter-wc-attribute.
 *
 * One block instance targets one WC product attribute taxonomy (`pa_color`,
 * `pa_size`, …). The picker is seeded from the WC Store API
 * (`/wc/store/v1/products/attributes`) rather than `/wp/v2/taxonomies`
 * because WooCommerce registers `pa_*` taxonomies without `show_in_rest`,
 * so they never appear in the core taxonomies endpoint. The Store API is
 * public and ships with WC Blocks (always-on in modern WC), so non-WC
 * sites simply 404 and we render the "no attributes" Placeholder.
 *
 * Once an attribute is chosen, the preview mirrors filter-checkbox: a
 * labeled list with sample buckets so designers can style the list in
 * place.
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { normalizeDisplayStyle } from '../display-style.js';

const ATTRIBUTE_PREFIX = 'pa_';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'red', label: __( 'Red', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'blue', label: __( 'Blue', 'jetpack-search-pkg' ), count: 8 },
	{ value: 'green', label: __( 'Green', 'jetpack-search-pkg' ), count: 3 },
];

const LOADING_TEXT = __( 'Loading product attributes…', 'jetpack-search-pkg' );
const PICKER_HELP = __(
	'Pick which WooCommerce product attribute drives this filter.',
	'jetpack-search-pkg'
);
const NO_ATTRIBUTES_HELP = __(
	'No WooCommerce product attributes were found on this site.',
	'jetpack-search-pkg'
);
const PLACEHOLDER_PICK = __(
	'Pick a WooCommerce product attribute in the block sidebar to enable this filter.',
	'jetpack-search-pkg'
);
const PLACEHOLDER_EMPTY = __(
	'No WooCommerce product attributes are registered on this site, so this block has nothing to filter on.',
	'jetpack-search-pkg'
);

/**
 * Strip the `pa_` prefix and humanize the remainder so a fallback label
 * reads naturally ("pa_screen_size" → "Screen Size") when the registered
 * taxonomy doesn't carry a singular_name.
 *
 * @param {string} slug - Taxonomy slug.
 * @return {string} Humanized name.
 */
function humanizeAttributeSlug( slug ) {
	const bare = slug.startsWith( ATTRIBUTE_PREFIX ) ? slug.slice( ATTRIBUTE_PREFIX.length ) : slug;
	return bare
		.split( '_' )
		.filter( Boolean )
		.map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

/**
 * Resolve the appropriate help text for the attribute picker, avoiding nested
 * ternaries which are forbidden by the ESLint `no-nested-ternary` rule.
 *
 * @param {boolean} isLoading     - True while taxonomies are being fetched.
 * @param {boolean} hasAttributes - True when at least one `pa_*` attribute is registered.
 * @return {string} Help text.
 */
function resolvePickerHelp( isLoading, hasAttributes ) {
	if ( isLoading ) {
		return LOADING_TEXT;
	}
	if ( hasAttributes ) {
		return PICKER_HELP;
	}
	return NO_ATTRIBUTES_HELP;
}

/**
 * Resolve the Placeholder instructions text, avoiding nested ternaries.
 *
 * @param {boolean} isLoading     - True while taxonomies are being fetched.
 * @param {boolean} hasAttributes - True when at least one `pa_*` attribute is registered.
 * @return {string} Instructions text.
 */
function resolvePlaceholderInstructions( isLoading, hasAttributes ) {
	if ( isLoading ) {
		return LOADING_TEXT;
	}
	if ( hasAttributes ) {
		return PLACEHOLDER_PICK;
	}
	return PLACEHOLDER_EMPTY;
}

/**
 * Edit component for the filter-wc-attribute block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterWcAttributeEdit( { attributes, setAttributes } ) {
	const displayStyle = normalizeDisplayStyle( attributes?.displayStyle );
	const blockProps = useBlockProps( {
		className: 'jetpack-search-filter-wc-attribute',
		'data-display-style': displayStyle,
	} );
	const rawLabel = attributes?.label || '';
	const showCount = attributes?.showCount !== false;
	const maxItems = Math.max( 1, attributes?.maxItems ?? 10 );
	const sortOrder = attributes?.bucketSortOrder === 'alpha' ? 'alpha' : 'count';
	const slug = attributes?.attributeTaxonomy || '';

	// `null` while in flight, array once resolved (empty on non-WC sites or
	// when the Store API 404s). Project into SelectControl options up front
	// so the render path below stays declarative.
	const [ attributeOptions, setAttributeOptions ] = useState( null );
	useEffect( () => {
		let cancelled = false;
		apiFetch( { path: '/wc/store/v1/products/attributes' } )
			.then( attrs => {
				if ( cancelled ) {
					return;
				}
				const list = Array.isArray( attrs ) ? attrs : [];
				const options = list
					.filter(
						attr =>
							typeof attr?.taxonomy === 'string' && attr.taxonomy.startsWith( ATTRIBUTE_PREFIX )
					)
					.map( attr => ( {
						value: attr.taxonomy,
						label: attr?.name || humanizeAttributeSlug( attr.taxonomy ),
					} ) )
					.sort( ( a, b ) => a.label.localeCompare( b.label ) );
				setAttributeOptions( options );
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setAttributeOptions( [] );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	const isLoading = attributeOptions === null;
	const hasAttributes = ! isLoading && attributeOptions.length > 0;
	const selectedOption = hasAttributes ? attributeOptions.find( opt => opt.value === slug ) : null;
	const previewLabel = rawLabel || ( selectedOption ? selectedOption.label : '' );

	const pickerHelp = resolvePickerHelp( isLoading, hasAttributes );
	const placeholderInstructions = resolvePlaceholderInstructions( isLoading, hasAttributes );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Attribute', 'jetpack-search-pkg' ) }
						value={ slug }
						onChange={ value => setAttributes( { attributeTaxonomy: value } ) }
						options={ [
							{ value: '', label: __( '— Select an attribute —', 'jetpack-search-pkg' ) },
							...( attributeOptions ?? [] ),
						] }
						disabled={ isLoading || ! hasAttributes }
						help={ pickerHelp }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ previewLabel }
						onChange={ value => setAttributes( { label: value } ) }
						help={ __(
							"Heading shown above the options. Leave empty to use the attribute's name.",
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show result counts', 'jetpack-search-pkg' ) }
						checked={ showCount }
						onChange={ value => setAttributes( { showCount: !! value } ) }
					/>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Display style', 'jetpack-search-pkg' ) }
						value={ displayStyle }
						onChange={ value => setAttributes( { displayStyle: normalizeDisplayStyle( value ) } ) }
					>
						<ToggleGroupControlOption
							value="checkbox-list"
							label={ __( 'Checkbox list', 'jetpack-search-pkg' ) }
						/>
						<ToggleGroupControlOption value="chips" label={ __( 'Chips', 'jetpack-search-pkg' ) } />
					</ToggleGroupControl>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Maximum items shown', 'jetpack-search-pkg' ) }
						value={ maxItems }
						min={ 1 }
						max={ 50 }
						onChange={ value => setAttributes( { maxItems: Math.max( 1, Number( value ) || 1 ) } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Sort order', 'jetpack-search-pkg' ) }
						value={ sortOrder }
						onChange={ value => setAttributes( { bucketSortOrder: value } ) }
						options={ [
							{
								value: 'count',
								label: __( 'By count (most matches first)', 'jetpack-search-pkg' ),
							},
							{ value: 'alpha', label: __( 'Alphabetical', 'jetpack-search-pkg' ) },
						] }
					/>
				</PanelBody>
			</InspectorControls>
			{ ! slug ? (
				<div { ...blockProps }>
					<Placeholder
						label={ __( 'Filter by Product Attribute', 'jetpack-search-pkg' ) }
						instructions={ placeholderInstructions }
					/>
				</div>
			) : (
				<div { ...blockProps }>
					{ previewLabel && <h3 className="jetpack-search-filter__title">{ previewLabel }</h3> }
					<ul className="jetpack-search-filter__list">
						{ SAMPLE_FILTER_ITEMS.map( item => (
							<li key={ item.value } className="jetpack-search-filter__item">
								{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- input is a direct child; implicit HTML5 association applies */ }
								<label>
									<input type="checkbox" disabled />
									<span className="jetpack-search-filter__label">{ item.label }</span>
									{ showCount && (
										<span className="jetpack-search-filter__count">{ String( item.count ) }</span>
									) }
								</label>
							</li>
						) ) }
					</ul>
				</div>
			) }
		</>
	);
}
