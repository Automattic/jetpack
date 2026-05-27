/**
 * Editor preview for jetpack-search/filters-popover.
 *
 * Two display modes share this block. In `popover-always` (default) the trigger button
 * renders as a non-interactive preview of the front-end control, and a block-toolbar
 * button toggles whether the panel is expanded in the canvas — so authors can edit the
 * panel contents when expanded or the surrounding template parts when collapsed. The
 * trigger itself stays inert because clicking it would select the block (and pop the
 * settings sidebar) without giving the author a way to collapse the panel afterwards.
 * `responsive` renders children inline, mirroring the ≥992px front-end appearance;
 * runtime visibility on the front end stays class-driven by the Interactivity store.
 */
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filter } from '@wordpress/icons';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
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
		value: 'popover-always',
		label: __( 'Always collapsed (popover)', 'jetpack-search-pkg' ),
	},
	{
		value: 'responsive',
		label: __( 'Inline on desktop, popover on mobile', 'jetpack-search-pkg' ),
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
	const displayMode = attributes?.displayMode === 'responsive' ? 'responsive' : 'popover-always';
	const isResponsive = displayMode === 'responsive';
	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false );
	// Split into a top-level if/else so Terser doesn't collapse two __() calls
	// into `__( cond ? 'a' : 'b' )` — the post-build i18n validator requires a
	// string literal as the first argument.
	let togglePanelLabel = __( 'Show filter panel', 'jetpack-search-pkg' );
	if ( isPopoverOpen ) {
		togglePanelLabel = __( 'Hide filter panel', 'jetpack-search-pkg' );
	}
	const blockProps = useBlockProps( {
		className: [
			'jetpack-search-filters-popover',
			`is-mode-${ displayMode }`,
			'is-editor-preview',
			! isResponsive && isPopoverOpen && 'is-popover-open',
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	return (
		<>
			{ ! isResponsive && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							icon={ filter }
							label={ togglePanelLabel }
							isPressed={ isPopoverOpen }
							onClick={ () => setIsPopoverOpen( open => ! open ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
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
							'Responsive shows the filters inline on wider screens and collapses them to a popover button on narrow ones.',
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
					className="jetpack-search-filters-popover__panel"
					role="region"
					aria-label={ __( 'Search filters', 'jetpack-search-pkg' ) }
				>
					<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
				</div>
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
