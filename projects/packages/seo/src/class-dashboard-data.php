<?php
/**
 * The SEO dashboard's REST surface: the read-only routes behind each data-backed
 * tab (preloaded onto the page so a normal load resolves them with no request),
 * the settings the dashboard writes, and the one write that isn't a setting.
 *
 * Writes go through WordPress core's `/wp/v2/settings` wherever the value is an
 * option — see {@see self::register_rest_settings()} — so the dashboard depends
 * on nothing but core REST. Module activation is the one thing `register_setting()`
 * can't express, and has its own small route ({@see self::register_module_routes()}).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Jetpack_SEO_Utils;
use WP_Error;
use WP_REST_Request;

/**
 * Registers the dashboard's REST routes and settings, and builds their payloads.
 */
class Dashboard_Data {

	/**
	 * REST namespace, shared with the package's other Jetpack routes.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * Route, relative to the namespace, for the dashboard toggles that map to
	 * Jetpack module activation rather than to an option.
	 *
	 * @var string
	 */
	const MODULES_REST_BASE = '/seo/modules';

	/**
	 * Settings API group the package registers its options under.
	 *
	 * Only the Settings API's `options.php` form handler reads groups, and the
	 * dashboard doesn't go through it — `register_setting()` requires a group, and
	 * it's otherwise inert here.
	 *
	 * @var string
	 */
	const SETTINGS_GROUP = 'jetpack_seo';

	/**
	 * Option holding the site's verification service codes, one per service.
	 *
	 * @var string
	 */
	const VERIFICATION_CODES_OPTION = 'verification_services_codes';

	/**
	 * Option holding the SEO page title structures.
	 *
	 * @var string
	 */
	const TITLE_FORMATS_OPTION = 'advanced_seo_title_formats';

	/**
	 * Option holding the front page meta description.
	 *
	 * Mirrors `Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION`, which the package can't
	 * rely on being loaded. Doubles as the REST key for the setting, which stays
	 * stable even when the value is stored in the legacy option instead
	 * ({@see self::front_page_description_option()}).
	 *
	 * @var string
	 */
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';

	/**
	 * Option holding the AI SEO Enhancer's on/off state.
	 *
	 * @var string
	 */
	const AI_SEO_ENHANCER_OPTION = 'ai_seo_enhancer_enabled';

