/**
 * Editor preview for jetpack/common-filters.
 *
 * Renders an InnerBlocks region pre-populated with the most common Jetpack
 * Search filters. The container itself owns no behavior — it's a Group-like
 * wrapper, so the front-end render.php just emits `$content` inside the
 * block-wrapper div and lets each inner filter contribute its own markup.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';

const TEMPLATE = [
	[ 'jetpack/active-filters' ],
	[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack/filter-checkbox', { filterType: 'author' } ],
	[ 'jetpack/filter-checkbox', { filterType: 'post_type' } ],
	[ 'jetpack/filter-date', { interval: 'year' } ],
];

const ALLOWED = [ 'jetpack/active-filters', 'jetpack/filter-checkbox', 'jetpack/filter-date' ];

/**
 * Edit component for the common-filters block.
 *
 * @return {object} Rendered element.
 */
export default function CommonFiltersEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-common-filters' } );
	return h( 'div', blockProps, h( InnerBlocks, { template: TEMPLATE, allowedBlocks: ALLOWED } ) );
}

/**
 * Save component — only renders InnerBlocks.Content.
 *
 * @return {object} Rendered element.
 */
export const save = () => h( InnerBlocks.Content, {} );
