/**
 * Editor preview for jetpack/search-product-filter-rating.
 *
 * Mirrors the runtime DOM shape — labeled list with five star rows and
 * optional count badges — so designers can style the rating filter in
 * place. Inspector exposes the user-tunable attributes (label, showCount).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

const STAR_VALUES = [ 5, 4, 3, 2, 1 ];
const SAMPLE_COUNTS = { 5: 18, 4: 12, 3: 5, 2: 1, 1: 0 };
const DEFAULT_LABEL = __( 'Rating', 'jetpack-search-pkg' );

/**
 * Render a 5-glyph star row showing `filled` of them as filled and the rest empty.
 *
 * @param {number} filled - How many stars to render filled (1–5).
 * @return {object[]} Array of star span elements.
 */
function renderStars( filled ) {
	const stars = [];
	for ( let i = 1; i <= 5; i++ ) {
		stars.push(
			h(
				'span',
				{
					key: i,
					className:
						'jetpack-search-filter-rating__star ' + ( i <= filled ? 'is-filled' : 'is-empty' ),
					'aria-hidden': 'true',
				},
				'★'
			)
		);
	}
	return stars;
}

/**
 * Edit component for the search-product-filter-rating block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterRatingEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-rating' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const showCount = attributes?.showCount !== false;

	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Label', 'jetpack-search-pkg' ),
					value: rawLabel,
					placeholder: DEFAULT_LABEL,
					onChange: value => setAttributes( { label: value } ),
					help: __(
						'Heading shown above the star rows. Leave empty for the default.',
						'jetpack-search-pkg'
					),
				} ),
				h( ToggleControl, {
					__nextHasNoMarginBottom: true,
					label: __( 'Show result counts', 'jetpack-search-pkg' ),
					checked: showCount,
					onChange: value => setAttributes( { showCount: !! value } ),
				} )
			)
		),
		h(
			'div',
			blockProps,
			h( 'h3', { className: 'jetpack-search-filter__title' }, previewLabel ),
			h(
				'ul',
				{ className: 'jetpack-search-filter__list' },
				STAR_VALUES.map( star => {
					/* translators: %d: number of stars (1-5). */
					const aria = sprintf( _n( '%d star', '%d stars', star, 'jetpack-search-pkg' ), star );
					return h(
						'li',
						{ key: star, className: 'jetpack-search-filter__item' },
						h(
							'label',
							null,
							h( 'input', { type: 'checkbox', disabled: true } ),
							h(
								'span',
								{ className: 'jetpack-search-filter__label', 'aria-label': aria },
								renderStars( star )
							),
							showCount
								? h(
										'span',
										{ className: 'jetpack-search-filter__count' },
										String( SAMPLE_COUNTS[ star ] )
								  )
								: null
						)
					);
				} )
			)
		)
	);
}
