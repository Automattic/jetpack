<?php
/**
 * WordAds Consent Management Provider
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WordAds_Consent_Management_Provider
 *
 * This is an integration with the GDPR Consent Management Provider
 * to comply with GDPR requirements for privacy and transparency related to advertising.
 */
class WordAds_Consent_Management_Provider {

	/**
	 * IAB specified cookie name for storing the consent string.
	 */
	const COOKIE_NAME = 'euconsent-v2';

	/**
	 * Initializes loading of the frontend framework.
	 */
	public static function init() {
		// Prevent Cookies & Consent banner from displaying when the CMP is active.
		add_filter( 'jetpack_disable_eu_cookie_law_widget', '__return_true' );
		add_filter( 'jetpack_disable_cookie_consent_block', '__return_true' );

		// Enqueue scripts.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend_scripts' ) );
	}

	/**
	 * AJAX handlers for fetching purposes and vendor data and setting the cookie serverside.
	 *
	 * Serverside cookie used so that the expiration can be longer than one week.
	 * This function is called from: /mu-plugins/wordads-ajax.php to ensure they run on all
	 * requests including admin requests.
	 */
	public static function init_ajax_actions() {
		add_action( 'wp_ajax_gdpr_set_consent', array( __CLASS__, 'handle_set_consent_request' ) );
		add_action( 'wp_ajax_nopriv_gdpr_set_consent', array( __CLASS__, 'handle_set_consent_request' ) );
	}

	/**
	 * Handler for setting consent cookie AJAX request.
	 */
	public static function handle_set_consent_request() {

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! isset( $_POST['consent'] ) ) {
			wp_send_json_error();
		}

		// TODO: Is there better sanitizing we can do here?
		$consent = trim( wp_unslash( $_POST['consent'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		setcookie( self::COOKIE_NAME, $consent, time() + YEAR_IN_SECONDS, '/', self::get_cookie_domain(), is_ssl(), false ); // phpcs:ignore Jetpack.Functions.SetCookie -- Client side CMP needs to be able to read this value.

		wp_send_json_success( true );

		// phpcs:enable WordPress.Security.NonceVerification.Missing
	}

	/**
	 * Enqueues the main frontend Javascript.
	 */
	public static function enqueue_frontend_scripts() {
		Assets::register_script(
			'cmp_script_loader',
			'_inc/build/wordads/js/cmp-loader.min.js',
			JETPACK__PLUGIN_FILE,
			array(
				'nonmin_path'  => 'modules/wordads/js/cmp-loader.js',
				'dependencies' => array(),
				'enqueue'      => true,
				'version'      => JETPACK__VERSION,
			)
		);

		wp_enqueue_script(
			'cmp_config_script',
			esc_url( self::get_config_url() ),
			array( 'cmp_script_loader' ),
			JETPACK__VERSION,
			false
		);
	}

	/**
	 * Gets the value to be used when an opt-in cookie is set.
	 *
	 * @return string The value to store in the opt-in cookie.
	 */
	private static function get_config_url() {
		return sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%1$d/cmp/configuration/%2$s/?_jsonp=a8c_cmp_callback',
			(int) Jetpack_Options::get_option( 'id' ),
			strtolower( get_locale() ) // Defaults to en_US not en.
		);
	}

	/**
	 * Gets the domain to be used for the opt-out cookie.
	 * Use the site's custom domain, or if the site has a wordpress.com subdomain, use .wordpress.com to share the cookie.
	 *
	 * @return string The domain to set for the opt-out cookie.
	 */
	public static function get_cookie_domain() {
		$host = 'localhost';

		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$host = filter_var( wp_unslash( $_SERVER['HTTP_HOST'] ) );
		}

		return '.wordpress.com' === substr( $host, -strlen( '.wordpress.com' ) ) ? '.wordpress.com' : '.' . $host;
	}
}
