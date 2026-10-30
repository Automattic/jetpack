<?php
/**
 * Narrows post queries to real podcast episodes.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast;

use WP_Query;
use WP_REST_Request;

/**
 * Exposes a `podcast_episodes` param on the posts REST collection that keeps
 * only posts carrying an `enclosure` meta row, the same rule the feed uses.
 */
class Episode_Query {

	const QUERY_VAR = 'podcast_episodes';

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Wire the REST param and the SQL constraint.
	 */
	public static function init() {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		add_filter( 'rest_post_collection_params', array( __CLASS__, 'register_collection_param' ) );
		add_filter( 'rest_post_query', array( __CLASS__, 'apply_rest_param' ), 10, 2 );
		add_filter( 'posts_where', array( __CLASS__, 'constrain_query' ), 10, 2 );
	}

	/**
	 * Add `podcast_episodes` to the posts collection schema.
	 *
	 * @param array $params Collection params.
	 * @return array
	 */
	public static function register_collection_param( $params ) {
		$params[ self::QUERY_VAR ] = array(
			'description' => __( 'Limit results to posts with an audio enclosure.', 'jetpack-podcast' ),
			'type'        => 'boolean',
			'default'     => false,
		);
		return $params;
	}

	/**
	 * Carry the REST param into the `WP_Query` args.
	 *
	 * @param array           $args    Query args.
	 * @param WP_REST_Request $request REST request.
	 * @return array
	 */
	public static function apply_rest_param( $args, $request ) {
		if ( $request->get_param( self::QUERY_VAR ) ) {
			$args[ self::QUERY_VAR ] = true;
		}
		return $args;
	}

	/**
	 * Append the enclosure constraint when the query asked for episodes.
	 *
	 * A correlated `EXISTS` rather than a `meta_query` join: episodes carry
	 * several `enclosure` rows, and a join would duplicate posts and break `LIMIT`.
	 *
	 * @param string   $where The `WHERE` clause of the query.
	 * @param WP_Query $query Query about to run.
	 * @return string
	 */
	public static function constrain_query( $where, $query ) {
		if ( ! $query->get( self::QUERY_VAR ) ) {
			return $where;
		}

		global $wpdb;

		return $where . $wpdb->prepare(
			" AND EXISTS ( SELECT 1 FROM {$wpdb->postmeta} WHERE {$wpdb->postmeta}.post_id = {$wpdb->posts}.ID AND {$wpdb->postmeta}.meta_key = %s )",
			'enclosure'
		);
	}
}
