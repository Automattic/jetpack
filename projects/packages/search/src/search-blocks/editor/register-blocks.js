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
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import ActiveFiltersEdit from '../blocks/active-filters/edit';
import ClearFiltersEdit from '../blocks/clear-filters/edit';
import FilterCheckboxEdit from '../blocks/filter-checkbox/edit';
import FilterDateEdit from '../blocks/filter-date/edit';
import FilterPostTypeEdit from '../blocks/filter-post-type/edit';
import FilterWcAttributeEdit from '../blocks/filter-wc-attribute/edit';
import FilterWcPriceEdit from '../blocks/filter-wc-price/edit';
import FilterWcRatingEdit from '../blocks/filter-wc-rating/edit';
import FilterWcStockStatusEdit from '../blocks/filter-wc-stock-status/edit';
import FiltersEdit, { save as filtersSave } from '../blocks/filters/edit';
import FiltersPopoverEdit, { save as filtersPopoverSave } from '../blocks/filters-popover/edit';
import FiltersProductEdit, { save as filtersProductSave } from '../blocks/filters-product/edit';
import PoweredByEdit from '../blocks/powered-by/edit';
import ResultsCountEdit from '../blocks/results-count/edit';
import ResultsListEdit from '../blocks/results-list/edit';
import ResultsLoadMoreEdit from '../blocks/results-load-more/edit';
import ResultsSortEdit from '../blocks/results-sort/edit';
import SearchInputEdit from '../blocks/search-input/edit';
import SearchResultsEdit, { save as searchResultsSave } from '../blocks/search-results/edit';
import BLOCK_ICONS, { FILTER_CHECKBOX_VARIATION_ICONS } from './icons';

// Default save for blocks that own no editor-side state — render.php is the
// source of truth on the front end, so save returns null. Container blocks
// that hold InnerBlocks pass their own `() => <InnerBlocks.Content />` save
// instead, since `save: null` would self-close their delimiter and drop the
// children on serialize.
const save = () => null;

const BLOCKS = [
	[ 'jetpack-search/search-input', SearchInputEdit ],
	[ 'jetpack-search/results-list', ResultsListEdit ],
	[ 'jetpack-search/filter-checkbox', FilterCheckboxEdit ],
	[ 'jetpack-search/filter-date', FilterDateEdit ],
	[ 'jetpack-search/active-filters', ActiveFiltersEdit ],
	[ 'jetpack-search/clear-filters', ClearFiltersEdit ],
	[ 'jetpack-search/filter-post-type', FilterPostTypeEdit ],
	[ 'jetpack-search/filter-wc-rating', FilterWcRatingEdit ],
	[ 'jetpack-search/filters', FiltersEdit, filtersSave ],
	[ 'jetpack-search/filters-popover', FiltersPopoverEdit, filtersPopoverSave ],
	[ 'jetpack-search/results-sort', ResultsSortEdit ],
	[ 'jetpack-search/results-count', ResultsCountEdit ],
	[ 'jetpack-search/results-load-more', ResultsLoadMoreEdit ],
	[ 'jetpack-search/search-results', SearchResultsEdit, searchResultsSave ],
	[ 'jetpack-search/powered-by', PoweredByEdit ],
	[ 'jetpack-search/filter-wc-attribute', FilterWcAttributeEdit ],
	[ 'jetpack-search/filter-wc-price', FilterWcPriceEdit ],
	[ 'jetpack-search/filter-wc-stock-status', FilterWcStockStatusEdit ],
	[ 'jetpack-search/filters-product', FiltersProductEdit, filtersProductSave ],
];

// Shape the "Jetpack Search" block category to match the Forms / Monetize /
// Grow headings in the inserter: the Jetpack logo next to a single-word
// label (the logo carries the branding for the whole family, so per-block
// icons can stay un-branded). The category itself is registered server-
// side via the `block_categories_all` filter (see
// Search_Blocks::register_block_category); core strips SVG `icon` values
// at that PHP boundary, so the icon has to be applied client-side via
// setCategories().
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

// On a non-Woo site PHP skips the server-side `register_block_type()`
// call for every WC-only block (see `Search_Blocks::register_blocks()`),
// so the editor must skip the matching client-side `registerBlockType()`
// too — registering without a server-side counterpart would produce a
// "Block JSON file not found" warning and a broken inserter card.
//
// The list of WC-only block names is localized from
// `Search_Blocks::woocommerce_only_block_names()` onto
// `window.JetpackSearchBlocksConfig.woocommerceOnlyBlocks` so PHP and JS
// stay in lockstep — adding a new WC-only block on the PHP side
// auto-applies here. Missing/malformed config defaults to "no blocks
// gated out" — defensive against the bundle being loaded outside its
// enqueue path (e.g. test harness), which can't happen in production.
const config = ( typeof window !== 'undefined' && window.JetpackSearchBlocksConfig ) || {};
const isWooCommerceActive = config.isWooCommerceActive === true;
const wcOnlyBlocks = new Set(
	Array.isArray( config.woocommerceOnlyBlocks ) ? config.woocommerceOnlyBlocks : []
);

// `filter-checkbox`'s variations are PHP-registered (see
// `Search_Blocks::inject_filter_checkbox_variations()`), so by the time
// `registerBlockType` runs client-side, the editor's preloaded metadata
// already carries them — but with no `icon` field. Hooking
// `blocks.registerBlockType` is the documented place to mutate block
// settings before they land in the registry; we walk the variations
// array and stamp the matching branded glyph from
// `FILTER_CHECKBOX_VARIATION_ICONS`. Variations without a mapped icon
// (e.g. a forward-compat one added later) fall through and inherit the
// parent block's `formatListBullets` glyph — the same fallback Gutenberg
// applies when no variation icon is provided.
addFilter(
	'blocks.registerBlockType',
	'jetpack-search/filter-checkbox-variation-icons',
	( settings, name ) => {
		if ( name !== 'jetpack-search/filter-checkbox' || ! Array.isArray( settings.variations ) ) {
			return settings;
		}
		return {
			...settings,
			variations: settings.variations.map( variation =>
				FILTER_CHECKBOX_VARIATION_ICONS[ variation.name ]
					? { ...variation, icon: FILTER_CHECKBOX_VARIATION_ICONS[ variation.name ] }
					: variation
			),
		};
	}
);

BLOCKS.forEach( ( [ name, edit, blockSave ] ) => {
	if ( ! isWooCommerceActive && wcOnlyBlocks.has( name ) ) {
		return;
	}
	// Dev-only safety net: since `block.json` no longer carries an `icon`
	// field, a future contributor who appends to `BLOCKS` but forgets to
	// add the matching entry in `editor/icons.js` would silently ship a
	// generic gray-grid placeholder. Warning at registration time turns
	// that into a noisy console message during local dev / CI builds; the
	// guard is stripped in production bundles where `NODE_ENV` is set.
	// eslint-disable-next-line no-undef -- webpack DefinePlugin substitutes process.env.NODE_ENV at build time.
	if ( process.env.NODE_ENV !== 'production' && ! BLOCK_ICONS[ name ] ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Jetpack Search: no icon registered for block "${ name }" — add an entry in editor/icons.js`
		);
	}
	// `icon` here overrides whatever server-side metadata block.json carries
	// — the centralized per-block glyph (`BLOCK_ICONS[ name ]`) renders in
	// the inserter, breadcrumb, and toolbar instead of the dashicon fallback.
	registerBlockType( name, { edit, save: blockSave ?? save, icon: BLOCK_ICONS[ name ] } );
} );
