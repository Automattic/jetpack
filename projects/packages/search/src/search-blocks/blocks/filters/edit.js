/**
 * Editor preview for jetpack-search/filters.
 *
 * Renders an InnerBlocks region pre-populated with the most common Jetpack
 * Search filters. The container itself owns no behavior — it's a Group-like
 * wrapper, so the front-end render.php just emits `$content` inside the
 * block-wrapper div and lets each inner filter contribute its own markup.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
	[ 'jetpack-search/clear-filters' ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'author' } ],
	[ 'jetpack-search/filter-checkbox', { filterType: 'post_type' } ],
	[ 'jetpack-search/filter-date', { interval: 'year' } ],
	[ 'jetpack-search/filter-post-type' ],
];

const ALLOWED = [
	'jetpack-search/active-filters',
	'jetpack-search/clear-filters',
	'jetpack-search/filter-checkbox',
	'jetpack-search/filter-date',
	'jetpack-search/filter-post-type',
];

/**
 * Edit component for the filters block.
 *
 * @return {object} Rendered element.
 */
export default function FiltersEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-filters' } );
	return (
		<div { ...blockProps }>
			<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
