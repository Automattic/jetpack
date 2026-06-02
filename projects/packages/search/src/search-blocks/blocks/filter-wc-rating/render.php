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

// Project histogram buckets onto cumulative "& up" counts: the count
// for star N is the sum of doc_counts across every bucket whose key
// is ≥ N - 0.5, i.e., every avg_rating that rounds to N or higher.
// Guarantees the displayed counts are monotone (count(3) ≥ count(4) ≥
// count(5)), matching shopper expectation for threshold rows.
$counts_by_star = array_fill_keys( array( '1', '2', '3', '4', '5' ), 0 );
foreach ( $seeded_buckets as $bucket ) {
	$key   = (float) ( $bucket['key'] ?? -1 );
	$count = (int) ( $bucket['doc_count'] ?? 0 );
	if ( $key < 0.5 ) {
		continue;
	}
	// `cap` is the highest star whose threshold this bucket clears.
	// Bucket keys land on .5 boundaries, so `key + 0.5` is an integer;
	// `(int) round(...)` shrugs off any FP slop without a config-time math lib.
	$cap = (int) round( $key + 0.5 );
	if ( $cap > 5 ) {
		$cap = 5;
	}
	for ( $star = 1; $star <= $cap; $star++ ) {
		$counts_by_star[ (string) $star ] += $count;
	}
}

$label      = (string) $config['label'];
$show_count = (bool) $config['showCount'];
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$enabled_stars = Filter_Wc_Rating::get_enabled_stars( (array) $attributes );
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
	<?php require __DIR__ . '/../filter-skeleton-partial.php'; ?>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( $enabled_stars as $star ) : ?>
			<?php
			$value      = (string) $star;
			$is_checked = in_array( $value, $seeded_selected, true );
			$option_cnt = $counts_by_star[ $value ] ?? 0;
			// The 5★ row matches `avg ≥ 4.5` — semantically "exactly
			// 5 stars" since there's no higher rating — so the "& up"
			// affordance is dropped on that row only.
			$is_top = ( 5 === $star );
			if ( $is_top ) {
				$aria_label = __( '5 stars', 'jetpack-search-pkg' );
			} else {
				$aria_label = sprintf(
					/* translators: %d is the rating threshold (1-4). The row applies a "rating ≥ N stars" filter. */
					_n( '%d star and up', '%d stars and up', $star, 'jetpack-search-pkg' ),
					$star
				);
			}
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
						<span class="jetpack-search-filter-rating__stars" aria-hidden="true">
							<?php
							// Render the star-row as filled vs. empty stars so the
							// row is recognizable without JS-side icon code; the
							// aria-label above carries the accessible text.
							for ( $i = 1; $i <= 5; $i++ ) :
								?>
								<span
									class="jetpack-search-filter-rating__star <?php echo $i <= $star ? 'is-filled' : 'is-empty'; ?>"
								>★</span>
							<?php endfor; ?>
						</span>
						<?php if ( ! $is_top ) : ?>
							<span class="jetpack-search-filter-rating__threshold-suffix" aria-hidden="true">
								<?php echo esc_html_x( '& up', 'rating filter row, e.g. "★★★★ & up"', 'jetpack-search-pkg' ); ?>
							</span>
						<?php endif; ?>
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
