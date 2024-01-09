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
	const CMP_JS_DIR = 'js/cmp/v2/';

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

		setcookie( self::COOKIE_NAME, $consent, time() + YEAR_IN_SECONDS, '/', self::get_cookie_domain() );

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
		$meta                      = self::get_vendor_meta_by_language( $language_code, $gvl_specification_version );
		$module_path               = plugin_dir_url( __DIR__ ) . self::CMP_JS_DIR; // TODO: Test this as a relative URL, for better caching?
		$gvl_path                  = sprintf( 'https://public-api.wordpress.com/wpcom/v2/sites/%d/cmp/v%d/vendors/%s/', get_current_blog_id(), $gvl_specification_version, $language_code );

		// Switch to supported language or fallback to English.
		switch_to_locale( $language_code );

		$vendors_count = $meta['meta']['vendors_count'] ?? 0;
		$intro         = self::get_intro( $vendors_count );

		$output = array(
			'gvlVersion'         => $meta['vendor_list_version'],
			'consentLanguage'    => strtoupper( substr( $language_code, 0, 2 ) ),
			'locale'             => $language_code,
			// 'vendorsAll'         => $meta['meta']['vendors_encoded'],
			// 'vendorsLegInterest' => $meta['meta']['vendors_legitimate_interests_encoded'],
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
				'_inc/build/wordads/js/cmp/v2/cmp-stub.min.js',
				'modules/wordads/js/cmp/v2/cmp-stub.js'
			),
			array(),
			self::CMP_VERSION,
			false
		);

		wp_enqueue_script(
			'cmp-script',
			Assets::get_file_url_for_environment(
				'_inc/build/wordads/js/cmp/v2/cmp.bundle.min.js',
				'modules/wordads/js/cmp/v2/cmp.bundle.js'
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
				'_inc/build/wordads/js/cmp/v2/cmp-non-gdpr.min.js',
				'modules/wordads/js/cmp/v2/cmp-non-gdpr.js'
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

		// Disable if stickered.
		// if ( has_blog_sticker( 'wordads-cmp-disable', get_current_blog_id() ) ) {
		// 	return false;
		// }

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
	 * Gets a list of purposes to surface through the UI.
	 *
	 * @return int[] A list of allowed purpose IDs (as defined by IAB).
	 */
	public static function get_allowed_purposes(): array {
		return self::ALLOWED_PURPOSES;
	}

	/**
	 * Gets a list of supported GVL specification versions.
	 *
	 * @return int[] The list of supported GVL specification versions.
	 */
	public static function get_supported_gvl_specification_versions(): array {
		return self::SUPPORTED_GVL_SPECIFICATION_VERSIONS;
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
	 * Gets GVL data along with translated UI text to be used by the front-end React application.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return array GVL data and translated UI text.
	 * @throws Exception Throws if the data lookup fails.
	 */
	public static function get_gvl_data( string $language_code, int $gvl_specification_version ): array {

		// Grab the most recent translated purposes data for the provided language.
		try {
			$purposes_data = self::get_purposes_by_language( $language_code, $gvl_specification_version );
		} catch ( Exception $e ) {
			throw $e;
		}

		// Grab the vendor list data for the vendor list version associated with the translated purposes.
		$vendor_list_version = $purposes_data['vendor_list_version'];

		try {
			$vendors_data = self::get_vendors_by_version( $vendor_list_version, $gvl_specification_version );
		} catch ( Exception $e ) {
			throw $e;
		}

		// Set the correct language for the translations.
		switch_to_locale( $language_code );

		$translated = $purposes_data['translated'];

		$purpose_intro = __( '<p>As part of our advertising program, we and our advertising partners collect and use your information for the purposes listed below. For some purposes, we or our partners require your consent before we will use your information in the way described. Use the checkbox next to each purpose to customize your consent preferences. Declining consent means we will not use your data for that purpose and you may see less relevant ads.</p><p>Some of the personal data processed by us or our partners is done based on a legitimate interest in the processing. That means it does not require your consent, but you have the right to object to it. Expand each purpose below to learn more about this type of processing; if you wish to object to the processing you can use the corresponding toggle.</p>', 'jetpack' );
		$partner_intro = __( 'Below is a list of partners we work with, or may work with in the future, for our ads program. Expand each partner to learn more about them, and use the corresponding partner checkbox to set your preference. Please note that partners you do not consent to may still process some of your personal data when they believe they have a legitimate interest in doing so; you have the right to object to this legitimate interest processing using the corresponding toggle.', 'jetpack' );

		$results = array(
			'purposes'        => $translated['purposes'],
			'specialPurposes' => $translated['specialPurposes'],
			'features'        => $translated['features'],
			'specialFeatures' => $translated['specialFeatures'],
			'vendors'         => $vendors_data['vendors'],
			'_'               => array(
				'purposeIntro'         => $purpose_intro,
				'purposes'             => __( 'Purposes', 'jetpack' ),
				'featureIntro'         => __( 'In addition to the above purposes, your personal data may be used in the following ways.', 'jetpack' ),
				'features'             => __( 'Features', 'jetpack' ),
				'legInterest'          => __( 'Legitimate Interest', 'jetpack' ),
				'purposeOptOut'        => __( 'Some of your personal data may still be processed, even if you deselect this purpose, if we or our partners believe we have a legitimate interest in doing so. You can object to this legitimate interest processing using the corresponding toggle.', 'jetpack' ),
				'partners'             => __( 'Partners', 'jetpack' ),
				'partnerIntro'         => $partner_intro,
				'consentPurposes'      => __( 'Consent Purposes', 'jetpack' ),
				'requiredPurposes'     => __( 'Required Purposes', 'jetpack' ),
				'legInterestPurposes'  => __( 'Legitimate Interest Purposes', 'jetpack' ),
				'vendorOptOut'         => __( 'If you do not consent to this partner\'s use of your data for the above purposes, they will still process your data for the following purposes based on a legitimate interest. You can object to this legitimate interest processing using the corresponding toggle.', 'jetpack' ),
				'acceptAll'            => __( 'Agree to All', 'jetpack' ),
				'rejectAll'            => __( 'Disagree to All', 'jetpack' ),
				'save'                 => __( 'Agree to Selected', 'jetpack' ),
				'discard'              => __( 'Discard Changes', 'jetpack' ),
				'back'                 => __( 'Back', 'jetpack' ),
				'selectAll'            => __( 'Select All', 'jetpack' ),
				'viewPartners'         => __( 'View Partners', 'jetpack' ),
				'viewPurposes'         => __( 'View Purposes', 'jetpack' ),
				'privacyPolicy'        => __( 'View Privacy Policy', 'jetpack' ),
				'details'              => _x( 'Learn More', 'CMP banner', 'jetpack' ),
				'deviceStorage'        => __( 'Device Storage', 'jetpack' ),
				'usesCookies'          => __( 'Uses Cookies', 'jetpack' ),
				'maxCookieAge'         => __( 'Maximum Cookie Age', 'jetpack' ),
				'usesNonCookieStorage' => __( 'Uses Non-Cookie Storage', 'jetpack' ),
				'session'              => __( 'Session', 'jetpack' ),
				'yes'                  => __( 'Yes', 'jetpack' ),
				'no'                   => __( 'No', 'jetpack' ),
				'identifier'           => __( 'Identifier', 'jetpack' ),
				'type'                 => __( 'Type', 'jetpack' ),
				'maxAge'               => __( 'Max Age', 'jetpack' ),
				'domain'               => __( 'Domain', 'jetpack' ),
				'year'                 => array( __( 'year', 'jetpack' ), __( 'years', 'jetpack' ) ),
				'day'                  => array( __( 'day', 'jetpack' ), __( 'days', 'jetpack' ) ),
				'hour'                 => array( __( 'hour', 'jetpack' ), __( 'hours', 'jetpack' ) ),
				'minute'               => array( __( 'minute', 'jetpack' ), __( 'minutes', 'jetpack' ) ),
				'second'               => array( __( 'second', 'jetpack' ), __( 'seconds', 'jetpack' ) ),
			),
		);

		// GVL v3 includes additional data.
		if ( 3 === $gvl_specification_version ) {
			$results['dataCategories'] = $translated['dataCategories'];
			$results['_']              = array_merge(
				$results['_'],
				array(
					// translators: %1$s - number of our partners that use the user data for the selected purpose.
					'partnersUtilizingPurpose'            => __( '%1$s of our partners use your data for this purpose.', 'jetpack' ),
					// translators: %1$s - number of our partners that require legitimate interest for the selected purpose.
					'partnersUtilizingLegitimateInterest' => __( '%1$s of them rely on legitimate interest.', 'jetpack' ),
					'dataDeclarations'                    => __( 'Types of Data Collected', 'jetpack' ),
					'dataRetentionPeriod'                 => __( 'Data Retention Period', 'jetpack' ),
					'duration'                            => __( 'Duration', 'jetpack' ),
					'purpose'                             => __( 'Purpose', 'jetpack' ),
					'illustrationsCaption'                => __( 'Example(s) of how this purpose might be used:', 'jetpack' ),
				)
			);
		}

		// Reset language.
		restore_current_locale();

		return $results;
	}

	/**
	 * Clears the caches used for GVL data.
	 *
	 * This method is called by WordAds_CMP_GVL_Ingestion after fetching the latest GVL data to clear out old data.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version to clear cache for.
	 */
	public static function clear_purpose_cache( string $language_code, int $gvl_specification_version ) {
		$meta_cache_key     = self::get_meta_cache_key( $language_code, $gvl_specification_version );
		$purposes_cache_key = self::get_purposes_cache_key( $language_code, $gvl_specification_version );

		wp_cache_delete( $meta_cache_key, self::CACHE_GROUP );
		wp_cache_delete( $purposes_cache_key, self::CACHE_GROUP );
	}

	/**
	 * Used to filter the language code before we look it up in the database.
	 *
	 * This is useful to combine language variants for which we have only one IAB translation e.g. Portuguese and Portuguese - Brazilian.
	 *
	 * @param string $language_code The language code to filter.
	 * @param int    $gvl_specification_version The GVL specification version to use.
	 *
	 * @return string The filtered language code.
	 */
	private static function filter_language_code_for_lookup( string $language_code, int $gvl_specification_version ): string {

		// GVL v2.
		if ( 2 === $gvl_specification_version ) {
			// Special handling for Portuguese. The IAB translations should be used for both Portuguese and Portuguese - Brazilian.
			if ( 'pt-br' === $language_code ) {
				$language_code = 'pt';
			}
		}

		// GVL v3.
		if ( 3 === $gvl_specification_version ) {
			// Special handling for Portuguese. GVL uses `pt-pt` instead of `pt`.
			if ( 'pt' === $language_code ) {
				$language_code = 'pt-pt';
			}
		}

		return $language_code;
	}

	/**
	 * Gets translated purpose text.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return array Translated purposes.
	 * @throws Exception If purposes cannot be loaded from the database.
	 */
	private static function get_purposes_by_language( string $language_code, int $gvl_specification_version ): array {

		$language_code = self::filter_language_code_for_lookup( $language_code, $gvl_specification_version );

		$cache_key = self::get_purposes_cache_key( $language_code, $gvl_specification_version );
		$purposes  = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false === $purposes ) {
			global $wpdb;
			$result = $wpdb->get_row( $wpdb->prepare( 'SELECT vendor_list_version, translated_json FROM wordads_gvl_translations WHERE language_code = %s AND gvl_specification_version = %d ORDER BY vendor_list_version DESC LIMIT 1', $language_code, $gvl_specification_version ), ARRAY_A );

			if ( null === $result ) {
				throw new Exception( sprintf( 'Could not load purposes with language code %s and GVL specification version %d from the database', $language_code, $gvl_specification_version ) );
			}

			$purposes = array(
				'vendor_list_version' => $result['vendor_list_version'],
				'translated'          => json_decode( $result['translated_json'], true ),
			);

			wp_cache_set( $cache_key, $purposes, self::CACHE_GROUP );
		}

		return $purposes;
	}

	/**
	 * Gets GVL vendor data.
	 *
	 * @param int $vendor_list_version The version used for lookup.
	 * @param int $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return array Vendor data.
	 * @throws Exception If the vendors cannot be loaded from the database.
	 */
	private static function get_vendors_by_version( int $vendor_list_version, int $gvl_specification_version ): array {
		$cache_key = self::get_vendors_cache_key( $vendor_list_version, $gvl_specification_version );
		$vendors   = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false === $vendors ) {
			global $wpdb;
			$result = $wpdb->get_row( $wpdb->prepare( 'SELECT vendor_list_version, vendors_json FROM wordads_gvl WHERE vendor_list_version = %d AND gvl_specification_version = %d', $vendor_list_version, $gvl_specification_version ), ARRAY_A );

			if ( null === $result ) {
				throw new Exception( sprintf( 'Could not load vendors with list version %d and GVL specification version %d from the database', $vendor_list_version, $gvl_specification_version ) );
			}

			$vendors = array(
				'vendor_list_version' => $result['vendor_list_version'],
				'vendors'             => json_decode( $result['vendors_json'], true ),
			);

			wp_cache_set( $cache_key, $vendors, self::CACHE_GROUP );
		}

		return $vendors;
	}

	/**
	 * Gets metadata for the vendor list.
	 *
	 * This metadata is output to the page as configuration in a script tag. It's used by the React front-end
	 * to avoid having to load the full GVL data when on the happy path of accepting all consent.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return array The GVL meta data.
	 */
	private static function get_vendor_meta_by_language( string $language_code, int $gvl_specification_version ): array {

		$language_code = self::filter_language_code_for_lookup( $language_code, $gvl_specification_version );

		$cache_key = self::get_meta_cache_key( $language_code, $gvl_specification_version );
		$meta      = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false === $meta ) {
			global $wpdb;
			$result = $wpdb->get_row( $wpdb->prepare( 'SELECT t.vendor_list_version, vendors_meta FROM wordads_gvl_translations t INNER JOIN wordads_gvl v ON t.vendor_list_version = v.vendor_list_version AND t.gvl_specification_version = v.gvl_specification_version  WHERE t.language_code = %s AND t.gvl_specification_version = %d ORDER BY t.vendor_list_version DESC LIMIT 1', strtoupper( $language_code ), $gvl_specification_version ), ARRAY_A );
			$meta   = array(
				'vendor_list_version' => $result['vendor_list_version'],
				'meta'                => json_decode( $result['vendors_meta'], true ),
			);
			wp_cache_set( $cache_key, $meta, self::CACHE_GROUP );
		}

		return $meta;
	}

	/**
	 * Gets the cache key used for reading/writing GVL metadata.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return string The cache key.
	 */
	private static function get_meta_cache_key( string $language_code, int $gvl_specification_version ): string {
		return sprintf( 'gvl_meta_%s_%d', $language_code, $gvl_specification_version );
	}

	/**
	 * Gets the cache key used for reading/writing purpose data.
	 *
	 * @param string $language_code The language code used for lookup.
	 * @param int    $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return string The cache key.
	 */
	private static function get_purposes_cache_key( string $language_code, int $gvl_specification_version ): string {
		return sprintf( 'gvl_purposes_%s_%d', $language_code, $gvl_specification_version );
	}

	/**
	 * Gets the cache key used for reading/writing vendor data.
	 *
	 * @param int $vendor_list_version The version used for lookup.
	 * @param int $gvl_specification_version The GVL specification version used for lookup.
	 *
	 * @return string The cache key.
	 */
	private static function get_vendors_cache_key( int $vendor_list_version, int $gvl_specification_version ): string {
		return sprintf( 'gvl_vendors_%d_%d', $vendor_list_version, $gvl_specification_version );
	}

	/**
	 * Gets the domain name to set the cookie under.  All *.wordpress.com sites will set the
	 * cookie on the .wordpress.com domain for shared consent.
	 *
	 * @return string The domain name used to set the cookie.
	 */
	private static function get_cookie_domain(): string {

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

		if ( isset( $_GET['country'] ) && preg_match( '|^[A-Za-z]{2}$|', sanitize_text_field( wp_unslash( $_GET['country'] ) ) ) ) {
			return strtoupper( sanitize_text_field( wp_unslash( $_GET['country'] ) ) );
		} elseif ( isset( $_SERVER['GEOIP_COUNTRY_CODE'] ) ) {
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
