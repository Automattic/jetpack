<?php
/**
 * WordPress.com Smart Dictation
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\WPCOM_DICTATION;

use Automattic\Jetpack\Status\Host;

/**
 * Class WPCOM_Smart_Dictation
 */
class WPCOM_Smart_Dictation {
	/**
	 * WPCOM_Smart_Dictation constructor.
	 */
	public static function init() {
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue_scripts' ), 100 );
		add_action( 'rest_api_init', array( self::class, 'register_rest_api' ) );
	}

	/**
	 * Register the Smart Dictation endpoints.
	 */
	public static function register_rest_api() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		require_once __DIR__ . '/class-wp-rest-wpcom-smart-dictation-client-secret.php';
		$controller = new WP_REST_WPCOM_Smart_Dictation_Client_Secret();
		$controller->register_rest_route();
	}

	/**
	 * Returns whether the current request is coming from the a8c proxy.
	 */
	private static function is_proxied() {
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}

	/**
	 * Returns true if the current screen if the block editor.
	 */
	public static function is_block_editor() {
		global $current_screen;

		if ( ! $current_screen ) {
			return false;
		}

		return $current_screen->is_block_editor() && $current_screen->id !== 'widgets';
	}

	/**
	 * Returns ISO 639 conforming locale string of the current user.
	 *
	 * @return string ISO 639 locale string e.g. "en"
	 */
	private static function determine_iso_639_locale() {
		$language = get_user_locale();
		$language = strtolower( $language );

		if ( in_array( $language, array( 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ), true ) ) {
			$language = str_replace( '_', '-', $language );
		} else {
			$language = preg_replace( '/([-_].*)$/i', '', $language );
		}

		if ( empty( $language ) ) {
			return 'en';
		}

		return $language;
	}

	/**
	 * Enqueue the Smart Dictation assets.
	 */
	public static function enqueue_scripts() {
		if ( self::is_block_editor() && 'en' === self::determine_iso_639_locale() ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/wpcom-smart-dictation/wpcom-smart-dictation.asset.json' );
			$is_a11n    = function_exists( '\is_automattician' ) && \is_automattician();
			$version    = ( is_array( $asset_file ) && isset( $asset_file['version'] ) )
				? $asset_file['version']
				: false;
			wp_enqueue_script(
				'wpcom-smart-dictation',
				'https://widgets.wp.com/wpcom-smart-dictation/wpcom-smart-dictation.min.js',
				array(),
				$version,
				true
			);

			$user_id      = get_current_user_id();
			$user_data    = get_userdata( $user_id );
			$username     = $user_data ? $user_data->user_login : null;
			$user_email   = $user_data ? $user_data->user_email : null;
			$display_name = $user_data ? $user_data->display_name : null;
			$avatar_url   = $user_data ? ( function_exists( 'wpcom_get_avatar_url' ) ? wpcom_get_avatar_url( $user_email, 64, '', true )[0] : get_avatar_url( $user_id ) ) : null;

			wp_add_inline_script(
				'wpcom-smart-dictation',
				'if ( typeof wpcomSmartDictationData === "undefined" ) { var wpcomSmartDictationData = ' . wp_json_encode(
					array(
						'isProxied'   => boolval( self::is_proxied() ),
						'currentUser' => array(
							'ID'           => $user_id,
							'username'     => $username,
							'display_name' => $display_name,
							'avatar_URL'   => $avatar_url,
							'email'        => $user_email,
							'is_a11n'      => $is_a11n,
						),
						'locale'      => self::determine_iso_639_locale(),
					),
					JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
				) . '; }',
				'before'
			);

			wp_enqueue_style(
				'wpcom-smart-dictation-style',
				'https://widgets.wp.com/wpcom-smart-dictation/wpcom-smart-dictation.css',
				array(),
				$version
			);
		}
	}

	/**
	 * Get the asset via file-system on wpcom and via network on Atomic sites.
	 *
	 * Checks a transient cache of successful remote fetches before the filesystem or a new HTTP request.
	 * Failures are not cached.
	 *
	 * @param string $filepath The path to the asset file.
	 * @return array|null Decoded manifest, or null when JSON is invalid or empty.
	 */
	private static function get_assets_json( $filepath ) {
		$local_path = ABSPATH . $filepath;

		if ( file_exists( $local_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a local file, not a remote URL.
			return json_decode( file_get_contents( $local_path ), true );
		}

		$cache_key = 'jetpack_mu_wpcom_sd_asset_' . md5( $filepath );
		$cached    = get_transient( $cache_key );

		if ( is_array( $cached ) ) {
			return $cached;
		}

		$request = wp_remote_get(
			'https://' . $filepath,
			array( 'timeout' => 10 )
		);

		$decoded = json_decode( wp_remote_retrieve_body( $request ), true );
		if ( is_array( $decoded ) ) {
			set_transient( $cache_key, $decoded, 12 * HOUR_IN_SECONDS );
		}
		return $decoded;
	}
}

add_action( 'init', array( __NAMESPACE__ . '\WPCOM_Smart_Dictation', 'init' ) );
