<?php
/**
 * WordAds Consent Management Provider
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

/**
 * Class WordAds_Consent_Management_Provider
 *
 * This is an IAB TCF v2.2 compatible implementation of a [Consent Management Provider](https://iabeurope.eu/transparency-consent-framework/)
 * to comply with GDPR requirements for privacy and transparency related to advertising.
 *
 * The repository for the CMP front-end JS can be found at: https://github.com/Automattic/cmp
 * Build with `yarn build` then create a Phabricator patch to deploy the assets in the `/dist` folder to WPCOM.
 */
class WordAds_Consent_Management_Provider {

	/**
	 * The build version of the JS files to use.
	 */
	const CMP_VERSION = '2.1.0';

	/**
	 * The relative path of the directory containing the CMP JS build files.
	 */
	const CMP_JS_DIR = 'jetpack/modules/wordads/js/cmp/v2/';

	/**
	 * The default [purposes](https://iabeurope.eu/iab-europe-transparency-consent-framework-policies/#A_Purposes) the CMP will surface for getting consent.
	 */
	const ALLOWED_PURPOSES = array( 1, 2, 3, 4, 7, 9, 10 );

	/**
	 * The versions for which we have the GVL records.
	 */
	const SUPPORTED_GVL_SPECIFICATION_VERSIONS = array( 2, 3 );

	/**
	 * IAB specified cookie name for storing the consent string.
	 */
	const COOKIE_NAME = 'euconsent-v2';

	/**
	 * Locales for which we have translated languages.
	 */
	const SUPPORTED_LANGUAGES = array(
		'English'                => 'en',
		'German'                 => 'de',
		'Spanish'                => 'es',
		'French'                 => 'fr',
		'Italian'                => 'it',
		'Dutch'                  => 'nl',
		'Polish'                 => 'pl',
		'Portuguese'             => 'pt',
		'Portuguese - Brazilian' => 'pt-br',
		'Russian'                => 'ru',
	);

	/**
	 * Group name for retrieving data from the cache. This is set as a global group for shared access across blogs.
	 */
	const CACHE_GROUP = 'wordads_cmp';

