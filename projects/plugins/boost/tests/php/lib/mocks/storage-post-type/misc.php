<?php
/**
 * Mocks for Storage_Post_Type tests
 *
 * @package automattic/jetpack-boost
 */

if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	/**
	 * Number of seconds in an hour.
	 *
	 * @var int
	 */
	define( 'HOUR_IN_SECONDS', 3600 );
}

if ( ! function_exists( 'sanitize_title' ) ) {
	/**
	 * Mock sanitize_title function.
	 *
	 * @param string $title The title to be sanitized.
	 * @return string
	 */
	function sanitize_title( $title ) {
		return strtolower( str_replace( ' ', '-', $title ) );
	}
}

if ( ! function_exists( 'post_type_exists' ) ) {
	/**
	 * Mock post_type_exists function.
	 *
	 * @param string $post_type The post type to check.
	 * @return bool
	 */
	function post_type_exists( $post_type ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}

if ( ! function_exists( 'register_post_type' ) ) {
	/**
	 * Mock register_post_type function.
	 *
	 * @param string $post_type Post type key.
	 * @param array  $args Post type arguments.
	 * @return void
	 */
	function register_post_type( $post_type, $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// No-op for testing.
	}
}

if ( ! function_exists( 'get_transient' ) ) {
	/**
	 * Mock get_transient function.
	 *
	 * @param string $transient Transient name.
	 * @return mixed
	 */
	function get_transient( $transient ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return false;
	}
}

if ( ! function_exists( 'set_transient' ) ) {
	/**
	 * Mock set_transient function.
	 *
	 * @param string $transient Transient name.
	 * @param mixed  $value Transient value.
	 * @param int    $expiration Expiration time in seconds.
	 * @return bool
	 */
	function set_transient( $transient, $value, $expiration = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}

if ( ! function_exists( 'delete_transient' ) ) {
	/**
	 * Mock delete_transient function.
	 *
	 * @param string $transient Transient name.
	 * @return bool
	 */
	function delete_transient( $transient ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}

if ( ! function_exists( 'wp_delete_post' ) ) {
	/**
	 * Mock wp_delete_post function.
	 *
	 * @param int  $postid Post ID.
	 * @param bool $force_delete Whether to bypass trash.
	 * @return mixed
	 */
	function wp_delete_post( $postid, $force_delete = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Remove the post from our mock store
		foreach ( \WP_Query::$mock_posts as $name => $data ) {
			if ( $data['id'] === $postid ) {
				unset( \WP_Query::$mock_posts[ $name ] );
				break;
			}
		}
		return true;
	}
}

if ( ! function_exists( 'wp_insert_post' ) ) {
	/**
	 * Mock wp_insert_post function.
	 *
	 * @param array $postarr Post data.
	 * @return int|WP_Error
	 */
	function wp_insert_post( $postarr ) {
		$post_id = count( \WP_Query::$mock_posts ) + 1;
		$name    = $postarr['post_name'];
		$content = $postarr['post_content'];
		$data    = maybe_unserialize( base64_decode( $content ) );

		\WP_Query::$mock_posts[ $name ] = array(
			'id'   => $post_id,
			'data' => $data,
		);
		return $post_id;
	}
}

if ( ! function_exists( 'wp_update_post' ) ) {
	/**
	 * Mock wp_update_post function.
	 *
	 * @param array $postarr Post data.
	 * @return int|WP_Error
	 */
	function wp_update_post( $postarr ) {
		$name    = $postarr['post_name'];
		$content = $postarr['post_content'];
		$data    = maybe_unserialize( base64_decode( $content ) );

		\WP_Query::$mock_posts[ $name ] = array(
			'id'   => $postarr['ID'],
			'data' => $data,
		);
		return $postarr['ID'];
	}
}

if ( ! function_exists( 'get_posts' ) ) {
	/**
	 * Mock get_posts function.
	 *
	 * @param array $args Query arguments.
	 * @return array
	 */
	function get_posts( $args ) {
		$posts = array();
		foreach ( \WP_Query::$mock_posts as $name => $data ) {
			$post               = new WP_Post();
			$post->ID           = $data['id'];
			$post->post_title   = $name;
			$post->post_name    = $name;
			$post->post_content = base64_encode( maybe_serialize( $data['data'] ) );
			$post->post_status  = 'publish';
			$post->post_type    = $args['post_type'];
			$posts[]            = $post;
		}
		return $posts;
	}
}

if ( ! function_exists( 'wp_cache_delete' ) ) {
	/**
	 * Mock wp_cache_delete function.
	 *
	 * @param string $key Cache key.
	 * @param string $group Cache group.
	 * @return bool
	 */
	function wp_cache_delete( $key, $group = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}

if ( ! function_exists( 'wp_cache_flush_group' ) ) {
	/**
	 * Mock wp_cache_flush_group function.
	 *
	 * @param string $group Cache group.
	 * @return bool
	 */
	function wp_cache_flush_group( $group ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Clear all mock posts when cache is flushed
		\WP_Query::clear_mock_posts();
		return true;
	}
}

if ( ! function_exists( 'wp_cache_supports' ) ) {
	/**
	 * Mock wp_cache_supports function.
	 *
	 * @param string $feature Cache feature.
	 * @return bool
	 */
	function wp_cache_supports( $feature ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}

if ( ! function_exists( 'maybe_serialize' ) ) {
	/**
	 * Mock maybe_serialize function.
	 *
	 * @param mixed $data Data to serialize.
	 * @return string
	 */
	function maybe_serialize( $data ) {
		return serialize( $data );
	}
}

if ( ! function_exists( 'maybe_unserialize' ) ) {
	/**
	 * Mock maybe_unserialize function.
	 *
	 * @param string $data Data to unserialize.
	 * @return mixed
	 */
	function maybe_unserialize( $data ) {
		return unserialize( $data );
	}
}

if ( ! function_exists( 'time' ) ) {
	/**
	 * Mock time function.
	 *
	 * @return int
	 */
	function time() {
		return \WP_Query::$current_time;
	}
}
