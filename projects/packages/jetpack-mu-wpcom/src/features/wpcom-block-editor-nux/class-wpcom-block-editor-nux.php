<?php
/**
 * WPCOM Block Editor NUX file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX;

define( 'MU_WPCOM_BLOCK_EDITOR_NUX', true );

require_once __DIR__ . '/../../utils.php';

/**
 * Class WPCOM_Block_Editor_NUX
 */
class WPCOM_Block_Editor_NUX {
	/**
	 * Class instance.
	 *
	 * @var WPCOM_Block_Editor_NUX
	 */
	private static $instance = null;

	/**
	 * WPCOM_Block_Editor_NUX constructor.
	 */
	public function __construct() {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_script_and_style' ), 100 );
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
	}

	/**
	 * Creates instance.
	 *
	 * @return \Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX\WPCOM_Block_Editor_NUX
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public function enqueue_script_and_style() {
		jetpack_mu_wpcom_enqueue_assets( 'wpcom-block-editor-nux', array( 'js', 'css' ) );
		wp_set_script_translations( 'wpcom-block-editor-nux', 'jetpack-mu-wpcom' );
	}

	/**
	 * Register the WPCOM Block Editor NUX endpoints.
	 */
	public function register_rest_api() {
		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-nux-status-controller.php';
		$controller = new WP_REST_WPCOM_Block_Editor_NUX_Status_Controller();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-first-post-published-modal-controller.php';
		$first_post_published_modal_controller = new WP_REST_WPCOM_Block_Editor_First_Post_Published_Modal_Controller();
		$first_post_published_modal_controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-seller-celebration-modal-controller.php';
		$seller_celebration_modal_controller = new WP_REST_WPCOM_Block_Editor_Seller_Celebration_Modal_Controller();
		$seller_celebration_modal_controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-video-celebration-modal-controller.php';
		$video_celebration_modal_controller = new WP_REST_WPCOM_Block_Editor_Video_Celebration_Modal_Controller();
		$video_celebration_modal_controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-sharing-modal-controller.php';
		$sharing_modal_controller = new WP_REST_WPCOM_Block_Editor_Sharing_Modal_Controller();
		$sharing_modal_controller->register_rest_route();
	}
}
add_action( 'init', array( __NAMESPACE__ . '\WPCOM_Block_Editor_NUX', 'init' ) );
