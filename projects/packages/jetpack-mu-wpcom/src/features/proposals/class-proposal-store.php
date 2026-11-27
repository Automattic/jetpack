<?php
/**
 * Storage for proposals: the post type, statuses and payload.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use WP_Error;
use WP_Post;

/**
 * Reads and writes proposal posts, whose post_content holds a JSON payload of typed items.
 */
class Proposal_Store {

	const POST_TYPE = 'jetpack_proposal';

	const PAYLOAD_VERSION = 2;

	const MAX_ITEMS = 20;

	const MAX_PAYLOAD_BYTES = 1048576;

	const STATUSES = array(
		'pending'   => 'jpp-pending',
		'applied'   => 'jpp-applied',
		'rejected'  => 'jpp-rejected',
		'stale'     => 'jpp-stale',
		'discarded' => 'jpp-discarded',
	);

	/** Who applied or rejected the proposal, and the outcome. */
	const REVIEW_META = '_jetpack_proposal_review';

	/** Keys a stored item may have. */
	const ITEM_KEYS = array( 'id', 'type', 'target', 'base', 'change' );

	/**
	 * Register the post type and statuses, lazily, since WordPress.com calls this class after switch_to_blog().
	 *
	 * Its capabilities are granted to no role, so only this class can write a proposal.
	 */
	public static function register(): void {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

		register_post_type(
			self::POST_TYPE,
			array(
				'label'               => 'Proposals',
				'public'              => false,
				'show_ui'             => false,
				'show_in_rest'        => false,
				'show_in_nav_menus'   => false,
				'exclude_from_search' => true,
				'can_export'          => false,
				'rewrite'             => false,
				'query_var'           => false,
				'capability_type'     => array( 'jetpack_proposal', 'jetpack_proposals' ),
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'author' ),
			)
		);

