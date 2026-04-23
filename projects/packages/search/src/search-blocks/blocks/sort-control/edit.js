/**
 * Editor preview for jetpack/sort-control.
 *
 * Pairs the label and select via htmlFor/id so the preview has the same
 * a11y semantics as render.php.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// The editor only renders one instance of each block at a time, so a stable
// static id is enough to wire up the label/select pair.
const SORT_CONTROL_PREVIEW_ID = 'jetpack-search-sort-preview';

/**
 * Edit component for the sort-control block.
 *
 * @return {object} Rendered element.
 */
export default function SortControlEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h( 'label', { htmlFor: SORT_CONTROL_PREVIEW_ID }, __( 'Sort by', 'jetpack-search-pkg' ) ),
		h(
			'select',
			{ id: SORT_CONTROL_PREVIEW_ID, disabled: true, defaultValue: 'relevance' },
			h( 'option', { value: 'relevance' }, __( 'Relevance', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'newest' }, __( 'Newest', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'oldest' }, __( 'Oldest', 'jetpack-search-pkg' ) )
		)
	);
}