	/**
	 * Initializes loading of the frontend framework.
	 */
	public static function init() {

		// Need separate Batcache cached pages for GDPR/non-GDPR countries.
		self::enable_caching();

		// Early out if not a test blog.
		if ( ! self::is_feature_enabled() ) {
			return;
		}

		// Only display the banner if the visitor is from a GDPR country.
		if ( ! self::does_gdpr_apply() ) {
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_non_gdpr_frontend_scripts' ) );

			return;
		}

		// Prevent Cookies & Consent banner from displaying when the CMP is active.
		add_filter( 'jetpack_disable_eu_cookie_law_widget', '__return_true' );

		// Enqueue scripts.
		add_action( 'wp_head', array( __CLASS__, 'insert_head' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend_scripts' ) );
	}

	/**
	 * Vary cache for GDPR/Non-GDPR visitors.
	 */
	public static function enable_caching() {
		if ( function_exists( 'vary_cache_on_function' ) ) {
			vary_cache_on_function(
				'return in_array( $_SERVER[ "GEOIP_COUNTRY_CODE" ], array(' .
				'"AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", ' .
				'"FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", ' .
				'"LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", ' .
				'"SI", "ES", "SE", "GB", "AX", "IC", "EA", "GF", "PF", ' .
				'"TF", "GI", "GP", "GG", "JE", "MQ", "YT", "NC", "RE", ' .
				'"BL", "MF", "PM", "SJ", "VA", "WF", "EZ", "CH" ' .
				') );'
			);
		}
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
		check_ajax_referer( 'gdpr_set_consent', 'security' );

		if ( ! isset( $_POST['consent'] ) ) {
			wp_send_json_error();
		}

		// TODO: Is there better sanitizing we can do here?
		$consent = trim( wp_unslash( $_POST['consent'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		setcookie( self::COOKIE_NAME, $consent, time() + YEAR_IN_SECONDS, '/', self::get_cookie_domain(), is_ssl(), true );

		// Log consent request.
		$valid_consent_types = array( 'accept_all', 'reject_all', 'custom' );
		$type                = 'unknown';

		if ( isset( $_POST['type'] ) ) {
			$post_type = strtolower( sanitize_text_field( wp_unslash( $_POST['type'] ) ) );

			if ( in_array( $post_type, $valid_consent_types, true ) ) {
				$type = $post_type;
			}
		}

		bump_stats_extras( 'wordads_cmp_consent', $type );

		wp_send_json_success( true );
	}

	/**
	 * Outputs the frontend Javascript framework configuration.
	 */
	public static function insert_head() {

		$nonce = wp_create_nonce( 'gdpr_set_consent' );

		$gvl_specification_version = self::get_default_gvl_specification_version();
		$language_code             = self::get_site_language_code();
		$meta                      = array();
		$module_path               = 'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/'; // consider version query param?
		$gvl_path                  = sprintf( 'https://public-api.wordpress.com/wpcom/v2/sites/%d/cmp/v%d/vendors/%s/', get_current_blog_id(), $gvl_specification_version, $language_code );

		// Switch to supported language or fallback to English.
		switch_to_locale( $language_code );

		$vendors_count = $meta['meta']['vendors_count'] ?? 0;
		$intro         = self::get_intro( $vendors_count );

		$output = array(
			'gvlVersion'         => $meta['vendor_list_version'],
			'consentLanguage'    => strtoupper( substr( $language_code, 0, 2 ) ),
			'locale'             => $language_code,
			'vendorsAll'         => 'EGpq_4__7a_t_y9e_T9ujzGr_vsffdiGIML5Nn3AuRd635OC--wmZom3VtTBUyJAl27IJCAto5M6iKsULVECteY9jEgzkCZpRPwMkA5iL2zrAQvN8zFsfyBTPP9P7u7_Oyf_v7t_27ueefqs9-73r9zsrhETrXPto_8_7aJTf3ZD3v_f3_F-npv9cm37yat__r19_ev139v____v_v__4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAg',
			'vendorsLegInterest' => 'EGoAsw0KiAPsiQkItBwigQAiCsICKBAAAACQNEBACQMCnYGAS6wkQAgRQADBACAAFGQAIAABIAEIgAkAKBAABAIBAAAAAAIBAAwMAA4ALQQCAAEB0DFMKABQLCBIzIiFMCEKBIICWygQSAoEFcIAixwIoBETBQAIAkAFYAAALFYDEEgJWJBAlhBtAAAQAIBRShUIpOjAEMCZstVOKJtGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAg',
			'ajaxNonce'          => $nonce,
			'modulePath'         => $module_path,
			'gvlPath'            => $gvl_path,
			'_'                  => array(
				'title'        => __( 'Privacy & Cookies', 'jetpack' ),
				'intro'        => $intro,
				'config'       => _x( 'Learn More', 'CMP banner', 'jetpack' ),
				'accept'       => __( 'I Agree!', 'jetpack' ),
				'viewPartners' => __( 'View Partners', 'jetpack' ),
				'error'        => __( 'We\'re sorry but an unexpected error occurred. Please try again later.', 'jetpack' ),
			),
		);

		echo '<script id="cmp-configuration" type="application/configuration">' . wp_json_encode( $output ) . '</script>';

		// Restore locale.
		restore_current_locale();
	}

	/**
	 * Enqueues the main frontend Javascript.
	 */
	public static function enqueue_frontend_scripts() {
		wp_enqueue_script(
			'cmp-script-stub',
			Assets::get_file_url_for_environment(
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp-stub.js',
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp-stub.js'
			),
			array(),
			self::CMP_VERSION,
			false
		);

		wp_enqueue_script(
			'cmp-script',
			Assets::get_file_url_for_environment(
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp.bundle.js',
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp.bundle.js'
			),
			array(),
			self::CMP_VERSION,
			true
		);
	}

	/**
	 * Enqueues the frontend Javascript for a minimal CMP that always sets gdprApplies = false.
	 */
	public static function enqueue_non_gdpr_frontend_scripts() {
		wp_enqueue_script(
			'cmp-script-stub',
			Assets::get_file_url_for_environment(
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp-non-gdpr.js',
				'https://s0.wp.com/wp-content/blog-plugins/wordads-classes/js/cmp/v2/cmp-non-gdpr.js'
			),
			array(),
			self::CMP_VERSION,
			false
		);
	}

	/**
	 * Works as a feature flag to enable the GDPR banner.  Can remove after testing.
	 *
	 * @return bool True if the feature should be enabled on selected test blogs.
	 */
	public static function is_feature_enabled(): bool {

		// Enable for all sites.
		return true;
	}

	/**
	 * Check if the visitor is from a country that requires GDPR.
	 *
	 * @return bool True if the visitor's country requires GDPR.
	 */
	public static function does_gdpr_apply(): bool {
		$country_code = self::get_country_code();

		return 'none' === $country_code || wpcom_country_is_within_gdpr_zone( $country_code );
	}

	/**
	 * Gets a list of supported languages for which the UI is translated.
	 *
	 * @return string[] An array of valid Language => Language codes.
	 */
	public static function get_supported_languages(): array {
		return self::SUPPORTED_LANGUAGES;
	}

	/**
	 * Checks if the language is supported.
	 *
	 * @param string $language_code The language code to check.
	 *
	 * @return bool True if the language is supported.
	 */
	public static function is_supported_language( string $language_code ): bool {
		return in_array( strtolower( $language_code ), self::get_supported_languages(), true );
	}

	/**
	 * Get the default GVL specification version.
	 *
	 * @return int The minimal GVL specification version.
	 */
	public static function get_default_gvl_specification_version(): int {
		return max( self::SUPPORTED_GVL_SPECIFICATION_VERSIONS );
	}

	/**
	 * Gets the domain name to set the cookie under.  All *.wordpress.com sites will set the
	 * cookie on the .wordpress.com domain for shared consent.
	 *
	 * @return string The domain name used to set the cookie.
	 */
	private static function get_cookie_domain(): string {

		// Do we need this as it's .wordpress.com shared cookie?
		$cookie_domain  = '';
		$primary_domain = get_primary_redirect( get_current_blog_id() );

		// If this is a *.wordpress.com domain use shared consent -- unless it's a WordAds site.
		if ( '' !== $primary_domain && '.wordpress.com' === substr( $primary_domain, - strlen( '.wordpress.com' ) ) && ! has_blog_sticker( 'wordads', get_current_blog_id() ) ) {
			$cookie_domain = '.wordpress.com';
		}

		return $cookie_domain;
	}

	/**
	 * Gets the language code used by the site.
	 *
	 * @return string The language code set for this site.
	 */
	private static function get_site_language_code(): string {

		$language_code = strtolower( get_locale() );

		// Default to English if language is not supported.
		if ( ! self::is_supported_language( $language_code ) ) {
			return 'en';
		}

		return $language_code;
	}

	/**
	 * Gets the visitor's country code.
	 *
	 * @return string The two-letter country code (uppercase) or 'none'.
	 */
	private static function get_country_code(): string {

		// Try to find the country code in the following order:
		// 1. Set as a parameter in the query string.
		// 2. The country code identified by the Nginx geolocation module.

		if ( isset( $_SERVER['GEOIP_COUNTRY_CODE'] ) ) {
			return sanitize_text_field( wp_unslash( $_SERVER['GEOIP_COUNTRY_CODE'] ) );
		} else {
			return 'none';
		}
	}

	/**
	 * Returns the intro text.
	 *
	 * @param int|null $vendors_count The number of vendors.
	 *
	 * @return string The intro text.
	 */
	private static function get_intro( int $vendors_count ): string {
		/* translators: 1: Total number of partners. */
		$intro = sprintf( __( 'We and our %1$s advertising partners store and/or access information on your device and also process personal data, like unique identifiers, browsing activity, and other standard information sent by your device including your IP address. This information is collected over time and used for personalised ads, ad measurement, audience insights, and product development specific to our ads program. If this sounds good to you, select "I Agree!" below. Otherwise, you can get more information, customize your consent preferences, or decline consent by selecting "Learn More". Note that your preferences apply only to this website. If you change your mind in the future you can update your preferences anytime by visiting the Privacy link displayed under each ad or by using the "Privacy" option in the Action Bar located at the bottom-right corner of the screen. One last thing, our partners may process some of your data based on legitimate interests instead of consent but you can object to that by choosing "Learn More" and then disabling the Legitimate Interests toggle under any listed Purpose or Partner.', 'jetpack' ), $vendors_count );

		return $intro;
	}
}
