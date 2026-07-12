/**
 * Single source of truth for Jetpack Search block icons.
 *
 * Each block uses a distinct glyph from `@wordpress/icons` and lets the
 * editor paint it with the current icon color. The Jetpack-logo brand mark
 * on the inserter's "Search" category heading (see `setCategories` in
 * `register-blocks.js`) carries the family identity for the whole group.
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
	cart,
	category,
	chevronUpDown,
	commentContent,
	currencyDollar,
	filter,
	formatListBullets,
	funnel,
	grid,
	info,
	listView,
	pin,
	plus,
	postAuthor,
	postList,
	postTerms,
	published,
	reset,
	search,
	starFilled,
	store,
	swatch,
	tag,
	tool,
} from '@wordpress/icons';

const BLOCK_ICONS = {
	'jetpack-search/ai-answer': commentContent,
	'jetpack-search/search-input': search,
	'jetpack-search/search-results': listView,
	'jetpack-search/results-list': grid,
	'jetpack-search/results-count': info,
	'jetpack-search/results-sort': chevronUpDown,
	'jetpack-search/results-load-more': plus,
	'jetpack-search/filter-checkbox': formatListBullets,
	'jetpack-search/filter-date': calendar,
	'jetpack-search/filter-wc-attribute': tag,
	'jetpack-search/filter-wc-price': currencyDollar,
	'jetpack-search/filter-wc-rating': starFilled,
	'jetpack-search/filter-wc-stock-status': box,
	'jetpack-search/filters': filter,
	'jetpack-search/filters-popover': funnel,
	'jetpack-search/filters-product': store,
	'jetpack-search/active-filters': pin,
	'jetpack-search/clear-filters': reset,
	'jetpack-search/powered-by': (
		<JetpackLogo showText={ false } height={ 24 } width={ 24 } logoColor="currentColor" />
	),
};

/**
 * Per-variation icons for the `jetpack-search/filter-checkbox` block.
 *
 * The variations (Filter by Category / Tag / Post Type / Author / Product
 * Category / Product Tag / Product Brand / Custom Taxonomy) are registered
 * in PHP via `Search_Blocks::inject_filter_checkbox_variations()`, so they
 * arrive at the editor preloaded onto the block type's metadata. Each one
 * needs its own glyph in the inserter card — without it, every variation
 * would inherit the parent block's `formatListBullets` icon and the
 * resulting six-or-seven identical cards would all read the same to a
 * merchant scanning the inserter.
 *
 * Applied via a `blocks.registerBlockType` filter in `register-blocks.js`
 * (the only practical way to set variation icons when the variations
 * themselves are PHP-registered). Glyphs are picked from `@wordpress/icons`
 * and intentionally avoid every name already used in `BLOCK_ICONS` so the
 * full 19 + 8 set has no duplicates.
 */
const FILTER_CHECKBOX_VARIATION_ICONS = {
	category,
	post_tag: postTerms,
	post_type: postList,
	author: postAuthor,
	product_cat: cart,
	product_tag: published,
	product_brand: swatch,
	custom_taxonomy: tool,
};

export default BLOCK_ICONS;
export { FILTER_CHECKBOX_VARIATION_ICONS };
