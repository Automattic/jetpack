<?php
/**
 * Shared setup and assertions for the per-post switch tests.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

/**
 * A published post to switch, one public and one non-public custom post type, and
 * cleanup for the registrations WorDBless does not reset between cases.
 */
trait Post_Switch_Helpers {

	/**
	 * Published post the switch is read from and written to.
	 *
	 * @var int
	 */
	private $post_id;

	/**
	 * Post type support the switch under test adds.
	 *
	 * @var string
	 */
	private $post_type_support;

	/**
	 * Register the extra post types and create the post.
	 *
	 * @param string $post_type_support Post type support the switch under test adds.
	 */
	protected function set_up_post_switch( string $post_type_support ): void {
		$this->post_type_support = $post_type_support;

		register_post_type( 'switch_public', array( 'public' => true ) );
		register_post_type( 'switch_private', array( 'public' => false ) );

		$this->post_id = wp_insert_post(
			array(
				'post_title'  => 'Switch',
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Drop the fields, supports and post types the case registered.
	 */
	protected function tear_down_post_switch(): void {
		unset( $GLOBALS['wp_rest_additional_fields'] );

		foreach ( get_post_types() as $post_type ) {
			remove_post_type_support( $post_type, $this->post_type_support );
		}

		unregister_post_type( 'switch_public' );
		unregister_post_type( 'switch_private' );
	}

	/**
	 * Every callback on a hook, at any priority.
	 *
	 * @param string $hook_name Action name.
	 */
	private function count_callbacks( string $hook_name ): int {
		global $wp_filter;

		if ( ! isset( $wp_filter[ $hook_name ] ) ) {
			return 0;
		}

		return array_sum( array_map( 'count', $wp_filter[ $hook_name ]->callbacks ) );
	}

	/**
	 * The post's meta as a database would return it, or null for none.
	 *
	 * WorDBless keeps the PHP type a value was stored with; the database would not.
	 *
	 * @param string $key Meta key.
	 */
	private function stored_meta( string $key ): ?string {
		if ( ! metadata_exists( 'post', $this->post_id, $key ) ) {
			return null;
		}

		return (string) get_post_meta( $this->post_id, $key, true );
	}
}
