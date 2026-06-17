<?php
/**
 * Leaderboard formatter for the `stats/*` area.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

use WP_REST_Request;

/**
 * Formats `stats/*` responses into the leaderboard contract. The per-resource
 * differences (which summary bucket holds the items, which fields map to
 * label/value/href/meta, and any upstream param defaults) live in a small
 * declarative spec keyed by resource — the segment after `stats/`. Adding a
 * flat-list leaderboard resource is one spec row, not a new class.
 *
 * Resources absent from the spec (e.g. `stats/visits`, a time-series) are
 * passed through unchanged.
 */
class Stats_Formatter extends Leaderboard_Formatter {

	/**
	 * Per-resource formatting spec, keyed by the segment after `stats/`.
	 *
	 * Each row declares:
	 * - `items`        Summary bucket key holding the list of items.
	 * - `label`        Item field used as the entry label.
	 * - `value`        Item field used as the (numeric) entry value.
	 * - `href`         Item field surfaced as `meta.href` (optional).
	 * - `meta`         Extra item fields copied verbatim into the entry `meta` bag.
	 * - `filter_field` Item field the `name` query param filters on (optional).
	 * - `params`       Upstream WPCOM query defaults for this resource.
	 *
	 * @var array<string, array>
	 */
	private const SPEC = array(
		'top-posts' => array(
			'items'        => 'postviews',
			'label'        => 'title',
			'value'        => 'views',
			'href'         => 'href',
			'meta'         => array( 'type' ),
			'filter_field' => 'type',
			'params'       => array( 'summarize' => true ),
		),
		// Future flat-list resources are one row each, e.g. search-terms (items
		// "search_terms", label "term", value "views") or video-plays (items
		// "plays", label "title", value "plays").
	);

	/**
	 * Upstream query defaults for the resolved resource (e.g. `summarize=true`).
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array<string, scalar>
	 */
	public function upstream_params( WP_REST_Request $request ): array {
		$spec = $this->spec( $request );
		if ( null === $spec || empty( $spec['params'] ) || ! is_array( $spec['params'] ) ) {
			return array();
		}

		return $spec['params'];
	}

	/**
	 * Read `summary[ items ]` and map each item to a flat leaderboard row. A
	 * response without that bucket (e.g. a `days`-shaped body) yields an empty
	 * leaderboard and a logged notice. Returns null for unconfigured resources.
	 *
	 * @param array           $raw     Decoded WPCOM response body.
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array<int, array>|null
	 */
	protected function extract_rows( array $raw, WP_REST_Request $request ): ?array {
		$spec = $this->spec( $request );
		if ( null === $spec ) {
			return null;
		}

		$items_key = $spec['items'];
		$summary   = isset( $raw['summary'] ) && is_array( $raw['summary'] ) ? $raw['summary'] : null;
		if ( null === $summary || ! isset( $summary[ $items_key ] ) || ! is_array( $summary[ $items_key ] ) ) {
			$this->log_missing_summary( $request );

			return array();
		}

		$rows = array();
		foreach ( $summary[ $items_key ] as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$row = array(
				'id'    => isset( $item['id'] ) ? (string) $item['id'] : '',
				'label' => isset( $item[ $spec['label'] ] ) ? (string) $item[ $spec['label'] ] : '',
				'value' => isset( $item[ $spec['value'] ] ) ? (int) $item[ $spec['value'] ] : 0,
			);

			if ( ! empty( $spec['href'] ) ) {
				$row['href'] = isset( $item[ $spec['href'] ] ) ? (string) $item[ $spec['href'] ] : '';
			}

			foreach ( (array) ( $spec['meta'] ?? array() ) as $meta_field ) {
				$row[ $meta_field ] = $item[ $meta_field ] ?? null;
			}

			$rows[] = $row;
		}

		return $rows;
	}

	/**
	 * The field the `name` param filters on for the resolved resource.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return string|null
	 */
	protected function filter_field( WP_REST_Request $request ): ?string {
		$spec = $this->spec( $request );

		return ( null !== $spec && ! empty( $spec['filter_field'] ) ) ? (string) $spec['filter_field'] : null;
	}

	/**
	 * Resolve the spec row for the request's resource, or null if unconfigured.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array|null
	 */
	private function spec( WP_REST_Request $request ): ?array {
		$resource = $this->resource( $request );

		return self::SPEC[ $resource ] ?? null;
	}

	/**
	 * The resource segment (the part after `stats/`) of the proxied endpoint.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return string
	 */
	private function resource( WP_REST_Request $request ): string {
		$segments = explode( '/', trim( (string) $request->get_param( 'endpoint' ), '/' ) );

		// segments[0] is the area ('stats'); the resource is the next segment.
		return $segments[1] ?? '';
	}

	/**
	 * Log that a configured resource returned no summary bucket (e.g. a `days`
	 * response), so the empty leaderboard is explained rather than silent.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return void
	 */
	private function log_missing_summary( WP_REST_Request $request ): void {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
					'Premium Analytics: no summary bucket for stats resource "%s"; returning an empty leaderboard.',
					$this->resource( $request )
				)
			);
		}
	}
}
