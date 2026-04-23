/**
 * Editor preview for jetpack/sort-control.
 *
 * Pairs the label and select via htmlFor/id so the preview has the same
 * a11y semantics as render.php.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the sort-control block.
 *
 * @return {object} Rendered element.
 */
export default function SortControlEdit() {
	const blockProps = useBlockProps();
	// Per-instance id keeps the label→select association valid when the editor
	// renders more than one Sort Control on the same canvas.
	const selectId = useId();
	return h(
		'div',
		blockProps,
		h( 'label', { htmlFor: selectId }, __( 'Sort by', 'jetpack-search-pkg' ) ),
		h(
			'select',
			{ id: selectId, disabled: true, defaultValue: 'relevance' },
			h( 'option', { value: 'relevance' }, __( 'Relevance', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'newest' }, __( 'Newest', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'oldest' }, __( 'Oldest', 'jetpack-search-pkg' ) )
		)
	);
}
