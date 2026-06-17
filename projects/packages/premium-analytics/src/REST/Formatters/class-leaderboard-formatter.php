<?php
/**
 * Shared leaderboard-shaping logic for proxy formatters.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

use WP_REST_Request;

/**
 * Abstract base that turns flat rows into the leaderboard contract: optional
 * filtering, ranking, share math computed over the filtered set, zeroed
 * comparison fields, and an enveloped `{ data, meta }` body. Subclasses only
 * supply the resource-specific row extraction (and, optionally, the field the
 * `name` param filters on).
 */
abstract class Leaderboard_Formatter implements Widget_Formatter {

	/**
	 * Extract flat rows from the raw body. Each row is
	 * `array{ id, label, value, ...extras }`, where the extras (e.g. `href`,
	 * `type`) become the per-entry `meta` bag. Return `null` to pass the raw
	 * body through unchanged.
	 *
	 * @param array           $raw     Decoded WPCOM response body.
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array<int, array>|null
	 */
	abstract protected function extract_rows( array $raw, WP_REST_Request $request ): ?array;

	/**
	 * Row field the `name` query param filters on, or null to ignore `name`.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return string|null
	 */
	protected function filter_field( WP_REST_Request $request ): ?string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Overridable hook; the default ignores the request.
		return null;
	}

	/**
	 * Format the body into the leaderboard contract, or pass it through.
	 *
	 * @param array           $raw     Decoded WPCOM response body.
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array
	 */
	public function format( array $raw, WP_REST_Request $request ): array {
		$rows = $this->extract_rows( $raw, $request );
		if ( null === $rows ) {
			return $raw;
		}

		$rows = $this->rank_rows( $this->filter_rows( $rows, $request ) );

		$max = 0;
		foreach ( $rows as $row ) {
			$max = max( $max, (int) $row['value'] );
		}

		$entries = array();
		$total   = 0;
		foreach ( $rows as $row ) {
			$value     = (int) $row['value'];
			$total    += $value;
			$entries[] = array(
				'id'             => (string) $row['id'],
				'label'          => (string) $row['label'],
				'value'          => $value,
				'previous_value' => 0,
				'current_share'  => $max > 0 ? (float) $value / $max * 100 : 0.0,
				'previous_share' => 0,
				'delta'          => 0,
				'meta'           => $this->entry_meta( $row ),
			);
		}

		return array(
			'data' => $entries,
			'meta' => array(
				'period' => (string) $request->get_param( 'period' ),
				'date'   => (string) $request->get_param( 'date' ),
				'total'  => $total,
				'count'  => count( $entries ),
			),
		);
	}

	/**
	 * Per-entry meta bag: every extracted field that is not a core column.
	 *
	 * @param array $row Extracted row.
	 *
	 * @return array
	 */
	protected function entry_meta( array $row ): array {
		unset( $row['id'], $row['label'], $row['value'] );

		return $row;
	}

	/**
	 * Keep only rows whose filter field matches the requested `name`(s). When the
	 * resource has no filter field or no `name` is requested, all rows are kept.
	 *
	 * @param array<int, array> $rows    Extracted rows.
	 * @param WP_REST_Request   $request Incoming proxy request.
	 *
	 * @return array<int, array>
	 */
	protected function filter_rows( array $rows, WP_REST_Request $request ): array {
		$field = $this->filter_field( $request );
		if ( null === $field ) {
			return $rows;
		}

		$names = $this->requested_names( $request );
		if ( null === $names ) {
			return $rows;
		}

		$filtered = array();
		foreach ( $rows as $row ) {
			if ( isset( $row[ $field ] ) && in_array( (string) $row[ $field ], $names, true ) ) {
				$filtered[] = $row;
			}
		}

		return $filtered;
	}

	/**
	 * Sort rows by value, descending, preserving input order on ties.
	 *
	 * @param array<int, array> $rows Filtered rows.
	 *
	 * @return array<int, array>
	 */
	protected function rank_rows( array $rows ): array {
		$indexed = array();
		foreach ( $rows as $i => $row ) {
			$indexed[] = array( $i, $row );
		}

		usort(
			$indexed,
			static function ( $a, $b ) {
				$av = (int) $a[1]['value'];
				$bv = (int) $b[1]['value'];

				return $av === $bv ? $a[0] <=> $b[0] : $bv <=> $av;
			}
		);

		return array_map(
			static function ( $pair ) {
				return $pair[1];
			},
			$indexed
		);
	}

	/**
	 * Normalize the `name` query param into a list of allowed values, or null
	 * when nothing usable was supplied. Accepts a comma-separated string or an
	 * array.
	 *
	 * @param WP_REST_Request $request Incoming proxy request.
	 *
	 * @return array<int, string>|null
	 */
	protected function requested_names( WP_REST_Request $request ): ?array {
		$name = $request->get_param( 'name' );
		if ( null === $name || '' === $name ) {
			return null;
		}

		$names = is_array( $name ) ? $name : explode( ',', (string) $name );
		$names = array_filter(
			array_map( 'trim', array_map( 'strval', $names ) ),
			static function ( $value ) {
				return '' !== $value;
			}
		);

		return empty( $names ) ? null : array_values( $names );
	}
}
