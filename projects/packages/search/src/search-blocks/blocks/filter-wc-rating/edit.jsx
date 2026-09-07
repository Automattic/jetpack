/**
 * Editor preview for jetpack-search/filter-wc-rating.
 *
 * Mirrors the runtime DOM shape — labeled list with up to five star rows
 * and optional count badges — so designers can style the rating filter
 * in place. Inspector exposes the user-tunable attributes (label,
 * showCount, enabledStars).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	BaseControl,
	CheckboxControl,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
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
 * Normalize the `enabledStars` attribute. An unset / empty / malformed
 * value falls back to all five rows so a stale block instance can't
 * render an empty list. Mirrors PHP's `Filter_Wc_Rating::get_enabled_stars`.
 *
 * @param {unknown} raw - Raw attribute value.
 * @return {number[]} Star ints, deduplicated, high-to-low.
 */
function normalizeEnabledStars( raw ) {
	if ( ! Array.isArray( raw ) || raw.length === 0 ) {
		return [ ...STAR_VALUES ];
	}
	const set = new Set();
	for ( const v of raw ) {
		const n = Number( v );
		if ( Number.isFinite( n ) && n >= 1 && n <= 5 ) {
			set.add( Math.trunc( n ) );
		}
	}
	if ( set.size === 0 ) {
		return [ ...STAR_VALUES ];
	}
	return [ ...set ].sort( ( a, b ) => b - a );
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
	const enabledStars = normalizeEnabledStars( attributes?.enabledStars );
	const enabledSet = new Set( enabledStars );

	const toggleStar = ( star, on ) => {
		const next = new Set( enabledSet );
		if ( on ) {
			next.add( star );
		} else {
			// Don't let the author save an empty list — the block would
			// render nothing on the front end. Force at least one row to
			// stay enabled by rejecting the un-toggle when this is the
			// last selected row.
			if ( next.size <= 1 ) {
				return;
			}
			next.delete( star );
		}
		setAttributes( { enabledStars: [ ...next ].sort( ( a, b ) => b - a ) } );
	};

	const labelForStar = star =>
		star === 5
			? __( '5 stars', 'jetpack-search-pkg' )
			: sprintf(
					/* translators: %d is the rating threshold (1-4). */
					_n( '%d star and up', '%d stars and up', star, 'jetpack-search-pkg' ),
					star
			  );

	const previewStars = STAR_VALUES.filter( s => enabledSet.has( s ) );

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
					<BaseControl
						__nextHasNoMarginBottom
						id="filter-wc-rating-enabled-stars"
						label={ __( 'Visible rows', 'jetpack-search-pkg' ) }
						help={ __(
							'Hide rows you don’t want shoppers to pick. At least one row must stay visible.',
							'jetpack-search-pkg'
						) }
					>
						{ STAR_VALUES.map( star => (
							<CheckboxControl
								key={ star }
								__nextHasNoMarginBottom
								label={ labelForStar( star ) }
								checked={ enabledSet.has( star ) }
								onChange={ on => toggleStar( star, on ) }
							/>
						) ) }
					</BaseControl>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				<ul className="jetpack-search-filter__list">
					{ previewStars.map( star => {
						const isTop = star === 5;
						const aria = labelForStar( star );
						return (
							<li key={ star } className="jetpack-search-filter__item">
								{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies; rule's nesting heuristic doesn't trace through sibling spans */ }
								<label>
									<input type="checkbox" disabled />
									<span className="jetpack-search-filter__label" aria-label={ aria }>
										<span className="jetpack-search-filter-rating__stars" aria-hidden="true">
											{ renderStars( star ) }
										</span>
										{ ! isTop && (
											<span
												className="jetpack-search-filter-rating__threshold-suffix"
												aria-hidden="true"
											>
												{ _x(
													'& up',
													'rating filter row, e.g. "★★★★ & up"',
													'jetpack-search-pkg'
												) }
											</span>
										) }
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
