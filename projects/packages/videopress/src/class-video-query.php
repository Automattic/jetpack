<?php
/**
 * VideoPress video query: one search, filter, sort and page contract for the dashboard and channel.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Serves `GET /videos` from Channel_Data::browse(), so the dashboard's pickers see the
 * same matches, totals and order as the channel's Videos page.
 */
class Video_Query {

	const MAX_PER_PAGE  = 100;
	const MAX_SNAPSHOT  = 200;
	const DEFAULT_LIMIT = 50;

	/**
	 * Query arguments shared by `GET /videos` and the playlist add-matching route.
	 *
	 * @return array
	 */
	public static function args() {
		$args = array(
			'search' => array(
				'type'              => 'string',
				'default'           => '',
				'maxLength'         => Channel_Data::SEARCH_MAX_LENGTH,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'sort'   => array(
				'type'    => 'string',
				'enum'    => Channel_Data::BROWSE_SORTS,
				'default' => 'newest',
			),
			'length' => array(
				'type'    => 'string',
				'enum'    => Channel_Data::BROWSE_LENGTHS,
				'default' => 'any',
			),
		);
		foreach ( array_keys( Classification::taxonomies() ) as $taxonomy ) {
			$args[ $taxonomy ] = array(
				'type'    => 'array',
				'items'   => array( 'type' => 'string' ),
				'default' => array(),
			);
		}
		return $args;
	}

	/**
	 * A browse state from request parameters.
	 *
	 * @param WP_REST_Request $request Request.
	 * @param int             $page    1-based page.
	 * @return array Same shape as Channel_Data::browse_request().
	 */
	public static function state( WP_REST_Request $request, $page = 1 ) {
		$terms = array();
		foreach ( array_keys( Classification::taxonomies() ) as $taxonomy ) {
			$terms[ $taxonomy ] = (array) $request->get_param( $taxonomy );
		}
		return array(
			'search' => trim( (string) $request->get_param( 'search' ) ),
			'sort'   => in_array( $request->get_param( 'sort' ), Channel_Data::BROWSE_SORTS, true ) ? $request->get_param( 'sort' ) : 'newest',
			'length' => in_array( $request->get_param( 'length' ), Channel_Data::BROWSE_LENGTHS, true ) ? $request->get_param( 'length' ) : 'any',
			'page'   => max( 1, (int) $page ),
			'terms'  => Classification::normalize_selection( $terms ),
		);
	}

	/**
	 * Register `GET /videos` under Rest_Controller::REST_NAMESPACE.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/videos',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'rest_list_videos' ),
				'permission_callback' => array( __CLASS__, 'rest_can_list' ),
				'args'                => array_merge(
					self::args(),
					array(
						'page'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::MAX_PER_PAGE,
							'default' => 20,
						),
					)
				),
			)
		);
	}

	/**
	 * Listing every video, including private ones, is for people who manage the library.
	 *
	 * @return bool
	 */
	public static function rest_can_list() {
		return current_user_can( 'upload_files' );
	}

	/**
	 * GET /videos.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function rest_list_videos( WP_REST_Request $request ) {
		$result = Channel_Data::browse( self::state( $request, (int) $request['page'] ), (int) $request['per_page'] );
		$videos = array();
		foreach ( $result['entries'] as $entry ) {
			$video = array(
				'id'          => (int) $entry['id'],
				'guid'        => $entry['guid'],
				'title'       => html_entity_decode( get_the_title( (int) $entry['id'] ), ENT_QUOTES, 'UTF-8' ),
				'durationMs'  => (int) $entry['durationMs'],
				'height'      => (int) $entry['height'],
				'publishedAt' => (int) $entry['publishedAt'],
			);
			if ( isset( $entry['snippet'] ) ) {
				$video['snippet'] = $entry['snippet'];
				$video['startMs'] = (int) $entry['startMs'];
			}
			$videos[] = $video;
		}
		$response = rest_ensure_response(
			array(
				'videos' => $videos,
				'total'  => $result['total'],
				'page'   => $result['page'],
				'pages'  => $result['pages'],
			)
		);
		$response->header( 'X-WP-Total', (string) $result['total'] );
		$response->header( 'X-WP-TotalPages', (string) $result['pages'] );
		return $response;
	}

	/**
	 * The first matches of a state that are not already in a list, in the state's order.
	 *
	 * @param array    $state   Browse state.
	 * @param string[] $exclude GUIDs to skip.
	 * @param int      $limit   Most matches to return.
	 * @return array{entries: array[], total: int} Entries with guid, durationMs and height; total of new matches.
	 */
	public static function matches( array $state, array $exclude, $limit ) {
		$limit         = max( 1, min( self::MAX_SNAPSHOT, (int) $limit ) );
		$state['page'] = 1;
		$result        = Channel_Data::browse( $state, $limit, array_values( array_unique( $exclude ) ) );
		$entries       = array();
		foreach ( $result['entries'] as $entry ) {
			$entries[] = array(
				'guid'       => $entry['guid'],
				'durationMs' => (int) $entry['durationMs'],
				'height'     => (int) $entry['height'],
			);
		}
		return array(
			'entries' => $entries,
			'total'   => $result['total'],
		);
	}

	/**
	 * An error for a snapshot that matched nothing new.
	 *
	 * @return WP_Error
	 */
	public static function nothing_to_add() {
		return new WP_Error( 'videopress_playlist_no_matches', __( 'No other videos match these filters.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
	}
}
