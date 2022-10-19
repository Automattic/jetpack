<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack_Boost\Features\Optimizations\Optimizations;
use Automattic\Jetpack_Boost\Features\Speed_Score\Speed_Score;
use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Premium_Pricing;

class Admin {

	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'jetpack-boost';

	/**
	 * Main plugin instance.
	 *
	 * @var Jetpack_Boost Plugin.
	 */
	private $modules;

	/**
	 * Speed_Score class instance.
	 *
	 * @var Speed_Score instance.
	 */
	private $speed_score;

	/**
	 * Configuration constants.
	 *
	 * @param Config $config
	 */
	private $config;

	public function __construct( Optimizations $modules ) {
		$this->modules     = $modules;
		$this->speed_score = new Speed_Score( $modules );
		Environment_Change_Detector::init();
		Premium_Pricing::init();

		$this->config = new Config();
		$this->config->init();

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );

		add_action( 'admin_notices', array( $this, 'connection_prompt' ) );
		add_action( 'wp_ajax_dismiss_setup_banner', array( $this, 'dismiss_setup_banner' ) );

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			'Boost',
			'manage_options',
			JETPACK_BOOST_SLUG,
			array( $this, 'render_settings' )
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

		// Admin Notices
		Regenerate_Admin_Notice::init();
	}

	/**
	 * Enqueue scripts and styles for the admin page.
	 */
	public function admin_init() {
		// Clear premium features cache when the plugin settings page is loaded.
		Premium_Features::clear_cache();

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		wp_enqueue_style(
			'jetpack-boost-css',
			plugins_url( $internal_path . 'jetpack-boost.css', JETPACK_BOOST_PATH ),
			array( 'wp-components' ),
			JETPACK_BOOST_VERSION
		);
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$admin_js_handle = 'jetpack-boost-admin';

		wp_register_script(
			$admin_js_handle,
			plugins_url( $internal_path . 'jetpack-boost.js', JETPACK_BOOST_PATH ),
			array( 'wp-i18n', 'wp-components' ),
			JETPACK_BOOST_VERSION,
			true
		);

		wp_localize_script(
			$admin_js_handle,
			'Jetpack_Boost',
			$this->config->constants()
		);

		wp_set_script_translations( $admin_js_handle, 'jetpack-boost' );

		wp_enqueue_script( $admin_js_handle );
	}

	/**
	 * Get settings link.
	 *
	 * @param array $links the array of links.
	 */
	public function plugin_page_settings_link( $links ) {
		$settings_link = '<a href="' . admin_url( 'admin.php?page=jetpack-boost' ) . '">' . esc_html__( 'Settings', 'jetpack-boost' ) . '</a>';
		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Show the connection prompt
	 */
	public function connection_prompt() {
		$screen = get_current_screen();
		if ( $screen->parent_file === 'plugins.php' ) { ?>
			<style>
			.boost-banner {
				margin: 50px 1.25rem 1.25rem 0;
				box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.03), 0px 1px 2px rgba(0, 0, 0, 0.03);
				border: 1px solid #d5d5d5;
				position: relative;
			}
			.boost-banner h1{
				line-height:30px;
			}
			.boost-banner-inner {
				display: flex;
				grid-template-columns: minmax(auto, 750px) 500px;
				justify-content: space-between;
				min-height: 300px;
				background: #fff;
				overflow: hidden;
			}

			.boost-banner-content {
				display: inline-flex;
				flex-direction: column;
				padding: 2rem 3rem 2rem 2rem;
				text-align: left;
			}

			.boost-banner-image-container {
				position: relative;
				background-image: url( <?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/jetpack-colors.svg' ); ?> );
				background-size: cover;
				max-width: 40%;
				overflow: hidden;
			}

			.boost-banner-image-container img {
				position: relative;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				width: 100%;
			}

			.boost-banner p {
				font-size: 16px;
				line-height: 1.5;
				margin: 1rem 0 2rem;
			}

			.boost-banner .boost-dismiss {
				position: absolute;
				top: 10px;
				right: 10px;
				color: white;
				cursor:pointer;
			}

			.boost-banner .button-primary {
				background: black;
				border-color: black;
				color: #fff;
				width: fit-content;
				padding: 0.4rem 1rem;
				font-size: 16px;
			}

			.boost-banner .button-primary:hover {
				background-color: #333;
			}

			.boost-banner .button-primary:visited {
				background-color: black;
				border-color: black;
			}
			.boost-banner .boost-almost-done{
				align-items: baseline;
				background-color: #069e08;
				color: #fff;
				display: flex;
				padding: 1rem 2.25rem 1.5rem 1rem;
			}
			.boost-almost-done  svg {
				height: 24px;
				margin-right: 0.625rem;
				position: relative;
				top: 7px;
				width: 24px;
				color:white;
			}
			.boost-almost-done  svg path{
				fill:white;
			}
			</style>
			<?php
			// we need to decide what setup complete is. Can't be connected Boost since they may already have connected Jetpack
			// do we want success to be successfully generate critical CSS? I'd say so, so I'll word the messaging as such.

			$showing_setup_banner = get_option( 'boost_setup_banner', true );
			$boost_banner_nonce   = wp_create_nonce( 'boost_setup_banner' );
			if ( $showing_setup_banner ) {
				?>
					<div class="boost-banner">
						<div class="boost-almost-done">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"></rect><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path></g></svg>
							<?php esc_html_e( 'You are almost done. Set up Jetpack Bost and generate your sites critical CSS to see the impact on your pagespeed scores.', 'jetpack-boost' ); ?>
						</div>
						<div class="boost-banner-inner">
							<div class="boost-banner-content">
								<img style="width:176px" src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/jetpack-logo.svg' ); ?>" height="32" />

								<h1>
									<?php esc_html_e( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ); ?>
								</h1>

								<p>
									<?php esc_html_e( 'You are almost done. Set up Jetpack Bost and generate your sites critical CSS to see the impact on your pagespeed scores.', 'jetpack-boost' ); ?>
								</p>
								<?php // phpcs:disable ?>
								<a href="<?php echo admin_url( 'admin.php?page=jetpack-boost' ); ?>" class="button button-primary">
								<?php // phpcs:enable ?>
								<?php esc_html_e( 'Set up Jetpack Boost', 'jetpack-boost' ); ?>
								</a>
							</div>

							<div class="boost-banner-image-container">
								<img
									src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/boost-performance.png' ); ?>"
									title="<?php esc_attr_e( 'Check how your web site performance scores for desktop and mobile.', 'jetpack-boost' ); ?>"
									alt="<?php esc_attr_e( 'An image showing a web site with a photo of a time-lapsed watch face. In the foreground is a graph showing a speed score for mobile and desktop in yellow and green with an overall score of B', 'jetpack-boost' ); ?>"
									srcset="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . '/app/assets/static/images/boost-performance.png' ); ?> 650w <?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance-2x.png' ); ?> 1306w"
									sizes="(max-width: 782px) 654px, 1306px"
								>
							</div>
						</div>

						<span class="boost-dismiss dashicons dashicons-dismiss"></span>
					</div>

					<script>
						jQuery( '.boost-dismiss' ).on( 'click', function() {
							jQuery( '.boost-banner' ).fadeOut( 'slow' );
							jQuery.post( ajaxurl, {
								action: 'dismiss_setup_banner',
								nonce: '<?php echo esc_js( $boost_banner_nonce ); ?>',
							} );
						} );
					</script>
				<?php
			} // end if plugin banner
		} // end if screen is plugins.php
	}

	// hides the boost promo banner on dismiss
	public function dismiss_setup_banner() {
		check_ajax_referer( 'boost_setup_banner', 'nonce' );
		update_option( 'boost_setup_banner', 0, 'no' );
		wp_die();
	}

	/**
	 * Generate the settings page.
	 */
	public function render_settings() {
		wp_localize_script(
			'jetpack-boost-admin',
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
		?>
		<div id="jb-admin-settings"></div>
		<?php
	}
}
