<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets\Logo;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Registers the Jetpack menu parent, whose page only redirects.
 */
class Jetpack_React_Page extends Jetpack_Admin_Page {
	/**
	 * Register the menu parent before the site connects too.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = false;

	/**
	 * Legacy hashes the Settings page renders; they forward there with their hash.
	 *
	 * Mirrors `settingsRoutes` in `_inc/client/main.jsx`, plus the connection screens.
	 *
	 * @since $$next-version$$
	 * @var string[]
	 */
	const SETTINGS_ROUTES = array(
		'/settings',
		'/security',
		'/performance',
		'/writing',
		'/sharing',
		'/discussion',
		'/earn',
		'/reader',
		'/traffic',
		'/privacy',
		'/setup',
		'/connect-user',
		'/connect-user-setup',
	);

	/**
	 * Forwards Settings hashes with their hash, maps known routes, and falls back for the rest.
	 *
	 * @var string
	 */
	const LEGACY_ROUTE_REDIRECT_SCRIPT = <<<'JS'
function ( settings, forward, routes, fallback ) {
	var hash = window.location.hash;
	var path = hash.replace( /^#\/?/, '/' ).split( '?' )[ 0 ] || '/';
	var target = fallback;
	if ( forward.indexOf( path ) !== -1 ) {
		target = settings + hash;
	} else if ( Object.prototype.hasOwnProperty.call( routes, path ) ) {
		target = routes[ path ];
	}
	window.location.replace( target );
}
JS;

	/**
	 * Add the main admin Jetpack menu.
	 *
	 * @return string|false Return value from WordPress's `add_menu_page()`.
	 */
	public function get_page_hook() {
		$logo = new Logo();
		// Keep this fallback in sync with Jetpack_Network::add_network_admin_menu().
		$icon = method_exists( $logo, 'get_base64_admin_menu_logo' ) ? $logo->get_base64_admin_menu_logo() : $logo->get_base64_logo();
		return add_menu_page( 'Jetpack', 'Jetpack', 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), $icon, 3 );
	}

