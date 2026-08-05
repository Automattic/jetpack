<?php
/**
 * The SEO dashboard's read-only REST routes and the payload builders behind
 * them — one route per data-backed tab, preloaded onto the page so a normal
 * load resolves them with no request.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Jetpack_SEO_Utils;

/**
 * Registers the dashboard's read routes and builds their payloads.
 */
class Dashboard_Data {

	/**
	 * Map of read-only dashboard routes: tab slug => data-builder callable. The
	 * single source of truth for both the registered routes and the paths
	 * preloaded onto the page, so the two can't drift.
	 *
	 * @return array<string, callable>
	 */
	private static function rest_reads() {
		return array(
			'overview' => array( __CLASS__, 'get_overview_data' ),
			'settings' => array( __CLASS__, 'get_settings_data' ),
			'ai'       => array( __CLASS__, 'get_ai_data' ),
			'content'  => array( __CLASS__, 'get_content_data' ),
		);
	}

	/**
	 * REST paths the dashboard reads its initial state from, preloaded into the
	 * page (see {@see Admin_Page::inject_script_data()}) and fetched by the app.
	 *
	 * @return string[]
	 */
	public static function rest_read_paths() {
		return array_map(
			static function ( $slug ) {
				return '/jetpack/v4/seo/' . $slug;
			},
			array_keys( self::rest_reads() )
		);
	}