	/**
	 * Legacy option the front page meta description is stored in on WordPress.com
	 * sites that set one while SEO tools were free for every Simple site. Mirrors
	 * `Jetpack_SEO_Utils::LEGACY_META_OPTION`.
	 *
	 * @var string
	 */
	const LEGACY_FRONT_PAGE_META_OPTION = 'seo_meta_description';

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
				return '/' . self::REST_NAMESPACE . '/seo/' . $slug;
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
				self::REST_NAMESPACE,
				'/seo/' . $slug,
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => static function () use ( $builder ) {
						return rest_ensure_response( call_user_func( $builder ) );
					},
					'permission_callback' => array( __CLASS__, 'permission_check' ),
				)
			);
		}
	}

	/**
	 * Capability gate for the dashboard's REST routes — the same `manage_options`
	 * the SEO admin page itself requires, and the same capability the core settings
	 * controller enforces on the settings the dashboard writes there.
	 *
	 * @return bool
	 */
	public static function permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Expose every option the SEO dashboard writes to WordPress core's
	 * `/wp/v2/settings` endpoint.
	 *
	 * The dashboard used to save these through the Jetpack plugin's
	 * `/jetpack/v4/settings` route, which doesn't exist everywhere the package
	 * runs — WordPress.com Simple sites boot Jetpack from a small file list that
	 * doesn't include it, so every write 404'd there. Core's settings endpoint is
	 * registered by WordPress itself, needs no new route, and enforces the same
	 * `manage_options` capability, so it works on every platform with one code path.
	 *
	 * Only settings registered with `show_in_rest` round-trip through that
	 * endpoint, and it silently ignores keys that aren't registered — which is why
	 * this runs behind the same `seo-tools` gate as the rest of the settings
	 * surface, and why the dashboard hides its controls when that module is off.
	 *
	 * Hooked late on `init`, not at package init: which option the front page
	 * description is stored in depends on `jetpack_disable_seo_tools`, and a conflicting
	 * SEO plugin adds that filter on `plugins_loaded` or `init`. Registering after them
	 * — and still well before `rest_api_init` — means the save targets the option the
	 * front end will actually read.
	 *
	 * @return void
	 */
	public static function register_rest_settings() {
		// Search-engine visibility is a WordPress core option, not a Jetpack one.
		register_setting(
			'reading',
			'blog_public',
			array(
				'show_in_rest' => true,
				'type'         => 'integer',
				'default'      => 1,
			)
		);

		foreach ( self::settings_definitions() as $option => $args ) {
			register_setting( self::SETTINGS_GROUP, $option, $args );
		}

		// `verification_services_codes` is also registered by the verification-tools
		// module, and the last `register_setting()` for an option name replaces the
		// registry entry — which would drop the `show_in_rest` exposure the dashboard
		// saves through, leaving core to ignore the write and still answer 200. Rather
		// than depend on hook order, force our own arguments back on for the options we
		// own, whoever registers them and whenever. Added after the loop above so our
		// own registrations don't recurse through it.
		add_filter( 'register_setting_args', array( __CLASS__, 'force_setting_args' ), 10, 4 );

		// The one thing that has to happen after the write rather than during it:
		// dropping the superseded legacy front-page option. Both actions pass the
		// option name first, and `added_option` covers a first write, which
		// `update_option()` routes through `add_option()`.
		add_action( 'added_option', array( __CLASS__, 'after_setting_write' ) );
		add_action( 'updated_option', array( __CLASS__, 'after_setting_write' ) );
	}

	/**
	 * Keep the REST contract of the options this package owns authoritative, no matter
	 * who else registers them or in what order.
	 *
	 * Only the three arguments that decide whether and how the option round-trips
	 * through `/wp/v2/settings` are forced. Everything else is the caller's: its label
	 * and description still describe its own surface, and leaving its `sanitize_callback`
	 * in place is what keeps the verification-tools module's `jetpack_verification_validate`
	 * attached — and with it the `jetpack_site_verification_validate` action its consumers
	 * listen for. Our own sanitizer is attached by our own `register_setting()` call and
	 * stays attached alongside it, since sanitize filters accumulate.
	 *
	 * @param array  $args     Arguments the caller passed to `register_setting()`.
	 * @param array  $defaults Default arguments.
	 * @param string $group    Setting group (unused).
	 * @param string $option   Option name.
	 * @return array
	 */
	public static function force_setting_args( $args, $defaults, $group, $option ) {
		$ours = self::settings_definitions();
		if ( ! isset( $ours[ $option ] ) ) {
			return $args;
		}

		return array_merge(
			$args,
			array(
				'type'         => $ours[ $option ]['type'],
				// `filter_default_option()` reads this key unconditionally once the option
				// is registered, so it has to survive a caller that didn't set one.
				'default'      => $ours[ $option ]['default'],
				'show_in_rest' => $ours[ $option ]['show_in_rest'],
			)
		);
	}

	/**
	 * The SEO options exposed to `/wp/v2/settings`, keyed by option name.
	 *
	 * Types, defaults and sanitizers mirror what `/jetpack/v4/settings` enforced for
	 * the same keys, so a save behaves the same as before wherever that route exists.
	 *
	 * @return array<string, array>
	 */
	private static function settings_definitions() {
		return array(
			self::AI_SEO_ENHANCER_OPTION          => array(
				'type'         => 'boolean',
				'default'      => false,
				'show_in_rest' => true,
			),
			Llms_Txt::OPTION                      => array(
				'type'         => 'boolean',
				'default'      => false,
				'show_in_rest' => true,
			),
			Ai_Crawlers::OPTION                   => array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_ai_crawler_overrides' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						// A sparse `crawler slug => blocked` map, so the keys are the
						// catalog's, not a fixed property list. Ai_Crawlers::get_overrides()
						// drops slugs it doesn't know on read.
						'additionalProperties' => array( 'type' => 'boolean' ),
					),
				),
			),
			self::TITLE_FORMATS_OPTION            => array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_title_formats' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => self::title_format_schemas(),
					),
				),
			),
			self::VERIFICATION_CODES_OPTION       => array(
				'type'              => 'object',
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_verification_codes' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array_fill_keys(
							array( 'google', 'bing', 'pinterest', 'yandex', 'facebook' ),
							array( 'type' => 'string' )
						),
					),
				),
			),
			self::front_page_description_option() => array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => array( __CLASS__, 'sanitize_front_page_description' ),
				// The REST key stays the modern option name even when the value lives in
				// the legacy one, so the client never has to know which is in play.
				'show_in_rest'      => array( 'name' => self::FRONT_PAGE_META_OPTION ),
			),
		);
	}

	/**
	 * Per-page-type schema for a title structure, restoring the contract
	 * `Jetpack_SEO_Titles::are_valid_title_formats()` enforced on the Jetpack settings
	 * endpoint: both keys are required (the renderer reads `type` on every public
	 * request), and a token has to be one this page type actually offers.
	 *
	 * @return array<string, array>
	 */
	private static function title_format_schemas() {
		// Mirrors `Jetpack_SEO_Titles::get_allowed_tokens()`. Duplicated rather than
		// called: that class ships with the Jetpack plugin, and the schema has to hold
		// wherever the package runs.
		$allowed_tokens = array(
			'front_page' => array( 'site_name', 'tagline' ),
			'posts'      => array( 'site_name', 'tagline', 'post_title' ),
			'pages'      => array( 'site_name', 'tagline', 'page_title' ),
			'groups'     => array( 'site_name', 'tagline', 'group_title' ),
			'archives'   => array( 'site_name', 'tagline', 'date', 'archive_title' ),
		);

		$schemas = array();
		foreach ( $allowed_tokens as $page_type => $tokens ) {
			$schemas[ $page_type ] = array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					// Both keys required: the front-end renderer reads `type` on every
					// public request, so a token missing it must never reach storage.
					'required'   => array( 'type', 'value' ),
					'properties' => array(
						'type'  => array(
							'type' => 'string',
							'enum' => array( 'string', 'token' ),
						),
						'value' => array( 'type' => 'string' ),
					),
					// Which values `value` may take depends on `type`, which one flat
					// object can't say. Core applies `oneOf` first and then the shape
					// above, so the two together are the old helper's contract.
					'oneOf'      => array(
						array(
							'type'       => 'object',
							'properties' => array(
								'type' => array(
									'type' => 'string',
									'enum' => array( 'string' ),
								),
							),
						),
						array(
							'type'       => 'object',
							'properties' => array(
								'type'  => array(
									'type' => 'string',
									'enum' => array( 'token' ),
								),
								'value' => array(
									'type' => 'string',
									'enum' => $tokens,
								),
							),
						),
					),
				),
			);
		}

		return $schemas;
	}

	/**
	 * The option the front page meta description is stored in for this site.
	 *
	 * A WordPress.com site that set a description while SEO tools were free for every
	 * Simple site keeps editing that legacy option while it's plan-gated, because the
	 * front end still reads the description from there. Decided from the site's own
	 * state — the gate and the stored value — rather than from `Jetpack_SEO_Utils`,
	 * which ships with the Jetpack plugin: reading it through `class_exists()` would
	 * quietly answer "modern" wherever the plugin's SEO files aren't loaded, and the
	 * save would then overwrite the wrong option and drop a live legacy description.
	 *
	 * @return string
	 */
	private static function front_page_description_option() {
		return self::has_legacy_front_page_meta()
			? self::LEGACY_FRONT_PAGE_META_OPTION
			: self::FRONT_PAGE_META_OPTION;
	}

	/**
	 * Whether the front page description still lives in the legacy option — Jetpack's
	 * SEO output is off for this site and a description is stored there, so that's what
	 * the front end reads and what an edit has to write back to.
	 *
	 * The rule `Jetpack_SEO_Utils::has_legacy_front_page_meta()` applies, evaluated from
	 * the site's own state so that the read path, the write path and the front end can't
	 * disagree on a site where that class isn't loaded.
	 *
	 * @return bool
	 */
	private static function has_legacy_front_page_meta() {
		return ! self::is_jetpack_seo_enabled() && (bool) get_option( self::LEGACY_FRONT_PAGE_META_OPTION );
	}

	/**
	 * Whether Jetpack's SEO output is live for this site, which is what decides
	 * where the front page description is stored and read from.
	 *
	 * Defers to `Jetpack_SEO_Utils` wherever it's loaded, because that helper is what
	 * the front end reads the description by and the two must not disagree. The fallback
	 * reproduces it exactly rather than approximately: the conflicting-plugin filter,
	 * then the plan gate on WordPress.com **Simple only** — the helper plan-gates behind
	 * `IS_WPCOM`, so an Atomic site is never gated by it even without `advanced-seo`, and
	 * a wider copy would send that site's edits to the legacy option while its front end
	 * kept reading the modern one.
	 *
	 * @return bool
	 */
	private static function is_jetpack_seo_enabled() {
		if ( class_exists( 'Jetpack_SEO_Utils' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
			return (bool) Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		}

		/** This filter is documented in projects/plugins/jetpack/modules/seo-tools/class-jetpack-seo-utils.php */
		if ( apply_filters( 'jetpack_disable_seo_tools', false ) ) {
			return false;
		}

		// `Initializer::is_gated()` on Simple reduces to the helper's own
		// `wpcom_site_has_feature( 'advanced-seo' )` check.
		return ( new Host() )->is_wpcom_simple() ? ! Initializer::is_gated() : true;
	}

	/**
	 * Drop the superseded legacy front page description once a modern one is saved.
	 *
	 * The front end falls back to the legacy option whenever the modern value is
	 * empty, so leaving it in place would let a cleared description resurrect text the
	 * site set years ago. Matches what the Jetpack settings endpoint did on the same
	 * write, including its condition: only where Jetpack's SEO output is actually live,
	 * so a gated site's legacy description is never touched.
	 *
	 * Hooked to `added_option` / `updated_option` (both pass the option name first),
	 * so it fires on a real change only, whichever surface made it.
	 *
	 * @param string $option Name of the option that was written.
	 * @return void
	 */
	public static function after_setting_write( $option ) {
		if ( self::FRONT_PAGE_META_OPTION === $option && self::is_jetpack_seo_enabled() ) {
			delete_option( self::LEGACY_FRONT_PAGE_META_OPTION );
		}
	}

	/**
	 * Whether this site has the given Jetpack module at all.
	 *
	 * Deliberately not `Modules::is_module()`: that's a path-traversal check, and it
	 * passes every slug on a site whose module list is empty — which is the case this
	 * has to detect. WordPress.com Simple ships no Jetpack modules and provides the
	 * behavior itself.
	 *
	 * @param string $module Module slug.
	 * @return bool
	 */
	private static function has_module( $module ) {
		return in_array( $module, ( new Modules() )->get_available(), true );
	}

	/**
	 * Toggle a legacy Jetpack module to match the setting that now drives it.
	 *
	 * A no-op where the module already agrees, which is also what stops the Jetpack
	 * plugin's own module → option sync from bouncing straight back here. Callers
	 * must have checked {@see self::has_module()} first.
	 *
	 * @param string $module  Module slug.
	 * @param bool   $enabled Whether the setting is on.
	 * @return bool Whether the module now matches the setting.
	 */
	private static function sync_module_to_option( $module, $enabled ) {
		$modules = new Modules();

		if ( $modules->is_active( $module ) === $enabled ) {
			return true;
		}

		$modules->update_status( $module, $enabled, false, false );

		return $modules->is_active( $module ) === $enabled;
	}

	/**
	 * Clamp the front page meta description to plain text of a bounded length.
	 *
	 * @param string $value Submitted description.
	 * @return string
	 */
	public static function sanitize_front_page_description( $value ) {
		$value = wp_strip_all_tags( (string) $value );

		/** This filter is documented in projects/plugins/jetpack/modules/seo-tools/class-jetpack-seo-utils.php */
		$max_length = (int) apply_filters( 'jetpack_seo_front_page_description_max_length', 300 );

		return function_exists( 'mb_substr' )
			? mb_substr( $value, 0, $max_length )
			: substr( $value, 0, $max_length );
	}

	/**
	 * Strip markup out of the literal text a title structure joins its tokens with.
	 *
	 * Deliberately not `wp_strip_all_tags()`: that trims, and the spacing around a
	 * separator ("Post Title | Site Name") is exactly what the user typed and has to
	 * survive. Token values are left alone — the schema already limits a token to a
	 * string, and an unrecognized one simply renders as itself.
	 *
	 * @param array $value Submitted title structures, keyed by page type.
	 * @return array
	 */
	public static function sanitize_title_formats( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		foreach ( $value as $page_type => $tokens ) {
			if ( ! is_array( $tokens ) ) {
				unset( $value[ $page_type ] );
				continue;
			}

			foreach ( $tokens as $index => $token ) {
				if ( ! isset( $token['value'] ) || ! isset( $token['type'] ) || 'string' !== $token['type'] ) {
					continue;
				}

				$text = preg_replace( '@<(script|style)[^>]*?>.*?</\\1>@si', '', (string) $token['value'] );
				$text = strip_tags( $text ); // phpcs:ignore WordPress.WP.AlternativeFunctions.strip_tags_strip_tags -- wp_strip_all_tags() trims, and leading/trailing spacing is meaningful here.

				$value[ $page_type ][ $index ]['value'] = preg_replace( '/[\r\n\t ]+/', ' ', $text );
			}
		}

		return $value;
	}

	/**
	 * Reduce each submitted verification entry to the bare code, merged over the
	 * codes already stored.
	 *
	 * Services hand out a whole `<meta name="…" content="…">` tag and site owners
	 * paste it verbatim, so keep only the content attribute — the same thing the
	 * verification-tools module does when it renders the tag. Merging rather than
	 * replacing keeps any service the dashboard doesn't offer intact.
	 *
	 * @param array $value Submitted codes, keyed by service.
	 * @return array
	 */
	public static function sanitize_verification_codes( $value ) {
		$stored = get_option( self::VERIFICATION_CODES_OPTION, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		if ( ! is_array( $value ) ) {
			return $stored;
		}

		foreach ( $value as $service => $code ) {
			$code = (string) $code;

			// Anything that isn't already a bare code has to yield one, or it's not a
			// verification code at all and is cleared — the same reject-to-empty
			// outcome `jetpack_verification_validate()` produces, so a site behaves the
			// same whether or not the verification-tools module is loaded to run it.
			if ( ! preg_match( '/^[a-z0-9_-]*$/i', $code ) ) {
				$code = preg_match( '/content=["\']?([^"\' ]*)["\' ]/i', $code, $matches )
					? urldecode( $matches[1] )
					: '';
			}

			// 100 chars is the cap the verification-tools module stores by.
			$stored[ $service ] = substr( sanitize_text_field( trim( $code ) ), 0, 100 );
		}

		return $stored;
	}

	/**
	 * Normalize the AI crawler override map to `slug => bool`.
	 *
	 * @param array $value Submitted overrides.
	 * @return array
	 */
	public static function sanitize_ai_crawler_overrides( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$sanitized = array();
		foreach ( $value as $slug => $blocked ) {
			$sanitized[ sanitize_key( $slug ) ] = (bool) $blocked;
		}

		return $sanitized;
	}

	/**
	 * The dashboard settings that are backed by a Jetpack module rather than by a plain
	 * option: request field => [ module slug, durable option or null ].
	 *
	 * These are the settings core's `/wp/v2/settings` can't own. Writing them switches a
	 * module, that can fail, and a failure has to reach the user — and a `register_setting()`
	 * sanitizer is the wrong place for a side effect, since it runs before the write and
	 * fires on paths where nothing is ever persisted. So they get a route callback that
	 * switches the module, checks it took, and returns a real error when it didn't.
	 *
	 * Sitemap and canonical URLs also have a durable option, which is what the dashboard
	 * reads and what keeps them working where there's no module at all. Site verification
	 * has none: the module's own state is the setting.
	 *
	 * @return array<string, array{0:string, 1:string|null}>
	 */
	private static function module_settings() {
		return array(
			'sitemap_active'            => array( 'sitemaps', Initializer::SITEMAP_ENABLED_OPTION ),
			'canonical_active'          => array( 'canonical-urls', Initializer::CANONICAL_ENABLED_OPTION ),
			'verification_tools_active' => array( 'verification-tools', null ),
		);
	}

	/**
	 * Register the write route for the dashboard settings that switch a Jetpack module.
	 *
	 * Write-only: the current state is already served by `/jetpack/v4/seo/settings`,
	 * which the dashboard reads on load.
	 *
	 * @return void
	 */
	public static function register_module_routes() {
		$args = array();
		foreach ( array_keys( self::module_settings() ) as $field ) {
			// All optional: the dashboard sends only what changed.
			$args[ $field ] = array( 'type' => 'boolean' );
		}

		register_rest_route(
			self::REST_NAMESPACE,
			self::MODULES_REST_BASE,
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( __CLASS__, 'update_modules' ),
				'permission_callback' => array( __CLASS__, 'permission_check' ),
				'args'                => $args,
			)
		);
	}

	/**
	 * Apply the submitted module-backed settings, and report the state the site ended up in.
	 *
	 * Each one switches its module first and only records the durable option once that
	 * took, so the option can never claim a state the module never reached. Where the
	 * module doesn't exist the option is the whole story and is written directly — that's
	 * what makes the sitemap and canonical toggles work on a site with no Jetpack modules.
	 * Site verification has no such option, so there it's a request the site can't support.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function update_modules( WP_REST_Request $request ) {
		$applied = array();

		foreach ( self::module_settings() as $field => $target ) {
			if ( null === $request[ $field ] ) {
				continue;
			}

			list( $module, $option ) = $target;
			$enabled                 = (bool) $request[ $field ];

			if ( self::has_module( $module ) ) {
				if ( ! self::sync_module_to_option( $module, $enabled ) ) {
					return new WP_Error(
						'jetpack_seo_module_toggle_failed',
						/* translators: %s: name of a Jetpack module, e.g. "sitemaps". */
						sprintf( __( 'The %s module could not be switched.', 'jetpack-seo' ), $module ),
						array( 'status' => 500 )
					);
				}
			} elseif ( null === $option ) {
				// Nothing to switch and nothing to remember it in.
				return new WP_Error(
					'jetpack_seo_module_unavailable',
					/* translators: %s: name of a Jetpack module, e.g. "verification-tools". */
					sprintf( __( 'This site has no %s module to switch.', 'jetpack-seo' ), $module ),
					array( 'status' => 400 )
				);
			}

			if ( null !== $option ) {
				update_option( $option, $enabled );
			}

			$applied[ $field ] = $enabled;
		}

		return rest_ensure_response( $applied );
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
			'site_visibility'         => array(
				'search_engines_visible' => (int) get_option( 'blog_public', 1 ) === 1,
				// Read the durable SEO option (seeded/synced from the `sitemaps` module
				// by the Jetpack plugin) so the state survives the module's removal. The
				// reachable sitemap URL + "View" link live on the Settings tab.
				'sitemap_active'         => self::is_sitemap_enabled( $modules ),
				'seo_tools_active'       => $modules->is_active( 'seo-tools' ),
			),
			// Per-service booleans (a code is set or not) for the Overview's
			// Site verification card.
			'site_verification'       => array(
				'google'    => ! empty( $codes['google'] ),
				'bing'      => ! empty( $codes['bing'] ),
				'pinterest' => ! empty( $codes['pinterest'] ),
				'yandex'    => ! empty( $codes['yandex'] ),
				'facebook'  => ! empty( $codes['facebook'] ),
			),
			'content_coverage'        => Content_Coverage::get(),
			'plan'                    => array(
				'seo_enabled_for_site' => $seo_enabled,
			),
			// Whether the site-verification toggle can do anything here. False where
			// that module isn't present — WordPress.com Simple ships no Jetpack modules
			// and reports every one of them active — so the dashboard hides the control
			// rather than offering a toggle the route would refuse.
			'verification_switchable' => self::has_module( 'verification-tools' ),
		);
	}

	/**
	 * Build the editable Settings state the Settings tab hydrates from.
	 *
	 * Read-only bootstrap only. Writes go to core's `/wp/v2/settings` for every
	 * field backed by an option ({@see self::register_rest_settings()}), and to the
	 * package's own routes for site verification's module state and the nested
	 * Schema container; bootstrapping them all here keeps the Settings UI hydrated
	 * without a second request.
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
		// the value stays live in the legacy option. The gated Settings uses this to keep
		// that one field editable, and it's the same rule the save writes by.
		$has_legacy_front_page_meta = self::has_legacy_front_page_meta();

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
	 * the `ai-seo-enhancer` feature. The toggle writes the `ai_seo_enhancer_enabled`
	 * option through core's `/wp/v2/settings` endpoint.
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
