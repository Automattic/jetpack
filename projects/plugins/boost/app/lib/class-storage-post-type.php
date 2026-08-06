<?php
/**
 * Cache for Jetpack Boost that uses CPTs to store the data.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Storage_Post_type
 *
 * Internal to Boost. Stores arrays and scalars only, never objects.
 */
class Storage_Post_Type {

	/**
	 * Cache format version, part of the transient key.
	 *
	 * Keeps get() away from transients an earlier release wrote, which were cached
	 * without the object checks below.
	 *
	 * @since $$next-version$$
	 */
	const CACHE_VERSION = 'v2';

	/**
	 * Matches a serialized object (O:), custom-serialized class (C:) or enum case
	 * (E:) anywhere in a serialized string. Boost never stores objects, so a match
	 * means the row is not one Boost wrote.
	 *
	 * @since $$next-version$$
	 */
	const OBJECT_TOKEN_PATTERN = '/(^|[;{])[OCE]:\+?[0-9]+:/';

	/**
	 * The name.
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Slugs this class has registered on this request, keyed by slug.
	 *
	 * Tells "somebody else owns this slug" apart from "we already registered it".
	 *
	 * @since $$next-version$$
	 *
	 * @var array<string, bool>
	 */
	private static $registered = array();

	/**
	 * Storage_Post_type constructor.
	 *
	 * @param string $name The name.
	 */
	public function __construct( $name ) {
		$this->name = sanitize_title( $name );
		$this->init();
	}

	/**
	 * Get the post type slug.
	 */
	public function post_type_slug() {
		return 'jb_store_' . $this->name;
	}

	/**
	 * Get the transient key backing a cache entry.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $key Cache key name.
	 *
	 * @return string
	 */
	private function transient_key( $key ) {
		return $this->post_type_slug() . '_' . self::CACHE_VERSION . '_' . $key;
	}

	/**
	 * Static initialization.
	 */
	private function init() {
		// Check if post type already registered.
		if ( post_type_exists( $this->post_type_slug() ) ) {
			if ( ! isset( self::$registered[ $this->post_type_slug() ] ) ) {
				Debug::log( 'cache post type "' . $this->post_type_slug() . '" was already registered elsewhere; Boost\'s REST and capability restrictions are not in effect for it' );
			}

			return;
		}

		self::$registered[ $this->post_type_slug() ] = true;

		register_post_type(
			$this->post_type_slug(),
			array(
				'description'      => 'Cache entries for the Jetpack Boost plugin.',
				'public'           => false,
				'show_in_rest'     => false,
				'rewrite'          => false,
				'can_export'       => false,
				'delete_with_user' => false,
				// Boost writes through wp_insert_post and friends, which bypass capability
				// checks, so denying every generated capability closes the write vector into
				// get()'s unserialize sink (CWE-502).
				'map_meta_cap'     => true,
				'capabilities'     => array(
					'read'                   => 'do_not_allow',
					'create_posts'           => 'do_not_allow',
					'edit_posts'             => 'do_not_allow',
					'edit_others_posts'      => 'do_not_allow',
					'edit_published_posts'   => 'do_not_allow',
					'edit_private_posts'     => 'do_not_allow',
					'publish_posts'          => 'do_not_allow',
					'read_private_posts'     => 'do_not_allow',
					'delete_posts'           => 'do_not_allow',
					'delete_others_posts'    => 'do_not_allow',
					'delete_published_posts' => 'do_not_allow',
					'delete_private_posts'   => 'do_not_allow',
				),
			)
		);
	}

