/**
 * Editor preview for jetpack-search/filters-popover.
 *
 * The trigger button renders as a non-interactive preview of the front-end control, and a
 * block-toolbar button toggles whether the panel is expanded in the canvas — so authors can
 * edit the panel contents when expanded or the surrounding template parts when collapsed. The
 * trigger itself stays inert because clicking it would select the block (and pop the settings
 * sidebar) without giving the author a way to collapse the panel afterwards.
 *
 * When a jetpack-search/filters(-product) block exists elsewhere in the document, this block's
 * own inner blocks are server-synced to mirror it (Search_Blocks::sync_filters_popover_content())
 * on every save/reload, so direct edits here would silently vanish — the panel locks its own
 * InnerBlocks read-only via Disabled in that case. See AGENTS.md's "Editor preview gotchas" for
 * why this doesn't render a live mirror instead. Standalone (no sidebar sibling), the panel is
 * fully editable as normal.
 */
import { BlockControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Disabled, Notice, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
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
];

const SOURCE_BLOCK_NAMES = [ 'jetpack-search/filters', 'jetpack-search/filters-product' ];

/**
 * Edit component for the filters-popover block.
 *
 * @return {object} Rendered element.
 */
export default function FiltersPopoverEdit() {
	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false );

	const hasSidebarFilters = useSelect( select => {
		const { getBlockName, getClientIdsWithDescendants } = select( 'core/block-editor' );
		return getClientIdsWithDescendants().some( clientId =>
			SOURCE_BLOCK_NAMES.includes( getBlockName( clientId ) )
		);
	}, [] );

	// Split into a top-level if/else so Terser doesn't collapse two __() calls
	// into `__( cond ? 'a' : 'b' )` — the post-build i18n validator requires a
	// string literal as the first argument.
	let togglePanelLabel = __( 'Show filter panel', 'jetpack-search-pkg' );
	if ( isPopoverOpen ) {
		togglePanelLabel = __( 'Hide filter panel', 'jetpack-search-pkg' );
	}
	let noticeText = __(
		'Configure the filters to show when this panel is collapsed to a button.',
		'jetpack-search-pkg'
	);
	if ( hasSidebarFilters ) {
		noticeText = __(
			'This panel mirrors the Filters block on wider screens — add, remove, or edit filters there and they will carry over here on the next save or reload.',
			'jetpack-search-pkg'
		);
	}
	const blockProps = useBlockProps( {
		className: [
			'jetpack-search-filters-popover',
			'is-editor-preview',
			isPopoverOpen && 'is-popover-open',
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	return (
		<>
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
			<div { ...blockProps }>
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
				<div
					className="jetpack-search-filters-popover__panel"
					role="region"
					aria-label={ __( 'Search filters', 'jetpack-search-pkg' ) }
				>
					<Notice status="info" isDismissible={ false }>
						{ noticeText }
					</Notice>
					{ hasSidebarFilters ? (
						<Disabled>
							<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
						</Disabled>
					) : (
						<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
					) }
				</div>
			</div>
		</>
	);
}

export const save = () => <InnerBlocks.Content />;
