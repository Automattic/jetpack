<?php
/**
 * Search Results block render.
 *
 * WordPress passes $attributes, $content, $block at runtime; VariableAnalysis
 * can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

use Automattic\Jetpack\Search\Helper;
use Automattic\Jetpack\Search\Search_Blocks;
use Automattic\Jetpack\Status;

$search_query    = (string) get_search_query();
$is_private      = ( new Status() )->is_private_site();
$site_id         = Helper::get_wpcom_site_id();
$initial_results = array();
$total           = 0;

// Pre-fetch results server-side so the page renders without a client round-trip.
// Private sites skip SSR because the public endpoint requires auth they don't have;
// those render a loading state and fetch client-side with a nonce header.
if ( $site_id && ! $is_private && '' !== $search_query ) {
	$query_args = array(
		'query'            => $search_query,
		'size'             => 10,
		// Keep this in sync with SEARCH_FIELDS / HIGHLIGHT_FIELDS in store/api.js.
		// Without an explicit fields[] list the API only returns date/post_id.
		'fields'           => array(
			'date',
			'permalink.url.raw',
			'post_type',
			'title.default',
			'has.image',
			'image.url.raw',
			'image.alt_text',
		),
		'highlight_fields' => array( 'title', 'content' ),
	);
	$api_url    = "https://public-api.wordpress.com/rest/v1.3/sites/{$site_id}/search?" . http_build_query( $query_args );
	/**
	 * Filter the SSR pre-fetch timeout (seconds).
	 *
	 * This call is on the SSR critical path and blocks the response. WP's 5s
	 * default is a general-purpose "don't hang forever" ceiling tuned for
	 * contexts like cron jobs and update checks — not for synchronous page-
	 * render fetches, where a slow upstream pushes LCP past Google's 2.5s
	 * "good" threshold and piles up PHP-FPM workers under load. 3s leaves
	 * headroom for a legitimately slow-but-alive upstream (cold caches,
	 * distant regions) before falling back to the client-side fetch path.
	 * Hosts with their own telemetry can tune via this filter.
	 *
	 * @param int $timeout Timeout in seconds. Default 3.
	 */
	$timeout  = (int) apply_filters( 'jetpack_search_ssr_timeout', 3 );
	$response = wp_remote_get(
		esc_url_raw( $api_url ),
		array( 'timeout' => $timeout )
	);
	if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
		$body            = json_decode( wp_remote_retrieve_body( $response ), true );
		$raw_results     = $body['results'] ?? array();
		$initial_results = array_map(
			static fn( $r ) => Search_Blocks::normalize_result( (array) $r ),
			(array) $raw_results
		);
		$total           = $body['total'] ?? 0;
	}
}

// Merge pre-fetched, normalized results into the shared Interactivity API store.
wp_interactivity_state(
	'jetpack-search',
	array(
		'results'      => $initial_results,
		'totalResults' => $total,
	)
);
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
>
	<div
		class="jetpack-search-results__loading"
		data-wp-bind--hidden="!state.isLoading"
		aria-live="polite"
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
							data-wp-text="context.result.title"
						></a>
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
