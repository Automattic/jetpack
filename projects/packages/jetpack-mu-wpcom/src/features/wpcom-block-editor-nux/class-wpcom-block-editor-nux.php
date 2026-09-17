<?php
/**
 * WPCOM Block Editor NUX file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX;

use Automattic\Jetpack\Status;

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
		$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-block-editor-nux', array( 'js', 'css' ) );
		wp_set_script_translations( $handle, 'jetpack-mu-wpcom' );

		/**
		 * Enqueue the launchpad options.
		 */
		$launchpad_options = wp_json_encode(
			array(
				'launchpadScreenOption' => get_option( 'launchpad_screen' ),
				'siteUrlOption'         => get_option( 'siteurl' ),
				'siteIntentOption'      => get_option( 'site_intent' ),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var launchpadOptions = $launchpad_options;",
			'before'
		);

		$site_id    = \Jetpack_Options::get_option( 'id' );
		$is_p2_site = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( $site_id );

		/**
		 * Enqueue the recommended tags modal options.
		 */
		$recommended_tags_modal_options = wp_json_encode(
			array(
				'isDismissed' => WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller::get_wpcom_recommended_tags_modal_dismissed(),
				'isP2'        => $is_p2_site,
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var recommendedTagsModalOptions = $recommended_tags_modal_options;",
			'before'
		);

		/**
		 * Enqueue the site visibility panel options.
		 */
		$site_visibility_panel_options = wp_json_encode(
			array(
				'isComingSoon'        => self::is_coming_soon(),
				'canChangeVisibility' => current_user_can( 'manage_options' ),
				'settingsUrl'         => admin_url( 'options-reading.php' ),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var siteVisibilityPanelOptions = $site_visibility_panel_options;",
			'before'
		);
	}

	/**
	 * Whether the site is Coming Soon.
	 *
	 * Status finds the WordPress.com global and the public Coming Soon option, but on Atomic the
	 * equivalent function is namespaced by wpcomsh, which is where the legacy private-site flavor
	 * of Coming Soon lives.
	 *
	 * @return bool
	 */
	private static function is_coming_soon() {
		if ( ( new Status() )->is_coming_soon() ) {
			return true;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Only called where wpcomsh defines it.
		return function_exists( '\Private_Site\site_is_coming_soon' ) && \Private_Site\site_is_coming_soon();
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

		require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-recommended-tags-modal-controller.php';
		$recommended_tags_modal_controller = new WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller();
		$recommended_tags_modal_controller->register_rest_route();
	}
}
add_action( 'init', array( __NAMESPACE__ . '\WPCOM_Block_Editor_NUX', 'init' ) );
