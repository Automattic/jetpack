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
	 * Cache format version. Part of the transient key, and the prefix on post_content.
	 *
	 * On the transient key it keeps get() away from transients an earlier release
	 * wrote, which were cached without the object checks below. On the row it marks
	 * where the encoded payload starts; get() validates every row, prefixed or not,
	 * before serving it.
	 *
	 * @since 4.7.0
	 */
	const CACHE_VERSION = 'v2';

	/**
	 * Matches a serialized object (O:), custom-serialized class (C:) or enum case
	 * (E:) anywhere in a serialized string. Boost never stores objects, so a match
	 * means the row is not one Boost wrote.
	 *
	 * @since 4.7.0
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
	 * @since 4.7.0
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
	 * @since 4.7.0
	 *
	 * @param string $key Cache key name.
	 *
	 * @return string
	 */
	private function transient_key( $key ) {
		return $this->post_type_slug() . '_' . self::CACHE_VERSION . '_' . $key;
	}

	/**
	 * The prefix set() puts in front of the encoded payload.
	 *
	 * Sits outside the payload so get() knows where the encoded bytes start on a row
	 * this release wrote, without decoding to find out. A row without it is still
	 * read; get() just decodes from the first byte.
	 *
	 * @since 4.7.0
	 *
	 * @return string
	 */
	private function row_prefix() {
		return self::CACHE_VERSION . ':';
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
		$data_post_data['post_content'] = $this->row_prefix() . base64_encode( maybe_serialize( $value ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

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

		$prefix  = $this->row_prefix();
		$encoded = $data_post->post_content;

		// A row without the prefix was written before this release, when the REST route
		// and the default capabilities let anyone create one. Most such rows are cache
		// Boost itself wrote, so the prefix only marks where the payload starts, not
		// whether the row can be served: that is settled below, by the same object-token
		// scan and allowed_classes => false every row runs through. The strip is
		// conditional because ':' is not in the base64 alphabet, so a legitimate
		// unprefixed payload can never begin with the prefix, and stripping one that is
		// not there would misalign the decode.
		if ( 0 === strpos( $encoded, $prefix ) ) {
			$encoded = substr( $encoded, strlen( $prefix ) );
		}

		// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode, WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize, WordPress.PHP.NoSilencedErrors.Discouraged
		$decoded = base64_decode( $encoded );
		$value   = $decoded;

		// Ahead of is_serialized(), which has no case for C:, and ahead of unserialize(),
		// so no object is instantiated: not O:/C: as __PHP_Incomplete_Class, and not E:,
		// which allowed_classes does not filter at all.
		if ( preg_match( self::OBJECT_TOKEN_PATTERN, trim( $decoded ) ) ) {
			$this->refuse_row( $key, 'contains an object' );

			return $default;
		}

		if ( is_serialized( $decoded ) ) {
			$trimmed = trim( $decoded );

			// Degrades O:/C: to an inert __PHP_Incomplete_Class if the pattern above ever
			// misses one. It is not a second layer for E:, where the pattern is the only guard.
			$value = @unserialize( $trimmed, array( 'allowed_classes' => false ) );

			// Claimed serialized and would not deserialize: not a row Boost wrote.
			// b:0; legitimately gives false.
			if ( false === $value && 'b:0;' !== $trimmed ) {
				$this->refuse_row( $key, 'is malformed' );

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
	 * Serve the default for a row get() will not read, and leave the row alone.
	 *
	 * The checks that land here are inexact. serialize() embeds CSS and markup
	 * verbatim, so ordinary content can carry something the object pattern matches,
	 * and a truncated row looks the same as a crafted one. Deleting would cost a
	 * regeneration on a false positive; the next set() overwrites the row anyway.
	 *
	 * @since 4.7.0
	 *
	 * @param string $key    Cache key name.
	 * @param string $reason For the debug log.
	 *
	 * @return void
	 */
	private function refuse_row( $key, $reason ) {
		Debug::log( 'refused cache entry "' . $key . '": stored content ' . $reason );
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
