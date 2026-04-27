/**
 * Editor preview for jetpack/results-count.
 *
 * Matches the copy the live store emits via `state.resultsCountText`
 * (see store/index.js) so the preview reflects the same string designers
 * style on the front end.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the results-count block.
 *
 * @return {object} Rendered element.
 */
export default function ResultsCountEdit() {
	const blockProps = useBlockProps();
	return h( 'p', blockProps, __( '42 results', 'jetpack-search-pkg' ) );
}
