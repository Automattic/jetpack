<?php
/**
 * Identity_Crisis package.
 *
 * @package  automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Tracking as Tracking;
use Jetpack_Tracks_Client;

/**
 * The Identity Crisis UI handling.
 */
class UI {

	/**
	 * Initialization.
	 */
	public static function init() {
		if ( did_action( 'jetpack_identity_crisis_ui_init' ) ) {
			return;
		}

		/**
		 * Action called after initializing Identity Crisis UI.
		 *
		 * @since $$next-version$$
		 */
		do_action( 'jetpack_identity_crisis_ui_init' );

		$idc_data = Identity_Crisis::check_identity_crisis();

		// TODO: replace the `jetpack_disconnect` check with a non-admin IDC screen.
		if ( false === $idc_data || ! current_user_can( 'jetpack_disconnect' ) ) {
			return;
		}

		$idc_data = Identity_Crisis::check_identity_crisis();

		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_scripts' ) );

		Tracking::register_tracks_functions_scripts( true );
	}

	/**
	 * Enqueue scripts!
	 */
	public static function enqueue_scripts() {
		if ( is_admin() ) {
			Assets::register_script(
				'jp_identity_crisis_banner',
				'../build/index.js',
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack',
				)
			);
			Assets::enqueue_script( 'jp_identity_crisis_banner' );
			wp_add_inline_script( 'jp_identity_crisis_banner', static::get_initial_state(), 'before' );

			add_action( 'admin_notices', array( static::class, 'render_container' ) );
		}
	}

	/**
	 * Create the container element for the IDC banner.
	 */
	public static function render_container() {
		?>
		<div id="jp-identity-crisis-container"></div>
		<?php
	}

	/**
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private static function get_initial_state() {
		return 'var JP_IDENTITY_CRISIS__INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( static::get_initial_state_data() ) ) . '"));';
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private static function get_initial_state_data() {
		$idc_urls       = Identity_Crisis::get_mismatched_urls();
		$current_screen = get_current_screen();

		return array(
			'WP_API_root'         => esc_url_raw( rest_url() ),
			'WP_API_nonce'        => wp_create_nonce( 'wp_rest' ),
			'wpcomHomeUrl'        => $idc_urls['wpcom_url'],
			'currentUrl'          => $idc_urls['current_url'],
			// TODO: find a better way to get the redirect URL.
			'redirectUri'         => str_replace( '/wp-admin/', '/', $_SERVER['REQUEST_URI'] ),
			'tracksUserData'      => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'tracksEventData'     => array(
				'isAdmin'       => current_user_can( 'jetpack_disconnect' ),
				'currentScreen' => $current_screen ? $current_screen->id : false,
			),
			'isSafeModeConfirmed' => Identity_Crisis::$is_safe_mode_confirmed,
		);
	}

}
