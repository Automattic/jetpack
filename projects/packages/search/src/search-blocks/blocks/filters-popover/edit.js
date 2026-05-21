/**
 * Editor preview for jetpack-search/filters-popover.
 *
 * Two display modes share this block. `responsive` (default) renders children inline,
 * mirroring the ≥992px front-end appearance; CSS swaps in the trigger + popover below.
 * `popover-always` keeps the legacy collapsed trigger + dialog preview at every width.
 */
import { InnerBlocks, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
	[ 'jetpack-search/clear-filters' ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'post_type' } ],
];

const ALLOWED = [
	'jetpack-search/filter-checkbox',
	'jetpack-search/active-filters',
	'jetpack-search/clear-filters',
	'jetpack-search/filter-post-type',
];

const DISPLAY_MODE_OPTIONS = [
	{
		value: 'responsive',
		label: __( 'Inline on desktop, popover on mobile', 'jetpack-search-pkg' ),
	},
	{
		value: 'popover-always',
		label: __( 'Always collapsed (popover)', 'jetpack-search-pkg' ),
	},
];

/**
 * Edit component for the filters-popover block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FiltersPopoverEdit( { attributes, setAttributes } ) {
	const displayMode =
		attributes?.displayMode === 'popover-always' ? 'popover-always' : 'responsive';
	const isResponsive = displayMode === 'responsive';
	const blockProps = useBlockProps( {
		className: `jetpack-search-filters-popover is-mode-${ displayMode }`,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Display mode', 'jetpack-search-pkg' ) }
						value={ displayMode }
						options={ DISPLAY_MODE_OPTIONS }
						onChange={ value => setAttributes( { displayMode: value } ) }
						help={ __(
							'Responsive shows filters inline at 992px and wider, then collapses to a popover button on narrower screens.',
							'jetpack-search-pkg'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ ! isResponsive && (
					<button
						type="button"
						className="jetpack-search-filters-popover__trigger"
						aria-haspopup="dialog"
						aria-expanded="false"
						disabled
					>
						<svg
							className="jetpack-search-filters-popover__icon"
							width={ 18 }
							height={ 18 }
							viewBox="0 0 24 24"
							aria-hidden="true"
							focusable="false"
						>
							<path fill="currentColor" d="M3 6h18v2H3V6Zm3 5h12v2H6v-2Zm3 5h6v2H9v-2Z" />
						</svg>
						<span className="screen-reader-text">
							{ __( 'Filter results', 'jetpack-search-pkg' ) }
						</span>
					</button>
				) }
				<div
					className={
						isResponsive
							? 'jetpack-search-filters-popover__panel jetpack-search-filters-popover__panel--inline'
							: 'jetpack-search-filters-popover__panel jetpack-search-filters-popover__panel--editor'
					}
					role={ isResponsive ? 'group' : 'dialog' }
					aria-label={ __( 'Filters', 'jetpack-search-pkg' ) }
					hidden={ ! isResponsive }
				>
					<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
				</div>
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
