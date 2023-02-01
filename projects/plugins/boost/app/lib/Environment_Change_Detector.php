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
		$post_types = get_post_types( array( 'name' => $post->post_type ), 'objects' );
		if ( empty( $post_types ) || $post_types['post']->public !== true ) {
			return;
		}

		$this->do_action( false, 'post_saved' );
	}

	public function handle_theme_change() {
		$this->do_action( true, 'switched_theme' );
	}

	public function handle_plugin_change() {
		$this->do_action( true, 'plugin_change' );
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
}
