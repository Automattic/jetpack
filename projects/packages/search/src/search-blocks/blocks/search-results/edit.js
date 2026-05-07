/**
 * Editor preview for jetpack-search/search-results.
 *
 * Renders an InnerBlocks region pre-populated with the result-display stack
 * (count + sort row, results list, load-more). The results-list block owns
 * its empty-state and error-state messages internally. Container owns no
 * behavior — render.php is a Group-like wrapper that emits `$content` and
 * lets each inner block contribute its own markup and Interactivity API
 * directives.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[
		'core/group',
		{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
		[ [ 'jetpack-search/results-count' ], [ 'jetpack-search/results-sort' ] ],
	],
	[ 'jetpack-search/results-list' ],
	[ 'jetpack-search/results-load-more' ],
	[ 'jetpack-search/powered-by' ],
];

const ALLOWED = [
	'core/group',
	'jetpack-search/results-count',
	'jetpack-search/results-sort',
	'jetpack-search/results-list',
	'jetpack-search/results-load-more',
	'jetpack-search/powered-by',
];

/**
 * Edit component for the search-results block.
 *
 * @return {object} Rendered element.
 */
export default function SearchResultsEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-search-results' } );
	return (
		<div { ...blockProps }>
			<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
