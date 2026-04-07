<?php
/**
 * Survicate survey integration
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Survicate
 */
class Survicate {
	/**
	 * Survicate workspace key.
	 */
	const WORKSPACE_KEY = 'e4794374cce15378101b63de24117572';

	/**
	 * Class instance.
	 *
	 * @var Survicate
	 */
	private static $instance = null;

	/**
	 * Survicate constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 100 );
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Check whether Survicate should load on the current page.
	 *
	 * @return bool
	 */
	private function should_load() {
		if ( ! is_user_logged_in() ) {
			return false;
		}

		if ( ! is_admin() ) {
			return false;
		}

		// Only load for English locale users.
		if ( strpos( strtolower( get_user_locale() ), 'en' ) !== 0 ) {
			return false;
		}

		return true;
	}

	/**
	 * Detect the current editor context.
	 *
	 * @return string One of 'site-editor', 'block-editor', or 'wp-admin'.
	 */
	private function get_editor_context() {
		global $pagenow;

		if ( $pagenow === 'site-editor.php' ) {
			return 'site-editor';
		}

		if ( function_exists( 'get_current_screen' ) ) {
			$current_screen = get_current_screen();
			if ( $current_screen && $current_screen->is_block_editor() && $current_screen->id !== 'widgets' ) {
				return 'block-editor';
			}
		}

		return 'wp-admin';
	}

	/**
	 * Get visitor traits for Survicate.
	 *
	 * @return array
	 */
	private function get_visitor_traits() {
		$user_data = get_userdata( get_current_user_id() );
		$email     = $user_data ? $user_data->user_email : '';
		$site_id   = get_wpcom_blog_id();
		$site_type = ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) ? 'atomic' : 'simple';

		return array(
			'email'          => $email,
			'site_id'        => $site_id ? (string) $site_id : '',
			'site_type'      => $site_type,
			'editor_context' => $this->get_editor_context(),
		);
	}

	/**
	 * Enqueue Survicate scripts.
	 */
	public function enqueue_scripts() {
		if ( ! $this->should_load() ) {
			return;
		}

		$traits_json   = wp_json_encode( $this->get_visitor_traits(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
		$workspace_key = self::WORKSPACE_KEY;

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.NotInFooter
		wp_register_script(
			'wpcom-survicate',
			false,
			array(),
			'1.0',
			false
		);

		wp_add_inline_script(
			'wpcom-survicate',
			<<<JS
( function () {
	if ( window.innerWidth < 480 ) {
		return;
	}
	var script = document.createElement( 'script' );
	script.src = 'https://survey.survicate.com/workspaces/{$workspace_key}/web_surveys.js';
	script.async = true;
	document.head.appendChild( script );
	var traits = {$traits_json};
	window.addEventListener( 'SurvicateReady', function () {
		window._sva.setVisitorTraits( traits );
	} );
} )();
JS
		);

		wp_enqueue_script( 'wpcom-survicate' );
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Survicate', 'init' ) );
