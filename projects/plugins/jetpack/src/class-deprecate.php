<?php
/**
 * Place to properly deprecate Jetpack features.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Redirect;

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
	 * An array of notices to display.
	 *
	 * @var array
	 */
	private $notices = array();

	/**
	 * Initialize the class.
	 */
	private function __construct() {
		// phpcs:disable Squiz.PHP.CommentedOutCode.Found
		// Example $this->notices content:
		// array(
		// 'my-admin-deprecate-features' => array(
		// 'title'     => __( "Retired feature: Jetpack's XYZ Feature", 'jetpack' ),
		// 'message'   => __( "This feature is being retired and will be removed effective November, 2024. Please use the Classic Theme Helper plugin instead.", 'jetpack' ),
		// 'link'      => array(
		// 'label' => __( 'Learn more', 'jetpack' ),
		// 'url'   => 'jetpack-support-xyz',
		// ),
		// 'condition' => 'show_feature_notice', // Method name to check if notice should show
		// ),
		// phpcs:enable Squiz.PHP.CommentedOutCode.Found
		$this->notices = array();

		if ( $this->has_notices() ) {
			add_action( 'admin_notices', array( $this, 'render_admin_notices' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
			add_filter( 'my_jetpack_red_bubble_notification_slugs', array( $this, 'add_my_jetpack_red_bubbles' ) );
			add_filter( 'jetpack_modules_list_table_items', array( $this, 'remove_masterbar_module_list' ) );
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

		foreach ( $this->notices as $id => $notice ) {
			if ( method_exists( $this, $notice['condition'] ) && $this->{$notice['condition']}() ) {
				$support_url = Redirect::get_url( $notice['link']['url'] );

				$this->render_notice(
					$id,
					esc_html( $notice['message'] ) .
					' <a href="' . $support_url . '" target="_blank">' . esc_html( $notice['link']['label'] ) . '</a>.'
				);
			}
		}
	}

	/**
	 * Add the deprecation notices to My Jetpack.
	 *
	 * @param array $slugs Already added bubbles.
	 *
	 * @return array
	 */
	public function add_my_jetpack_red_bubbles( $slugs ) {

		foreach ( $this->notices as $id => $notice ) {
			if ( method_exists( $this, $notice['condition'] ) && $this->{$notice['condition']}() ) {
				$slugs[ $id ] = array(
					'data' => array(
						'text' => $notice['message'],
						'link' => array(
							'label' => esc_html( $notice['link']['label'] ),
							'url'   => Redirect::get_url( $notice['link']['url'] ),
						),
						'id'   => $id,
					),
				);
			}
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
	 * Check if there are any notices to be displayed, so we wouldn't load unnecessary JS and run excessive hooks.
	 *
	 * @return bool
	 */
	private function has_notices() {
		foreach ( $this->notices as $notice ) {
			if ( method_exists( $this, $notice['condition'] ) && $this->{$notice['condition']}() ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Remove Masterbar from the old Module list.
	 * Available at wp-admin/admin.php?page=jetpack_modules
	 * We only need this function until the Masterbar is fully removed from Jetpack (including notices).
	 *
	 * @param array $items Array of Jetpack modules.
	 * @return array
	 */
	public function remove_masterbar_module_list( $items ) {
		if ( isset( $items['masterbar'] ) && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
			unset( $items['masterbar'] );
		}
		return $items;
	}
}
