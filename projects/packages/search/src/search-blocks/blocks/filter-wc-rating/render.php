<?php
/**
 * Filter by WC rating render.
 *
 * Emits a fixed five-row star list (5..1 stars) and registers the
 * filterConfig with the shared `jetpack-search` Interactivity store.
 * Counts come from the histogram aggregation registered in
 * `buildAggregations` for the `wc_rating` filterType — bucket keys land
 * on half-integer boundaries (0.5, 1.5, 2.5, 3.5, 4.5), each
 * corresponding to one star band per WC's `ROUND(avg_rating, 0)` rule.
 *
 * Always-show-all-options matches WC's UX: even rows whose count is 0
 * remain visible and clickable so the user has a stable list to scan.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Wc_Rating::build_config( (array) $attributes );

wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			Filter_Wc_Rating::FILTER_KEY => $config,
		),
	)
);

$view = Search_Blocks::pre_hydration_filter_view( Filter_Wc_Rating::FILTER_KEY );

$seeded_state    = wp_interactivity_state( 'jetpack-search' );
$seeded_aggs     = (array) ( $seeded_state['aggregations'] ?? array() );
$seeded_buckets  = (array) ( ( (array) ( $seeded_aggs[ Filter_Wc_Rating::FILTER_KEY ] ?? array() ) )['buckets'] ?? array() );
$seeded_active   = (array) ( $seeded_state['activeFilters'] ?? array() );
$seeded_selected = (array) ( $seeded_active[ Filter_Wc_Rating::FILTER_KEY ] ?? array() );

// Project histogram buckets keyed at .5 boundaries onto star values
// 1..5. Bucket key 4.5 → star 5, 3.5 → star 4, etc. Anything below 0.5
// (the "no rating" bucket the histogram emits at -0.5 thanks to
// min_doc_count: 0) is dropped since there's no UI option for it.
$counts_by_star = array();
foreach ( $seeded_buckets as $bucket ) {
	$key   = (float) ( $bucket['key'] ?? -1 );
	$count = (int) ( $bucket['doc_count'] ?? 0 );
	// Map .5-boundary key → star integer. Equivalent to (int) round( $key + 0.5 ).
	$star = (int) ( $key + 1.0 );
	if ( $star >= 1 && $star <= 5 ) {
		$counts_by_star[ (string) $star ] = $count;
	}
}

$label      = (string) $config['label'];
$show_count = (bool) $config['showCount'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-rating' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php Search_Blocks::emit_filter_wrapper_context( Filter_Wc_Rating::FILTER_KEY, $view['show_wrapper'] ); ?>
	data-wp-bind--hidden="context.wrapperHidden"
	data-wp-watch="callbacks.syncFilterWrapperVisibility"
	<?php echo $view['show_wrapper'] ? '' : 'hidden'; ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<?php
	if ( $view['is_initial_loading'] ) {
		require __DIR__ . '/../filter-skeleton-partial.php';
	}
	?>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( Filter_Wc_Rating::get_star_values() as $star ) : ?>
			<?php
			$value      = (string) $star;
			$is_checked = in_array( $value, $seeded_selected, true );
			$option_cnt = $counts_by_star[ $value ] ?? 0;
			/* translators: %d: number of stars (1-5). Used as the accessible name for the star-rating row. */
			$aria_label = sprintf( _n( '%d star', '%d stars', $star, 'jetpack-search-pkg' ), $star );
			?>
			<li
				class="jetpack-search-filter__item"
				<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'starValue' => $value ) ) ); ?>
			>
				<label>
					<input
						type="checkbox"
						value="<?php echo esc_attr( $value ); ?>"
						<?php checked( $is_checked ); ?>
						data-wp-bind--checked="state.isRatingOptionSelected"
						data-wp-on--change="actions.onRatingFilterChange"
					/>
					<span class="jetpack-search-filter__label" aria-label="<?php echo esc_attr( $aria_label ); ?>">
						<?php
						// Render the star-row as filled vs. empty stars so the
						// row is recognizable without JS-side icon code; the
						// aria-label above carries the accessible text.
						for ( $i = 1; $i <= 5; $i++ ) :
							?>
							<span
								class="jetpack-search-filter-rating__star <?php echo $i <= $star ? 'is-filled' : 'is-empty'; ?>"
								aria-hidden="true"
							>★</span>
						<?php endfor; ?>
					</span>
					<?php if ( $show_count ) : ?>
						<span
							class="jetpack-search-filter__count"
							data-wp-text="state.ratingOptionCount"
						><?php echo esc_html( (string) $option_cnt ); ?></span>
					<?php endif; ?>
				</label>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
