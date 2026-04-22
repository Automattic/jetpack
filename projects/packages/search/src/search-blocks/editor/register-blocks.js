/**
 * Editor-side registration for Jetpack Search blocks.
 *
 * Each block registers a static preview Edit component that mirrors the DOM
 * shape its render.php produces on the front end after JS hydration. The
 * previews use simple mock data — sample result cards, sample filter
 * buckets, a sample pill — rather than piping render.php through
 * ServerSideRender. The live output leans on the Interactivity store
 * (`state.results`, `state.filterItems`, `state.resultsCountText`, …) which
 * doesn't hydrate in an editor context, so data-driven blocks otherwise
 * rendered as empty shells in the Site Editor.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_RESULTS = [
	{
		title: __( 'First sample result', 'jetpack-search-pkg' ),
		path: 'example.com/articles/first',
		date: __( 'Apr 1, 2026', 'jetpack-search-pkg' ),
	},
	{
		title: __( 'Another relevant post', 'jetpack-search-pkg' ),
		path: 'example.com/guides/another',
		date: __( 'Mar 22, 2026', 'jetpack-search-pkg' ),
	},
	{
		title: __( 'Older archived entry', 'jetpack-search-pkg' ),
		path: 'example.com/2025/older',
		date: __( 'Dec 18, 2025', 'jetpack-search-pkg' ),
	},
];

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

/**
 * Render the magnifying-glass glyph used by the search input, matching the
 * inline SVG emitted by render.php so the editor preview looks identical.
 *
 * @return {object} Rendered SVG element.
 */
function SearchGlyph() {
	return h(
		'svg',
		{
			className: 'jetpack-search-input__icon',
			'aria-hidden': 'true',
			focusable: 'false',
			xmlns: 'http://www.w3.org/2000/svg',
			width: 24,
			height: 24,
			viewBox: '0 0 24 24',
		},
		h( 'path', {
			d: 'M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z',
		} )
	);
}

/**
 * Editor preview for jetpack/search-input.
 *
 * @return {object} Rendered element.
 */
function SearchInputEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'div',
			{ className: 'jetpack-search-input__inside-wrapper' },
			h( SearchGlyph, null ),
			h( 'input', {
				type: 'search',
				className: 'jetpack-search-input__field',
				placeholder: __( 'Search…', 'jetpack-search-pkg' ),
				disabled: true,
				readOnly: true,
			} )
		)
	);
}

/**
 * Editor preview for jetpack/search-results. Renders sample rows so the
 * block surfaces in the canvas even though live results need the runtime.
 *
 * @return {object} Rendered element.
 */
function SearchResultsEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'ul',
			{ className: 'jetpack-search-results__list' },
			SAMPLE_RESULTS.map( result =>
				h(
					'li',
					{ key: result.path, className: 'jetpack-search-results__item' },
					h(
						'div',
						{ className: 'jetpack-search-results__copy' },
						h( 'h3', { className: 'jetpack-search-results__title' }, result.title ),
						h( 'div', { className: 'jetpack-search-results__path' }, result.path ),
						h( 'div', { className: 'jetpack-search-results__date' }, result.date )
					)
				)
			)
		)
	);
}

/**
 * Editor preview for jetpack/filter-checkbox. Shows a labeled list of sample
 * checkbox options mirroring the runtime DOM shape.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Saved block attributes.
 * @return {object} Rendered element.
 */
function FilterCheckboxEdit( { attributes } ) {
	const blockProps = useBlockProps();
	const label = attributes?.label || __( 'Filter', 'jetpack-search-pkg' );
	const showCount = attributes?.showCount !== false;
	return h(
		'div',
		blockProps,
		h( 'h3', { className: 'jetpack-search-filter__title' }, label ),
		h(
			'ul',
			{ className: 'jetpack-search-filter__list' },
			SAMPLE_FILTER_ITEMS.map( item =>
				h(
					'li',
					{ key: item.value, className: 'jetpack-search-filter__item' },
					h(
						'label',
						null,
						h( 'input', { type: 'checkbox', disabled: true } ),
						h( 'span', { className: 'jetpack-search-filter__label' }, item.label ),
						showCount
							? h( 'span', { className: 'jetpack-search-filter__count' }, item.count )
							: null
					)
				)
			)
		)
	);
}