		foreach ( self::STATUSES as $status ) {
			register_post_status(
				$status,
				array(
					'internal'            => true,
					'public'              => false,
					'exclude_from_search' => true,
				)
			);
		}
	}

	/**
	 * Get a proposal by ID.
	 *
	 * @param int $proposal_id Proposal post ID.
	 * @return array|null
	 */
	public static function get( int $proposal_id ): ?array {
		self::register();

		$post = $proposal_id > 0 ? get_post( $proposal_id ) : null;
		if ( ! $post || self::POST_TYPE !== $post->post_type ) {
			return null;
		}

		return self::from_post( $post );
	}

	/**
	 * Get a proposal by its preview token. Numeric IDs are never accepted.
	 *
	 * @param string $uuid A v4 UUID.
	 * @return array|null
	 */
	public static function get_by_uuid( string $uuid ): ?array {
		if ( ! wp_is_uuid( $uuid, 4 ) ) {
			return null;
		}

		self::register();

		$posts = get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => array_values( self::STATUSES ),
				'name'             => $uuid,
				'posts_per_page'   => 1,
				'no_found_rows'    => true,
				'suppress_filters' => true,
			)
		);

		return $posts ? self::from_post( $posts[0] ) : null;
	}

	/**
	 * Proposals with any of these statuses, newest first.
	 *
	 * @param string[] $statuses Keys of STATUSES.
	 * @param int      $limit    At most this many.
	 * @return WP_Post[]
	 */
	public static function posts_with_status( array $statuses, int $limit ): array {
		self::register();

		return get_posts(
			array(
				'post_type'        => self::POST_TYPE,
				'post_status'      => array_values( array_intersect_key( self::STATUSES, array_flip( $statuses ) ) ),
				'posts_per_page'   => $limit,
				'orderby'          => 'ID',
				'order'            => 'DESC',
				'no_found_rows'    => true,
				'suppress_filters' => true,
			)
		);
	}

	/**
	 * Build the proposal array from its post.
	 *
	 * @param WP_Post $post Proposal post.
	 * @return array{id: int, uuid: string, title: string, author: int, status: string, created_gmt: string, modified_gmt: string, hash: string, items: array<int, array>, review: array}
	 */
	public static function from_post( WP_Post $post ): array {
		$payload = json_decode( $post->post_content, true );
		$items   = is_array( $payload ) && self::PAYLOAD_VERSION === ( $payload['version'] ?? null ) && self::is_valid_payload( $payload['items'] ?? null ) ? $payload['items'] : array();
		$status  = array_search( $post->post_status, self::STATUSES, true );
		$review  = get_post_meta( $post->ID, self::REVIEW_META, true );

		return array(
			'id'           => (int) $post->ID,
			'uuid'         => $post->post_name,
			'title'        => $post->post_title,
			'author'       => (int) $post->post_author,
			// A status set outside this feature, such as trash, closes the proposal rather than reopening it.
			'status'       => false === $status ? 'discarded' : $status,
			'created_gmt'  => $post->post_date_gmt,
			'modified_gmt' => $post->post_modified_gmt,
			'hash'         => self::hash( $post->post_content ),
			'items'        => $items,
			'review'       => is_array( $review ) ? $review : array(),
		);
	}

	/**
	 * Whether stored items are a payload the engine could have produced. Anything else reads as empty.
	 *
	 * @param mixed $items Decoded payload items.
	 */
	public static function is_valid_payload( $items ): bool {
		if ( ! is_array( $items ) || ! $items || count( $items ) > self::MAX_ITEMS || ! array_is_list( $items ) ) {
			return false;
		}

		$handlers = Proposals::handlers();
		$ids      = array();
		$targets  = array();

		foreach ( $items as $item ) {
			if (
				! is_array( $item )
				|| array_diff( array_keys( $item ), self::ITEM_KEYS )
				|| ! is_string( $item['id'] ?? null ) || ! preg_match( '/^i[1-9][0-9]*$/D', $item['id'] ) || isset( $ids[ $item['id'] ] )
				|| ! is_string( $item['type'] ?? null ) || ! isset( $handlers[ $item['type'] ] )
				|| ! is_array( $item['target'] ?? null ) || ! is_array( $item['base'] ?? null ) || ! is_array( $item['change'] ?? null )
			) {
				return false;
			}
			$handler = $handlers[ $item['type'] ];
			if ( ! $handler->is_valid( $item ) ) {
				return false;
			}
			$ids[ $item['id'] ] = true;

			foreach ( $handler->targets( $item ) as $target ) {
				if ( ! is_string( $target ) || '' === $target || isset( $targets[ $target ] ) ) {
					return false;
				}
				$targets[ $target ] = true;
			}
		}

		return true;
	}

	/**
	 * The version identifier a person approves.
	 *
	 * @param string $content Stored payload.
	 */
	public static function hash( string $content ): string {
		return hash( 'sha256', $content );
	}

	/**
	 * Encode items as a payload.
	 *
	 * @param array $items Items.
	 */
	public static function encode( array $items ): string {
		return (string) wp_json_encode(
			array(
				'version' => self::PAYLOAD_VERSION,
				'items'   => $items,
			),
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		);
	}

	/**
	 * Insert or update a proposal post without content filters rewriting the JSON. The handlers sanitized its values.
	 *
	 * @param array $postarr Post data.
	 * @return int|WP_Error Proposal ID.
	 */
	public static function write( array $postarr ) {
		self::register();

		if ( isset( $postarr['post_content'] ) && strlen( $postarr['post_content'] ) > self::MAX_PAYLOAD_BYTES ) {
			return new WP_Error( 'proposal_too_large', 'Nothing was saved: the proposal would take more than 1 MB to store. Propose fewer posts at a time; a single post\'s content must stay well under 1 MB.' );
		}

		add_filter( 'wp_insert_post_data', array( __CLASS__, 'preserve_payload' ), 5, 3 );
		try {
			return isset( $postarr['ID'] )
				? wp_update_post( wp_slash( $postarr ), true )
				: wp_insert_post( wp_slash( $postarr ), true );
		} finally {
			remove_filter( 'wp_insert_post_data', array( __CLASS__, 'preserve_payload' ), 5 );
		}
	}

	/**
	 * Keep the payload exactly as encoded. Mirrors
	 * WP_Customize_Manager::preserve_insert_changeset_post_content().
	 *
	 * @param array $data                Sanitized post data.
	 * @param array $postarr             Post data.
	 * @param array $unsanitized_postarr Post data before sanitizing.
	 * @return array
	 */
	public static function preserve_payload( array $data, array $postarr, array $unsanitized_postarr ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature.
		if ( self::POST_TYPE === $data['post_type'] && isset( $unsanitized_postarr['post_content'] ) ) {
			$data['post_content'] = $unsanitized_postarr['post_content'];
		}
		return $data;
	}
}
