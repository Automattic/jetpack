/**
 * Single source of truth for Jetpack Search block icons.
 *
 * Each block uses a distinct glyph from `@wordpress/icons`, painted in the
 * Jetpack brand green via the `foreground` field of Gutenberg's documented
 * icon-object shape. The `background` field is intentionally omitted — the
 * inserter / breadcrumb / toolbar all render the icon container without a
 * filled pill, so the glyph reads as a coloured mark rather than a heavy
 * badge. The Jetpack-logo brand mark on the inserter's "Search" category
 * heading (see `setCategories` in `register-blocks.js`) carries the family
 * identity for the whole group.
 *
 * Glyphs come from `@wordpress/icons` (Core's modern icon library, already
 * a direct dep at 12.2.0). Adding a new Search block: append one entry
 * here, then reference `BLOCK_ICONS[ name ]` from the editor's
 * `registerBlockType()` call.
 *
 * `block.json` no longer carries an `icon` field for these blocks — the
 * JS-side override is the single source of truth, so the 19 sibling JSON
 * files can't drift from each other.
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import {
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
	store,
	tag,
} from '@wordpress/icons';

const BRAND_FOREGROUND = '#069e08';

const greened = src => ( { src, foreground: BRAND_FOREGROUND } );

const BLOCK_ICONS = {
	'jetpack-search/search-input': greened( search ),
	'jetpack-search/search-results': greened( listView ),
	'jetpack-search/results-list': greened( grid ),
	'jetpack-search/results-count': greened( info ),
	'jetpack-search/results-sort': greened( chevronUpDown ),
	'jetpack-search/results-load-more': greened( plus ),
	'jetpack-search/filter-checkbox': greened( formatListBullets ),
	'jetpack-search/filter-date': greened( calendar ),
	'jetpack-search/filter-post-type': greened( customPostType ),
	'jetpack-search/filter-wc-attribute': greened( tag ),
	'jetpack-search/filter-wc-price': greened( currencyDollar ),
	'jetpack-search/filter-wc-rating': greened( starFilled ),
	'jetpack-search/filter-wc-stock-status': greened( box ),
	'jetpack-search/filters': greened( filter ),
	'jetpack-search/filters-popover': greened( funnel ),
	'jetpack-search/filters-product': greened( store ),
	'jetpack-search/active-filters': greened( pin ),
	'jetpack-search/clear-filters': greened( reset ),
	// The "Powered by Jetpack Search" block advertises Jetpack ownership in
	// the post footer — the Jetpack logo is the right glyph here, even
	// though every other Search block uses a neutral @wordpress/icons glyph.
	// The logo SVG has hardcoded brand colours, so the `foreground` override
	// is a no-op (and intentionally omitted) — included verbatim so the
	// glyph keeps its native green / white treatment.
	'jetpack-search/powered-by': <JetpackLogo showText={ false } height={ 24 } width={ 24 } />,
};

export default BLOCK_ICONS;
export { BRAND_FOREGROUND };
