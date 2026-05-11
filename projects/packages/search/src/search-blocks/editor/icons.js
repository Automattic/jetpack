/**
 * Single source of truth for Jetpack Search block icons.
 *
 * Each entry uses Gutenberg's documented `{ src, foreground, background }`
 * icon-object shape so the inserter, parent-block breadcrumb, and toolbar
 * render every Search block as a Jetpack-green pill. The shared tint is what
 * keeps the family visually distinct from Core / WooCommerce / other-plugin
 * blocks — distinct glyphs differentiate one Search block from another within
 * the family.
 *
 * Glyphs come from `@wordpress/icons` (the modern replacement for dashicon
 * strings; Core has fully migrated and 12.2.0 is already a direct dep of this
 * package). Adding a new Search block: append one entry here, then reference
 * `BLOCK_ICONS[ name ]` from the editor's `registerBlockType()` call.
 *
 * `block.json` no longer carries an `icon` field for these blocks — the JS
 * registration's `icon` overrides the server-side metadata, and centralizing
 * here avoids drift between 19 sibling JSON files.
 */
import {
	archive,
	box,
	calendar,
	chevronUpDown,
	currencyDollar,
	customPostType,
	filter,
	formatListBullets,
	funnel,
	grid,
	info,
	listView,
	pin,
	plus,
	reset,
	search,
	starFilled,
	tag,
	wordpress,
} from '@wordpress/icons';

/**
 * Jetpack brand green. Matches the default `logoColor` of `<JetpackLogo />`
 * (see `js-packages/components/components/jetpack-logo/index.tsx`) so the
 * inserter's "Search" category icon (rendered as the Jetpack logo) and each
 * block's per-icon pill share one brand swatch.
 */
const BRAND_BACKGROUND = '#069e08';
const BRAND_FOREGROUND = '#fff';

const tinted = src => ( {
	src,
	background: BRAND_BACKGROUND,
	foreground: BRAND_FOREGROUND,
} );

const BLOCK_ICONS = {
	'jetpack-search/search-input': tinted( search ),
	'jetpack-search/search-results': tinted( listView ),
	'jetpack-search/results-list': tinted( grid ),
	'jetpack-search/results-count': tinted( info ),
	'jetpack-search/results-sort': tinted( chevronUpDown ),
	'jetpack-search/results-load-more': tinted( plus ),
	'jetpack-search/filter-checkbox': tinted( formatListBullets ),
	'jetpack-search/filter-date': tinted( calendar ),
	'jetpack-search/filter-post-type': tinted( customPostType ),
	'jetpack-search/filter-wc-attribute': tinted( tag ),
	'jetpack-search/filter-wc-price': tinted( currencyDollar ),
	'jetpack-search/filter-wc-rating': tinted( starFilled ),
	'jetpack-search/filter-wc-stock-status': tinted( box ),
	'jetpack-search/filters': tinted( filter ),
	'jetpack-search/filters-popover': tinted( funnel ),
	'jetpack-search/filters-product': tinted( archive ),
	'jetpack-search/active-filters': tinted( pin ),
	'jetpack-search/clear-filters': tinted( reset ),
	'jetpack-search/powered-by': tinted( wordpress ),
};

export default BLOCK_ICONS;
export { BRAND_BACKGROUND, BRAND_FOREGROUND };
