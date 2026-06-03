<?php
/**
 * Skeleton list shared by the filter blocks' render.php, included inside the
 * wrapper element. The literal `hidden` keeps it out of the pre-hydration
 * paint unless the URL already carries a query/filter (`is_initial_loading()`);
 * afterwards `state.skeletonHidden` drives visibility reactively, so a
 * client-side search from a bare /search/ page re-shows it.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

defined( 'ABSPATH' ) || exit;

$rows               = 4;
$is_initial_loading = Search_Blocks::is_initial_loading();
?>
<ul
	class="jetpack-search-filter__list jetpack-search-filter__list--skeleton"
	data-wp-bind--hidden="state.skeletonHidden"
	aria-hidden="true"
	<?php echo $is_initial_loading ? '' : 'hidden'; ?>
>
	<?php for ( $i = 0; $i < $rows; $i++ ) : ?>
		<li class="jetpack-search-filter__item jetpack-search-filter__item--skeleton">
			<span class="jetpack-search-skeleton jetpack-search-skeleton--filter-row"></span>
		</li>
	<?php endfor; ?>
</ul>
