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

	const ENV_CHANGE_LEGACY         = '1';
	const ENV_CHANGE_PAGE_SAVED     = 'page_saved';
	const ENV_CHANGE_POST_SAVED     = 'post_saved';
	const ENV_CHANGE_SWITCHED_THEME = 'switched_theme';
	const ENV_CHANGE_PLUGIN_CHANGE  = 'plugin_change';

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

		if ( 'page' === $post->post_type ) {
			$change_type = $this::ENV_CHANGE_PAGE_SAVED;
		} else {
			$change_type = $this::ENV_CHANGE_POST_SAVED;
		}

		$this->do_action( false, $change_type );
	}

	public function handle_theme_change() {
		$this->do_action( true, $this::ENV_CHANGE_SWITCHED_THEME );
	}

	public function handle_plugin_change() {
		$this->do_action( false, $this::ENV_CHANGE_PLUGIN_CHANGE );
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

	public static function get_available_env_change_statuses() {
		return array(
			self::ENV_CHANGE_PAGE_SAVED,
			self::ENV_CHANGE_POST_SAVED,
			self::ENV_CHANGE_SWITCHED_THEME,
			self::ENV_CHANGE_PLUGIN_CHANGE,
		);
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
