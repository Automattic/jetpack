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
 * render as empty shells in the Site Editor.
 *
 * Each block owns its Edit component + mock data in its own folder under
 * `../blocks/<slug>/edit.js`. This file is the thin orchestrator that wires
 * those components up to WordPress — touching one block's preview should
 * only require edits inside that block's folder.
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { getCategories, registerBlockType, setCategories } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import ActiveFiltersEdit from '../blocks/active-filters/edit';
import CommonFiltersEdit, { save as commonFiltersSave } from '../blocks/common-filters/edit';
import FilterCheckboxEdit from '../blocks/filter-checkbox/edit';
import FilterDateEdit from '../blocks/filter-date/edit';
import FilterPopoverEdit, { save as filterPopoverSave } from '../blocks/filter-popover/edit';
import LoadMoreEdit from '../blocks/load-more/edit';
import PostTypeFilterEdit from '../blocks/post-type-filter/edit';
import PoweredByEdit from '../blocks/powered-by/edit';
import ResultsCountEdit from '../blocks/results-count/edit';
import ResultsPanelEdit, { save as resultsPanelSave } from '../blocks/results-panel/edit';
import SearchInputEdit from '../blocks/search-input/edit';
import SearchResultsEdit from '../blocks/search-results/edit';
import SortControlEdit from '../blocks/sort-control/edit';

// Default save for blocks that own no editor-side state — render.php is the
// source of truth on the front end, so save returns null. Container blocks
// that hold InnerBlocks pass their own `() => <InnerBlocks.Content />` save
// instead, since `save: null` would self-close their delimiter and drop the
// children on serialize.
const save = () => null;

const BLOCKS = [
	[ 'jetpack/search-input', SearchInputEdit ],
	[ 'jetpack/search-results', SearchResultsEdit ],
	[ 'jetpack/filter-checkbox', FilterCheckboxEdit ],
	[ 'jetpack/filter-date', FilterDateEdit ],
	[ 'jetpack/active-filters', ActiveFiltersEdit ],
	[ 'jetpack/post-type-filter', PostTypeFilterEdit ],
	[ 'jetpack/common-filters', CommonFiltersEdit, commonFiltersSave ],
	[ 'jetpack/filter-popover', FilterPopoverEdit, filterPopoverSave ],
	[ 'jetpack/sort-control', SortControlEdit ],
	[ 'jetpack/results-count', ResultsCountEdit ],
	[ 'jetpack/load-more', LoadMoreEdit ],
	[ 'jetpack/results-panel', ResultsPanelEdit, resultsPanelSave ],
	[ 'jetpack/powered-by', PoweredByEdit ],
];

// Shape the "Jetpack Search" block category to match the Forms / Monetize /
// Grow headings in the inserter: the Jetpack logo next to a single-word
// label (the logo carries the branding, so the label drops the "Jetpack"
// prefix). The category itself is registered server-side via the
// `block_categories_all` filter (see Search_Blocks::register_block_category);
// core strips SVG `icon` values at that PHP boundary, so the icon has to be
// applied client-side with setCategories().
setCategories(
	getCategories().map( category =>
		category.slug === 'jetpack-search'
			? {
					...category,
					title: __( 'Search', 'jetpack-search-pkg' ),
					icon: <JetpackLogo showText={ false } height={ 24 } width={ 24 } />,
			  }
			: category
	)
);

BLOCKS.forEach( ( [ name, edit, blockSave ] ) => {
	registerBlockType( name, { edit, save: blockSave ?? save } );
} );