	/**
	 * Register the read-only REST routes the dashboard hydrates from — one per
	 * data-backed tab, each returning the same builder payload previously injected
	 * synchronously onto the page. Read-only and gated to the page's own
	 * `manage_options`; writes still go through their existing endpoints.
	 *
	 * @return void
	 */
	public static function register_rest_reads() {
		foreach ( self::rest_reads() as $slug => $builder ) {
			register_rest_route(
				'jetpack/v4',
				'/seo/' . $slug,
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => static function () use ( $builder ) {
						return rest_ensure_response( call_user_func( $builder ) );
					},
					'permission_callback' => array( __CLASS__, 'reads_permission_check' ),
				)
			);
		}
	}

	/**
	 * Capability gate for the dashboard's read routes — the same `manage_options`
	 * the SEO admin page itself requires.
	 *
	 * @return bool
	 */
	public static function reads_permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Expose the core `blog_public` option to the REST settings endpoint.
	 *
	 * Search-engine visibility is a WordPress core option, not a Jetpack one,
	 * so the Settings tab saves it through `/wp/v2/settings` — which only
	 * round-trips settings registered with `show_in_rest`. The core settings
	 * controller enforces the `manage_options` capability on writes.
	 *
	 * @return void
	 */
	public static function register_rest_settings() {
		register_setting(
			'reading',
			'blog_public',
			array(
				'show_in_rest' => true,
				'type'         => 'integer',
				'default'      => 1,
			)
		);
	}

	/**
	 * Build the aggregated Overview state the dashboard renders.
	 *
	 * @return array
	 */
	public static function get_overview_data() {
		$modules = new Modules();
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$seo_enabled = class_exists( 'Jetpack_SEO_Utils' ) && Jetpack_SEO_Utils::is_enabled_jetpack_seo();

		$codes = get_option( 'verification_services_codes', array() );
		if ( ! is_array( $codes ) ) {
			$codes = array();
		}

		return array(
			'site_visibility'   => array(
				'search_engines_visible' => (int) get_option( 'blog_public', 1 ) === 1,
				// Read the durable SEO option (seeded/synced from the `sitemaps` module
				// by the Jetpack plugin) so the state survives the module's removal. The
				// reachable sitemap URL + "View" link live on the Settings tab.
				'sitemap_active'         => self::is_sitemap_enabled( $modules ),
				'seo_tools_active'       => $modules->is_active( 'seo-tools' ),
			),
			// Per-service booleans (a code is set or not) for the Overview's
			// Site verification card.
			'site_verification' => array(
				'google'    => ! empty( $codes['google'] ),
				'bing'      => ! empty( $codes['bing'] ),
				'pinterest' => ! empty( $codes['pinterest'] ),
				'yandex'    => ! empty( $codes['yandex'] ),
				'facebook'  => ! empty( $codes['facebook'] ),
			),
			'content_coverage'  => Content_Coverage::get(),
			'plan'              => array(
				'seo_enabled_for_site' => $seo_enabled,
			),
		);
	}

	/**
	 * Build the editable Settings state the Settings tab hydrates from.
	 *
	 * Read-only bootstrap only. Most writes go through the existing
	 * `/jetpack/v4/settings` REST endpoint, which already validates and
	 * sanitizes those flat fields. Nested Schema writes use the package's
	 * schema-settings route; bootstrapping them here keeps the Settings UI
	 * hydrated without a second request.
	 *
	 * @return array
	 */
	public static function get_settings_data() {
		$modules = new Modules();

		// Read the stored values directly: Jetpack_SEO_Titles::get_custom_title_formats()
		// intentionally hides them while another SEO plugin controls output, but the
		// dashboard must still show the saved values without allowing edits.
		$title_formats = get_option( 'advanced_seo_title_formats', array() );
		if ( ! is_array( $title_formats ) ) {
			$title_formats = array();
		}
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$title_formats_editable = class_exists( 'Jetpack_SEO_Utils' ) && Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$front_page_desc = class_exists( 'Jetpack_SEO_Utils' ) ? Jetpack_SEO_Utils::get_front_page_meta_description() : '';

		// A site that set a front-page description back when it was free for all
		// WordPress.com Simple sites keeps editing it, even when otherwise plan-gated:
		// the value stays live and `Jetpack_SEO_Utils` still reads/writes it via the
		// legacy option. The gated Settings uses this to keep that one field editable.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$has_legacy_front_page_meta = class_exists( 'Jetpack_SEO_Utils' ) && (bool) Jetpack_SEO_Utils::has_legacy_front_page_meta();

		$codes = get_option( 'verification_services_codes', array() );
		if ( ! is_array( $codes ) ) {
			$codes = array();
		}

		$sitemap_active = self::is_sitemap_enabled( $modules );

		return array(
			'search_engines_visible'     => (int) get_option( 'blog_public', 1 ) === 1,
			// Read the durable SEO option (seeded/synced from the `sitemaps` module
			// by the Jetpack plugin) so the state survives the module's removal.
			'sitemap_active'             => $sitemap_active,
			// The reachable sitemap URL (Jetpack serves a valid sitemap here as soon as
			// it's on + the site is public), or '' when sitemaps are off, so the Settings
			// tab shows the "View sitemap" link exactly when there's a sitemap to view.
			'sitemap_url'                => self::get_reachable_sitemap_url( $sitemap_active ),
			// Read the durable SEO option (seeded/synced from the `canonical-urls` module
			// by the Jetpack plugin) so the state survives the module's removal.
			'canonical_active'           => self::is_canonical_enabled( $modules ),
			// Cast to object so an empty format set serializes as `{}`, not `[]`.
			'title_formats'              => (object) $title_formats,
			// Separator WordPress joins default document-title parts with. A page type
			// with no stored format keeps the default title: `get_custom_title()` returns
			// the incoming value untouched, so core composes the title itself and the
			// Settings tab replays that composition to preview it.
			'title_separator'            => self::get_default_title_separator(),
			'title_formats_editable'     => $title_formats_editable,
			'front_page_description'     => (string) $front_page_desc,
			'has_legacy_front_page_meta' => $has_legacy_front_page_meta,
			'verification_tools_active'  => $modules->is_active( 'verification-tools' ),
			'verification'               => array(
				'google'    => isset( $codes['google'] ) ? (string) $codes['google'] : '',
				'bing'      => isset( $codes['bing'] ) ? (string) $codes['bing'] : '',
				'pinterest' => isset( $codes['pinterest'] ) ? (string) $codes['pinterest'] : '',
				'yandex'    => isset( $codes['yandex'] ) ? (string) $codes['yandex'] : '',
				'facebook'  => isset( $codes['facebook'] ) ? (string) $codes['facebook'] : '',
			),
			'schema'                     => Schema_Settings::get_editable(),
		);
	}

	/**
	 * Build the Google site-verification state for the Settings tab.
	 *
	 * The Settings verification card lets a connected user verify with Google via a
	 * WordPress.com keyring OAuth popup (in addition to pasting a meta-tag code). This
	 * bootstraps the keyring connect URL and whether the current user is connected —
	 * the live verified status is fetched client-side from `/jetpack/v4/verify-site/google`
	 * (a wpcom round-trip we don't want to make on every page load).
	 *
	 * Both `Keyring_Helper` (Publicize package) and the connection `Manager` are provided
	 * by the host Jetpack plugin, so they're guarded with `class_exists` like the
	 * `Jetpack_SEO_*` helpers. On a disconnected self-hosted site `is_connected` is false
	 * and the UI falls back to manual code entry only.
	 *
	 * @return array
	 */
	public static function get_google_verify_data() {
		$connect_url = '';
		if ( class_exists( 'Automattic\\Jetpack\\Publicize\\Keyring_Helper' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- guarded; Publicize package is provided by the host plugin.
			$connect_url = (string) \Automattic\Jetpack\Publicize\Keyring_Helper::connect_url( 'google_site_verification', 'other' );
		}

		$is_connected = false;
		if ( class_exists( 'Automattic\\Jetpack\\Connection\\Manager' ) ) {
			$is_connected = ( new \Automattic\Jetpack\Connection\Manager() )->is_user_connected();
		}

		return array(
			'connect_url'  => $connect_url,
			'is_connected' => (bool) $is_connected,
		);
	}

	/**
	 * Build the AI tab's initial state.
	 *
	 * The AI SEO Enhancer auto-generates SEO titles/descriptions/alt-text in the
	 * editor (the generation itself is wpcom/AI-Assistant side); this exposes only
	 * its persisted on/off toggle and whether it's available. Availability mirrors
	 * the legacy Traffic page: the `ai_seo_enhancer_enabled` feature filter must be
	 * on (it still depends on AI being available) AND the site's plan must support
	 * the `ai-seo-enhancer` feature. The toggle writes through the existing
	 * `/jetpack/v4/settings` endpoint (`ai_seo_enhancer_enabled`).
	 *
	 * @return array
	 */
	public static function get_ai_data() {
		$filter_on = (bool) apply_filters( 'ai_seo_enhancer_enabled', true );

		// Current_Plan comes from the jetpack-plans package (a dependency of this
		// package since the plan-gating work), so it's always available here; the
		// class_exists guard is kept as belt-and-suspenders for older bundled snapshots.
		$plan_supports = class_exists( 'Automattic\\Jetpack\\Current_Plan' )
			&& \Automattic\Jetpack\Current_Plan::supports( 'ai-seo-enhancer' );

		return array(
			'enhancer' => array(
				'available' => $filter_on && $plan_supports,
				'enabled'   => (bool) get_option( 'ai_seo_enhancer_enabled', false ),
			),
			'llmsTxt'  => array(
				'enabled'  => Llms_Txt::is_enabled(),
				'url'      => home_url( '/llms.txt' ),
				'canServe' => Llms_Txt::can_serve(),
			),
			'crawlers' => Ai_Crawlers::get_bootstrap_data(),
		);
	}

	/**
	 * Build the supported post type options for the Content tab.
	 *
	 * @return array{post_types:array<int,array{slug:string,label:string}>}
	 */
	public static function get_content_data() {
		return array(
			'post_types' => Post_Types::get_supported_content_type_options(),
		);
	}

	/**
	 * Site identity used to render the homepage search/social previews on the
	 * Settings tab: title, tagline, URL, and representative images. The front-page
	 * description that completes the preview is read from the Settings form
	 * (it's editable there), not bootstrapped here.
	 *
	 * @return array
	 */
	public static function get_site_data() {
		$icon_url = (string) get_site_icon_url();

		$logo_id  = (int) get_theme_mod( 'custom_logo' );
		$logo_url = $logo_id ? (string) wp_get_attachment_image_url( $logo_id, 'full' ) : '';
		if ( class_exists( 'Jetpack_Redux_State_Helper' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_Redux_State_Helper lives in plugins/jetpack and is guarded by class_exists.
			$image_url = (string) \Jetpack_Redux_State_Helper::get_site_image();
		} else {
			$image_url = $logo_url ? $logo_url : $icon_url;
		}

		return array(
			'title'   => (string) get_bloginfo( 'name' ),
			'tagline' => (string) get_bloginfo( 'description' ),
			'url'     => (string) home_url(),
			'icon'    => $icon_url,
			'image'   => $image_url,
		);
	}

	/**
	 * Whether sitemap generation is enabled.
	 *
	 * Reads the durable {@see Initializer::SITEMAP_ENABLED_OPTION} flag. The default is only
	 * used when the option is absent (for example before the Jetpack plugin's migration
	 * has run on a freshly upgraded site), in which case it falls back to the live
	 * `sitemaps` module state so behavior is unchanged in that gap.
	 *
	 * @param Modules $modules Modules instance to read live module state from.
	 * @return bool
	 */
	private static function is_sitemap_enabled( Modules $modules ) {
		$enabled = get_option( Initializer::SITEMAP_ENABLED_OPTION, null );

		// Only fall back to the live module state when the durable option is absent.
		// Passing it as get_option()'s default would evaluate it on every call, since
		// PHP resolves function arguments eagerly even when the option exists.
		if ( null === $enabled ) {
			$enabled = $modules->is_active( 'sitemaps' );
		}

		return (bool) $enabled;
	}

	/**
	 * Whether canonical URLs are enabled.
	 *
	 * Reads the durable {@see Initializer::CANONICAL_ENABLED_OPTION} flag. The default is only
	 * used when the option is absent (for example before the Jetpack plugin's migration
	 * has run on a freshly upgraded site), in which case it falls back to the live
	 * `canonical-urls` module state so behavior is unchanged in that gap.
	 *
	 * @param Modules $modules Modules instance to read live module state from.
	 * @return bool
	 */
	private static function is_canonical_enabled( Modules $modules ) {
		$enabled = get_option( Initializer::CANONICAL_ENABLED_OPTION, null );

		// Only fall back to the live module state when the durable option is absent.
		// Passing it as get_option()'s default would evaluate it on every call, since
		// PHP resolves function arguments eagerly even when the option exists.
		if ( null === $enabled ) {
			$enabled = $modules->is_active( 'canonical-urls' );
		}

		return (bool) $enabled;
	}

	/**
	 * The separator, as rendered, that WordPress joins default document-title parts
	 * with — for previewing the title a page type with no stored format produces.
	 *
	 * `document_title_separator` alone is not what a visitor sees. `wp_get_document_title()`
	 * composes the parts, then passes the whole title through the `document_title`
	 * filter, which WordPress texturizes by default — turning the default spaced
	 * hyphen into an en dash. Previewing the raw filter value would show `-` on a site
	 * that renders `–`, which is every site running core's defaults.
	 *
	 * This applies only to the default title. A stored format short-circuits
	 * `pre_get_document_title`, which returns before the `document_title` filter, so a
	 * custom format keeps the separator the user typed verbatim — the front end renders
	 * `Site - MARKER - Page` for a custom format while producing `Page – Site` for the
	 * default one.
	 *
	 * @return string The rendered separator.
	 */
	private static function get_default_title_separator() {
		$separator = (string) apply_filters( 'document_title_separator', '-' );

		// Only texturize when the title itself would be: a site that unhooks
		// `wptexturize` renders the raw separator, and the preview should match.
		if ( has_filter( 'document_title', 'wptexturize' ) ) {
			$separator = trim(
				html_entity_decode( wptexturize( ' ' . $separator . ' ' ), ENT_QUOTES, 'UTF-8' )
			);
		}

		return $separator;
	}

	/**
	 * The public URL of the XML sitemap, or an empty string when none is reachable.
	 *
	 * A sitemap is reachable as soon as generation is enabled and the site is public:
	 * Jetpack serves a valid (empty-until-built) sitemap at a stable URL — never a 404 —
	 * so the link is safe to surface immediately, without waiting on (or gating against)
	 * the cron build. A prior gate looked the master sitemap up by a mis-built filename
	 * and so never matched, which is what left the Settings tab stuck on "Generating…".
	 *
	 * `jetpack_sitemap_uri()` / `jp_sitemap_filename()` and the JP_MASTER_SITEMAP_TYPE
	 * constant live in the Jetpack plugin's Sitemaps module (loaded only for an active
	 * module on a public site), so they are guarded; in the package-only context they
	 * are absent and the sitemap is reported as not reachable.
	 *
	 * @param bool $sitemap_active Whether sitemap generation is enabled.
	 * @return string The sitemap URL, or '' when not reachable.
	 */
	private static function get_reachable_sitemap_url( $sitemap_active ) {
		// Jetpack only serves sitemaps when generation is on and the site is public.
		if ( ! $sitemap_active || (int) get_option( 'blog_public', 1 ) !== 1 ) {
			return '';
		}

		// The `JP_MASTER_SITEMAP_TYPE` constant and the `jp_sitemap_filename()` /
		// `jetpack_sitemap_uri()` helpers all live together in plugins/jetpack and load
		// as a unit, so this single guard covers every symbol used below.
		if (
			! defined( 'JP_MASTER_SITEMAP_TYPE' )
			|| ! function_exists( 'jp_sitemap_filename' )
			|| ! function_exists( 'jetpack_sitemap_uri' )
		) {
			return '';
		}

		// `jp_sitemap_filename()` returns an error string ("error-not-int-…") unless a
		// non-null number is passed; the master ignores the number, so pass 0 (matching
		// Jetpack's own call sites). Fail safe: the master file is always 'sitemap.xml',
		// so if a bundled Jetpack ever returns something else, report not-reachable
		// rather than surface a broken URL — the exact failure this method shipped with
		// before (the missing number silently produced an "error-not-int-…" link).
		// @phan-suppress-next-line PhanUndeclaredFunction -- guarded above; symbols live in plugins/jetpack.
		$filename = (string) jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 );
		if ( 'sitemap.xml' !== $filename ) {
			return '';
		}

		// esc_url_raw (not esc_url): transported via script data and rendered by React,
		// so it must not be HTML-entity-encoded (e.g. the plain-permalink
		// `?jetpack-sitemap=` form keeps its raw `&`).
		// @phan-suppress-next-line PhanUndeclaredFunction -- guarded above; symbols live in plugins/jetpack.
		return esc_url_raw( (string) jetpack_sitemap_uri( $filename ) );
	}
}
