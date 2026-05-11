/**
 * Editor preview for jetpack-search/filters-popover.
 *
 * Renders the trigger + a closed panel in the editor so the full Search
 * pattern preview mirrors the front-end default state.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
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

/**
 * Edit component for the filters-popover block.
 *
 * @return {object} Rendered element.
 */
export default function FiltersPopoverEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-filters-popover' } );
	return (
		<div { ...blockProps }>
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
				<span className="screen-reader-text">{ __( 'Filter results', 'jetpack-search-pkg' ) }</span>
			</button>
			<div
				className="jetpack-search-filters-popover__panel jetpack-search-filters-popover__panel--editor"
				role="dialog"
				aria-label={ __( 'Filters', 'jetpack-search-pkg' ) }
				hidden
			>
				<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
			</div>
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
