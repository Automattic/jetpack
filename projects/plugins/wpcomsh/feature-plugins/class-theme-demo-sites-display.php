<?php
/**
 * Theme_Demo_Sites_Display file.
 * Adds the demo bar on atomic theme demo sites.
 *
 * @package wpcomsh
 */

/**
 * Class Theme_Demo_Sites_Display
 */
class Theme_Demo_Sites_Display {
	/**
	 * Singleton instance.
	 *
	 * @var Theme_Demo_Sites_Display
	 */
	private static $instance = null;

	/**
	 * Theme data information, containing the cost and is_retired status.
	 *
	 * @var null|object
	 */
	private $premium_theme_data = null;

	/**
	 * Silence is golden
	 */
	private function __construct() {}

	/**
	 * Ooh, a singleton
	 *
	 * @uses self::setup
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->setup();
		}

		return self::$instance;
	}

	/**
	 * Get premium theme data for the specified theme.
	 * The data structure is returned from the wpcom/v2/themes/{$stylesheet}/premium-details endpoint.
	 *
	 * @param string $stylesheet Theme slug.
	 * @return object|bool Returns false when the theme is not premium or we fail to look up the data, and a premium theme data object otherwise.
	 */
	private function get_premium_theme_data( $stylesheet ) {
		if ( null !== $this->premium_theme_data ) {
			return $this->premium_theme_data;
		}

		$transient_key     = "atomic-premium-theme-data:$stylesheet";
		$cached_theme_data = get_transient( $transient_key );
		if ( is_object( $cached_theme_data ) ) {
			return $cached_theme_data;
		}

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
			"themes/{$stylesheet}/premium-details",
			'2',
			array(
				'method' => 'GET',
			),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) || 200 !== $response['response']['code'] || ! isset( $response['body'] ) ) {
			return false;
		}

		$this->premium_theme_data = json_decode( wp_remote_retrieve_body( $response ) );
		set_transient( $transient_key, $this->premium_theme_data, 5 * MINUTE_IN_SECONDS );

		return $this->premium_theme_data;
	}

	/**
	 * Register actions based on use case
	 *
	 * @uses add_action
	 * @return void
	 */
	protected function setup() {
		if ( isset( $_GET['demo'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'init', array( $this, 'external_demo_init' ), 30 );
		} else {
			add_action( 'init', array( $this, 'activation_bar_init' ), 30 );
		}
	}

	/**
	 * Check if the current blog is eligible for the demo bar.
	 *
	 * @param int $id site id
	 * @return bool
	 */
	protected function demo_site_supports_activation_bar( $id ) {
		// Sanitize blog ID
		$id = (int) $id;

		// Certain demo sites aren't eligible, usually due to visual conflicts between the demo bar and the theme
		$ineligible = array(
			/**
			 * Example of how to add a demo site to the ineligible list:
			 * blog_id, // url of demo site - explanation of why it's ineligible
			 */
		);

		// If the theme is retired, the demo site shouldn't display the activation bar, since the theme probably isn't available to the viewer
		$current_theme = get_option( 'stylesheet' );

		if ( $current_theme && $this->wpcom_is_retired_theme( $current_theme ) ) {
			return false;
		}

		return ! in_array( $id, $ineligible, true );
	}

	/**
	 * Checks if the theme is retired.
	 *
	 * @param string $stylesheet stylesheet slug
	 * @return bool
	 */
	private function wpcom_is_retired_theme( $stylesheet ) {
		$premium_theme_data = $this->get_premium_theme_data( $stylesheet );
		return $premium_theme_data && $premium_theme_data->is_retired;
	}

	/**
	 * Prepare activation bar if current site is a theme demo site
	 *
	 * @global $blog_id
	 * @uses is_customize_preview
	 * @uses jetpack_is_mobile
	 * @uses add_action
	 * @uses add_filter
	 * @uses wp_enqueue_script
	 * @uses plugins_url
	 * @uses wp_enqueue_style
	 * @return null
	 */
	public function activation_bar_init() {
		// Make sure we don't have the cookie law widget when we are on a theme demo site
		unregister_widget( 'EU_Cookie_Law_Widget' );

		// Don't display activation bar in Customizer
		if ( is_customize_preview() ) {
			return;
		}

		// Don't display activation bar in Theme Preview
		if ( isset( $_GET['theme_preview'] ) && $_GET['theme_preview'] === 'true' ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// Load activation bar code, if site is eligible
		global $blog_id;

		if ( ! jetpack_is_mobile() && $this->demo_site_supports_activation_bar( $blog_id ) ) {
			add_action( 'wp_footer', array( $this, 'activation_bar_init_widget' ) );

			add_action( 'wp_enqueue_scripts', array( $this, 'activation_bar_fonts' ) );
			add_filter( 'body_class', array( $this, 'activation_bar_body_classes' ) );

			wp_enqueue_style( 'demosite-activate', plugins_url( 'assets/demosite-activate.css', __DIR__ ), array(), WPCOMSH_VERSION );
		}
	}

	/**
	 * Get the premium theme slug
	 *
	 * @param string $stylesheet stylesheet slug
	 * @return string
	 */
	private function get_theme_slug( $stylesheet ) {
		return "premium/{$stylesheet}";
	}

	/**
	 * Check if the theme is premium for a given stylesheet
	 *
	 * @param string $stylesheet stylesheet slug
	 * @return bool
	 */
	private function is_premium_theme( $stylesheet ) {
		$premium_theme_data = $this->get_premium_theme_data( $stylesheet );
		if ( ! $premium_theme_data ) {
			return false;
		}

		return true;
	}

	/**
	 * Output the trigger, widget, and form/button
	 *
	 * @global $current_blog
	 * @uses wp_get_theme
	 * @uses __
	 * @uses is_premium_theme
	 * @uses _e
	 * @uses esc_attr
	 * @uses esc_html
	 * @uses wp_nonce_field
	 * @uses add_query_arg
	 * @uses esc_url
	 * @action wp_footer
	 * @return void
	 */
	public function activation_bar_init_widget() {
		global $current_blog;

		// setup $theme object
		$theme = wp_get_theme();

		// Signup URL with theme and source parameters
		// 'theme' and 'demo-blog'
		$url = add_query_arg(
			array(
				'theme'   => rawurlencode( $this->get_theme_slug( $theme->stylesheet ) ),
				'premium' => $this->is_premium_theme( $theme->stylesheet ) ? 'true' : false,
				'ref'     => 'demo-blog',
			),
			'https://wordpress.com/start/with-theme'
		);

		$title    = __( 'Start your WordPress.com site with this theme.' );
		$tab_text = __( 'Sign Up Now' );
		$text     = __( 'Start a site with this theme.' );
		$button   = __( 'Activate' );

		if ( $this->is_premium_theme( $theme->stylesheet ) ) {
			$tab_text = __( 'Purchase' );
			$text     = __( 'Create a site and purchase this theme to start using it now.' );
			$button   = __( 'Purchase &amp; Activate' );
		}

		// if the site is premium, set $theme_price
		$theme_price = '';

		$premium_theme_data = $this->get_premium_theme_data( $theme->stylesheet );

		if ( $premium_theme_data && $this->is_premium_theme( $theme->stylesheet ) && $theme->is_allowed( 'network' ) ) {
			$theme_price = '<span class="theme-price">' . $premium_theme_data->cost . '</span>';
		}
		?>

		<div id="demosite-activate-wrap" class="demosite-activate">

			<header class="demosite-header">
				<p class="demosite-tagline"><?php echo esc_html( $title ); ?></p>
				<a class="demosite-activate-trigger" href="<?php echo esc_url( $url ); ?>">
					<?php
						echo $tab_text; //phpcs:ignore
						echo $theme_price; //phpcs:ignore
					?>
				</a>
			</header>
		</div><!-- #demosite-activate-wrap -->
		<?php
	}

	/**
	 * Adds demo-site class array of body classes
	 *
	 * @param array $classes array of body classes
	 * @filter body_class
	 * @return array
	 */
	public function activation_bar_body_classes( $classes ) {
		$classes[] = 'demo-site';

		return $classes;
	}

	/**
	 * Enqueue Google Fonts
	 *
	 * @uses is_ssl
	 * @uses wp_enqueue_style
	 * @uses add_query_arg
	 * @action wp_enqueue_scripts
	 * @return void
	 */
	public function activation_bar_fonts() {
		$args = array(
			'family' => 'Open+Sans:300,300italic,400,400italic,600,600italic,700,700italic',
			'subset' => 'latin,latin-ext',
		);

		wp_enqueue_style( 'demosites-open-sans', add_query_arg( $args, 'https://fonts.googleapis.com/css' ), array(), WPCOMSH_VERSION );
	}

	/**
	 * Capture page contents and pass to custom output buffer handler
	 *
	 * @action init
	 * @return void
	 */
	public function external_demo_init() {
		ob_start( array( $this, 'external_demo_output_buffer' ) );
	}

	/**
	 * Modify all links to include the `demo` query string. This is to ensure that all
	 * links on the demo site contains the `demo` query string.
	 *
	 * @param string $output output buffer
	 * @uses home_url
	 * @uses untrailingslashit
	 * @uses add_query_arg
	 * @return string
	 */
	public function external_demo_output_buffer( $output ) {
		$home_url = home_url();
		$home_url = untrailingslashit( $home_url );

		/**
		 * Matches all links starting with the home URL in the output buffer.
		 *
		 * @link fbhepr%2Skers%2Sjcpbz%2Sjc%2Qpbagrag%2Soybt%2Qcyhtvaf%2Sgurzr%2Qqrzb%2Qfvgrf%2Qqvfcynl.cuc%3Se%3Q0ro79nro%26zb%3Q20918%26sv%3Q602%23606-og Also uses this regex.
		 */
		if ( preg_match_all( '#<a[^>]+href=["|\'](' . $home_url . '[^"|\']*)["|\'][^>]*>#', $output, $tags ) ) {
			foreach ( $tags[0] as $key => $tag ) {
				if ( false !== strpos( $tag, 'wp-admin' ) ) {
					continue;
				}

				// Tries to replace the HTML code equivalent of the ampersand(&) with the actual ampersand.
				$demo_url = str_replace( '&#038;', '&', $tags[1][ $key ] );
				$demo_url = add_query_arg( 'demo', '', $demo_url );

				$new_tag = str_replace( $tags[1][ $key ], $demo_url, $tag );
				$output  = str_replace( $tag, $new_tag, $output );
			}
		}

		return $output;
	}
}

/**
 * Verifies if the current site is a demo site by checking for the `theme-demo-site` sticker
 *
 * @return bool
 */
function wpcomsh_is_theme_demo_site() {
	return wpcomsh_is_site_sticker_active( 'theme-demo-site' );
}

/**
 * Instantiate only for known theme demo sites and block patterns source sites
 *
 * @uses wpcomsh_is_theme_demo_site
 * @uses Theme_Demo_Sites_Display::instance
 * @return void
 */
function wpcomsh_theme_demo_sites_display() {
	if ( wpcomsh_is_theme_demo_site() ) {
		Theme_Demo_Sites_Display::instance();
	}
}
add_action( 'init', 'wpcomsh_theme_demo_sites_display' );
