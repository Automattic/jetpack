<?php
/**
 * Attract high-quality traffic to your site.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Blaze\Dashboard as Blaze_Dashboard;
use Automattic\Jetpack\Blaze\Dashboard_REST_Controller as Blaze_Dashboard_REST_Controller;
use Automattic\Jetpack\Blaze\REST_Controller;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;
use WP_Post;

/**
 * Class for promoting posts.
 */
class Blaze {
	/**
	 * Script handle for the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-promote-editor';

	/**
	 * Transient prefix for active campaign status checks.
	 *
	 * @var string
	 */
	const ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_PREFIX = 'jetpack_blaze_active_campaigns_status_';

	/**
	 * Transient TTL for active campaign status checks that find campaigns.
	 *
	 * @var int
	 */
	const ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_TTL = HOUR_IN_SECONDS;

	/**
	 * Transient TTL for active campaign status checks that cannot determine campaign status.
	 *
	 * @var int
	 */
	const UNKNOWN_ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Minimum campaign statuses that should trigger a warning.
	 *
	 * @var string[]
	 */
	const ACTIVE_CAMPAIGN_STATUSES = array( 'active' );

	/**
	 * Path of the JS file we enqueue in the post editor.
	 *
	 * @var string
	 */
	public static $script_path = '../build/editor.js';

	/**
	 * Initializer.
	 * Used to configure the blaze package, eg when called via the Config package.
	 *
	 * @return void
	 */
	public static function init() {
		// On the edit screen, add a row action to promote the post.
		add_action( 'load-edit.php', array( __CLASS__, 'add_post_links_actions' ) );
		// After the quick-edit screen is processed, ensure the blaze row action is still present
		if ( 'edit.php' === $GLOBALS['pagenow'] ||
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verification is not needed here, we're not saving anything.
			( 'admin-ajax.php' === $GLOBALS['pagenow'] && ! empty( $_POST['post_view'] ) && 'list' === $_POST['post_view'] && ! empty( $_POST['action'] ) && 'inline-save' === $_POST['action'] ) ) {
			self::add_post_links_actions();
		}
		// In the post editor, add a post-publish panel to allow promoting the post.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
		// Add a Blaze Menu.
		add_action( 'admin_menu', array( __CLASS__, 'enable_blaze_menu' ), 999 );
		// Redirect legacy/duplicate advertising URLs (the old tools.php location, or the
		// admin.php?page=advertising slug when the standalone Blaze Ads plugin owns the
		// menu). Runs late (after WooCommerce and core register their menus, so
		// get_menu_parent() resolves the real parent) but still before WordPress
		// validates the page parameter.
		add_action( 'admin_menu', array( __CLASS__, 'redirect_legacy_advertising_url' ), 999 );
		// Add Blaze dashboard app REST API endpoints.
		add_action( 'rest_api_init', array( Blaze_Dashboard_REST_Controller::class, 'register' ) );
		// Add general Blaze REST API endpoints.
		add_action( 'rest_api_init', array( REST_Controller::class, 'register' ) );
	}

	/**
	 * Add links under each published post in the wp-admin post list.
	 *
	 * @return void
	 */
	public static function add_post_links_actions() {
		if ( self::should_initialize()['can_init'] ) {
			add_filter( 'post_row_actions', array( __CLASS__, 'jetpack_blaze_row_action' ), 10, 2 );
			add_filter( 'page_row_actions', array( __CLASS__, 'jetpack_blaze_row_action' ), 10, 2 );
		}
	}

	/**
	 * Is the wp-admin Dashboard enabled?
	 * That dashboard is not available or necessary on WordPress.com sites when the nav redesign is disabled.
	 *
	 * @return bool
	 */
	public static function is_dashboard_enabled() {
		$is_dashboard_enabled = true;

		// On WordPress.com sites, the dashboard is not needed if the nav redesign is not enabled.
		if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' && ( new Host() )->is_wpcom_platform() ) {
			$is_dashboard_enabled = false;
		}

