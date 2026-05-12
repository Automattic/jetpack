/**
 * Editor preview for jetpack-search/filter-date.
 *
 * `displayStyle` swaps between the default checkbox-list rendering and a
 * chip-pill variant for the date buckets, mirroring the same attribute on
 * filter-checkbox / filter-wc-*. The runtime DOM stays identical across
 * variants — only the wrapper data attribute changes — so the existing
 * Interactivity bindings keep working.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { normalizeDisplayStyle } from '../display-style.js';

const SAMPLE_BUCKETS_YEAR = [
	{ value: '2024', label: '2024', count: 42 },
	{ value: '2023', label: '2023', count: 31 },
	{ value: '2022', label: '2022', count: 18 },
];

const SAMPLE_BUCKETS_MONTH = [
	{ value: '2024-03', label: __( 'March 2024', 'jetpack-search-pkg' ), count: 14 },
	{ value: '2024-02', label: __( 'February 2024', 'jetpack-search-pkg' ), count: 9 },
	{ value: '2024-01', label: __( 'January 2024', 'jetpack-search-pkg' ), count: 6 },
];

/**
 * Edit component for the filter-date block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterDateEdit( { attributes, setAttributes } ) {
	const displayStyle = normalizeDisplayStyle( attributes?.displayStyle );
	const blockProps = useBlockProps( { 'data-display-style': displayStyle } );
	const rawLabel = attributes?.label || '';
	const placeholderLabel = __( 'Date', 'jetpack-search-pkg' );
	const previewLabel = rawLabel || placeholderLabel;
	const showCount = attributes?.showCount !== false;
	const maxItems = Math.max(
		1,
		Number.isFinite( attributes?.maxItems ) ? attributes.maxItems : 10
	);
	const interval = attributes?.interval === 'month' ? 'month' : 'year';
	const bucketSortOrder = [ 'newest', 'oldest', 'count' ].includes( attributes?.bucketSortOrder )
		? attributes.bucketSortOrder
		: 'newest';
	const sampleBuckets = interval === 'month' ? SAMPLE_BUCKETS_MONTH : SAMPLE_BUCKETS_YEAR;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Interval', 'jetpack-search-pkg' ) }
						value={ interval }
						options={ [
							{ value: 'year', label: __( 'Year', 'jetpack-search-pkg' ) },
							{ value: 'month', label: __( 'Month', 'jetpack-search-pkg' ) },
						] }
						onChange={ value =>
							setAttributes( { interval: value === 'month' ? 'month' : 'year' } )
						}
						help={ __(
							'Bucket size: yearly suits long-running blogs; monthly suits archive-heavy news sites.',
							'jetpack-search-pkg'
						) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ placeholderLabel }
						onChange={ value => setAttributes( { label: value } ) }
						help={ __( 'Leave empty to use the default "Date" label.', 'jetpack-search-pkg' ) }
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
						label={ __( 'Maximum items', 'jetpack-search-pkg' ) }
						value={ maxItems }
						min={ 1 }
						max={ 50 }
						onChange={ value => setAttributes( { maxItems: Math.max( 1, value || 1 ) } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Sort order', 'jetpack-search-pkg' ) }
						value={ bucketSortOrder }
						options={ [
							{ value: 'newest', label: __( 'Most recent first', 'jetpack-search-pkg' ) },
							{ value: 'oldest', label: __( 'Oldest first', 'jetpack-search-pkg' ) },
							{ value: 'count', label: __( 'Most results first', 'jetpack-search-pkg' ) },
						] }
						onChange={ value => setAttributes( { bucketSortOrder: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
				<ul className="jetpack-search-filter__list">
					{ sampleBuckets.slice( 0, maxItems ).map( item => (
						<li key={ item.value } className="jetpack-search-filter__item">
							{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies; rule's nesting heuristic doesn't trace through sibling spans */ }
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
		</>
	);
}
