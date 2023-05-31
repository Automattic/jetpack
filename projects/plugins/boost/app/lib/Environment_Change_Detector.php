<?php
/**
 * Environment Change Detector class.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Environment_Change_Detector
 */
class Environment_Change_Detector {

	/**
	 * Initialize the change detection hooks.
	 */
	public static function init() {
		$object = new self();
		$object->register_hooks();
	}

	public function register_hooks() {
		add_action( 'after_switch_theme', array( $this, 'handle_theme_change' ) );
		add_action( 'save_post', array( $this, 'handle_post_change' ), 10, 2 );
		add_action( 'activated_plugin', array( $this, 'handle_plugin_change' ) );
		add_action( 'deactivated_plugin', array( $this, 'handle_plugin_change' ) );
	}

	public function handle_post_change( $post_id, $post ) {
		// Ignore changes to any post which is not published.
		if ( 'publish' !== $post->post_status ) {
			return;
		}

		// Ignore changes to post types which do not affect the front-end UI
		if ( ! $this->is_post_type_invalidating( $post->post_type ) ) {
			return;
		}

		$this->do_action( false, 'post_saved' );
	}

	public function handle_theme_change() {
		$this->do_action( true, 'switched_theme' );
	}

	public function handle_plugin_change() {
		$this->do_action( false, 'plugin_change' );
	}

	/**
	 * Fire the environment change action.
	 *
	 * @param string $change_type The change type.
	 * @param bool   $is_major_change Whether the change is major.
	 */
	public function do_action( $is_major_change, $change_type ) {
		do_action( 'handle_environment_change', $is_major_change, $change_type );
	}

	/**
	 * Given a post_type, return true if this post type affects the front end of
	 * the site - i.e.: should cause cached optimizations to be invalidated.
	 *
	 * @param string $post_type The post type to check
	 * @return bool             True if this post type affects the front end of the site.
	 */
	private function is_post_type_invalidating( $post_type ) {
		// Special cases: items which are not viewable, but affect the UI.
		if ( in_array( $post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
			return true;
		}

		if ( is_post_type_viewable( $post_type ) ) {
			return true;
		}
	}
}
