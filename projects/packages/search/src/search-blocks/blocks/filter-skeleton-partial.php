<?php
/**
 * Pre-hydration skeleton list shared by filter-checkbox and filter-date
 * render.php. Included with `require __DIR__ . '/../filter-skeleton.partial.php';`
 * inside the wrapper element when `Search_Blocks::is_initial_loading()` is true.
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
