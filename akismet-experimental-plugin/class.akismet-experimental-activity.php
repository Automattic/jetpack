<?php
/**
 * Activity-log union-query for the experimental Akismet UI.
 *
 * Returns a list of `ActivityRow` items from heterogeneous sources:
 *   - Real spam comments via `WP_Comment_Query`, enriched with the
 *     `_akismet_score` + `akismet_history` meta keys directly (no
 *     dependency on the legacy Akismet class, which isn't loaded in
 *     the standalone plugin).
 *   - Real WC fraud orders when WooCommerce + WFP are detected;
 *     deterministic mock rows otherwise — the row's `preview` flag
 *     drives the UI badge.
 *   - Deterministic mock rows for forms / logins / bots / brute-force
 *     so the UI is testable end-to-end before upstream signal sources
 *     wire up.
 *
 * Filters (`outcome`, `source`, `search`) are applied across the unioned
 * list; pagination is in PHP because the upstream queries can't share
 * an offset across sources.
 *
 * @package Akismet_Experimental
 */

defined( 'ABSPATH' ) || exit;

/**
 * Union-queries the Activity log used by the experimental UI's tab 3.
 */
class Akismet_Experimental_Activity {

	const CATEGORIES = array( 'comments', 'forms', 'logins', 'checkouts', 'bots', 'brute-force' );
	const OUTCOMES   = array( 'block', 'challenge-passed', 'challenge-failed', 'allowed-but-flagged' );
	const SOURCES    = array(
		'akismet-content',
		'blackbox-behavioral',
		'blackbox-fingerprint',
		'blackbox-edge',
		'woocommerce-fraud',
		'akismet-rules',
	);

	/**
	 * Build the unified activity list, applying filters.
	 *
	 * @param array $args category, outcome, source, search, from, to, page, per_page.
	 * @return array { items, total, page, per_page, total_pages }
	 */
	public static function query( array $args ) {
		$category = isset( $args['category'] ) ? (string) $args['category'] : 'all';
		$rows     = array();

		if ( in_array( $category, array( 'all', 'comments' ), true ) ) {
			$rows = array_merge( $rows, self::query_comments() );
		}
		if ( in_array( $category, array( 'all', 'checkouts' ), true ) ) {
			$rows = array_merge( $rows, self::query_checkouts() );
		}
		foreach ( array( 'forms', 'logins', 'bots', 'brute-force' ) as $mocked ) {
			if ( in_array( $category, array( 'all', $mocked ), true ) ) {
				$rows = array_merge( $rows, self::query_mocked( $mocked ) );
			}
		}

		// Secondary filters that span sources.
		$outcome = isset( $args['outcome'] ) ? (string) $args['outcome'] : 'all';
		if ( '' !== $outcome && 'all' !== $outcome ) {
			$rows = array_values(
				array_filter(
					$rows,
					static function ( $r ) use ( $outcome ) {
						return $r['outcome'] === $outcome;
					}
				)
			);
		}

		$source = isset( $args['source'] ) ? (string) $args['source'] : 'all';
		if ( '' !== $source && 'all' !== $source ) {
			$rows = array_values(
				array_filter(
					$rows,
					static function ( $r ) use ( $source ) {
						return $r['source'] === $source;
					}
				)
			);
		}

		$search = isset( $args['search'] ) ? (string) $args['search'] : '';
		if ( '' !== $search ) {
			$needle = strtolower( $search );
			$rows   = array_values(
				array_filter(
					$rows,
					static function ( $r ) use ( $needle ) {
						$hay = strtolower(
							(string) ( $r['subject']['label'] ?? '' ) . ' ' .
							(string) ( $r['subject']['secondary'] ?? '' )
						);
						return false !== strpos( $hay, $needle );
					}
				)
			);
		}

		// Sort newest first.
		usort(
			$rows,
			static function ( $a, $b ) {
				return strcmp( (string) $b['timestamp'], (string) $a['timestamp'] );
			}
		);

		$page     = max( 1, isset( $args['page'] ) ? (int) $args['page'] : 1 );
		$per_page = max( 1, min( 100, isset( $args['per_page'] ) ? (int) $args['per_page'] : 25 ) );
		$total    = count( $rows );
		$offset   = ( $page - 1 ) * $per_page;
		$items    = array_slice( $rows, $offset, $per_page );

		return array(
			'items'       => $items,
			'total'       => $total,
			'page'        => $page,
			'per_page'    => $per_page,
			'total_pages' => $total > 0 ? (int) ceil( $total / $per_page ) : 0,
		);
	}

	/**
	 * Real comments — query the spam queue + enrich from meta directly.
	 *
	 * @return array
	 */
	protected static function query_comments() {
		$q        = new WP_Comment_Query();
		$comments = $q->query(
			array(
				'status'  => 'spam',
				'number'  => 200, // cap; union pagination applies after.
				'orderby' => 'comment_date_gmt',
				'order'   => 'DESC',
			)
		);

		$rows = array();
		foreach ( $comments as $c ) {
			$score      = (float) get_comment_meta( $c->comment_ID, '_akismet_score', true );
			$history    = get_comment_meta( $c->comment_ID, 'akismet_history', true );
			$session_id = (string) get_comment_meta( $c->comment_ID, '_blackbox_session_id', true );
			$post       = $c->comment_post_ID ? get_post( (int) $c->comment_post_ID ) : null;

			$rows[] = array(
				'id'         => 'comment-' . (int) $c->comment_ID,
				'timestamp'  => mysql_to_rfc3339( (string) $c->comment_date_gmt ),
				'category'   => 'comments',
				'source'     => 'akismet-content',
				'outcome'    => 'block',
				'subject'    => array(
					'kind'      => 'comment',
					'label'     => (string) $c->comment_author,
					'secondary' => $post ? get_the_title( $post ) : '',
					'link'      => admin_url( 'comment.php?action=editcomment&c=' . (int) $c->comment_ID ),
				),
				'signals'    => array(
					array(
						'name'        => 'akismet_classification',
						'weight'      => $score,
						'description' => __( 'Akismet content rules.', 'akismet' ),
					),
				),
				'ip'         => (string) $c->comment_author_IP,
				'visitor_id' => '' !== $session_id ? $session_id : null,
				'context'    => array(
					'comment_id' => (int) $c->comment_ID,
					'history'    => is_array( $history ) ? array_slice( $history, 0, 5 ) : array(),
				),
				'preview'    => false,
			);
		}
		return $rows;
	}