/**
 * Editor preview for jetpack/active-filters. The live block is hidden until
 * the user selects at least one filter value; render a sample pill so
 * designers can style the block in place.
 *
 * @return {object} Rendered element.
 */
function ActiveFiltersEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'span',
			{ className: 'jetpack-search-active-filters__heading' },
			__( 'Active filters:', 'jetpack-search-pkg' )
		),
		h(
			'ul',
			{ className: 'jetpack-search-active-filters__pills' },
			h(
				'li',
				null,
				h(
					'button',
					{
						type: 'button',
						className: 'jetpack-search-active-filters__pill',
						disabled: true,
					},
					h(
						'span',
						{ className: 'jetpack-search-active-filters__pill-label' },
						__( 'Example filter', 'jetpack-search-pkg' )
					),
					h(
						'span',
						{ className: 'jetpack-search-active-filters__pill-remove', 'aria-hidden': 'true' },
						'×'
					)
				)
			)
		),
		h(
			'button',
			{
				type: 'button',
				className: 'jetpack-search-active-filters__clear-all',
				disabled: true,
			},
			__( 'Clear all', 'jetpack-search-pkg' )
		)
	);
}

/**
 * Editor preview for jetpack/sort-control.
 *
 * @return {object} Rendered element.
 */
function SortControlEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h( 'label', null, __( 'Sort by', 'jetpack-search-pkg' ) ),
		h(
			'select',
			{ disabled: true, defaultValue: 'relevance' },
			h( 'option', { value: 'relevance' }, __( 'Relevance', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'newest' }, __( 'Newest', 'jetpack-search-pkg' ) ),
			h( 'option', { value: 'oldest' }, __( 'Oldest', 'jetpack-search-pkg' ) )
		)
	);
}

/**
 * Editor preview for jetpack/results-count.
 *
 * @return {object} Rendered element.
 */
function ResultsCountEdit() {
	const blockProps = useBlockProps();
	return h( 'p', blockProps, __( 'Showing 1–10 of 42 results', 'jetpack-search-pkg' ) );
}

/**
 * Editor preview for jetpack/no-results. The front end hides this block when
 * results are present; the editor always shows it so designers can style it.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Saved block attributes.
 * @return {object} Rendered element.
 */
function NoResultsEdit( { attributes } ) {
	const blockProps = useBlockProps();
	const message =
		attributes?.message || __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
	return h( 'div', blockProps, h( 'p', null, message ) );
}

/**
 * Editor preview for jetpack/load-more.
 *
 * @return {object} Rendered element.
 */
function LoadMoreEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'button',
			{
				type: 'button',
				className: 'jetpack-search-load-more__button',
				disabled: true,
			},
			__( 'Load more results', 'jetpack-search-pkg' )
		)
	);
}

/**
 * Dynamic block save — render.php produces all front-end markup.
 *
 * @return {null} No save output.
 */
function save() {
	return null;
}

const BLOCKS = [
	[ 'jetpack/search-input', SearchInputEdit ],
	[ 'jetpack/search-results', SearchResultsEdit ],
	[ 'jetpack/filter-checkbox', FilterCheckboxEdit ],
	[ 'jetpack/active-filters', ActiveFiltersEdit ],
	[ 'jetpack/sort-control', SortControlEdit ],
	[ 'jetpack/results-count', ResultsCountEdit ],
	[ 'jetpack/no-results', NoResultsEdit ],
	[ 'jetpack/load-more', LoadMoreEdit ],
];

BLOCKS.forEach( ( [ name, edit ] ) => {
	registerBlockType( name, { edit, save } );
} );
