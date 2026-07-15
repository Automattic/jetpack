<?php
/**
 * Constrains the core REST posts query the episodes dashboard reads from, so
 * enclosure-less posts don't count against a page or its totals.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use WP_REST_Request;

/**
 * The episodes dashboard lists posts via the generic `wp/v2/posts` endpoint
 * filtered by the podcast category. Like the RSS feed, that endpoint applies
 * the enclosure test too late to matter — the SQL `LIMIT`/`OFFSET` (and the
 * `X-WP-Total*` headers) count posts that have no `enclosure` meta, so pages
 * come up short and the totals overstate the real episode count.
 *
 * This opt-in filter lets the dashboard request add an enclosure `EXISTS`
 * constraint at the SQL level. It is gated on an explicit request param rather
 * than the category alone, so other consumers of the same category (the block
 * editor, other plugins) are untouched.
 */
class Episodes_Query {

	/**
	 * REST collection param — and the WP_Query var it's bridged to — that opts a
	 * posts query into the enclosure `EXISTS` constraint.
	 *
	 * @var string
	 */
	const HAS_ENCLOSURE_PARAM = 'jetpack_podcast_has_enclosure';

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Register the REST param and the two query-time hooks. Idempotent.
	 */
	public static function init() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_filter( 'rest_post_collection_params', array( __CLASS__, 'register_rest_param' ) );
		add_filter( 'rest_post_query', array( __CLASS__, 'flag_query' ), 10, 2 );
		add_filter( 'posts_where', array( __CLASS__, 'constrain_query' ), 10, 2 );
	}

	/**
	 * Advertise the opt-in param on the `post` collection schema so REST
	 * validates it as a boolean.
	 *
	 * @param array $params Collection params keyed by name.
	 * @return array
	 */
	public static function register_rest_param( $params ) {
		$params[ self::HAS_ENCLOSURE_PARAM ] = array(
			'description' => __( 'Limit results to podcast episodes that have an audio enclosure.', 'jetpack-podcast' ),
			'type'        => 'boolean',
			'default'     => false,
		);
		return $params;
	}

	/**
	 * Bridge the REST param onto the WP_Query args so `constrain_query()` — which
	 * only sees the query, not the request — can pick it up. The core posts
	 * controller doesn't forward unregistered args into WP_Query, so this is
	 * where the opt-in crosses over.
	 *
	 * @param array           $args    WP_Query args assembled by the controller.
	 * @param WP_REST_Request $request The REST request.
	 * @return array
	 */
	public static function flag_query( $args, $request ) {
		if ( $request instanceof WP_REST_Request && rest_sanitize_boolean( $request->get_param( self::HAS_ENCLOSURE_PARAM ) ) ) {
			$args[ self::HAS_ENCLOSURE_PARAM ] = true;
		}
		return $args;
	}

	/**
	 * Append the enclosure `EXISTS` constraint to a query flagged by
	 * `flag_query()`. Self-gated on the query var, so it's a no-op for every
	 * other query on the site.
	 *
	 * @param string    $where The `WHERE` clause of the query.
	 * @param \WP_Query $query Query about to run.
	 * @return string
	 */
	public static function constrain_query( $where, $query ) {
		if ( empty( $query->get( self::HAS_ENCLOSURE_PARAM ) ) ) {
			return $where;
		}
		return Customize_Feed::append_enclosure_exists( $where );
	}
}