		/**
		 * Enable a wp-admin dashboard for Blaze campaign management.
		 *
		 * @since 0.7.0
		 *
		 * @param bool $should_enable Should the dashboard be enabled?
		 */
		return apply_filters( 'jetpack_blaze_dashboard_enable', $is_dashboard_enabled );
	}

	/**
	 * Enable the Blaze menu.
	 *
	 * @return void
	 */
	public static function enable_blaze_menu() {
		if ( ! self::should_initialize()['can_init'] ) {
			return;
		}

		/**
		 * Filter the menu page slug used for the Blaze dashboard.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $menu_slug The menu page slug. Default 'advertising'.
		 */
		$menu_slug = apply_filters( 'jetpack_blaze_menu_slug', 'advertising' );

		// Avoid a duplicate Blaze Ads menu when the standalone Blaze Ads plugin
		// (Automattic/blaze-ads) is also active. Releases <= 0.9.0 register their own
		// menu and leave our slug at the default 'advertising', so we bail to avoid a
		// second entry; the standalone owns the menu under 'wp-blaze' and
		// redirect_legacy_advertising_url() forwards 'advertising' links there. When the
		// standalone instead delegates registration to us by filtering the slug (e.g. to
		// 'wp-blaze'), we are the only registrant and must register normally -- the
		// non-default slug is what tells the two cases apart.
		if ( 'advertising' === $menu_slug && self::is_standalone_blaze_ads_active() ) {
			return;
		}

		/**
		 * Filter the menu label for the Blaze dashboard menu item.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $menu_label The menu label. Default 'Blaze Ads'.
		 */
		$menu_label = apply_filters( 'jetpack_blaze_menu_label', 'Blaze Ads' ); // Product name, do not translate.

		/**
		 * Filter the CSS class prefix for the Blaze dashboard.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $css_prefix The CSS class prefix. Default 'jp-blaze'.
		 */
		$css_prefix = apply_filters( 'jetpack_blaze_dashboard_css_prefix', 'jp-blaze' );

		$parent_slug     = self::get_menu_parent();
		$blaze_dashboard = new Blaze_Dashboard( 'admin.php', $menu_slug, $css_prefix );

		if ( self::is_dashboard_enabled() || ( new Host() )->is_wpcom_platform() ) {
			if ( 'jetpack' === $parent_slug ) {
				// Register through Admin_Menu: on WordPress.com Simple sites the Jetpack
				// parent menu does not exist yet at this priority, and registering the
				// submenu before its parent produces a broken menu URL.
				$page_suffix = Admin_Menu::add_menu(
					esc_attr( $menu_label ),
					$menu_label,
					'manage_options',
					$menu_slug,
					array( $blaze_dashboard, 'render' ),
					1
				);
			} else {
				// Other parents already exist at this priority, so add_submenu_page is safe.
				$page_suffix = add_submenu_page(
					$parent_slug,
					esc_attr( $menu_label ),
					$menu_label,
					'manage_options',
					$menu_slug,
					array( $blaze_dashboard, 'render' ),
					1
				);
			}
			add_action( 'load-' . $page_suffix, array( $blaze_dashboard, 'admin_init' ) );

			// Temporary entry at the old Tools location; remove ~1 month after the move ships.
			if ( 'tools.php' !== $parent_slug ) {
				self::add_migration_notice_menu();
			}
		}
	}

	/**
	 * Detect whether the standalone Blaze Ads plugin (Automattic/blaze-ads) is active.
	 *
	 * Both this package and the standalone plugin can register a Blaze Ads menu, which
	 * would result in a duplicate entry when both are active on the same site (for
	 * example a WooCommerce store running Jetpack alongside the standalone plugin). When
	 * the standalone plugin is present it owns the menu, so this package defers to it.
	 *
	 * Detection relies on a class/constant defined by the standalone plugin rather than
	 * on any cooperation from it, so it works with every released version of the plugin,
	 * including ones that predate the jetpack_blaze_menu_* filters.
	 *
	 * @return bool True if the standalone Blaze Ads plugin is active.
	 */
	public static function is_standalone_blaze_ads_active() {
		$is_active = defined( 'BLAZEADS_PLUGIN_FILE' )
			|| defined( 'BLAZE_ADS_VERSION_NUMBER' )
			|| class_exists( 'Blaze_Ads' );

		/**
		 * Filter whether the standalone Blaze Ads plugin (Automattic/blaze-ads) is
		 * considered active. When active and this package is still using the default
		 * menu slug, the package skips registering its own Blaze Ads menu to avoid a
		 * duplicate entry.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $is_active Whether the standalone Blaze Ads plugin is active.
		 */
		return (bool) apply_filters( 'jetpack_blaze_standalone_active', $is_active );
	}

	/**
	 * Determine the appropriate parent menu slug based on the installation context.
	 *
	 * - WooCommerce active (Marketing menu registered): parent is 'woocommerce-marketing'
	 * - WordPress.com platform or Jetpack connected: parent is 'jetpack'
	 * - Otherwise: parent is 'tools.php'
	 *
	 * @return string The parent menu slug.
	 */
	public static function get_menu_parent() {
		if ( class_exists( 'WooCommerce' ) ) {
			// Only use woocommerce-marketing if the menu is actually registered.
			global $menu;
			foreach ( (array) $menu as $item ) {
				if ( isset( $item[2] ) && 'woocommerce-marketing' === $item[2] ) {
					/**
					 * Filter the parent menu slug for the Blaze dashboard submenu item.
					 *
					 * @since $$next-version$$
					 *
					 * @param string $parent The parent menu slug.
					 */
					return apply_filters( 'jetpack_blaze_menu_parent', 'woocommerce-marketing' );
				}
			}
		}

		if ( ( new Host() )->is_wpcom_platform() ) {
			/** This filter is documented above. */
			return apply_filters( 'jetpack_blaze_menu_parent', 'jetpack' );
		}

		if ( ( new Jetpack_Connection() )->is_connected() ) {
			/** This filter is documented above. */
			return apply_filters( 'jetpack_blaze_menu_parent', 'jetpack' );
		}

		/** This filter is documented above. */
		return apply_filters( 'jetpack_blaze_menu_parent', 'tools.php' );
	}

	/**
	 * Register a temporary "moved" notice page at the old Tools menu location.
	 *
	 * The menu keeps its old "Advertising" label so users who knew it by that
	 * name still recognize it; the page itself explains the move to Blaze Ads.
	 *
	 * @return void
	 */
	public static function add_migration_notice_menu() {
		/**
		 * Filter whether to show the temporary migration notice at the old
		 * Tools > Advertising location.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $show_notice Whether to show the migration notice. Default true.
		 */
		if ( ! apply_filters( 'jetpack_blaze_show_migration_notice', true ) ) {
			return;
		}

		add_submenu_page(
			'tools.php',
			esc_attr__( 'Advertising', 'jetpack-blaze' ),
			__( 'Advertising', 'jetpack-blaze' ),
			'manage_options',
			'advertising-moved',
			array( __CLASS__, 'render_migration_notice' ),
			1
		);
	}

	/**
	 * Render the temporary migration notice shown at the old Tools menu location.
	 *
	 * @return void
	 */
	public static function render_migration_notice() {
		/** This filter is documented in Blaze::enable_blaze_menu() */
		$menu_slug = apply_filters( 'jetpack_blaze_menu_slug', 'advertising' );

		$parent_slug  = self::get_menu_parent();
		$parent_label = 'woocommerce-marketing' === $parent_slug
			? __( 'Marketing', 'jetpack-blaze' )
			: 'Jetpack';

		$dashboard_url = admin_url( 'admin.php?page=' . $menu_slug );
		$image_file    = 'woocommerce-marketing' === $parent_slug
			? 'blaze-ads-moved-woo.webp'
			: 'blaze-ads-moved.webp';
		$image_path    = dirname( __DIR__ ) . '/assets/images/' . $image_file;
		$image_url     = plugins_url( 'assets/images/' . $image_file, __DIR__ );

		?>
		<div class="wrap blaze-ads-migration">
			<div class="blaze-ads-migration__header">
				<svg class="blaze-ads-migration__logo" xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
					<path d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" fill="#069e08" />
					<polygon points="15,19 7,19 15,3" fill="#fff" />
					<polygon points="17,29 17,13 25,13" fill="#fff" />
				</svg>
				<span class="blaze-ads-migration__brand">Blaze Ads</span>
			</div>
			<h1 class="blaze-ads-migration__title">
				<?php
				printf(
					/* translators: %s is the product name (not translatable). */
					esc_html__( '%s has moved', 'jetpack-blaze' ),
					'Blaze Ads'
				);
				?>
			</h1>
			<p class="blaze-ads-migration__subtitle">
				<?php
				printf(
					/* translators: %s is the menu path where the section lives now, e.g. "Jetpack → Blaze Ads" or "Marketing → Blaze Ads". */
					esc_html__( "Now it's part of %s", 'jetpack-blaze' ),
					esc_html( $parent_label . ' → Blaze Ads' )
				);
				?>
			</p>
			<p>
				<a class="button button-primary button-hero" href="<?php echo esc_url( $dashboard_url ); ?>">
					<?php
					printf(
						/* translators: %s is the product name (not translatable). */
						esc_html__( 'Check new %s', 'jetpack-blaze' ),
						'Blaze Ads'
					);
					?>
				</a>
			</p>
			<?php if ( file_exists( $image_path ) ) : ?>
				<p class="blaze-ads-migration__image">
					<img
						src="<?php echo esc_url( $image_url ); ?>"
						alt="<?php echo esc_attr( sprintf( /* translators: %s is the product name (not translatable). */ __( '%s has moved', 'jetpack-blaze' ), 'Blaze Ads' ) ); ?>"
					/>
				</p>
			<?php endif; ?>
		</div>
		<style>
			.blaze-ads-migration__header { display: flex; align-items: center; gap: 8px; margin: 16px 0 24px; }
			.blaze-ads-migration__brand { font-size: 1.65em; font-weight: 500; line-height: 1; }
			.blaze-ads-migration__title { font-size: 2.5em; margin-bottom: 0.25em; padding: 0; }
			.blaze-ads-migration__subtitle { font-size: 1.4em; margin-top: 0; color: #50575e; }
			.blaze-ads-migration__image { margin-top: 3em; }
			.blaze-ads-migration__image img { max-width: 100%; height: auto; }
		</style>
		<?php
	}

	/**
	 * Redirect legacy/duplicate Blaze dashboard URLs to wherever the menu actually lives.
	 *
	 * Runs early on admin_menu, before WordPress validates the ?page= parameter against
	 * registered submenus. The target is computed by get_legacy_advertising_redirect_target();
	 * this method only performs the redirect.
	 *
	 * @return void
	 */
	public static function redirect_legacy_advertising_url() {
		$target = self::get_legacy_advertising_redirect_target();
		if ( null !== $target ) {
			wp_safe_redirect( $target, 302 );
			exit;
		}
	}

	/**
	 * Compute where a legacy/duplicate `page=advertising` request should be redirected, or
	 * null if it should be left alone. Pure (no side effects) so it is unit-testable.
	 *
	 * Two cases produce a redirect:
	 *
	 * - Standard move: `tools.php?page=advertising` -> `admin.php?page=advertising`, once the
	 *   menu has moved away from Tools.
	 * - Standalone Blaze Ads plugin present: this package does not register the 'advertising'
	 *   page (the standalone owns the menu under 'wp-blaze'), so BOTH the tools.php and the
	 *   admin.php `page=advertising` entry points are forwarded to the standalone's page. We
	 *   forward both ourselves rather than relying on the standalone shipping its own
	 *   redirect, so correctness never depends on a particular standalone release.
	 *
	 * @return string|null The redirect URL, or null if no redirect should happen.
	 */
	public static function get_legacy_advertising_redirect_target() {
		global $pagenow;

		if (
			! isset( $_GET['page'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only check to redirect, no data is processed.
			|| 'advertising' !== $_GET['page'] // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only check to redirect, no data is processed.
		) {
			return null;
		}

		if ( ! self::should_initialize()['can_init'] ) {
			return null;
		}

		if ( self::is_standalone_blaze_ads_active() ) {
			// Only the two URLs that can carry the dashboard page parameter.
			if ( 'admin.php' !== $pagenow && 'tools.php' !== $pagenow ) {
				return null;
			}
			/**
			 * Filter the standalone Blaze Ads plugin's menu slug used as the redirect
			 * target when this package defers to it.
			 *
			 * @since $$next-version$$
			 *
			 * @param string $standalone_slug The standalone menu slug. Default 'wp-blaze'.
			 */
			$standalone_slug = apply_filters( 'jetpack_blaze_standalone_menu_slug', 'wp-blaze' );
			return admin_url( 'admin.php?page=' . $standalone_slug );
		}

		if ( 'tools.php' !== $pagenow || 'tools.php' === self::get_menu_parent() ) {
			return null;
		}

		/** This filter is documented in Blaze::enable_blaze_menu() */
		$menu_slug = apply_filters( 'jetpack_blaze_menu_slug', 'advertising' );
		return admin_url( 'admin.php?page=' . $menu_slug );
	}

	/**
	 * Check the WordPress.com REST API
	 * to ensure that the site supports the Blaze feature.
	 *
	 * - If the site is on WordPress.com Simple, we do not query the API.
	 * - Results are cached for a day after getting response from API.
	 * - If the API returns an error, we cache the result for an hour.
	 *
	 * @param int $blog_id The blog ID to check.
	 *
	 * @return bool
	 */
	public static function site_supports_blaze( $blog_id ) {
		$transient_name = 'jetpack_blaze_site_supports_blaze_' . $blog_id;

		/*
		 * On WordPress.com, we don't need to make an API request,
		 * we can query directly.
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'blaze_is_site_eligible' ) ) {
			return blaze_is_site_eligible( $blog_id );
		}

		$cached_result = get_transient( $transient_name );
		if ( false !== $cached_result ) {
			if ( is_array( $cached_result ) ) {
				return $cached_result['approved'];
			}

			return (bool) $cached_result;
		}

		// Make the API request.
		$url      = sprintf( '/sites/%d/blaze/status', $blog_id );
		$response = Client::wpcom_json_api_request_as_blog(
			$url,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		// If there was an error or malformed response, bail and save response for an hour.
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			set_transient( $transient_name, array( 'approved' => false ), HOUR_IN_SECONDS );
			return false;
		}

		// Decode the results.
		$result = json_decode( wp_remote_retrieve_body( $response ), true );

		// Bail if there were no results returned.
		if ( ! is_array( $result ) || ! isset( $result['approved'] ) ) {
			return false;
		}

		// Cache the result for 24 hours.
		set_transient( $transient_name, array( 'approved' => (bool) $result['approved'] ), DAY_IN_SECONDS );

		return (bool) $result['approved'];
	}

	/**
	 * Get the active campaign status for a site.
	 *
	 * @param int $blog_id The blog ID to check.
	 *
	 * @return array Active campaign status.
	 */
	public static function get_active_campaigns_status( $blog_id ) {
		$blog_id = absint( $blog_id );

		if ( empty( $blog_id ) ) {
			return self::get_unknown_active_campaigns_status();
		}

		$transient_name = self::ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_PREFIX . $blog_id;
		$cached_result  = get_transient( $transient_name );

		if ( false !== $cached_result ) {
			return $cached_result;
		}

		/**
		 * Filter the campaign statuses that should trigger the active campaign warning.
		 *
		 * @since 0.27.23
		 *
		 * @param string[] $statuses Campaign statuses to check.
		 * @param int      $blog_id  The blog ID being checked.
		 */
		$statuses = apply_filters( 'jetpack_blaze_active_campaign_statuses', self::ACTIVE_CAMPAIGN_STATUSES, $blog_id );
		$statuses = array_filter( array_map( 'sanitize_key', (array) $statuses ) );

		if ( empty( $statuses ) ) {
			$statuses = self::ACTIVE_CAMPAIGN_STATUSES;
		}

		$url = add_query_arg(
			array(
				'status' => implode( ',', $statuses ),
				'limit'  => 1,
			),
			sprintf( '/sites/%d/wordads/dsp/api/v1/search/campaigns/site/%d', $blog_id, $blog_id )
		);

		$response = Client::wpcom_json_api_request_as_user(
			$url,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return self::get_unknown_active_campaigns_status( $transient_name );
		}

		$result = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $result ) || ! isset( $result['campaigns'] ) || ! is_array( $result['campaigns'] ) ) {
			return self::get_unknown_active_campaigns_status( $transient_name );
		}

		$has_active_campaigns = ! empty( $result['campaigns'] );
		$status               = array(
			'has_active_campaigns' => $has_active_campaigns,
			'status'               => $has_active_campaigns ? 'active' : 'none',
		);

		if ( $has_active_campaigns ) {
			set_transient( $transient_name, $status, self::ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_TTL );
		}

		return $status;
	}

	/**
	 * Get the unknown active campaign status response.
	 *
	 * @param string|null $transient_name Optional transient name used to cache the unknown status.
	 * @return array Unknown active campaign status.
	 */
	private static function get_unknown_active_campaigns_status( $transient_name = null ) {
		$status = array(
			'has_active_campaigns' => false,
			'status'               => 'unknown',
		);

		if ( $transient_name ) {
			set_transient( $transient_name, $status, self::UNKNOWN_ACTIVE_CAMPAIGNS_STATUS_TRANSIENT_TTL );
		}

		return $status;
	}

	/**
	 * Determines if criteria is met to enable Blaze features.
	 * Keep in mind that this makes remote requests, so we want to avoid calling it when unnecessary, like in the frontend.
	 *
	 * @return array
	 */
	public static function should_initialize() {
		$is_wpcom   = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$connection = new Jetpack_Connection();
		$site_id    = Jetpack_Connection::get_site_id();

		// Only admins should be able to Blaze posts on a site.
		if ( ! current_user_can( 'manage_options' ) ) {
			return array(
				'can_init' => false,
				'reason'   => 'user_not_admin',
			);
		}

		// Allow short-circuiting the Blaze initialization via a filter.
		if ( has_filter( 'jetpack_blaze_enabled' ) ) {
			/**
			 * Filter to disable all Blaze functionality.
			 *
			 * @since 0.3.0
			 *
			 * @param bool $should_initialize Whether Blaze should be enabled. Default to true.
			 */
			$should_init = apply_filters( 'jetpack_blaze_enabled', true );

			return array(
				'can_init' => $should_init,
				'reason'   => $should_init ? null : 'initialization_disabled',
			);
		}

		// On self-hosted sites, we must do some additional checks.
		if ( ! $is_wpcom ) {
			/*
			* These features currently only work on WordPress.com,
			* so the site must be connected to WordPress.com, and the user as well for things to work.
			*/
			if (
				is_wp_error( $site_id )
			) {
				return array(
					'can_init' => false,
					'reason'   => 'wp_error',
				);
			}

			if ( ! $connection->is_connected() ) {
				return array(
					'can_init' => false,
					'reason'   => 'site_not_connected',
				);
			}

			if ( ! $connection->is_user_connected() ) {
				return array(
					'can_init' => false,
					'reason'   => 'user_not_connected',
				);
			}

			// The whole thing is powered by Sync!
			if ( ! Sync_Settings::is_sync_enabled() ) {
				return array(
					'can_init' => false,
					'reason'   => 'sync_disabled',
				);
			}
		}

		// Check if the site supports Blaze.
		if ( is_numeric( $site_id ) && ! self::site_supports_blaze( $site_id ) ) {
			return array(
				'can_init' => false,
				'reason'   => 'site_not_eligible',
			);
		}

		// Final fallback.
		return array(
			'can_init' => true,
			'reason'   => null,
		);
	}

	/**
	 * Get URL to create a Blaze campaign for a specific post.
	 *
	 * This can return 2 different types of URL:
	 * - Calypso Links
	 * - wp-admin Links if access to the wp-admin Blaze Dashboard is enabled.
	 *
	 * @param int|string $post_id Post ID.
	 *
	 * @return array An array with the link, and whether this is a Calypso or a wp-admin link.
	 */
	public static function get_campaign_management_url( $post_id ) {
		if ( self::is_dashboard_enabled() ) {
			/** This filter is documented in Blaze::enable_blaze_menu() */
			$menu_slug = apply_filters( 'jetpack_blaze_menu_slug', 'advertising' );

			// When the standalone Blaze Ads plugin owns the menu under its own slug and
			// this package did not register 'advertising', point the link straight at the
			// standalone's page. Relying on the admin.php?page=advertising redirect would
			// drop the #! route fragment and land the user on the dashboard home instead
			// of the specific post's promotion flow.
			if ( 'advertising' === $menu_slug && self::is_standalone_blaze_ads_active() ) {
				/** This filter is documented in Blaze::redirect_legacy_advertising_url() */
				$menu_slug = apply_filters( 'jetpack_blaze_standalone_menu_slug', 'wp-blaze' );
			}

			$admin_url = admin_url( 'admin.php?page=' . $menu_slug );
			$hostname  = wp_parse_url( get_site_url(), PHP_URL_HOST );
			// The dashboard SPA routes under its menu slug (see Dashboard), so the #! path
			// prefix must match the slug rather than being hardcoded to 'advertising'.
			$blaze_url = sprintf(
				'%1$s#!/%2$s/posts/promote/post-%3$s/%4$s',
				$admin_url,
				$menu_slug,
				esc_attr( $post_id ),
				$hostname
			);

			return array(
				'link'     => $blaze_url,
				'external' => false,
			);
		}

		// Default Calypso link.
		$blaze_url = Redirect::get_url(
			'jetpack-blaze',
			array(
				'query' => 'blazepress-widget=post-' . esc_attr( $post_id ),
			)
		);
		return array(
			'link'     => $blaze_url,
			'external' => true,
		);
	}

	/**
	 * Adds the Promote link to the posts list row action.
	 *
	 * @param array   $post_actions The current array of post actions.
	 * @param WP_Post $post The current post in the post list table.
	 *
	 * @return array
	 */
	public static function jetpack_blaze_row_action( $post_actions, $post ) {
		/**
		 * Allow third-party plugins to disable Blaze row actions.
		 *
		 * @since 0.16.0
		 *
		 * @param bool    $are_quick_links_enabled Should Blaze row actions be enabled.
		 * @param WP_Post $post                    The current post in the post list table.
		 */
		$are_quick_links_enabled = apply_filters( 'jetpack_blaze_post_row_actions_enable', true, $post );

		// Bail if we are not looking at one of the supported post types (post, page, or product).
		if (
			! $are_quick_links_enabled
			|| ! in_array( $post->post_type, array( 'post', 'page', 'product' ), true )
		) {
			return $post_actions;
		}

		// Bail if the post is not published.
		if ( $post->post_status !== 'publish' ) {
			return $post_actions;
		}

		// Bail if the post has a password.
		if ( '' !== $post->post_password ) {
			return $post_actions;
		}

		$blaze_url = self::get_campaign_management_url( $post->ID );
		$text      = __( 'Promote with Blaze', 'jetpack-blaze' );
		$title     = get_the_title( $post );
		$label     = sprintf(
			/* translators: post title */
			__( 'Blaze &#8220;%s&#8221; to Tumblr and WordPress.com audiences.', 'jetpack-blaze' ),
			$title
		);

		$post_actions['blaze'] = sprintf(
			'<a href="%1$s" title="%2$s" aria-label="%2$s" %4$s>%3$s</a>',
			esc_url( $blaze_url['link'] ),
			esc_attr( $label ),
			esc_html( $text ),
			( true === $blaze_url['external'] ? 'target="_blank" rel="noopener noreferrer"' : '' )
		);

		return $post_actions;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		/*
		 * We do not want (nor need) Blaze in the site editor, or the widget editor, or the classic editor.
		 * We only want it in the post editor.
		 * Enqueueing the script in those editors would cause a fatal error.
		 * See #20357 for more info.
		*/
		if ( ! function_exists( 'get_current_screen' ) ) { // When Gutenberg is loaded in the frontend.
			return;
		}
		$current_screen = get_current_screen();
		if (
			empty( $current_screen )
			|| $current_screen->base !== 'post'
			|| ! $current_screen->is_block_editor()
		) {
			return;
		}
		// Bail if criteria is not met to enable Blaze features.
		if ( ! self::should_initialize()['can_init'] ) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			self::$script_path,
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-blaze',
			)
		);

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );

		// Pass additional data to our script.
		wp_localize_script(
			self::SCRIPT_HANDLE,
			'blazeInitialState',
			array(
				'blazeUrlTemplate' => self::get_campaign_management_url( '__POST_ID__' ),
			)
		);
	}
}
