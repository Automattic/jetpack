<?php
/**
 * Pre-hydration skeleton list used by filter-wc-attribute/render.php.
 * Included inside the wrapper element when `Search_Blocks::is_initial_loading()`
 * is true. WC attribute filters are the longest-loading filter region on a
 * product page (one aggregation per registered attribute taxonomy), which is
 * where the pre-hydration shimmer matters most; the other filter blocks just
 * default-hide their wrappers until buckets arrive.
 *
 * Visibility flips off via `state.skeletonHidden` once the first fetch
 * resolves on the client (see `actions.search()` in `store/index.js`).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

defined( 'ABSPATH' ) || exit;

$rows = 4;
?>
<ul
	class="jetpack-search-filter__list jetpack-search-filter__list--skeleton"
	data-wp-bind--hidden="state.skeletonHidden"
	aria-hidden="true"
>
	<?php for ( $i = 0; $i < $rows; $i++ ) : ?>
		<li class="jetpack-search-filter__item jetpack-search-filter__item--skeleton">
			<span class="jetpack-search-skeleton jetpack-search-skeleton--filter-row"></span>
		</li>
	<?php endfor; ?>
</ul>
