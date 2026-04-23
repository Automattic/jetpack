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
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Mock result data. Dates are intentionally not wrapped in __() because
// they are fixed display strings, not translatable content — localized
// dates come from `formatDate()` on the live front end.
const SAMPLE_RESULTS = [
	{
		title: __( 'First sample result', 'jetpack-search-pkg' ),
		path: 'example.com/articles/first',
		date: 'Apr 1, 2026',
	},
	{
		title: __( 'Another relevant post', 'jetpack-search-pkg' ),
		path: 'example.com/guides/another',
		date: 'Mar 22, 2026',
	},
	{
		title: __( 'Older archived entry', 'jetpack-search-pkg' ),
		path: 'example.com/2025/older',
		date: 'Dec 18, 2025',
	},
];

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

// The editor only renders one instance of each block at a time, so a stable
// static id is enough to wire up label/input and label/select pairs.
const SEARCH_INPUT_PREVIEW_ID = 'jetpack-search-input-preview';
const SORT_CONTROL_PREVIEW_ID = 'jetpack-search-sort-preview';

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
 * Editor preview for jetpack/search-input. Mirrors render.php's full
 * structure — screen-reader label, icon, input, and the (initially hidden)
 * clear button — so designers can target every CSS hook.
 *
 * @return {object} Rendered element.
 */
function SearchInputEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'label',
			{
				className: 'jetpack-search-input__label screen-reader-text',
				htmlFor: SEARCH_INPUT_PREVIEW_ID,
			},
			__( 'Search', 'jetpack-search-pkg' )
		),
		h(
			'div',
			{ className: 'jetpack-search-input__inside-wrapper' },
			h( SearchGlyph, null ),
			h( 'input', {
				id: SEARCH_INPUT_PREVIEW_ID,
				type: 'search',
				className: 'jetpack-search-input__field',
				placeholder: __( 'Search…', 'jetpack-search-pkg' ),
				disabled: true,
				readOnly: true,
			} ),
			h(
				'button',
				{
					type: 'button',
					className: 'jetpack-search-input__clear',
					hidden: true,
					disabled: true,
					'aria-label': __( 'Clear search', 'jetpack-search-pkg' ),
				},
				'×'
			)
		)
	);
}

/**
 * Editor preview for jetpack/search-results. Renders sample rows, including
 * the (hidden) image-link wrapper render.php emits so designers can style
 * the `.jetpack-search-results__image-link` / `__image` CSS hooks.
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
					),
					h(
						'a',
						{
							className: 'jetpack-search-results__image-link',
							hidden: true,
							tabIndex: -1,
							'aria-hidden': 'true',
						},
						h( 'img', { className: 'jetpack-search-results__image', alt: '' } )
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
							? h( 'span', { className: 'jetpack-search-filter__count' }, String( item.count ) )
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
 * Editor preview for jetpack/sort-control. Pairs the label and select via
 * htmlFor/id so the preview has the same a11y semantics as render.php.
 *
 * @return {object} Rendered element.
 */
function SortControlEdit() {
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

/**
 * Editor preview for jetpack/results-count. Matches the copy the live store
 * emits via `state.resultsCountText` (see store/index.js) so the preview
 * reflects the same string designers style on the front end.
 *
 * @return {object} Rendered element.
 */
function ResultsCountEdit() {
	const blockProps = useBlockProps();
	return h( 'p', blockProps, __( '42 results', 'jetpack-search-pkg' ) );
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
 * Editor preview for jetpack/load-more. Includes the (hidden) loading-
 * spinner span render.php emits so the `.jetpack-search-load-more__spinner`
 * CSS hook is available to style. The Inspector exposes a text input for the
 * `buttonLabel` attribute; the saved value (or the translated default) is
 * what render.php prints on the front end.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
function LoadMoreEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const defaultLabel = __( 'Load more results', 'jetpack-search-pkg' );
	// Match render.php: a whitespace-only label falls back to the default
	// in the preview so the editor mirrors the front-end behaviour the
	// "Leave empty…" help text describes. The raw input is still stored.
	const buttonLabel = ( attributes?.buttonLabel || '' ).trim() || defaultLabel;
	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Button label', 'jetpack-search-pkg' ),
					value: attributes?.buttonLabel || '',
					placeholder: defaultLabel,
					onChange: value => setAttributes( { buttonLabel: value } ),
					help: __( 'Leave empty to use the default translated label.', 'jetpack-search-pkg' ),
				} )
			)
		),
		h(
			'div',
			blockProps,
			h(
				'button',
				{
					type: 'button',
					className: 'wp-element-button jetpack-search-load-more__button',
					disabled: true,
				},
				buttonLabel
			),
			h(
				'span',
				{ className: 'jetpack-search-load-more__spinner', hidden: true },
				__( 'Loading…', 'jetpack-search-pkg' )
			)
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
