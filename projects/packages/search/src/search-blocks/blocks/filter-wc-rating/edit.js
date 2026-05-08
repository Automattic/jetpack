/**
 * Editor preview for jetpack-search/filter-wc-rating.
 *
 * Mirrors the runtime DOM shape — labeled list with five star rows and
 * optional count badges — so designers can style the rating filter in
 * place. Inspector exposes the user-tunable attributes (label, showCount).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __, _n, _x, sprintf } from '@wordpress/i18n';

const STAR_VALUES = [ 5, 4, 3, 2, 1 ];
// Cumulative "& up" counts — each row's count is the threshold-superset
// of the rows below it, matching the runtime projection so designers see
// the right shape in the editor.
const SAMPLE_COUNTS = { 5: 8, 4: 22, 3: 29, 2: 31, 1: 32 };
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
			<span
				key={ i }
				className={
					'jetpack-search-filter-rating__star ' + ( i <= filled ? 'is-filled' : 'is-empty' )
				}
			>
				★
			</span>
		);
	}
	return stars;
}

/**
 * Edit component for the filter-wc-rating block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterWcRatingEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-filter-wc-rating' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const showCount = attributes?.showCount !== false;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ DEFAULT_LABEL }
						onChange={ value => setAttributes( { label: value } ) }
						help={ __(
							'Heading shown above the star rows. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show result counts', 'jetpack-search-pkg' ) }
						checked={ showCount }
						onChange={ value => setAttributes( { showCount: !! value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				<ul className="jetpack-search-filter__list">
					{ STAR_VALUES.map( star => {
						const aria = sprintf(
							/* translators: %d is the rating threshold (1-5). The row applies a "rating ≥ N stars" filter. */
							_n( '%d star and up', '%d stars and up', star, 'jetpack-search-pkg' ),
							star
						);
						return (
							<li key={ star } className="jetpack-search-filter__item">
								{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies; rule's nesting heuristic doesn't trace through sibling spans */ }
								<label>
									<input type="checkbox" disabled />
									<span className="jetpack-search-filter__label" aria-label={ aria }>
										<span className="jetpack-search-filter-rating__stars" aria-hidden="true">
											{ renderStars( star ) }
										</span>
										<span
											className="jetpack-search-filter-rating__threshold-suffix"
											aria-hidden="true"
										>
											{ _x( '& up', 'rating filter row, e.g. "★★★★ & up"', 'jetpack-search-pkg' ) }
										</span>
									</span>
									{ showCount && (
										<span className="jetpack-search-filter__count">
											{ String( SAMPLE_COUNTS[ star ] ) }
										</span>
									) }
								</label>
							</li>
						);
					} ) }
				</ul>
			</div>
		</>
	);
}
