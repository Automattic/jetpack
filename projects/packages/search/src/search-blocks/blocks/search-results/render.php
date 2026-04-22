<?php
/**
 * Search Results block render.
 *
 * WordPress passes $attributes, $content, $block at runtime; VariableAnalysis
 * can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

use Automattic\Jetpack\Status;

$search_query    = (string) get_search_query();
$is_private      = ( new Status() )->is_private_site();
$site_id         = Helper::get_wpcom_site_id();
$initial_results = array();
$initial_aggs    = (object) array();
$total           = 0;

// Read back the state that Search_Blocks::seed_interactivity_state() seeded
// plus whatever filter-checkbox render.php calls have merged so far. Calling
// wp_interactivity_state() with no state arg returns the current value.
// Filter-checkbox blocks placed earlier in the block tree contribute their
// filterConfigs before this block renders; blocks rendered after us don't
// appear here and will pick up aggregations client-side on hydration.
$seeded_state   = function_exists( 'wp_interactivity_state' )
	? wp_interactivity_state( 'jetpack-search' )
	: array();
$active_filters = $seeded_state['activeFilters'] ?? array();
$filter_configs = $seeded_state['filterConfigs'] ?? array();

// Pre-fetch results server-side so the page renders without a client round-trip.
// Private sites skip SSR because the public endpoint requires auth they don't have;
// those render a loading state and fetch client-side with a nonce header.
if ( $site_id && ! $is_private && ( '' !== $search_query || ! empty( $active_filters ) ) ) {
	$query_args = array(
		'query' => $search_query,
		'size'  => 10,
	);

	$aggregations_payload = Filter_Checkbox::build_aggregations( (array) $filter_configs );
	if ( $aggregations_payload ) {
		$query_args['aggregations'] = $aggregations_payload;
	}

	$filter_clause = Filter_Checkbox::build_filter_clause( (array) $active_filters, (array) $filter_configs );
	if ( $filter_clause ) {
		$query_args['filter'] = $filter_clause;
	}

	// http_build_query() flattens nested arrays to `filter[bool][must][0]...`
	// which matches the encoding qss + q-flat produce on the client, so the
	// SSR and hydrated API calls hit the same URL shape.
	$api_url = "https://public-api.wordpress.com/rest/v1.3/sites/{$site_id}/search?" . http_build_query( $query_args );
	/**
	 * Filter the SSR pre-fetch timeout (seconds).
	 *
	 * Kept short so a slow or unreachable public API can't block the entire
	 * page render. If the timeout fires, we silently skip SSR and the client
	 * re-fetches on hydration.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $timeout Default 3 seconds.
	 */
	$timeout  = (int) apply_filters( 'jetpack_search_ssr_timeout', 3 );
	$response = wp_remote_get(
		$api_url,
		array(
			'timeout' => $timeout,
			'headers' => array( 'Accept' => 'application/json' ),
		)
	);

	if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
		$body            = json_decode( wp_remote_retrieve_body( $response ), true );
		$initial_results = $body['results'] ?? array();
		$aggs            = $body['aggregations'] ?? array();
		// Keep empty aggs as a JS object, not an array, so state.aggregations
		// always has a predictable shape for view.js getters to read.
		$initial_aggs = empty( $aggs ) ? (object) array() : $aggs;
		$total        = $body['total'] ?? 0;
	}
}

if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state(
		'jetpack-search',
		array(
			'results'      => $initial_results,
			'aggregations' => $initial_aggs,
			'totalResults' => $total,
		)
	);
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-init="callbacks.initialize"
	data-wp-bind--aria-busy="state.isLoading"
>
	<div
		class="jetpack-search-results__loading"
		data-wp-bind--hidden="!state.isLoading"
	>
		<?php esc_html_e( 'Loading…', 'jetpack-search-pkg' ); ?>
	</div>

	<ul
		class="jetpack-search-results__list"
		data-wp-bind--hidden="state.isLoading"
		aria-live="polite"
	>
		<template
			data-wp-each--result="state.results"
			data-wp-key="context.result.id"
		>
			<li class="jetpack-search-results__item">
				<div class="jetpack-search-results__copy">
					<h3 class="jetpack-search-results__title">
						<a
							class="jetpack-search-results__title-link"
							data-wp-bind--href="context.result.permalink"
						>
							<span
								data-wp-bind--hidden="context.result.hasTitleHighlight"
								data-wp-text="context.result.title"
							></span>
							<template
								data-wp-each--piece="context.result.titlePieces"
								data-wp-key="context.piece.index"
							>
								<span
									data-wp-text="context.piece.text"
									data-wp-class--jetpack-search-results__highlight="context.piece.isHighlight"
								></span>
							</template>
						</a>
					</h3>
					<div
						class="jetpack-search-results__path"
						data-wp-bind--hidden="!context.result.path"
						data-wp-text="context.result.path"
					></div>
					<div
						class="jetpack-search-results__date"
						data-wp-bind--hidden="!context.result.dateLabel"
						data-wp-text="context.result.dateLabel"
					></div>
				</div>
				<a
					class="jetpack-search-results__image-link"
					data-wp-bind--href="context.result.permalink"
					data-wp-bind--hidden="!context.result.imageUrl"
					tabindex="-1"
					aria-hidden="true"
				>
					<img
						class="jetpack-search-results__image"
						data-wp-bind--src="context.result.imageUrl"
						alt=""
					/>
				</a>
			</li>
		</template>
	</ul>
</div>
