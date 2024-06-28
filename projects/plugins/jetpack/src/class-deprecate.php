<?php
/**
 * Place to properly deprecate Jetpack features.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Host;

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
		add_action( 'admin_notices', array( $this, 'render_admin_notices' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_filter( 'my_jetpack_red_bubble_notification_slugs', array( $this, 'add_my_jetpack_red_bubbles' ) );
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
	 * Render Google Analytics deprecation notice.
	 *
	 * @return void
	 */
	public function render_admin_notices() {
		if ( $this->show_ga_notice() ) {
			$support_url = Redirect::get_url( 'jetpack-support-google-analytics' );

			$this->render_notice(
				'jetpack-ga-admin-notice',
				esc_html__( "Jetpack's Google Analytics feature will be removed on August 6, 2024.", 'jetpack' )
				. ' <a href="' . $support_url . '" target="_blank">' . esc_html__( 'Read this document for details and how to keep tracking visits with Google Analytics', 'jetpack' ) . '</a>.'
			);
		}
	}

	/**
	 * Add the deprecation notices to My Jetpack.
	 *
	 * @param array $slugs Already added bubbles.
	 *
	 * @return mixed
	 */
	public function add_my_jetpack_red_bubbles( $slugs ) {
		if ( $this->show_ga_notice() ) {
			$slugs['jetpack-google-analytics-deprecate-feature'] = array(
				'data' => array(
					'text' => __( "Jetpack's Google Analytics feature will be removed on August 6, 2024. Read the documentation for details and how to keep tracking visits with Google Analytics.", 'jetpack' ),
					'link' => array(
						'label' => esc_html__( 'See documentation', 'jetpack' ),
						'url'   => Redirect::get_url( 'jetpack-support-google-analytics' ),
					),
				),
			);
		}

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
	 * Check if there are any notices to be displayed, so we wouldn't load unnecessary JS.
	 *
	 * @return bool
	 */
	private function has_notices() {
		return $this->show_ga_notice();
	}

	/**
	 * Check if Google Analytics notice should show up.
	 *
	 * @return bool
	 */
	private function show_ga_notice() {
		return ( new Modules() )->is_active( 'google-analytics', false )
			&& ! is_plugin_active( 'jetpack-legacy-google-analytics/jetpack-legacy-google-analytics.php' )
			&& ! ( new Host() )->is_woa_site();
	}
}
