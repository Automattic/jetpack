<?php
/**
 * A class that adds a stats dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\StatsAdmin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Jetpack_Options;

/**
 * Responsible for adding a stats dashboard to wp-admin.
 *
 * @package jetpack-stats
 */
class Dashboard {
	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Priority for the dashboard menu
	 * For Jetpack sites: Jetpack uses 998 and 'Admin_Menu' uses 1000, so we need to use 999.
	 * For simple site: the value is overriden in a child class with value 100000 to wait for all menus to be registered.
	 *
	 * @var int
	 */
	protected $menu_priority = 999;

	/**
	 * Init Stats dashboard.
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			( new self() )->init_hooks();
		}
	}

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		self::$initialized = true;
		// Jetpack uses 998 and 'Admin_Menu' uses 1000.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_submenu' ), $this->menu_priority );
	}

	/**
	 * The page to be added to submenu
	 */
	public function add_wp_admin_submenu() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'Stats App', 'jetpack-stats-admin' ),
			_x( 'Stats App', 'product name shown in menu', 'jetpack-stats-admin' ),
			'manage_options',
			'jetpack-stats-app',
			array( $this, 'render' ),
			100
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		?>
		<div id="wpcom" class="jp-stats-dashboard">
			<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Stats dashboard requires JavaScript to function properly.', 'jetpack-stats-admin' ); ?></div>
		</div>
		<script>
			jQuery(document).ready(function($) {
				$("#wpcom").on('click', 'a', function (e) {
					const link = e && e.currentTarget && e.currentTarget.attributes && e.currentTarget.attributes.href && e.currentTarget.attributes.href.value;
					if( link && ! link.startsWith( 'http' ) ) {
						location.hash = `#!${link}`;
						return false;
					}
				});
			});
		</script>
		<?php
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		wp_register_script( 'jp-stats-dashboard', 'https://kangzj.net/dist/build.min.js', array( 'react', 'react-dom', 'wp-polyfill' ), JETPACK__VERSION, true );
		wp_register_style( 'jp-stats-dashboard-style', 'https://kangzj.net/dist/build.min' . ( is_rtl() ? '.rtl' : '' ) . '.css', array(), JETPACK__VERSION );
		wp_enqueue_script( 'jp-stats-dashboard' );
		wp_enqueue_style( 'jp-stats-dashboard-style' );

		wp_add_inline_script(
			'jp-stats-dashboard',
			static::config_data(),
			'before'
		);

		add_action(
			'admin_head',
			function () {
				echo '<style>
				.jp-stats-dashboard .card {
					border:0;
					max-width: initial;
					min-width: initial;
				}
				ul.wp-submenu, ul.wp-submenu-wrap {
					margin-left: 0;
				}
				.jp-stats-dashboard .followers-count {
					display: none;
				}
				.jp-stats-dashboard .layout__content {
					padding-top: 32px;
				}
				</style>';
			},
			100
		);
	}

	/**
	 * Return the initial state of the app.
	 */
	public static function config_data() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$empty_object = json_decode( '{}' );

		return 'window.configData = ' . wp_json_encode(
			array(
				'site_name'                      => \get_bloginfo( 'name' ),
				'env_id'                         => 'production',
				'i18n_default_locale_slug'       => 'en',
				'i18n_locale_slug'               => static::get_site_locale(),
				'google_analytics_key'           => 'UA-10673494-15',
				'client_slug'                    => 'browser',
				'twemoji_cdn_url'                => 'https://s0.wp.com/wp-content/mu-plugins/wpcom-smileys/twemoji/2/',
				'site_filter'                    => array(),
				'sections'                       => array(),
				'enable_all_sections'            => false,
				'jetpack_support_blog'           => 'jetpackme.wordpress.com',
				'wpcom_support_blog'             => 'en.support.wordpress.com',
				'google_maps_and_places_api_key' => '',
				'mc_analytics_enabled'           => false,
				'gutenboarding_url'              => '/new',
				'hostname'                       => false,
				'restricted_me_access'           => true,
				'signup_url'                     => false,
				'features'                       => array(),
				'api_root'                       => esc_url_raw( rest_url() ),
				'blog_id'                        => Jetpack_Options::get_option( 'id' ),
				'nonce'                          => wp_create_nonce( 'wp_rest' ),
				'is_running_in_jetpack_site'     => true,
				'admin_page_base'                => static::get_admin_path(),
				'meta'                           => array(
					'property' => 'og:site_name',
					'content'  => 'WordPress.com',
				),
				'features'                       => array(
					'stats/show-traffic-highlights' => true,
					'stats/new-main-chart'          => true,
				),
				'intial_state'                   => array(
					'currentUser' => array(
						'id'   => 1000,
						'user' => array(
							'ID'       => 1000,
							'username' => 'no-user',
						),
					),
					'ui'          => array(
						'selectedSiteId'           => Jetpack_Options::get_option( 'id' ),
						'siteSelectionInitialized' => true,
					),
					'sites'       => array(
						'items' => array(
							"$blog_id" => array(
								'ID'           => $blog_id,
								'URL'          => site_url(),
								'jetpack'      => true,
								'visible'      => true,
								'capabilities' => $empty_object,
								'products'     => array(),
								'plan'         => $empty_object,
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Page base for the Calypso admin page.
	 */
	protected static function get_admin_path() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( ! isset( $_SERVER['PHP_SELF'] ) || ! isset( $_SERVER['QUERY_STRING'] ) ) {
			$parsed = wp_parse_url( admin_url( 'admin.php?page=stats&calypso_stats=1' ) );
			return $parsed['path'] . '?' . $parsed['query'];
		}
		// We do this because page.js requires the exactly page base to be set otherwise it will not work properly.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		return wp_unslash( $_SERVER['PHP_SELF'] ) . '?' . wp_unslash( $_SERVER['QUERY_STRING'] );
	}

	/**
	 * Get locale acceptable by Calypso.
	 */
	protected static function get_site_locale() {
		// Stolen from `projects/plugins/jetpack/modules/sitemaps/sitemap-builder.php`

		/*
		 * Trim the locale to an ISO 639 language code as required by Google.
		 * Special cases are zh-cn (Simplified Chinese) and zh-tw (Traditional Chinese).
		 * @link https://www.loc.gov/standards/iso639-2/php/code_list.php
		 */
		$locale = strtolower( get_locale() );

		if ( in_array( $locale, array( 'zh_tw', 'zh_cn' ), true ) ) {
			$locale = str_replace( '_', '-', $locale );
		} else {
			$locale = preg_replace( '/(_.*)$/i', '', $locale );
		}
		return $locale;
	}

}
