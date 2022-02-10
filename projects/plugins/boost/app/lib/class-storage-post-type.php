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
 */
class Storage_Post_Type {

	/**
	 * The name.
	 *
	 * @var string
	 */
	private $name;

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
	 * Static initialization.
	 */
	private function init() {
		// Check if post type already registered.
		if ( post_type_exists( $this->post_type_slug() ) ) {
			return;
		}
		register_post_type(
			$this->post_type_slug(),
			array(
				'description'      => 'Cache entries for the Jetpack Boost plugin.',
				'public'           => false,
				'show_in_rest'     => true,
				'rewrite'          => false,
				'can_export'       => false,
				'delete_with_user' => false,
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
		$data_post_data['post_content'] = base64_encode( maybe_serialize( $value ) ); // phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		// Update an existing data post if we have one or create a new one.
		if ( $data_post ) {
			$data_post_data['ID'] = $data_post->ID;
			wp_update_post( $data_post_data );
		} else {
			wp_insert_post( $data_post_data );
		}
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
		$cached = wp_cache_get( $key, $this->post_type_slug() );
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

		// phpcs:disable
		$value = maybe_unserialize( base64_decode( $data_post->post_content ) );
		// phpcs:enable

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

		wp_cache_set( $key, $value['data'], $this->post_type_slug(), HOUR_IN_SECONDS );

		return $value['data'];
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
	 * We're not using any taxonomies with our storage post type at the moment,
	 * so it's not necessary to do anything more complex
	 * than a simple delete DB Query.
	 *
	 * @return false|int
	 */
	public function clear() {
		global $wpdb;

		wp_cache_delete( null, $this->post_type_slug() );

		return $wpdb->delete(
			$wpdb->posts,
			array( 'post_type' => $this->post_type_slug() ),
			array( '%s' )
		);
	}
}
