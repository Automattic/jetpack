<?php
/**
 * Akismet experimental admin UI.
 *
 * Internal R&D — registers a NEW admin page (?page=akismet-experimental) gated
 * by the AKISMET_EXPERIMENTAL_UI wp-config constant. The legacy Akismet plugin
 * (`class.akismet-admin.php`, `views/config.php`, etc.) is NEVER touched.
 *
 * Three independent wp-config constants gate behavior — see GUARDRAILS.md:
 *
 * - AKISMET_EXPERIMENTAL_UI           — read-only surfaces.
 * - AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS — comment moderation writes.
 * - AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API — real calls to blackbox-api.wp.com.
 *
 * Production WPCOM must not define any of these. This class file is only
 * `require_once`'d when AKISMET_EXPERIMENTAL_UI is true (see akismet-experimental.php).
 *
 * @package Akismet_Experimental
 */

defined( 'ABSPATH' ) || exit;

/**
 * Owns the experimental admin page, asset enqueue, REST registration, and the
 * single read-points for each of the three guardrail constants.
 */
class Akismet_Experimental {

	const PAGE_SLUG = 'akismet-experimental';

	// ─────────────────────────────────────────────────────────────────────────
	// Guardrail constants — see GUARDRAILS.md. The three constants are
	// independent; turning on the UI does NOT turn on mutations or Blackbox.
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Whether the experimental UI is enabled for this site.
	 *
	 * Gate: define( 'AKISMET_EXPERIMENTAL_UI', true ) in wp-config.php.
	 * When false, the class file is not required at all.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return defined( 'AKISMET_EXPERIMENTAL_UI' ) && AKISMET_EXPERIMENTAL_UI === true;
	}

	/**
	 * Whether mutating endpoints (comment approve / force-delete) are allowed.
	 *
	 * Default: OFF. Tripwire that prevents accidental writes to live comment data.
	 *
	 * @return bool
	 */
	public static function allow_mutations() {
		return defined( 'AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS' ) && AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS === true;
	}

	/**
	 * Whether the REST proxy may make real calls to blackbox-api.wp.com.
	 *
	 * Default: OFF. Even when AKISMET_BLACKBOX_API_KEY is defined, the
	 * Blackbox proxy handlers serve deterministic mocks unless this is also on.
	 *
	 * @return bool
	 */
	public static function allow_blackbox_api() {
		return defined( 'AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API' ) && AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API === true;
	}

	/**
	 * Initialize hooks. Called when AKISMET_EXPERIMENTAL_UI is true.
	 */
	public static function init() {
		if ( ! self::is_enabled() ) {
			return;
		}
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ), 20 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );

		if ( class_exists( 'Akismet_Experimental_REST_API' ) ) {
			Akismet_Experimental_REST_API::init();
		}
	}

	/**
	 * Register the "Akismet (Experimental)" admin menu item.
	 */
	public static function register_menu() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$title = __( 'Akismet (Experimental)', 'akismet' );

		if ( class_exists( 'Jetpack' ) ) {
			add_submenu_page(
				'jetpack',
				$title,
				$title,
				'manage_options',
				self::PAGE_SLUG,
				array( __CLASS__, 'render_page' )
			);
		} else {
			add_submenu_page(
				'options-general.php',
				$title,
				$title,
				'manage_options',
				self::PAGE_SLUG,
				array( __CLASS__, 'render_page' )
			);
		}
	}

	/**
	 * Render the React mount point. The bundle is enqueued in `enqueue_assets`.
	 */
	public static function render_page() {
		?>
		<div class="wrap akismet-experimental-wrap">
			<div id="akismet-experimental-app"><?php /* React mounts here. */ ?></div>
		</div>
		<?php
	}

	/**
	 * Enqueue the React bundle on our own admin page only.
	 *
	 * @param string $hook_suffix WP-supplied hook suffix for the current screen.
	 */
	public static function enqueue_assets( $hook_suffix ) {
		// Only on our own page.
		$expected_hooks = array(
			'settings_page_' . self::PAGE_SLUG,
			'jetpack_page_' . self::PAGE_SLUG,
		);
		if ( ! in_array( $hook_suffix, $expected_hooks, true ) ) {
			return;
		}

		$asset_file = AKISMET_EXPERIMENTAL__PLUGIN_DIR . 'build/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = include $asset_file;

		wp_enqueue_script(
			'akismet-experimental',
			plugins_url( 'build/index.js', AKISMET_EXPERIMENTAL__PLUGIN_FILE ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( AKISMET_EXPERIMENTAL__PLUGIN_DIR . 'build/index.css' ) ) {
			wp_enqueue_style(
				'akismet-experimental',
				plugins_url( 'build/index.css', AKISMET_EXPERIMENTAL__PLUGIN_FILE ),
				array(),
				$asset['version']
			);
		}

		$blackbox = self::blackbox_client_config();

		// Whitelisted localize payload. Never include the Blackbox Bearer key
		// (AKISMET_BLACKBOX_API_KEY) — see GUARDRAILS.md §"Enforcement mechanisms".
		wp_localize_script(
			'akismet-experimental',
			'akismetExperimental',
			array(
				'apiNonce'       => wp_create_nonce( 'wp_rest' ),
				'apiRoot'        => esc_url_raw( rest_url() ),
				'jetpackActive'  => class_exists( 'Jetpack' ),
				'apiKey'         => class_exists( 'Akismet' ) ? (string) Akismet::get_api_key() : '',
				'pluginUrl'      => plugins_url( '', AKISMET_EXPERIMENTAL__PLUGIN_FILE ),
				'pageSlug'       => self::PAGE_SLUG,
				'blackbox'       => $blackbox,
				'allowMutations' => self::allow_mutations(),
				'integrations'   => array(
					'woocommerce' => class_exists( 'WooCommerce' ),
				),
			)
		);
	}

	/**
	 * Describe whether this site is enrolled with Blackbox.
	 *
	 * Returns shape:
	 *   array(
	 *     'enrolled' => bool,        // are credentials present
	 *     'clientId' => string|null, // opaque client identifier for the dashboard surfaces
	 *     'apiHost'  => string,      // base for the Blackbox API
	 *   );
	 *
	 * NOTE: the Bearer key is NEVER sent to the browser. Browser-side surfaces
	 * hit server-side WP REST endpoints (added in plans 2 + 3) which forward
	 * to Blackbox with the Bearer key held in PHP.
	 *
	 * @return array
	 */
	protected static function blackbox_client_config() {
		$client_id = defined( 'AKISMET_BLACKBOX_CLIENT_ID' ) ? AKISMET_BLACKBOX_CLIENT_ID : null;
		$bearer    = defined( 'AKISMET_BLACKBOX_API_KEY' ) ? AKISMET_BLACKBOX_API_KEY : '';

		return array(
			'enrolled' => ! empty( $client_id ) && ! empty( $bearer ),
			'clientId' => $client_id,
			'apiHost'  => 'https://blackbox-api.wp.com',
		);
	}
}

Akismet_Experimental::init();