	/**
	 * Sets the cache entry using a CPT.
	 *
	 * @param string $key    Cache key name.
	 * @param mixed  $value  Cache value.
	 * @param int    $expiry Cache expiration in seconds.
	 *
	 * @return void
	 */
	public function set( $key, $value, $expiry = 0 ) {
		$data_post_data = array(
			'post_type'   => $this->post_type_slug(),
			'post_title'  => $key,
			'post_name'   => $key,
			'post_status' => 'publish',
		);

		$data_post        = $this->get_post_by_name( $key );
		$expiry_timestamp = 0;

		if ( $expiry ) {
			$expiry_timestamp = time() + $expiry;
		}

		$value                          = array(
			'data'   => $value,
			'expiry' => $expiry_timestamp,
		);
		$data_post_data['post_content'] = base64_encode( maybe_serialize( $value ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		// Update an existing data post if we have one or create a new one.
		if ( $data_post ) {
			$data_post_data['ID'] = $data_post->ID;
			wp_update_post( $data_post_data );
		} else {
			wp_insert_post( $data_post_data );
		}

		delete_transient( $this->transient_key( $key ) );
	}

	/**
	 * Gets a cache entry using a CPT.
	 *
	 * @param string $key     Cache key name.
	 * @param mixed  $default Default value.
	 *
	 * @return mixed
	 */
	public function get( $key, $default ) {
		$cached = get_transient( $this->transient_key( $key ) );
		if ( $cached ) {
			return $cached;
		}

		$data_post = $this->get_post_by_name( $key );

		if ( ! $data_post ) {
			return $default;
		}

		/**
		 * Array(
		 *   'data' => mixed,
		 *   'expiry' => int,
		 * )
		 */

		// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode, WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize, WordPress.PHP.NoSilencedErrors.Discouraged
		$decoded = base64_decode( $data_post->post_content );
		$value   = $decoded;

		if ( is_serialized( $decoded ) ) {
			$trimmed = trim( $decoded );

			// Refuse the row before unserialize() sees it: checking the wire format means
			// no object is ever instantiated, not even __PHP_Incomplete_Class. A payload
			// whose own string data happens to match only costs a regeneration.
			if ( preg_match( self::OBJECT_TOKEN_PATTERN, $trimmed ) ) {
				$this->delete_rejected_row( $key, $data_post, 'contains an object' );

				return $default;
			}

			// allowed_classes as a second layer behind the pattern above.
			$value = @unserialize( $trimmed, array( 'allowed_classes' => false ) );

			// Claimed serialized and would not deserialize: not a row Boost wrote.
			// b:0; legitimately gives false.
			if ( false === $value && 'b:0;' !== $trimmed ) {
				$this->delete_rejected_row( $key, $data_post, 'is malformed' );

				return $default;
			}
		}
		// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode, WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize, WordPress.PHP.NoSilencedErrors.Discouraged

		if ( isset( $value['expiry'] ) && intval( $value['expiry'] ) > 0 ) {
			if ( time() > intval( $value['expiry'] ) ) {
				// The cache entry expired. Clear it.
				$this->delete( $key );

				return $default;
			}
		}

		if ( ! isset( $value['data'] ) ) {
			return $default;
		}

		set_transient( $this->transient_key( $key ), $value['data'], HOUR_IN_SECONDS );

		return $value['data'];
	}

	/**
	 * Delete a cache row get() refused to load.
	 *
	 * Contained, because get() has already decided to serve the default and a
	 * throwing wp_delete_post() subscriber must not fatal the render.
	 *
	 * @since $$next-version$$
	 *
	 * @param string   $key       Cache key name.
	 * @param \WP_Post $data_post The refused row.
	 * @param string   $reason    For the debug log.
	 *
	 * @return void
	 */
	private function delete_rejected_row( $key, $data_post, $reason ) {
		Debug::log( 'refused cache entry "' . $key . '": stored content ' . $reason . '; deleting the row' );

		try {
			wp_delete_post( $data_post->ID, true );
		} catch ( \Throwable $e ) {
			Debug::log( 'deleting cache entry "' . $key . '" threw: ' . $e->getMessage() );
		}

		delete_transient( $this->transient_key( $key ) );
	}

	/**
	 * Delete a cache entry from a CPT.
	 *
	 * @param string $key Cache key name.
	 *
	 * @return void
	 */
	public function delete( $key ) {
		$data_post = $this->get_post_by_name( $key );

		// Delete the post.
		if ( $data_post ) {
			wp_delete_post( $data_post->ID, true );
		}

		// Match set(), which clears the transient whenever the row changes.
		delete_transient( $this->transient_key( $key ) );
	}

	/**
	 * Returns a single WP post based on the `post_name` property.
	 *
	 * Note: `post_name` is indexed in the DB.
	 *
	 * @see https://codex.wordpress.org/Database_Description#Indexes_6
	 *
	 * @param string $post_name Post name.
	 *
	 * @return bool|\WP_Post
	 */
	public function get_post_by_name( $post_name ) {
		$post_query = new \WP_Query(
			array(
				'name'                   => $post_name,
				'post_type'              => $this->post_type_slug(),
				'post_status'            => 'publish',
				'posts_per_page'         => 1,
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( ! $post_query->have_posts() ) {
			return false;
		}
		if ( ! $post_query->posts[0] instanceof \WP_Post ) {
			return false;
		}

		return $post_query->posts[0];
	}

	/**
	 * Clear all data stored in post types. On systems which support it, this
	 * will use wp_cache_flush_group and a db query to efficiently flush the
	 * cache. Otherwise, it will fall back to deleting each item.
	 */
	public function clear() {
		if (
			function_exists( 'wp_cache_flush_group' ) &&
			function_exists( 'wp_cache_supports' ) &&
			wp_cache_supports( 'flush_group' )
		) {
			$this->clear_bulk();
		} else {
			$this->clear_manually();
		}
	}

	/**
	 * Clear all data stored in post types using wp_cache_flush_group and a db
	 * query. This is more efficient than deleting each item individually.
	 * Make sure that wp_cache_supports( 'flush_group' ) returns true before
	 * calling this method.
	 */
	private function clear_bulk() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete(
			$wpdb->posts,
			array( 'post_type' => $this->post_type_slug() ),
			array( '%s' )
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->options WHERE option_name LIKE %s",
				'_transient_' . $this->post_type_slug() . '_%'
			)
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->options WHERE option_name LIKE %s",
				'_transient_timeout_' . $this->post_type_slug() . '_%'
			)
		);

		wp_cache_flush_group( $this->post_type_slug() );
		wp_cache_flush_group( 'options' );
	}

	/**
	 * Clear all data stored in post types by deleting each item individually.
	 * This is less efficient than using wp_cache_flush_group and a db query,
	 * but works on all systems.
	 */
	private function clear_manually() {
		$posts = get_posts(
			array(
				'post_type'      => $this->post_type_slug(),
				'posts_per_page' => -1,
			)
		);

		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
			wp_cache_delete( $post->post_name, $this->post_type_slug() );
			// The versioned key, and the key a pre-CACHE_VERSION release wrote.
			delete_transient( $this->transient_key( $post->post_name ) );
			delete_transient( $this->post_type_slug() . '_' . $post->post_name );
		}
	}
}