	/**
	 * Add page action.
	 *
	 * @param string $hook Hook of current page.
	 * @return void
	 */
	public function add_page_actions( $hook ) {
		/** This action is documented in class.jetpack-admin.php */
		do_action( 'jetpack_admin_menu', $hook );

		if ( ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$page = sanitize_text_field( wp_unslash( $_GET['page'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'jetpack' !== $page ) {
			if ( strpos( $page, 'jetpack/' ) === 0 ) {
				$section = substr( $page, 8 );
				wp_safe_redirect( admin_url( 'admin.php?page=jetpack#/' . $section ) );
				exit( 0 );
			}
			return; // No need to handle the fallback redirection if we are not on the Jetpack page.
		}

		// After the action handlers and the connection controller, which exit when they act.
		add_action( "load-$hook", array( $this, 'render_redirect_document' ), PHP_INT_MAX );

		// If this is the first time the user is viewing the admin, don't show JITMs.
		// This filter is added just in time because this function is called on admin_menu
		// and JITMs are initialized on admin_init.
		if ( Jetpack::is_connection_ready() && ! Jetpack_Options::get_option( 'first_admin_view', false ) ) {
			Jetpack_Options::update_option( 'first_admin_view', true );
			add_filter( 'jetpack_just_in_time_msgs', '__return_false' );
		}
	}

	/**
	 * Remove the main Jetpack submenu if a site is in offline mode or connected
	 * or if My Jetpack is available.
	 * At that point, admins can access the Jetpack Dashboard instead.
	 *
	 * @since 13.8
	 */
	public function remove_jetpack_menu() {
		$is_offline_mode = ( new Status() )->is_offline_mode();
		$has_my_jetpack  = (
			class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' ) &&
			method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' ) &&
			\Automattic\Jetpack\My_Jetpack\Initializer::should_initialize()
		);

		if ( $is_offline_mode || $has_my_jetpack || Jetpack::is_connection_ready() ) {
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
	}

	/**
	 * Where links into page=jetpack land.
	 *
	 * Settings hashes keep their hash on the Settings page. Admins go to My Jetpack
	 * wherever it runs; everyone else, and a request with a pending error, lands on
	 * Settings. While the partner coupon screen applies, every route goes there.
	 *
	 * @return array{settings: string, forward: string[], routes: array<string, string>, fallback: string}
	 */
	public static function get_legacy_route_redirects() {
		$settings_url  = admin_url( 'admin.php?page=jetpack-settings' );
		$coupon_screen = self::get_partner_coupon_redirect();
		if ( $coupon_screen ) {
			return array(
				'settings' => $settings_url,
				'forward'  => array(),
				'routes'   => array(),
				'fallback' => $coupon_screen,
			);
		}

		$table = array(
			'settings' => $settings_url,
			'forward'  => self::SETTINGS_ROUTES,
			'routes'   => array(),
			'fallback' => $settings_url,
		);

		if ( ! self::should_redirect_legacy_routes() ) {
			return $table;
		}

		$pricing_url     = Redirect::get_url( 'jetpack-plans' );
		$table['routes'] = array(
			'/plans'        => $pricing_url,
			'/plans-prompt' => $pricing_url,
			'/newsletter'   => admin_url( 'admin.php?page=jetpack-newsletter' ),
		);

		if ( self::can_use_my_jetpack() ) {
			$my_jetpack = admin_url( 'admin.php?page=my-jetpack' );

			foreach ( array( 'akismet', 'backup', 'scan', 'search', 'security', 'videopress' ) as $product ) {
				$table['routes'][ '/product/' . $product ] = $my_jetpack . '#/add-' . $product;
			}

			$table['routes']['/license/activation'] = $my_jetpack . '#/add-license';

			foreach ( array( '/reconnect', '/disconnect', '/woo-setup' ) as $route ) {
				$table['routes'][ $route ] = $my_jetpack . '#/connection';
			}

			$table['fallback'] = $my_jetpack;
		}

		return $table;
	}

	/**
	 * Whether this request may leave Settings.
	 *
	 * @return bool
	 */
	public static function should_redirect_legacy_routes() {
		// A pending error only renders via the Settings app's state notices.
		return ! Jetpack::state( 'error' );
	}

	/**
	 * Print the legacy route redirect; it runs in the browser because the server never sees the hash.
	 */
	public function print_legacy_route_redirect() {
		$table = self::get_legacy_route_redirects();
		$flags = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

		wp_print_inline_script_tag(
			sprintf(
				'( %s )( %s, %s, %s, %s );',
				self::LEGACY_ROUTE_REDIRECT_SCRIPT,
				wp_json_encode( $table['settings'], $flags ),
				wp_json_encode( $table['forward'], $flags ),
				wp_json_encode( (object) $table['routes'], $flags ),
				wp_json_encode( $table['fallback'], $flags )
			)
		);
	}

	/**
	 * Replace page=jetpack with the redirect document; nothing else renders here.
	 *
	 * @since $$next-version$$
	 *
	 * @return never
	 */
	public function render_redirect_document() {
		$table = self::get_legacy_route_redirects();
		if ( $table['settings'] === $table['fallback'] ) {
			// Settings renders this request's notices, so its state must survive the hop.
			Jetpack::restate();
		}

		$this->print_redirect_document();
		exit( 0 );
	}

	/**
	 * Print a bare document that only redirects.
	 *
	 * @since $$next-version$$
	 */
	public function print_redirect_document() {
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php echo esc_attr( get_bloginfo( 'charset' ) ); ?>">
<title>Jetpack</title><?php // "Jetpack" is a product name, do not translate. ?>
		<?php
		if ( $this->is_rest_api_enabled() ) {
			$this->print_legacy_route_redirect();
			$this->add_noscript_head_meta();
		} else {
			$this->add_fallback_head_meta();
		}
		?>
</head>
<body></body>
</html>
		<?php
	}

	/**
	 * Whether My Jetpack can take over for the current user.
	 *
	 * @return bool
	 */
	private static function can_use_my_jetpack() {
		return current_user_can( 'manage_options' )
			&& class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' )
			&& method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' )
			&& \Automattic\Jetpack\My_Jetpack\Initializer::should_initialize();
	}

	/**
	 * The My Jetpack coupon screen, while it should replace this page.
	 *
	 * An older My Jetpack bounces showCouponRedemption back here, so only forward to one that renders it.
	 *
	 * @return string|null
	 */
	private static function get_partner_coupon_redirect() {
		if (
			! class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' )
			|| ! method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'get_partner_coupon_screen' )
			|| null === \Automattic\Jetpack\My_Jetpack\Initializer::get_partner_coupon_screen()
		) {
			return null;
		}

		return admin_url( 'admin.php?page=my-jetpack&showCouponRedemption=1' );
	}

	/**
	 * Formerly added the Settings sub-link.
	 *
	 * @since 4.3.0
	 * @deprecated $$next-version$$ Jetpack_Settings_React_Page registers the Settings page.
	 */
	public function jetpack_add_settings_sub_nav_item() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Nothing renders here: render_redirect_document() exits on load.
	 *
	 * @return void
	 */
	public function page_render() {}
	/**
	 * Allow robust deep links to React.
	 *
	 * The Jetpack dashboard requires fragments/hash values to make
	 * a deep link to it but passing fragments as part of a return URL
	 * will most often be discarded throughout the process.
	 * This logic aims to bridge this gap and reduce the chance of React
	 * specific links being broken while passing them along.
	 */
	public function react_redirects() {
		global $pagenow;

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'admin.php' !== $pagenow || ! isset( $_GET['jp-react-redirect'] ) ) {
			return;
		}

		$allowed_paths = array(
			'product-purchased' => admin_url( 'admin.php?page=jetpack' ),
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$target = sanitize_text_field( wp_unslash( $_GET['jp-react-redirect'] ) );
		if ( isset( $allowed_paths[ $target ] ) ) {
			wp_safe_redirect( $allowed_paths[ $target ] );
			exit( 0 );
		}
	}

	/**
	 * Nothing loads here: render_redirect_document() exits on load.
	 */
	public function page_admin_scripts() {}
}
