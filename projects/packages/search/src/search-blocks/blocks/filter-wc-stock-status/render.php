<?php
/**
 * Search product filter — stock status render.
 *
 * V1 surfaces a single "In stock" toggle and registers the filterConfig
 * with the shared `jetpack-search` Interactivity store. The data plane
 * routes through the WC `product_visibility` taxonomy (`outofstock`
 * term ⇒ out of stock; absence ⇒ in stock); see store/api.js for the
 * agg / clause shape and class-search-product-filter-status.php for why
 * the option list is shaped this way today.
 *
 * Counts on first paint come from URL-seeded
 * `state.aggregations.filter_stock_status.buckets` so direct URL hits
 * have a count badge before JS hydrates; bindings update once the first
 * JS-driven fetch completes. The in-stock count is derived as
 * `totalResults - outofstock_bucket` because the taxonomy has no
 * positive `instock` term.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Search_Product_Filter_Status::build_config( (array) $attributes );

// Register this filter's config into the shared store. JS reads the
// filterConfigs map to build aggregation requests and ES filter clauses.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			Search_Product_Filter_Status::FILTER_KEY => $config,
		),
	)
);

$seeded_state    = wp_interactivity_state( 'jetpack-search' );
$seeded_aggs     = (array) ( $seeded_state['aggregations'] ?? array() );
$seeded_buckets  = (array) ( ( (array) ( $seeded_aggs[ Search_Product_Filter_Status::FILTER_KEY ] ?? array() ) )['buckets'] ?? array() );
$seeded_active   = (array) ( $seeded_state['activeFilters'] ?? array() );
$seeded_selected = (array) ( $seeded_active[ Search_Product_Filter_Status::FILTER_KEY ] ?? array() );
$seeded_total    = (int) ( $seeded_state['totalResults'] ?? 0 );

// Pre-hydration count for the in-stock option. The aggregation only
// carries the `outofstock` bucket; the in-stock count is derived as
// `totalResults - outofstock` because the `product_visibility`
// taxonomy has no positive `instock` term. Falls back to 0 before any
// search has run so the badge always has something to render.
$out_of_stock = 0;
foreach ( $seeded_buckets as $bucket ) {
	if ( 'outofstock' === (string) ( $bucket['key'] ?? '' ) ) {
		$out_of_stock = (int) ( $bucket['doc_count'] ?? 0 );
		break;
	}
}
$counts = array(
	'instock' => max( 0, $seeded_total - $out_of_stock ),
);

$label      = (string) $config['label'];
$show_count = (bool) $config['showCount'];
?>
<?php
// Wrapper visibility note: filter-checkbox / filter-date hide their
// wrapper via `pre_hydration_filter_view` + `wrapperHidden` while
// aggregations are loading because their option list is bucket-driven.
// This block has a fixed option list, so there's nothing to wait for —
// the wrapper stays visible whenever the block is on the page. The
// data-plane caveat (out-of-stock count derived from `totalResults -
// outofstock`) is documented at the top of this file.
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-stock-status' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => Search_Product_Filter_Status::FILTER_KEY ) ) ); ?>
>
	<?php /* `build_config()` always falls back to default_label() so $label is non-empty. */ ?>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( Search_Product_Filter_Status::get_options() as $option ) : ?>
			<?php
			$value      = (string) $option['value'];
			$option_lbl = (string) $option['label'];
			$is_checked = in_array( $value, $seeded_selected, true );
			$option_cnt = $counts[ $value ] ?? 0;
			?>
			<li class="jetpack-search-filter__item">
				<label>
					<input
						type="checkbox"
						value="<?php echo esc_attr( $value ); ?>"
						<?php echo $is_checked ? 'checked' : ''; ?>
						data-wp-bind--checked="state.isStatusOptionSelected"
						data-wp-on--change="actions.onStatusFilterChange"
					/>
					<span class="jetpack-search-filter__label"><?php echo esc_html( $option_lbl ); ?></span>
					<?php if ( $show_count ) : ?>
						<span
							class="jetpack-search-filter__count"
							data-wp-text="state.statusOptionCount"
						><?php echo esc_html( (string) $option_cnt ); ?></span>
					<?php endif; ?>
				</label>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