	/**
	 * WooCommerce fraud orders — real query when WC + WFP detected, mock otherwise.
	 *
	 * @return array
	 */
	protected static function query_checkouts() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return array();
		}

		$wfp_active = class_exists( 'WC_Fraud_Protection' ) || defined( 'WC_FRAUD_PROTECTION_PLUGIN_VERSION' );
		if ( ! $wfp_active ) {
			return self::query_mocked( 'checkouts' );
		}

		// TODO: real query against wc_get_orders with meta_query on
		// `_woofraud_score`. Coordinate the meta key + threshold with
		// @luizfreis. Returning a mock for now so the UI is testable end
		// to end. Mark rows preview=true — WFP active alone isn't enough
		// without confirmed meta keys.
		return self::query_mocked( 'checkouts' );
	}

	/**
	 * Deterministic mock rows for one category, seeded so the same call
	 * returns the same shape (testable, no jitter between calls).
	 *
	 * @param string $category Category id.
	 * @return array
	 */
	protected static function query_mocked( $category ) {
		$counts = array(
			'forms'       => 18,
			'logins'      => 24,
			'bots'        => 31,
			'brute-force' => 12,
			'checkouts'   => 9,
		);
		$count  = isset( $counts[ $category ] ) ? $counts[ $category ] : 10;

		$sources_by_category = array(
			'forms'       => array( 'akismet-content', 'blackbox-behavioral' ),
			'logins'      => array( 'blackbox-behavioral', 'blackbox-fingerprint' ),
			'bots'        => array( 'blackbox-edge', 'blackbox-fingerprint' ),
			'brute-force' => array( 'blackbox-behavioral' ),
			'checkouts'   => array( 'woocommerce-fraud', 'blackbox-fingerprint' ),
		);
		$sources             = isset( $sources_by_category[ $category ] )
			? $sources_by_category[ $category ]
			: array( 'akismet-rules' );

		$seed = crc32( $category );

		$rows = array();
		for ( $i = 0; $i < $count; $i++ ) {
			$r       = abs( ( $seed + ( $i * 31 ) ) % 9999 );
			$outcome = self::OUTCOMES[ $r % count( self::OUTCOMES ) ];
			$source  = $sources[ $r % count( $sources ) ];
			$subject = self::mock_subject_for( $category, $i );

			$rows[] = array(
				'id'         => $category . '-mock-' . $i,
				'timestamp'  => gmdate( 'c', time() - ( $r * 60 ) ),
				'category'   => $category,
				'source'     => $source,
				'outcome'    => $outcome,
				'subject'    => $subject,
				'signals'    => array(
					array(
						'name'        => $category . '_' . str_replace( '-', '_', $source ) . '_rule',
						'weight'      => round( ( $r % 100 ) / 100, 2 ),
						'description' => sprintf(
							/* translators: %s: category id. */
							__( 'Preview signal for %s.', 'akismet' ),
							$category
						),
					),
				),
				'ip'         => sprintf(
					'%d.%d.%d.%d',
					( $r % 200 ) + 10,
					$r % 256,
					( $r * 7 ) % 256,
					( $r * 13 ) % 256
				),
				'visitor_id' => 'bbx_preview_' . substr( md5( $category . $i ), 0, 12 ),
				'context'    => array(),
				'preview'    => true,
			);
		}
		return $rows;
	}

	/**
	 * Per-category mock subject shapes.
	 *
	 * @param string $category Category id.
	 * @param int    $i        Row index.
	 * @return array
	 */
	protected static function mock_subject_for( $category, $i ) {
		switch ( $category ) {
			case 'forms':
				return array(
					'kind'      => 'form-submission',
					'label'     => sprintf(
						/* translators: %d: row index. */
						__( 'Form submission #%d', 'akismet' ),
						$i + 1
					),
					'secondary' => 'contact-form-7',
				);
			case 'logins':
				return array(
					'kind'      => 'login-attempt',
					'label'     => sprintf( 'admin (attempt #%d)', $i + 1 ),
					'secondary' => 'wp-login.php',
				);
			case 'bots':
				return array(
					'kind'      => 'visitor',
					'label'     => sprintf(
						/* translators: %d: row index. */
						__( 'Crawler %d', 'akismet' ),
						$i + 1
					),
					'secondary' => '/wp-json/wp/v2/posts',
				);
			case 'brute-force':
				return array(
					'kind'      => 'login-attempt',
					'label'     => sprintf( 'user-%d', $i + 1 ),
					'secondary' => __( '142 attempts in 60s', 'akismet' ),
				);
			case 'checkouts':
				return array(
					'kind'      => 'order',
					'label'     => sprintf(
						/* translators: %d: order number. */
						__( 'Order #%d', 'akismet' ),
						1000 + $i
					),
					'secondary' => sprintf( '$%d.00', 50 + ( $i * 11 ) ),
				);
			default:
				return array(
					'kind'  => 'visitor',
					'label' => 'unknown',
				);
		}
	}
}
