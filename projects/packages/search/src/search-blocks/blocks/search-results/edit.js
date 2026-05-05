/**
 * Editor preview for jetpack/search-results.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { LAYOUTS, resolveLayout } from './layout-features';

const SAMPLE_RESULTS = [
	{
		title: __( 'First sample result', 'jetpack-search-pkg' ),
		path: 'example.com/articles/first',
		date: 'Apr 1, 2026',
	},
	{
		title: __( 'Another relevant post', 'jetpack-search-pkg' ),
		path: 'example.com/guides/another',
		date: 'Mar 22, 2026',
	},
	{
		title: __( 'Older archived entry', 'jetpack-search-pkg' ),
		path: 'example.com/2025/older',
		date: 'Dec 18, 2025',
	},
];

const SAMPLE_PRODUCTS = [
	{
		title: __( 'Sample product', 'jetpack-search-pkg' ),
		formattedPrice: '$24.00',
		ratingPercent: '90%',
		reviewCount: 42,
	},
	{
		title: __( 'Another product on sale', 'jetpack-search-pkg' ),
		formattedRegularPrice: '$30.00',
		formattedSalePrice: '$19.99',
		hasSalePrice: true,
		ratingPercent: '70%',
		reviewCount: 12,
	},
	{
		title: __( 'Third product', 'jetpack-search-pkg' ),
		formattedPrice: '$48.00',
		ratingPercent: '100%',
		reviewCount: 7,
	},
];

const LAYOUT_OPTIONS = () => [
	{ label: __( 'Card', 'jetpack-search-pkg' ), value: 'card' },
	{ label: __( 'Compact', 'jetpack-search-pkg' ), value: 'compact' },
	{ label: __( 'Product (for WooCommerce stores)', 'jetpack-search-pkg' ), value: 'product' },
];

/**
 * Editor preview for the search-results block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchResultsEdit( { attributes, setAttributes } ) {
	const layout = attributes?.layout ?? 'card';
	const features = resolveLayout( layout );
	const blockProps = useBlockProps( {
		className: `jetpack-search-results--${ features.modifier }`,
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<RadioControl
						label={ __( 'Result format', 'jetpack-search-pkg' ) }
						selected={ LAYOUTS.includes( layout ) ? layout : 'card' }
						options={ LAYOUT_OPTIONS() }
						onChange={ value => setAttributes( { layout: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ layout === 'product'
					? renderProductPreview( SAMPLE_PRODUCTS )
					: renderListPreview( SAMPLE_RESULTS, features ) }
			</div>
		</>
	);
}

/**
 * Card / compact preview list. The two layouts share the same DOM and only
 * vary in which sections render, so a single function handles both.
 *
 * @param {Array}  results  - Sample rows.
 * @param {object} features - Resolved layout feature flags.
 * @return {object} Rendered element.
 */
function renderListPreview( results, features ) {
	return (
		<ul className="jetpack-search-results__list">
			{ results.map( result => (
				<li key={ result.path } className="jetpack-search-results__item">
					<div className="jetpack-search-results__copy">
						<h3 className="jetpack-search-results__title">{ result.title }</h3>
						{ features.showPath && (
							<div className="jetpack-search-results__path">{ result.path }</div>
						) }
						{ features.showDate && (
							<div className="jetpack-search-results__meta">
								<span className="jetpack-search-results__date">{ result.date }</span>
							</div>
						) }
					</div>
					{ features.showImage && (
						<a
							className="jetpack-search-results__image-link"
							hidden
							tabIndex={ -1 }
							aria-hidden="true"
						>
							<img className="jetpack-search-results__image" alt="" />
						</a>
					) }
				</li>
			) ) }
		</ul>
	);
}

/**
 * Product preview grid.
 *
 * @param {Array} products - Sample product rows.
 * @return {object} Rendered element.
 */
function renderProductPreview( products ) {
	return (
		<ul className="jetpack-search-results__list">
			{ products.map( product => (
				<li key={ product.title } className="jetpack-search-results__item">
					<div className="jetpack-search-results__product-image-link" aria-hidden="true">
						<span
							className="jetpack-search-results__product-image-placeholder"
							aria-hidden="true"
						/>
					</div>
					<h3 className="jetpack-search-results__title">{ product.title }</h3>
					<div className="jetpack-search-results__price">
						{ product.hasSalePrice ? (
							<>
								<del className="jetpack-search-results__price-regular">
									{ product.formattedRegularPrice }
								</del>{ ' ' }
								<ins className="jetpack-search-results__price-sale">
									{ product.formattedSalePrice }
								</ins>
							</>
						) : (
							<span>{ product.formattedPrice }</span>
						) }
					</div>
					<div
						className="jetpack-search-results__rating"
						aria-label={ `${ product.ratingPercent } rating` }
					>
						<span className="jetpack-search-results__rating-stars" aria-hidden="true">
							<span
								className="jetpack-search-results__rating-fill"
								style={ { width: product.ratingPercent } }
							/>
						</span>
						<span className="jetpack-search-results__rating-count">({ product.reviewCount })</span>
					</div>
				</li>
			) ) }
		</ul>
	);
}
