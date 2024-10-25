<?php
/**
 * Place to properly deprecate Jetpack features.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;

/**
 * Place to properly deprecate Jetpack features.
 */
class Deprecate {

	/**
	 * The singleton instance.
	 *
	 * @var Deprecate
	 */
	private static $instance;

	/**
	 * Initialize the class.
	 */
	private function __construct() {
		if ( $this->has_notices() ) {
			add_action( 'admin_notices', array( $this, 'render_admin_notices' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
			add_filter( 'my_jetpack_red_bubble_notification_slugs', array( $this, 'add_my_jetpack_red_bubbles' ) );
		}
	}

	/**
	 * Create/get the singleton instance.
	 *
	 * @return static
	 */
	public static function instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}

		return static::$instance;
	}

	/**
	 * Enqueue the scripts.
	 *
	 * @return void
	 */
	public function enqueue_admin_scripts() {
		if ( ! $this->has_notices() ) {
			return;
		}

		if ( ! wp_script_is( 'jetpack-deprecate', 'registered' ) ) {
			wp_register_script(
				'jetpack-deprecate',
				Assets::get_file_url_for_environment( '_inc/build/deprecate.min.js', '_inc/deprecate.js' ),
				array(),
				JETPACK__VERSION,
				true
			);
		}

		wp_enqueue_script( 'jetpack-deprecate' );
	}

	/**
	 * Render deprecation notices for relevant features.
	 *
	 * @return void
	 */
	public function render_admin_notices() {
	}

	/**
	 * Add the deprecation notices to My Jetpack.
	 *
	 * @param array $slugs Already added bubbles.
	 *
	 * @return array
	 */
	public function add_my_jetpack_red_bubbles( $slugs ) {
		return $slugs;
	}

	/**
	 * Render the notice.
	 *
	 * @param string $id The notice ID.
	 * @param string $text The notice text.
	 * @param array  $params Additional notice params.
	 *
	 * @return void
	 */
	private function render_notice( $id, $text, $params = array() ) {
		if ( ! empty( $_COOKIE['jetpack_deprecate_dismissed'][ $id ] ) ) {
			return;
		}

		$params['id'] = $id;

		if ( empty( $params['type'] ) ) {
			$params['type'] = 'warning';
		}

		if ( empty( $params['dismissible'] ) ) {
			$params['dismissible'] = true;
		}

		if ( $params['dismissible'] ) {
			if ( empty( $params['additional_classes'] ) ) {
				$params['additional_classes'] = array();
			}

			$params['additional_classes'][] = 'jetpack-deprecate-dismissible';
		}

		wp_admin_notice( $text, $params );
	}

	/**
	 * Check if there are any notices to be displayed, so we wouldn't load unnecessary JS and run excessive hooks.
	 *
	 * @return bool
	 */
	private function has_notices() {
		return false;
	}
}
