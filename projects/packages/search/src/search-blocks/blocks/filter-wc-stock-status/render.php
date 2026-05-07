<?php
/**
 * Search product filter — stock status render.
 *
 * Emits a fixed three-option list (in stock / out of stock / on backorder)
 * and registers the filterConfig with the shared `jetpack-search`
 * Interactivity store. Counts are looked up at render time from
 * URL-seeded `state.aggregations.filter_stock_status.buckets` so direct
 * URL hits show count badges before JS hydrates; bindings update them
 * once the first JS-driven fetch completes.
 *
 * Unlike the generic filter-checkbox block, the option list is fixed
 * (WC's `wc_get_product_stock_status_options()` keys) and renders even
 * when the aggregation has zero buckets — the e-commerce facet UX
 * convention is "always show every option, even at count 0," which
 * mirrors WC's own filter and matches what shoppers expect.
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

// Build a slug → count map from the aggregation buckets so the static
// option list can render count badges on first paint.
$counts = array();
foreach ( $seeded_buckets as $bucket ) {
	$key = (string) ( $bucket['key'] ?? '' );
	if ( '' === $key ) {
		continue;
	}
	$counts[ $key ] = (int) ( $bucket['doc_count'] ?? 0 );
}

$label      = (string) $config['label'];
$show_count = (bool) $config['showCount'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-stock-status' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => Search_Product_Filter_Status::FILTER_KEY ) ) ); ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
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
