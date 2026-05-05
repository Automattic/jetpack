/**
 * Editor preview for jetpack/results-panel.
 *
 * Renders an InnerBlocks region pre-populated with the result-display stack
 * (count + sort row, results list, error, empty state, load-more). Container
 * owns no behavior — render.php is a Group-like wrapper that emits `$content`
 * and lets each inner block contribute its own markup and Interactivity API
 * directives.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[
		'core/group',
		{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
		[ [ 'jetpack/results-count' ], [ 'jetpack/sort-control' ] ],
	],
	[ 'jetpack/search-results' ],
	[ 'jetpack/search-error' ],
	[ 'jetpack/no-results' ],
	[ 'jetpack/load-more' ],
];

const ALLOWED = [
	'core/group',
	'jetpack/results-count',
	'jetpack/sort-control',
	'jetpack/search-results',
	'jetpack/search-error',
	'jetpack/no-results',
	'jetpack/load-more',
];

/**
 * Edit component for the results-panel block.
 *
 * @return {object} Rendered element.
 */
export default function ResultsPanelEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-results-panel' } );
	return (
		<div { ...blockProps }>
			<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
		</div>
	);
}

/**
 * Save component — only renders InnerBlocks.Content.
 *
 * @return {object} Rendered element.
 */
export const save = () => <InnerBlocks.Content />;
