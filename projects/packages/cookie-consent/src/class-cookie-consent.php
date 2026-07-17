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
	 * CCPA page ID option name.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_ID_OPTION = 'jetpack_cookie_consent_ccpa_page_id';

	/**
	 * CCPA page created-once option name.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_CREATED_OPTION = 'jetpack_cookie_consent_ccpa_page_created';

	/**
	 * CCPA opt-out page slug.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_SLUG = 'your-privacy-choices';

	/**
	 * Post meta marker for CCPA pages created by this package.
	 *
	 * @var string
	 */
	private const CCPA_PAGE_CREATED_META = '_jetpack_cookie_consent_created_ccpa_page';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Resolved configuration, stashed on first access.
	 *
	 * @var array|null
	 */
	private static $config = null;

	/**
	 * Whether the required footer legal links were injected into a footer
	 * navigation block (Block Hooks) for the current rendered response.
	 *
	 * Set true by the navigation-link render filter when one of our hooked
	 * links renders; consulted by the wp_footer fallback to avoid duplicating
	 * the links on block themes that already received them.
	 *
	 * @var bool
	 */
	private static $footer_links_injected = false;

	/**
	 * Initialize the package. Idempotent; safe to call multiple times.
	 *
	 * Public entry point a consumer calls to activate cookie consent. Resolves
	 * and stashes the configuration, bails entirely when `enabled` is false, and
	 * otherwise registers each hook slice only when its `features.*` toggle is on.
	 *
	 * The first call latches, including when `enabled` is false: a disabled init is a
	 * sticky no-op, so a later caller cannot re-enable the feature within the same
	 * request. Only deactivate() clears the latch.
	 *
	 * @param array $config Partial consumer config, resolved via Config_Schema.
	 */
	public static function init( array $config = array() ) {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		$resolved          = self::resolve_config( $config );
		self::$config      = $resolved;
		if ( empty( $resolved['enabled'] ) ) {
			return;
		}

		$features = $resolved['features'];

		// Gate each shared frontend resource on every feature that needs it, not on the
		// banner alone — otherwise disabling the banner would break the CCPA opt-out button
		// and the footer "Manage Privacy Preferences" link, which reuse the same module and
		// modal. The consent-log route stays gated on `consent_log`; the frontend skips its
		// POST when that's off (see logger.ts).
		$needs_module = $features['banner'] || $features['ccpa_page'] || $features['footer_links'];
		$needs_modal  = $features['banner'] || $features['footer_links'];

		if ( $needs_module ) {
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		}

		if ( $needs_modal ) {
			// Also rendered for footer-links-only sites so the manage-preferences link can
			// reopen the modal; it only auto-shows when the banner feature is on (view.ts).
			add_action( 'wp_footer', array( __CLASS__, 'render_banner' ), 999 );
		}

		if ( $features['footer_links'] ) {
			// Classic-theme (and footer-nav-less block theme) fallback for the required
			// legal links. Runs late so any Block Hooks injection has already happened
			// and flipped self::$footer_links_injected.
			add_action( 'wp_footer', array( __CLASS__, 'maybe_render_footer_links_fallback' ), 999 );

			// Hook Privacy Policy and CCPA links into navigation blocks using Block Hooks API.
			add_filter( 'hooked_block_types', array( __CLASS__, 'register_footer_navigation_links' ), 10, 4 );
			add_filter( 'hooked_block_core/navigation-link', array( __CLASS__, 'set_footer_navigation_link_attributes' ), 10, 4 );
			add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'maybe_suppress_privacy_policy_link' ), 10, 2 );
			add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_gdpr_manage_preferences_directives' ), 10, 2 );
			// Flag that the required links were injected into a footer nav (covers all
			// three, including the Privacy Policy link which has no directive filter),
			// so the wp_footer fallback does not duplicate them.
			add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'mark_footer_links_injected' ), 10, 2 );
		}

		if ( $features['ccpa_page'] ) {
			// Create the CCPA opt-out page once (guarded), now that the Atomic
			// garden_site_provisioning hook is no longer available in this context.
			add_action( 'init', array( __CLASS__, 'maybe_create_ccpa_page' ) );
			add_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_ccpa_interactivity_directives' ), 10, 2 );

			// Add Interactivity API directive to CCPA opt-out button.
			add_filter( 'render_block_core/button', array( __CLASS__, 'add_ccpa_button_directive' ), 10, 2 );

			// Add Interactivity API directives to CCPA group block and inject snackbar.
			add_filter( 'render_block_core/group', array( __CLASS__, 'add_ccpa_group_directives' ), 10, 2 );

			// Exclude CCPA page from page-list block using get_pages filter.
			add_filter( 'get_pages', array( __CLASS__, 'exclude_ccpa_from_get_pages' ), 10, 2 );

			// Register the CCPA page id setting for REST access.
			add_action( 'rest_api_init', array( __CLASS__, 'register_ccpa_page_setting' ) );
		}

		if ( $features['geo'] ) {
			// Keep the geolocation cookies out of Jetpack Boost's page-cache key.
			add_filter( 'jetpack_boost_ignore_cookies', array( __CLASS__, 'ignore_geo_cookies_in_page_cache' ) );
		}

		if ( $features['consent_log'] ) {
			// Consent log REST controller: table, cron cleanup, routes.
			Consent_Log_Controller::init( $resolved['log'] );
		}
	}

	/**
	 * Deactivate Cookie Consent runtime hooks and scheduled events.
	 *
	 * Consumers should call this from their plugin deactivation hook. This keeps
	 * stored consent logs, CCPA page content, and options intact so a later
	 * reactivation can resume without data loss.
	 *
	 * @since $$next-version$$
	 */
	public static function deactivate() {
		// These mirror the full set of hooks init() can register across every
		// features.* toggle, and matter only when a consumer deactivates within
		// the same request (e.g. a runtime toggle). Removing a hook that a gated
		// init() never added is a harmless no-op, so this list stays unconditional
		// rather than re-deriving which toggles were on. The standard
		// register_deactivation_hook path runs in a separate admin request where
		// these hooks never fire, so the durable cleanup is the cron unschedule and
		// setting unregister below. Keep this list in sync with init() whenever a
		// hook is added there.
		remove_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		remove_action( 'wp_footer', array( __CLASS__, 'render_banner' ), 999 );
		remove_action( 'wp_footer', array( __CLASS__, 'maybe_render_footer_links_fallback' ), 999 );
		remove_action( 'init', array( __CLASS__, 'maybe_create_ccpa_page' ) );

		remove_filter( 'hooked_block_types', array( __CLASS__, 'register_footer_navigation_links' ), 10 );
		remove_filter( 'hooked_block_core/navigation-link', array( __CLASS__, 'set_footer_navigation_link_attributes' ), 10 );
		remove_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_ccpa_interactivity_directives' ), 10 );
		remove_filter( 'render_block_core/navigation-link', array( __CLASS__, 'maybe_suppress_privacy_policy_link' ), 10 );
		remove_filter( 'render_block_core/navigation-link', array( __CLASS__, 'add_gdpr_manage_preferences_directives' ), 10 );
		remove_filter( 'render_block_core/navigation-link', array( __CLASS__, 'mark_footer_links_injected' ), 10 );
		remove_filter( 'render_block_core/button', array( __CLASS__, 'add_ccpa_button_directive' ), 10 );
		remove_filter( 'render_block_core/group', array( __CLASS__, 'add_ccpa_group_directives' ), 10 );
		remove_filter( 'get_pages', array( __CLASS__, 'exclude_ccpa_from_get_pages' ), 10 );
		remove_action( 'rest_api_init', array( __CLASS__, 'register_ccpa_page_setting' ) );
		remove_filter( 'jetpack_boost_ignore_cookies', array( __CLASS__, 'ignore_geo_cookies_in_page_cache' ), 10 );

		if ( function_exists( 'unregister_setting' ) ) {
			unregister_setting( 'general', self::CCPA_PAGE_ID_OPTION );
		}

		Consent_Log_Controller::deactivate();
		self::$initialized = false;
	}

	/**
	 * Delete Cookie Consent artifacts owned by this package.
	 *
	 * Consumers should call this from their plugin uninstall hook. Consent logs
	 * are retained by default because they may be compliance records; pass true
	 * only when the consuming plugin has decided uninstall should delete them.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $delete_consent_logs Whether to drop the consent-log table.
	 */
	public static function uninstall( $delete_consent_logs = false ) {
		self::deactivate();
		self::delete_ccpa_page();
		Consent_Log_Controller::uninstall( $delete_consent_logs );
	}

	/**
	 * Delete the configured CCPA page and clear the CCPA options.
	 */
	private static function delete_ccpa_page() {
		$page_id = (int) get_option( self::CCPA_PAGE_ID_OPTION );

		if ( $page_id ) {
			$page = get_post( $page_id );
			if (
				$page
				&& 'page' === $page->post_type
				&& get_post_meta( $page_id, self::CCPA_PAGE_CREATED_META, true )
			) {
				wp_delete_post( $page_id, true );
			}
		}

		delete_option( self::CCPA_PAGE_ID_OPTION );
		delete_option( self::CCPA_PAGE_CREATED_OPTION );
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
		if ( get_option( self::CCPA_PAGE_CREATED_OPTION ) ) {
			return;
		}

		// A page already exists for the stored ID: record that and stop.
		$page_id = get_option( self::CCPA_PAGE_ID_OPTION );
		if ( $page_id && get_post( $page_id ) ) {
			update_option( self::CCPA_PAGE_CREATED_OPTION, 1 );
			return;
		}

		// Stale ID (option set but post gone): clear it before trying the slug.
		if ( $page_id && ! get_post( $page_id ) ) {
			delete_option( self::CCPA_PAGE_ID_OPTION );
		}

		// Fallback: adopt an existing page by slug (backwards compatibility).
		$page_slug = self::CCPA_PAGE_SLUG;
		$page      = get_page_by_path( $page_slug );
		if ( $page ) {
			update_option( self::CCPA_PAGE_ID_OPTION, $page->ID );
			update_option( self::CCPA_PAGE_CREATED_OPTION, 1 );
			return;
		}

		// Build the page content with blocks.
		$content = self::get_ccpa_page_content();
		$config  = self::get_config();
		$copy    = $config['copy'];

		// Create the page in a single call so the created-once flag is only set
		// once the full page (with content) has actually persisted. A two-step
		// insert-then-update would latch the flag before the content write, and a
		// failed update would leave a permanently published, empty page.
		$page_id = wp_insert_post(
			array(
				'post_title'     => $copy['ccpa_page_title'],
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
			update_post_meta( $page_id, self::CCPA_PAGE_CREATED_META, 1 );
			update_option( self::CCPA_PAGE_ID_OPTION, $page_id );
			update_option( self::CCPA_PAGE_CREATED_OPTION, 1 );
		}
	}

	/**
	 * Register the CCPA page id setting for REST API access.
	 */
	public static function register_ccpa_page_setting() {
		register_setting(
			'general',
			self::CCPA_PAGE_ID_OPTION,
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
		$country_code = $config['geo']['country_code_cookie'];
		$region       = $config['geo']['region_cookie'];
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
		$ccpa_page_id = get_option( self::CCPA_PAGE_ID_OPTION );
		if ( ! $ccpa_page_id ) {
			return false;
		}
		$page = get_post( $ccpa_page_id );
		return $page && 'publish' === $page->post_status;
	}

	/**
	 * Whether the CCPA "Your Privacy Choices" footer link should be surfaced.
	 *
	 * The opt-out page must be published AND the `ccpa_page` feature on. The link's
	 * region-gating interactivity directives (add_ccpa_interactivity_directives), its
	 * page-list exclusion (exclude_ccpa_from_get_pages), and the trashed-page 404 guard
	 * are all registered only inside init()'s ccpa_page branch, so injecting the link
	 * while that feature is off would render an unguarded, always-visible dead link.
	 *
	 * @return bool
	 */
	private static function ccpa_footer_link_enabled() {
		return self::ccpa_page_is_published() && ! empty( self::get_config()['features']['ccpa_page'] );
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
		// Get config for template (consumed by ccpa-content.php via include scope). $copy is
		// pre-resolved here so the template can use it directly instead of re-resolving via
		// get_copy() — the config is already stashed and fully normalized at this point.
		$config = self::get_config(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$copy   = $config['copy']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

		$ccpa_page_id = get_option( self::CCPA_PAGE_ID_OPTION );

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

		// Check CCPA page (must be published — a trashed page still resolves — and the
		// ccpa_page feature on, which owns the link's directives and page-list exclusion).
		if ( self::ccpa_footer_link_enabled() ) {
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

		$ccpa_page_exists = self::ccpa_footer_link_enabled();
		$ccpa_page_id     = get_option( self::CCPA_PAGE_ID_OPTION );

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
			$config                            = self::get_config();
			$hooked_block['attrs']['url']      = '#manage-preferences';
			$hooked_block['attrs']['label']    = $config['copy']['manage_preferences_link'];
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
	 * Mark that one of our required footer legal links was injected into a
	 * footer navigation block, so the wp_footer fallback does not duplicate it.
	 *
	 * Keyed on the metadata.name set by set_footer_navigation_link_attributes().
	 * Covers the Privacy Policy link too, which has no directive filter of its own.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The full block, including name and attributes.
	 * @return string Unmodified block content.
	 */
	public static function mark_footer_links_injected( $block_content, $block ) {
		if ( ! isset( $block['attrs']['metadata']['name'] ) ) {
			return $block_content;
		}

		$names = array(
			'jetpack-cookie-consent-privacy-policy-link',
			'jetpack-cookie-consent-ccpa-privacy-link',
			'jetpack-cookie-consent-gdpr-manage-preferences-link',
		);

		if ( in_array( $block['attrs']['metadata']['name'], $names, true ) ) {
			self::$footer_links_injected = true;
		}

		return $block_content;
	}

	/**
	 * Decide whether the floating footer-links fallback should render.
	 *
	 * Minimal gate modeled on Jetpack_Subscribe_Floating_Button::should_user_see_floating_button():
	 * frontend only, never on 404, and never in customizer/theme/post previews.
	 *
	 * @return bool True when the fallback control should be rendered.
	 */
	private static function should_show_fallback() {
		if ( is_admin() ) {
			return false;
		}

		if ( is_404() ) {
			return false;
		}

		// Don't show in customizer/theme/post previews.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['preview'] ) || isset( $_GET['theme_preview'] ) || isset( $_GET['customize_preview'] ) || isset( $_GET['hide_banners'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Get the published Privacy Policy page URL, or '' when none exists.
	 *
	 * @return string Privacy Policy permalink or empty string.
	 */
	private static function get_privacy_policy_url() {
		$privacy_policy_page_id = (int) get_option( 'wp_page_for_privacy_policy' );
		if ( ! $privacy_policy_page_id ) {
			return '';
		}

		$page = get_post( $privacy_policy_page_id );
		if ( ! $page || 'publish' !== $page->post_status ) {
			return '';
		}

		return (string) get_permalink( $privacy_policy_page_id );
	}

	/**
	 * Get the CCPA opt-out page URL and title, or empty strings when none exists.
	 *
	 * Mirrors the Block Hooks footer nav-link, which uses the CCPA page's own
	 * title (e.g. "Your Privacy Choices") as the link label.
	 *
	 * @return array{url: string, label: string} CCPA page URL and label.
	 */
	private static function get_ccpa_page_link() {
		if ( ! self::ccpa_page_is_published() ) {
			return array(
				'url'   => '',
				'label' => '',
			);
		}

		$ccpa_page_id = get_option( self::CCPA_PAGE_ID_OPTION );

		return array(
			'url'   => (string) get_permalink( $ccpa_page_id ),
			'label' => (string) get_the_title( $ccpa_page_id ),
		);
	}

	/**
	 * Render the classic-theme fallback for the required legal links.
	 *
	 * Bails when the Block Hooks footer-nav injection already ran for this
	 * response (self::$footer_links_injected) or when the visibility gate is
	 * false. Otherwise builds a fixed-corner floating control, processes its
	 * Interactivity directives, and echoes it — same pattern as render_banner().
	 */
	public static function maybe_render_footer_links_fallback() {
		if ( self::$footer_links_injected ) {
			return;
		}

		if ( ! self::should_show_fallback() ) {
			return;
		}

		$template_path = plugin_dir_path( __FILE__ ) . 'footer-links-fallback.php';
		if ( ! file_exists( $template_path ) ) {
			return;
		}

		// Resolve which links to show (same checks the Block Hooks path uses).
		// These are consumed by footer-links-fallback.php via the include scope.
		$privacy_policy_url = self::get_privacy_policy_url(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ccpa_link          = self::get_ccpa_page_link();
		$ccpa_url           = $ccpa_link['url']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ccpa_label         = $ccpa_link['label']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		ob_start();
		include $template_path;
		$html = ob_get_clean();

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_interactivity_process_directives( $html );
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

		$config = self::get_config();
		$copy   = $config['copy'];

		// Build the snackbar HTML.
		$snackbar_html = sprintf(
			'<div class="jetpack-cookie-consent-ccpa-snackbar" data-wp-bind--hidden="!state.showSnackbar">
				<div class="jetpack-cookie-consent-ccpa-snackbar__content">
					<span>%s</span>
					<button type="button" class="jetpack-cookie-consent-ccpa-snackbar__dismiss" data-wp-on--click="actions.dismissSnackbar" aria-label="%s">×</button>
				</div>
			</div>',
			esc_html( $copy['ccpa_snackbar_success'] ),
			esc_attr( $copy['ccpa_snackbar_dismiss_label'] )
		);

		// Insert the snackbar inside the group block (before the closing </div>).
		$closing_tag_pos = strrpos( $block_content, '</div>' );
		if ( false !== $closing_tag_pos ) {
			$block_content = substr_replace( $block_content, $snackbar_html, $closing_tag_pos, 0 );
		}

		return $block_content;
	}

	/**
	 * Get configured log versions.
	 *
	 * @return array Log version configuration.
	 */
	public static function get_log_versions() {
		$config     = self::get_config();
		$log_config = isset( $config['log'] ) && is_array( $config['log'] ) ? $config['log'] : array();

		return array(
			'policy_version' => self::normalize_log_version( $log_config['policy_version'] ?? '1', 'policy_version' ),
			'banner_version' => self::normalize_log_version( $log_config['banner_version'] ?? '1', 'banner_version' ),
		);
	}

	/**
	 * Normalize a configured log version value for callers.
	 *
	 * @param mixed  $version Version value from config.
	 * @param string $key     Config key being normalized, used for diagnostics.
	 * @return string Non-empty log version.
	 */
	private static function normalize_log_version( $version, $key ) {
		if ( is_scalar( $version ) ) {
			$normalized = sanitize_text_field( (string) $version );
			if ( '' !== $normalized ) {
				return $normalized;
			}
		}

		// A supplied value that isn't a usable version string would silently become the
		// default '1' on a proof-of-consent record, masking a misconfiguration. Surface it
		// so an integrating developer notices the configured value was dropped.
		_doing_it_wrong(
			__METHOD__,
			/* translators: %s is the log version configuration key. */
			esc_html( sprintf( __( 'Cookie consent log version for "%s" was ignored because it is not a non-empty scalar value.', 'jetpack-cookie-consent' ), $key ) ),
			''
		);

		return '1';
	}

	/**
	 * Resolve UI copy for a template, backfilling any missing keys with defaults.
	 *
	 * Templates normally receive a fully normalized `copy` group from get_config(),
	 * but they can also be included directly (tests, Storybook). Routing through this
	 * helper guarantees every key is present so a partial or absent `copy` array can't
	 * cause undefined-index access. An empty (the default) $config reads the already
	 * resolved and stashed get_config() instead of re-resolving from scratch.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $config Configuration array, which may lack a normalized `copy` group.
	 * @return array Copy with every key present.
	 */
	public static function get_copy( $config = array() ) {
		if ( empty( $config ) ) {
			return self::get_config()['copy'];
		}

		return Config_Schema::resolve( $config )['copy'];
	}

	/**
	 * Get normalized consent categories from a configuration array.
	 *
	 * An empty (the default) $config reads the already resolved and stashed
	 * get_config() instead of re-resolving from scratch.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $config Configuration array.
	 * @return array Normalized consent categories.
	 */
	public static function get_consent_categories( $config = array() ) {
		if ( empty( $config ) ) {
			return self::get_config()['consent']['categories'];
		}

		return Config_Schema::resolve( $config )['consent']['categories'];
	}

	/**
	 * Get the active configured consent category registry.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Normalized configured consent categories.
	 */
	public static function get_current_consent_categories() {
		$config = self::get_config();
		return $config['consent']['categories'];
	}

	/**
	 * Get the frontend preference key for a registry category key.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $key Registry category key.
	 * @return string Frontend preference key.
	 */
	public static function get_category_preference_key( $key ) {
		if ( 'functional' === $key ) {
			return 'required';
		}

		if ( 'marketing' === $key ) {
			return 'advertising';
		}

		return $key;
	}

	/**
	 * Get the Interactivity API category context object.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $categories Normalized category registry.
	 * @return array Category choices keyed by frontend preference key.
	 */
	public static function get_category_context( $categories ) {
		$context = array();

		foreach ( $categories as $category ) {
			$preference_key             = self::get_category_preference_key( $category['key'] );
			$context[ $preference_key ] = $category['required'] || $category['default_checked'];
		}

		return $context;
	}

	/**
	 * Convert normalized categories to the frontend config shape.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $categories Normalized category registry.
	 * @return array Frontend category registry.
	 */
	public static function get_frontend_consent_categories( $categories ) {
		$frontend_categories = array();

		foreach ( $categories as $category ) {
			$frontend_categories[] = array(
				'key'            => $category['key'],
				'preferenceKey'  => self::get_category_preference_key( $category['key'] ),
				'required'       => (bool) $category['required'],
				'defaultChecked' => (bool) $category['default_checked'],
				'wpConsentMap'   => array_values( $category['wp_consent_map'] ),
			);
		}

		return $frontend_categories;
	}

	/**
	 * Get package configuration, resolving and stashing it on first access.
	 *
	 * @internal This accessor is for package classes only and is not part of the public API.
	 *
	 * @return array Configuration array.
	 */
	public static function get_config() {
		if ( null === self::$config ) {
			self::$config = self::resolve_config();
		}

		return self::$config;
	}

	/**
	 * Resolve a partial config against the schema, let consumers filter the
	 * result, then re-resolve so any filtered value is re-validated.
	 *
	 * The consuming plugin injects its config through init(); this filter is the
	 * override point for other code on the site that does not own that init()
	 * call. Because the filtered array is resolved a second time, unknown or
	 * malformed values a filter returns are sanitized back to schema defaults
	 * rather than trusted verbatim. resolve() is idempotent, so re-resolving an
	 * unfiltered config is a no-op.
	 *
	 * @param array $config Partial consumer config.
	 * @return array Fully resolved, filtered, and re-validated config.
	 */
	private static function resolve_config( array $config = array() ) {
		$resolved = Config_Schema::resolve( $config );

		/**
		 * Filters the resolved Cookie Consent configuration.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $resolved The fully resolved configuration array.
		 */
		$filtered = apply_filters( 'jetpack_cookie_consent_config', $resolved );

		return Config_Schema::resolve( is_array( $filtered ) ? $filtered : $resolved );
	}

	/**
	 * Enqueue scripts and styles
	 */
	public static function enqueue_assets() {
		// Don't load in admin.
		if ( is_admin() ) {
			return;
		}

		$config   = self::get_config();
		$features = $config['features'];

		// init() registers this only when a consent UI feature needs the runtime, so no bail
		// here. w.js (Tracks) is loaded by the module on the frontend, gated on consent
		// (tracks-utils.ts); PHP must never enqueue it here.

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
		$frontend_categories = self::get_frontend_consent_categories( $config['consent']['categories'] );

		$config_data = array(
			'apiUrl'      => rest_url( 'jetpack/v4/cookie-consent/consent-log' ),
			'eventPrefix' => $config['event_prefix'],
			'features'    => $config['features'],
		);

		// Only expose a REST nonce to logged-in visitors, so the consent logger can
		// authenticate and record the real user_id. Anonymous visitors deliberately get
		// none: their pages are full-page-cached, a cached nonce would go stale and make
		// core reject the request (rest_cookie_invalid_nonce). Without a nonce core treats
		// the request as anonymous and stores user_id = 0, which is correct for them.
		if ( is_user_logged_in() ) {
			$config_data['nonce'] = wp_create_nonce( 'wp_rest' );
		}
		$config_data['categories'] = $frontend_categories;

		// Pass REST API URL and Tracks event prefix to the module via global config.
		wp_print_inline_script_tag(
			sprintf(
				'window.jetpackCookieConsentConfig = %s;',
				wp_json_encode(
					$config_data,
					JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
				)
			),
			array( 'id' => 'jetpack-cookie-consent-config' )
		);

		// Check for preview query parameter.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$force_preview = isset( $_GET['preview_cookie_consent'] ) && '1' === $_GET['preview_cookie_consent'];

		$frontend_config = array(
			'cookiePolicyUrl' => $config['links']['cookie_policy_url'],
			'gdprHonorsGpc'   => $config['gdpr_honors_gpc'] ?? true,
			'forcePreview'    => $force_preview,
			'geoEnabled'      => (bool) $features['geo'],
			// Always emit the full geo sub-array, even when the geo feature is off:
			// the banner JS dereferences config.geo unconditionally, so omitting it
			// (rather than gating on geoEnabled) would break the module.
			'geo'             => array(
				'provider'          => $config['geo']['provider'],
				'apiUrl'            => $config['geo']['api_url'],
				'countryCodeCookie' => $config['geo']['country_code_cookie'],
				'regionCookie'      => $config['geo']['region_cookie'],
				'cookieDuration'    => $config['geo']['cookie_duration'],
				'gdprCountries'     => $config['geo']['gdpr_countries'],
				'ccpaRegions'       => $config['geo']['ccpa_regions'],
				'showOnError'       => $config['geo']['show_on_error'],
			),
		);

		// Pass configuration to frontend using wp_interactivity_config.
		wp_interactivity_config( 'jetpack/cookie-consent', $frontend_config );
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
			// $copy/$categories are pre-resolved here so the template can use them directly
			// instead of re-resolving via get_copy()/get_consent_categories() — the config is
			// already stashed and fully normalized at this point.
			$config     = self::get_config(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$copy       = $config['copy']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$categories = $config['consent']['categories']; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			ob_start();
			include $template_path;
			$html = ob_get_clean();
			// Process directives and output.
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo wp_interactivity_process_directives( $html );
		}
	}
}
