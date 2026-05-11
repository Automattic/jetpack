/**
 * Single source of truth for Jetpack Search block icons.
 *
 * Each block uses a distinct glyph from `@wordpress/icons`. The Jetpack
 * brand mark lives on the inserter category header (see `setCategories`
 * in `register-blocks.js`) — it carries the family identity for the whole
 * Search group, so per-block icons can stay un-branded and the family
 * still reads as one set.
 *
 * Adding a new Search block: append one entry here, then reference
 * `BLOCK_ICONS[ name ]` from the editor's `registerBlockType()` call.
 *
 * `block.json` no longer carries an `icon` field for these blocks — the
 * JS-side override is the single source of truth, so the 19 sibling JSON
 * files can't drift from each other.
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

const BLOCK_ICONS = {
	'jetpack-search/search-input': search,
	'jetpack-search/search-results': listView,
	'jetpack-search/results-list': grid,
	'jetpack-search/results-count': info,
	'jetpack-search/results-sort': chevronUpDown,
	'jetpack-search/results-load-more': plus,
	'jetpack-search/filter-checkbox': formatListBullets,
	'jetpack-search/filter-date': calendar,
	'jetpack-search/filter-post-type': customPostType,
	'jetpack-search/filter-wc-attribute': tag,
	'jetpack-search/filter-wc-price': currencyDollar,
	'jetpack-search/filter-wc-rating': starFilled,
	'jetpack-search/filter-wc-stock-status': box,
	'jetpack-search/filters': filter,
	'jetpack-search/filters-popover': funnel,
	'jetpack-search/filters-product': archive,
	'jetpack-search/active-filters': pin,
	'jetpack-search/clear-filters': reset,
	'jetpack-search/powered-by': wordpress,
};

export default BLOCK_ICONS;
