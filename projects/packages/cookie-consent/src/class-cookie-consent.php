<?php
/**
 * Cookie Consent
 *
 * GDPR-compliant cookie consent controls implementation using the WordPress Interactivity API.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use WP_HTML_Tag_Processor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cookie Consent class
 */
class Cookie_Consent {

	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package. Idempotent; safe to call multiple times.
	 *
	 * Public entry point a consumer calls to activate cookie consent. Registers
	 * the front-end controls (banner, CCPA flow, enqueue) and boots the consent
	 * log REST controller (table creation, cron scheduling, route registration).
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( __CLASS__, 'render_banner' ), 999 );

		// Create the CCPA opt-out page once (guarded), now that the Atomic
		// garden_site_provisioning hook is no longer available in this context.
		add_action( 'init', array( __CLASS__, 'maybe_create_ccpa_page' ) );

		// Hook Privacy Policy and CCPA links into navigation blocks using Block Hooks API.
		add_filter( 'hooked_block_types', array( __CLASS__, 'register_footer_navigation_links' ), 10, 4 );
		add_filter( 'hooked_block_core/navigation-link', array( __CLASS__, 'set_footer_navigation_link_attributes' ), 10, 4 );
		add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_ccpa_interactivity_directives' ), 10, 2 );
		add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'maybe_suppress_privacy_policy_link' ), 10, 2 );
		add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_gdpr_manage_preferences_directives' ), 10, 2 );

		// Add Interactivity API directive to CCPA opt-out button.
		add_filter( 'render_block_core/button', array( __CLASS__, 'add_ccpa_button_directive' ), 10, 2 );

		// Add Interactivity API directives to CCPA group block and inject snackbar.
		add_filter( 'render_block_core/group', array( __CLASS__, 'add_ccpa_group_directives' ), 10, 2 );

		// Exclude CCPA page from page-list block using get_pages filter.
		add_filter( 'get_pages', array( __CLASS__, 'exclude_ccpa_from_get_pages' ), 10, 2 );

		// Register the CCPA page id setting for REST access.
		add_action( 'rest_api_init', array( __CLASS__, 'register_ccpa_page_setting' ) );

		// Keep the geolocation cookies out of Jetpack Boost's page-cache key.
		add_filter( 'jetpack_boost_ignore_cookies', array( __CLASS__, 'ignore_geo_cookies_in_page_cache' ) );

		// Consent log REST controller: table, cron cleanup, routes.
		Consent_Log_Controller::init();
	}

	/**
	 * Create the CCPA opt-out page at most once per site.
	 *
	 * Once the created-once flag is set, the page is never recreated — even if
	 * the site owner later deletes it.
	 */
	public static function maybe_create_ccpa_page() {
		// Create the page at most once per site. Once we have created or adopted
		// a page, never recreate it — even if the owner later deletes it.
		if ( get_option( 'jetpack_cookie_consent_ccpa_page_created' ) ) {
			return;
		}

		// A page already exists for the stored ID: record that and stop.
		$page_id = get_option( 'jetpack_cookie_consent_ccpa_page_id' );
		if ( $page_id && get_post( $page_id ) ) {
			update_option( 'jetpack_cookie_consent_ccpa_page_created', 1 );
			return;
		}

		// Stale ID (option set but post gone): clear it before trying the slug.
		if ( $page_id && ! get_post( $page_id ) ) {
			delete_option( 'jetpack_cookie_consent_ccpa_page_id' );
		}

		// Fallback: adopt an existing page by slug (backwards compatibility).
		$page_slug = 'your-privacy-choices';
		$page      = get_page_by_path( $page_slug );
		if ( $page ) {
			update_option( 'jetpack_cookie_consent_ccpa_page_id', $page->ID );
			update_option( 'jetpack_cookie_consent_ccpa_page_created', 1 );
			return;
		}

		// Build the page content with blocks.
		$content = self::get_ccpa_page_content();

		// Create the page in a single call so the created-once flag is only set
		// once the full page (with content) has actually persisted. A two-step
		// insert-then-update would latch the flag before the content write, and a
		// failed update would leave a permanently published, empty page.
		$page_id = wp_insert_post(
			array(
				'post_title'     => __( 'Your Privacy Choices', 'jetpack-cookie-consent' ),
				'post_name'      => $page_slug,
				'post_status'    => 'publish',
				'post_type'      => 'page',
				'post_content'   => $content,
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			)
		);

		// Store the page ID and mark as created.
		if ( $page_id && ! is_wp_error( $page_id ) ) {
			update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );
			update_option( 'jetpack_cookie_consent_ccpa_page_created', 1 );
		}
	}

	/**
	 * Register the CCPA page id setting for REST API access.
	 */
	public static function register_ccpa_page_setting() {
		register_setting(
			'general',
			'jetpack_cookie_consent_ccpa_page_id',
			array(
				'show_in_rest' => true,
				'type'         => 'integer',
				'description'  => __( 'CCPA opt-out page ID', 'jetpack-cookie-consent' ),
			)
		);
	}

	/**
	 * Exclude the geolocation cookies from Jetpack Boost's page-cache key.
	 *
	 * Geo is resolved client-side, so the server response is identical for every
	 * visitor. Boost keys its cache on the full cookie set, so leaving the
	 * `country_code`/`region` cookies in would spawn a separate cache file per
	 * region and make returning visitors miss the cache. They never affect the
	 * server-rendered HTML, so it is safe to ignore them.
	 *
	 * @param array $cookies Regex patterns Boost removes from the cache key.
	 * @return array Patterns with the geolocation cookies appended.
	 */
	public static function ignore_geo_cookies_in_page_cache( $cookies ) {
		$config       = self::get_config();
		$country_code = $config['country_code_cookie'] ?? 'country_code';
		$region       = $config['region_cookie'] ?? 'region';
		$cookies[]    = preg_quote( $country_code, '/' );
		$cookies[]    = preg_quote( $region, '/' );

		return $cookies;
	}

	/**
	 * Whether the auto-created CCPA page exists and is published.
	 *
	 * A trashed page still resolves via get_post(), so callers must check the
	 * status too — otherwise links would point at a trashed page and 404.
	 *
	 * @return bool
	 */
	private static function ccpa_page_is_published() {
		$ccpa_page_id = get_option( 'jetpack_cookie_consent_ccpa_page_id' );
		if ( ! $ccpa_page_id ) {
			return false;
		}
		$page = get_post( $ccpa_page_id );
		return $page && 'publish' === $page->post_status;
	}

	/**
	 * Whether the site's Privacy Policy page exists and is published.
	 *
	 * Mirrors ccpa_page_is_published(): a trashed page still resolves via
	 * get_post(), so the status must be checked too.
	 *
	 * @return bool
	 */
	private static function privacy_policy_is_published() {
		$privacy_policy_page_id = (int) get_option( 'wp_page_for_privacy_policy' );
		if ( ! $privacy_policy_page_id ) {
			return false;
		}
		$page = get_post( $privacy_policy_page_id );
		return $page && 'publish' === $page->post_status;
	}

	/**
	 * Get CCPA page content in block format
	 *
	 * @return string Page content with WordPress blocks
	 */
	private static function get_ccpa_page_content() {
		$template_path = plugin_dir_path( __FILE__ ) . 'ccpa-content.php';

		if ( ! file_exists( $template_path ) ) {
			return '';
		}

		ob_start();
		include $template_path;
		return ob_get_clean();
	}

	/**
	 * Exclude CCPA page from get_pages() results
	 *
	 * @param \WP_Post[] $pages Array of page objects.
	 * @return \WP_Post[] Filtered array of page objects.
	 */
	public static function exclude_ccpa_from_get_pages( $pages ) {
		if ( is_admin() ) {
			// In admin, include the CCPA page in the results.
			return $pages;
		}

		$ccpa_page_id = get_option( 'jetpack_cookie_consent_ccpa_page_id' );

		if ( ! $ccpa_page_id || empty( $pages ) ) {
			return $pages;
		}

		// Filter out the CCPA page from the results.
		return array_filter(
			$pages,
			function ( $page ) use ( $ccpa_page_id ) {
				return (int) $page->ID !== (int) $ccpa_page_id;
			}
		);
	}

	/**
	 * Register Privacy Policy and CCPA navigation links as hooked blocks
	 *
	 * @param array                    $hooked_block_types Array of hooked block types.
	 * @param string                   $relative_position  The relative position.
	 * @param string                   $anchor_block_type  The anchor block type.
	 * @param \WP_Block_Template|array $context            The block template, template part, or pattern.
	 * @return array Modified array of hooked block types.
	 */
	public static function register_footer_navigation_links( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
		// Only hook to navigation blocks.
		if ( 'core/navigation' !== $anchor_block_type ) {
			return $hooked_block_types;
		}

		// Only hook as last child.
		if ( 'last_child' !== $relative_position ) {
			return $hooked_block_types;
		}

		// Only hook in footer template parts.
		if ( ! is_array( $context ) || ! isset( $context['slug'] ) || ! str_contains( $context['slug'], '/footer' ) ) {
			return $hooked_block_types;
		}

		// Check which pages exist and register appropriate blocks.
		$privacy_policy_exists = false;
		$ccpa_page_exists      = false;

		// Check Privacy Policy page (must be published — a trashed page still resolves).
		if ( self::privacy_policy_is_published() ) {
			$privacy_policy_exists = true;
		}

		// Check CCPA page (must be published — a trashed page still resolves).
		if ( self::ccpa_page_is_published() ) {
			$ccpa_page_exists = true;
		}

		// Register one block for each page that exists.
		if ( $privacy_policy_exists ) {
			$hooked_block_types[] = 'core/navigation-link';
		}
		if ( $ccpa_page_exists ) {
			$hooked_block_types[] = 'core/navigation-link';
		}

		// Register GDPR "Manage Privacy Preferences" link (visibility handled client-side).
		$hooked_block_types[] = 'core/navigation-link';

		return $hooked_block_types;
	}

	/**
	 * Set attributes for hooked footer navigation links (Privacy Policy and CCPA)
	 *
	 * @param array|null $hooked_block The hooked block, or null to suppress.
	 * @return array|null Modified hooked block.
	 */
	public static function set_footer_navigation_link_attributes( $hooked_block ) {
		// Track which blocks we've processed.
		static $privacy_policy_processed     = false;
		static $ccpa_processed               = false;
		static $manage_preferences_processed = false;

		// Has the hooked block been suppressed by a previous filter?
		if ( null === $hooked_block ) {
			return $hooked_block;
		}

		// If another filter already set metadata, skip this block.
		if ( isset( $hooked_block['attrs']['metadata']['name'] ) ) {
			return $hooked_block;
		}

		// Check which pages exist (same logic as registration).
		$privacy_policy_page_id = (int) get_option( 'wp_page_for_privacy_policy' );
		$privacy_policy_exists  = self::privacy_policy_is_published();

		$ccpa_page_exists = self::ccpa_page_is_published();
		$ccpa_page_id     = get_option( 'jetpack_cookie_consent_ccpa_page_id' );

		// Process Privacy Policy first (if it exists and hasn't been processed).
		if ( $privacy_policy_exists && ! $privacy_policy_processed ) {
			$hooked_block['attrs']['url']      = get_permalink( $privacy_policy_page_id );
			$hooked_block['attrs']['label']    = get_the_title( $privacy_policy_page_id );
			$hooked_block['attrs']['kind']     = 'custom';
			$hooked_block['attrs']['metadata'] = array(
				'name' => 'jetpack-cookie-consent-privacy-policy-link',
			);
			$privacy_policy_processed          = true;
			return $hooked_block;
		}

		// Process CCPA next (if it exists and hasn't been processed).
		if ( $ccpa_page_exists && ! $ccpa_processed ) {
			$hooked_block['attrs']['url']      = get_permalink( $ccpa_page_id );
			$hooked_block['attrs']['label']    = get_the_title( $ccpa_page_id );
			$hooked_block['attrs']['kind']     = 'custom';
			$hooked_block['attrs']['metadata'] = array(
				'name' => 'jetpack-cookie-consent-ccpa-privacy-link',
			);
			$ccpa_processed                    = true;
			return $hooked_block;
		}

		// Process GDPR "Manage Privacy Preferences" link last.
		if ( ! $manage_preferences_processed ) {
			$hooked_block['attrs']['url']      = '#manage-preferences';
			$hooked_block['attrs']['label']    = __( 'Manage Privacy Preferences', 'jetpack-cookie-consent' );
			$hooked_block['attrs']['kind']     = 'custom';
			$hooked_block['attrs']['metadata'] = array(
				'name' => 'jetpack-cookie-consent-gdpr-manage-preferences-link',
			);
			$manage_preferences_processed      = true;
			return $hooked_block;
		}

		// If we get here, all have been processed or don't exist.
		return $hooked_block;
	}

	/**
	 * Add Interactivity API directives to the CCPA navigation link for conditional rendering
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Modified block content.
	 */
	public static function add_ccpa_interactivity_directives( $block_content, $block ) {
		// Check if this is our CCPA link by looking for our metadata marker.
		if ( ! isset( $block['attrs']['metadata']['name'] ) || 'jetpack-cookie-consent-ccpa-privacy-link' !== $block['attrs']['metadata']['name'] ) {
			return $block_content;
		}

		// If the CCPA page is gone or unpublished (e.g. the owner trashed or
		// deleted it), suppress the link instead of rendering a dead 404. This
		// covers persisted hooked links that bypass the injection-time gate.
		if ( ! self::ccpa_page_is_published() ) {
			return '';
		}

		// Use WP_HTML_Tag_Processor to safely add Interactivity API directives.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		// Find the first <li> tag (the navigation item wrapper).
		if ( $tags->next_tag( 'li' ) ) {
			// Add Interactivity API directives to the <li>.
			$tags->set_attribute( 'data-wp-interactive', 'jetpack/cookie-consent' );
			$tags->set_attribute( 'data-wp-context', '{"isCcpaRegion": false}' );
			$tags->set_attribute( 'data-wp-class--jetpack-cookie-consent-ccpa-privacy-link-hidden', '!state.isCcpaRegion' );
			$tags->set_attribute( 'data-wp-init', 'callbacks.init' );

			return $tags->get_updated_html();
		}

		return $block_content;
	}

	/**
	 * Suppress the hooked Privacy Policy link when its page is gone or unpublished.
	 *
	 * Making the Privacy Policy page deletable (the deletion lock was removed)
	 * means a persisted, Site-Editor-materialized footer link can outlive the
	 * page and 404. The injection-time gate only runs for non-persisted hooks, so
	 * this render-time guard mirrors the CCPA one to avoid a dead link.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Modified block content.
	 */
	public static function maybe_suppress_privacy_policy_link( $block_content, $block ) {
		// Only act on our hooked Privacy Policy link.
		if ( ! isset( $block['attrs']['metadata']['name'] ) || 'jetpack-cookie-consent-privacy-policy-link' !== $block['attrs']['metadata']['name'] ) {
			return $block_content;
		}

		if ( ! self::privacy_policy_is_published() ) {
			return '';
		}

		return $block_content;
	}

	/**
	 * Add Interactivity API directives to the GDPR "Manage Privacy Preferences" link
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Modified block content.
	 */
	public static function add_gdpr_manage_preferences_directives( $block_content, $block ) {
		// Check if this is our manage preferences link by looking for our metadata marker.
		if ( ! isset( $block['attrs']['metadata']['name'] ) || 'jetpack-cookie-consent-gdpr-manage-preferences-link' !== $block['attrs']['metadata']['name'] ) {
			return $block_content;
		}

		// Use WP_HTML_Tag_Processor to safely add Interactivity API directives.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		// Find the first <li> tag (the navigation item wrapper).
		if ( $tags->next_tag( 'li' ) ) {
			// Add Interactivity API directives to the <li>.
			$tags->set_attribute( 'data-wp-interactive', 'jetpack/cookie-consent' );
			$tags->set_attribute( 'data-wp-context', '{"isGdprManageLink": false}' );
			$tags->set_attribute( 'data-wp-class--jetpack-cookie-consent-gdpr-manage-link-hidden', '!context.isGdprManageLink' );
			$tags->set_attribute( 'data-wp-init', 'callbacks.init' );
			$tags->add_class( 'jetpack-cookie-consent-gdpr-manage-link-hidden' );
		}

		// Find the <a> tag and add click handler.
		if ( $tags->next_tag( 'a' ) ) {
			$tags->set_attribute( 'data-wp-on--click', 'actions.openManagePreferences' );
		}

		return $tags->get_updated_html();
	}

	/**
	 * Add Interactivity API directive to CCPA opt-out button
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Modified block content.
	 */
	public static function add_ccpa_button_directive( $block_content, $block ) {
		// Check if this button has the CCPA opt-out class.
		if ( ! isset( $block['attrs']['className'] ) || false === strpos( $block['attrs']['className'], 'jetpack-cookie-consent-ccpa-opt-out-button' ) ) {
			return $block_content;
		}

		// Use WP_HTML_Tag_Processor to safely add the directive.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		// Find the button element with the wp-block-button__link class.
		if ( $tags->next_tag( array( 'class_name' => 'wp-block-button__link' ) ) ) {
			$tags->set_attribute( 'data-wp-on--click', 'actions.optOut' );
			return $tags->get_updated_html();
		}

		return $block_content;
	}

	/**
	 * Add Interactivity API directives to CCPA group block and inject snackbar
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Modified block content.
	 */
	public static function add_ccpa_group_directives( $block_content, $block ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		// Check if this group block has the CCPA opt-out section class.
		if ( ! isset( $block['attrs']['className'] ) || false === strpos( $block['attrs']['className'], 'jetpack-cookie-consent-ccpa-opt-out-section' ) ) {
			return $block_content;
		}

		// Use WP_HTML_Tag_Processor to add Interactivity API directives.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		// Find the group div.
		if ( $tags->next_tag( array( 'class_name' => 'wp-block-group' ) ) ) {
			$tags->set_attribute( 'data-wp-interactive', 'jetpack/cookie-consent' );
			$tags->set_attribute( 'data-wp-context', '{"showSnackbar": false}' );
			$block_content = $tags->get_updated_html();
		}

		// Build the snackbar HTML.
		$snackbar_html = sprintf(
			'<div class="jetpack-cookie-consent-ccpa-snackbar" data-wp-bind--hidden="!state.showSnackbar">
				<div class="jetpack-cookie-consent-ccpa-snackbar__content">
					<span>%s</span>
					<button type="button" class="jetpack-cookie-consent-ccpa-snackbar__dismiss" data-wp-on--click="actions.dismissSnackbar" aria-label="%s">×</button>
				</div>
			</div>',
			esc_html__( 'Your browser has been successfully opted out from sharing personal data.', 'jetpack-cookie-consent' ),
			esc_attr__( 'Dismiss', 'jetpack-cookie-consent' )
		);

		// Insert the snackbar inside the group block (before the closing </div>).
		$closing_tag_pos = strrpos( $block_content, '</div>' );
		if ( false !== $closing_tag_pos ) {
			$block_content = substr_replace( $block_content, $snackbar_html, $closing_tag_pos, 0 );
		}

		return $block_content;
	}

	/**
	 * Get configuration with filters
	 *
	 * @return array Configuration array
	 */
	private static function get_config() {
		$default_config = array(
			'geo_api_url'         => 'https://public-api.wordpress.com/geo/',
			'geo_cookie_duration' => 6 * HOUR_IN_SECONDS, // 6 hours.
			'country_code_cookie' => 'country_code',
			'region_cookie'       => 'region',
			'cookie_policy_url'   => 'https://automattic.com/cookies/',
			'gdpr_countries'      => array(
				// European Member countries.
				'AT', // Austria.
				'BE', // Belgium.
				'BG', // Bulgaria.
				'CY', // Cyprus.
				'CZ', // Czech Republic.
				'DE', // Germany.
				'DK', // Denmark.
				'EE', // Estonia.
				'ES', // Spain.
				'FI', // Finland.
				'FR', // France.
				'GR', // Greece.
				'HR', // Croatia.
				'HU', // Hungary.
				'IE', // Ireland.
				'IT', // Italy.
				'LT', // Lithuania.
				'LU', // Luxembourg.
				'LV', // Latvia.
				'MT', // Malta.
				'NL', // Netherlands.
				'PL', // Poland.
				'PT', // Portugal.
				'RO', // Romania.
				'SE', // Sweden.
				'SI', // Slovenia.
				'SK', // Slovakia.
				'GB', // United Kingdom.
				// Single Market Countries that GDPR applies to.
				'CH', // Switzerland.
				'IS', // Iceland.
				'LI', // Liechtenstein.
				'NO', // Norway.
			),
			'ccpa_regions'        => array(
				/* US regions/states that are treated like California for Do Not Sell requests. */
				'california',
				'utah',
				'virginia',
				'colorado',
				'connecticut',
				'texas',
				'tennessee',
				'oregon',
				'new jersey',
				'montana',
				'iowa',
				'indiana',
				'delaware',
			),
			'show_on_error'       => true, // Show banner if geolocation fails.
			'event_prefix'        => 'jetpack', // Tracks event name prefix; set to 'woocommerceanalytics' for Unified Analytics continuity.
		);

		/**
		 * Filter cookie consent configuration
		 *
		 * @param array $config Configuration array
		 */
		return apply_filters( 'jetpack_cookie_consent_config', $default_config );
	}

	/**
	 * Enqueue scripts and styles
	 */
	public static function enqueue_assets() {
		// Don't load in admin.
		if ( is_admin() ) {
			return;
		}

		// Load Automattic Tracks (w.js) for analytics.
		// External script, version managed by Automattic - no version needed.
		wp_enqueue_script(
			'jetpack-cookie-consent-tracks',
			'https://stats.wp.com/w.js',
			array(),
			gmdate( 'YW' ),
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		// Register and enqueue the Interactivity API script module built by webpack.
		// Only the build version is read from the asset file; module dependencies are
		// declared explicitly. Script modules may only depend on other script modules,
		// so the asset file's `dependencies` (which can include classic scripts such as
		// `wp-polyfill`) must not be forwarded to wp_register_script_module().
		$asset_file = __DIR__ . '/../build/modules/cookie-consent/index.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array();
		$version    = $asset['version'] ?? self::PACKAGE_VERSION;
		$module_url = plugins_url( 'build/modules/cookie-consent/index.js', __DIR__ );
		$module_id  = '@automattic/jetpack-cookie-consent';

		wp_register_script_module(
			$module_id,
			$module_url,
			array( '@wordpress/interactivity' ),
			$version
		);
		wp_enqueue_script_module( $module_id );

		// Enqueue the module's compiled styles.
		$style_url = plugins_url( 'build/modules/cookie-consent/index.css', __DIR__ );
		wp_enqueue_style(
			'jetpack-cookie-consent',
			$style_url,
			array(),
			$version
		);

		// Resolve the configured Tracks event prefix once so it can be shared below.
		$config = self::get_config();

		// Pass REST API URL and Tracks event prefix to the module via global config.
		wp_print_inline_script_tag(
			sprintf(
				'window.jetpackCookieConsentConfig = %s;',
				wp_json_encode(
					array(
						'apiUrl'      => rest_url( 'jetpack/v4/cookie-consent/consent-log' ),
						'eventPrefix' => $config['event_prefix'],
					),
					JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
				)
			),
			array( 'id' => 'jetpack-cookie-consent-config' )
		);

		// Check for preview query parameter.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$force_preview = isset( $_GET['preview_cookie_consent'] ) && '1' === $_GET['preview_cookie_consent'];

		// Pass configuration to frontend using wp_interactivity_config.
		wp_interactivity_config(
			'jetpack/cookie-consent',
			array(
				'geoApiUrl'         => $config['geo_api_url'],
				'geoCookieDuration' => $config['geo_cookie_duration'],
				'countryCodeCookie' => $config['country_code_cookie'],
				'regionCookie'      => $config['region_cookie'],
				'cookiePolicyUrl'   => $config['cookie_policy_url'],
				'gdprCountries'     => $config['gdpr_countries'],
				'ccpaRegions'       => $config['ccpa_regions'],
				'showOnError'       => $config['show_on_error'],
				'forcePreview'      => $force_preview,
			)
		);
	}

	/**
	 * Render the cookie consent banner
	 */
	public static function render_banner() {
		// Don't render in admin.
		if ( is_admin() ) {
			return;
		}

		// Always render the banner/modal HTML so the "Manage Privacy Preferences" footer link
		// can reopen the modal after consent has been set. The banner visibility is controlled
		// client-side via Interactivity API directives (showBanner starts as false).
		$template_path = plugin_dir_path( __FILE__ ) . 'cookie-banner-content.php';
		if ( file_exists( $template_path ) ) {
			// Get config for template (consumed by cookie-banner-content.php via include scope).
			$config = self::get_config(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			ob_start();
			include $template_path;
			$html = ob_get_clean();
			// Process directives and output.
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo wp_interactivity_process_directives( $html );
		}
	}
}
