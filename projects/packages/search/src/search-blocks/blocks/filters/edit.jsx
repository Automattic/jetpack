/**
 * Editor preview for jetpack-search/filters.
 *
 * A stray click near the default appender can drop a new filter as a
 * sibling instead of a child, silently excluding it from the composition
 * (SEARCH-317). `ButtonBlockAppender` plus the outline+label below make the
 * container's boundary unambiguous — see AGENTS.md's "Editor preview
 * gotchas".
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'author' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'post_type' } ],
	[ 'jetpack-search/filter-date', { interval: 'year' } ],
];

const ALLOWED = [
	'jetpack-search/active-filters',
	'jetpack-search/clear-filters',
	'jetpack-search/filter-checkbox',
	'jetpack-search/filter-date',
];

/**
 * Edit component for the filters block.
 *
 * @return {object} Rendered element.
 */
export default function FiltersEdit() {
	const blockProps = useBlockProps( {
		className: 'jetpack-search-filters jetpack-search-filters__editor-canvas',
	} );
	return (
		<div { ...blockProps }>
			<span className="jetpack-search-filters__editor-label">
				{ __( 'Filters', 'jetpack-search-pkg' ) }
			</span>
			<InnerBlocks
				template={ TEMPLATE }
				allowedBlocks={ ALLOWED }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
