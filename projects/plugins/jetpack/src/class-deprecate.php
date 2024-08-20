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
		if ( $this->show_masterbar_notice() ) {
			$support_url = Redirect::get_url( 'jetpack-support-masterbar' );

			$this->render_notice(
				'jetpack-masterbar-admin-removal-notice',
				esc_html__( "Jetpack's WordPress.com Toolbar feature has been removed.", 'jetpack' )
				. ' <a href="' . $support_url . '" target="_blank">' . esc_html__( 'To find out more about what this means for you, please refer to this document', 'jetpack' ) . '</a>.'
			);
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
		if ( $this->show_masterbar_notice() ) {
			$slugs['jetpack-masterbar-deprecate-feature'] = array(
				'data' => array(
					'text' => __( "Jetpack's WordPress.com Toolbar feature has been removed.", 'jetpack' ),
					'link' => array(
						'label' => esc_html__( 'See documentation', 'jetpack' ),
						'url'   => Redirect::get_url( 'jetpack-support-masterbar' ),
					),
					'id'   => 'jetpack-masterbar-admin-removal-notice',
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
	 * Check if there are any notices to be displayed, so we wouldn't load unnecessary JS and run excessive hooks.
	 *
	 * @return bool
	 */
	private function has_notices() {
		return $this->show_masterbar_notice();
	}

	/**
	 * Check if Masterbar notice should show up.
	 *
	 * @return bool
	 */
	private function show_masterbar_notice() {
		return ( new Modules() )->is_active( 'masterbar', false )
			&& ! ( new Host() )->is_woa_site()
			&& empty( $_COOKIE['jetpack_deprecate_dismissed']['jetpack-masterbar-admin-removal-notice'] );
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
