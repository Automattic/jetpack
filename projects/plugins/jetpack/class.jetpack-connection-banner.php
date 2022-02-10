<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack connection banner.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Redirect;

/**
 * Jetpack connection banner.
 */
class Jetpack_Connection_Banner {
	/**
	 * Static instance.
	 *
	 * @var Jetpack_Connection_Banner
	 */
	private static $instance = null;

	/**
	 * Initialize and fetch the static instance.
	 *
	 * @return self
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Connection_Banner();
		}

		return self::$instance;
	}

	/**
	 * Jetpack_Connection_Banner constructor.
	 *
	 * Since we call the Jetpack_Connection_Banner:init() method from the `Jetpack` class, and after
	 * the admin_init action fires, we know that the admin is initialized at this point.
	 */
	private function __construct() {
		add_action( 'current_screen', array( $this, 'maybe_initialize_hooks' ) );
	}

	/**
	 * The banner is forcibly displayed.
	 *
	 * @return bool
	 */
	public static function force_display() {
		/**
		 * This is an experiment for partners to test. Allow customization of the behavior of pre-connection banners.
		 *
		 * @since 8.6.0
		 *
		 * @param bool $always_show_prompt Should this prompt always appear? Default to false.
		 */
		return apply_filters( 'jetpack_pre_connection_prompt_helpers', false );
	}

	/**
	 * Can the banner be displayed for the given screen?
	 *
	 * @param \WP_Screen $current_screen Current WordPress screen.
	 *
	 * @return bool
	 */
	public static function can_be_displayed( $current_screen ) {
		$has_connected_owner = Jetpack::connection()->has_connected_owner();
		$is_connected        = Jetpack::is_connection_ready();
		$has_licenses        = ! empty( Licensing::instance()->stored_licenses() );

		// Don't show the connect notice if the site has a connected owner.
		if ( $has_connected_owner ) {
			return false;
		}

		// Don't show the connect notice if a site connection is established and there are no stored licenses.
		// Stored licenses indicate that a purchased product may not be provisioned yet hence we need to keep
		// showing the notice to nudge the user to connect in order to have their product(s) provisioned.
		if ( $is_connected && ! $has_licenses ) {
			return false;
		}

		// Kill if banner has been dismissed and the pre-connection helpers filter is not set.
		if (
			Jetpack_Options::get_option( 'dismissed_connection_banner' ) &&
			! self::force_display()
		) {
			return false;
		}

		// Don't show the connect notice anywhere but the plugins.php after activating.
		if ( 'plugins' !== $current_screen->base && 'dashboard' !== $current_screen->base ) {
			return false;
		}

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Given a string for the the banner was added, and an int that represents the slide to
	 * a URL for, this function returns a connection URL with a from parameter that will
	 * support split testing.
	 *
	 * @since 7.2   Event key format is now banner-connect-banner-72-dashboard or connect-banner-72-plugins.
	 *              The param $slide_num was removed since we removed all slides but the first one.
	 * @since 4.4.0
	 *
	 * @param string $jp_version_banner_added A short version of when the banner was added. Ex. 44.
	 * @return string
	 */
	public function build_connect_url_for_slide( $jp_version_banner_added ) {
		global $current_screen;
		$url = Jetpack::init()->build_connect_url(
			true,
			false,
			sprintf( 'connect-banner-%s-%s', $jp_version_banner_added, $current_screen->base )
		);
		return add_query_arg( 'auth_approved', 'true', $url );
	}

	/**
	 * Will initialize hooks to display the new (as of 4.4) connection banner if the current user can
	 * connect Jetpack, if Jetpack has not been deactivated, and if the current page is the plugins page.
	 *
	 * @since 4.4.0
	 * @since 4.5.0 Made the new (as of 4.4) connection banner display to everyone by default.
	 * @since 5.3.0 Running another split test between 4.4 banner and a new one in 5.3.
	 * @since 7.2   B test was removed.
	 * @since 9.7   Moved the connection condition checking to this method to fulfill Licensing requirements.
	 *
	 * @param \WP_Screen $current_screen Current WordPress screen.
	 */
	public function maybe_initialize_hooks( $current_screen ) {
		if ( ! self::can_be_displayed( $current_screen ) ) {
			return;
		}

		if ( ! empty( Licensing::instance()->stored_licenses() ) ) {
			add_action( 'admin_notices', array( $this, 'render_license_aware_banner' ) );
		} else {
			add_action( 'admin_notices', array( $this, 'render_banner' ) );
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_banner_scripts' ) );
		add_action( 'admin_print_styles', array( Jetpack::init(), 'admin_banner_styles' ) );

		if ( Jetpack::state( 'network_nag' ) ) {
			add_action( 'network_admin_notices', array( $this, 'network_connect_notice' ) );
		}

		// Only fires immediately after plugin activation.
		if ( get_transient( 'activated_jetpack' ) ) {
			if (
				! \Jetpack_Options::get_option( 'has_seen_wc_connection_modal', false )
				&& in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', Jetpack::get_active_plugins() ), true )
			) {
				wp_safe_redirect( Jetpack::admin_url( 'page=jetpack#/woo-setup' ) );
			} else {
				add_action( 'admin_notices', array( $this, 'render_connect_prompt_full_screen' ) );
			}
			delete_transient( 'activated_jetpack' );
		}
	}

	/**
	 * Enqueues JavaScript for new connection banner.
	 *
	 * @since 4.4.0
	 */
	public static function enqueue_banner_scripts() {
		wp_enqueue_script(
			'jetpack-connection-banner-js',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-connection-banner.min.js',
				'_inc/jetpack-connection-banner.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_localize_script(
			'jetpack-connection-banner-js',
			'jp_banner',
			array(
				'ajax_url'              => admin_url( 'admin-ajax.php' ),
				'connectionBannerNonce' => wp_create_nonce( 'jp-connection-banner-nonce' ),
			)
		);
	}

	/**
	 * Enqueues JavaScript and CSS for new connect-in-place flow.
	 *
	 * @since 7.7
	 */
	public static function enqueue_connect_button_scripts() {
		global $is_safari;

		wp_enqueue_script(
			'jetpack-connect-button',
			Assets::get_file_url_for_environment(
				'_inc/build/connect-button.min.js',
				'_inc/connect-button.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_enqueue_style(
			'jetpack-connect-button',
			Assets::get_file_url_for_environment(
				'css/jetpack-connect.min.css',
				'css/jetpack-connect.css'
			),
			array(),
			JETPACK__VERSION
		);

		$jetpack_api_url = wp_parse_url( Jetpack::connection()->api_url( '' ) );

		// Due to the limitation in how 3rd party cookies are handled in Safari and Opera,
		// we're falling back to the original flow.
		if ( $is_safari || User_Agent_Info::is_opera_desktop() || Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' ) ) {
			$force_variation = 'original';
		} else {
			$force_variation = 'in_place';
		}

		$tracking = new Automattic\Jetpack\Tracking();
		$identity = $tracking->tracks_get_identity( get_current_user_id() );

		wp_localize_script(
			'jetpack-connect-button',
			'jpConnect',
			array(
				'apiBaseUrl'            => esc_url_raw( rest_url( 'jetpack/v4' ) ),
				'registrationNonce'     => wp_create_nonce( 'jetpack-registration-nonce' ),
				'apiNonce'              => wp_create_nonce( 'wp_rest' ),
				'apiSiteDataNonce'      => wp_create_nonce( 'wp_rest' ),
				'buttonTextRegistering' => __( 'Loading...', 'jetpack' ),
				'jetpackApiDomain'      => $jetpack_api_url['scheme'] . '://' . $jetpack_api_url['host'],
				'forceVariation'        => $force_variation,
				'connectInPlaceUrl'     => Jetpack::admin_url( 'page=jetpack#/setup' ),
				'dashboardUrl'          => Jetpack::admin_url( 'page=jetpack#/dashboard' ),
				'plansPromptUrl'        => Redirect::get_url( 'jetpack-connect-plans' ),
				'identity'              => $identity,
				'preFetchScript'        => plugins_url( '_inc/build/admin.js', JETPACK__PLUGIN_FILE ) . '?ver=' . JETPACK__VERSION,
			)
		);
	}

	/**
	 * Renders the new connection banner as of 4.4.0.
	 *
	 * @since 7.2   Copy and visual elements reduced to show the new focus of Jetpack on Security and Performance.
	 * @since 4.4.0
	 */
	public function render_banner() {
		?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__container-top-text">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"/></g></svg>
				<span>
					<?php esc_html_e( 'You’re almost done. Set up Jetpack to enable powerful security and performance tools for WordPress.', 'jetpack' ); ?>
				</span>
			</div>
			<div class="jp-wpcom-connect__inner-container">

				<?php
				if ( ! $this->force_display() ) :
					?>

					<span
						class="notice-dismiss connection-banner-dismiss"
						title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
					</span>

					<?php
				endif;
				?>

				<div class="jp-wpcom-connect__content-container">

					<!-- slide 1: intro -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-one jp__slide-is-active">

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<?php
							$logo = new Logo();
							echo $logo->render(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Returns SVG.
							?>
							<img
								src="<?php echo esc_url( plugins_url( 'images/jetpack-powering-up.svg', JETPACK__PLUGIN_FILE ) ); ?>"
								class="jp-wpcom-connect__hide-phone-and-smaller"
								alt="
								<?php
								esc_attr_e(
									'Jetpack premium services offer even more powerful performance, security, and revenue tools to help you keep your site safe, fast, and help generate income.',
									'jetpack'
								);
								?>
								"
								height="auto"
								width="225"
								/>
						</div>

						<div class="jp-wpcom-connect__slide-text">
							<h2><?php esc_html_e( 'Simplify your site security and performance with Jetpack', 'jetpack' ); ?></h2>

							<p>
								<?php
								esc_html_e(
									'Jetpack protects you against brute force attacks and unauthorized logins. Basic protection is always free, while premium plans add unlimited backups of your whole site, spam protection, malware scanning, and automated fixes.',
									'jetpack'
								);
								?>
							</p>

							<p>
								<?php
								esc_html_e(
									'Activate site accelerator tools and watch your page load times decrease—we’ll optimize your images and serve them from our own powerful global network of servers, and speed up your mobile site to reduce bandwidth usage.',
									'jetpack'
								);
								?>
							</p>

							<div class="jp-banner__button-container">
								<span class="jp-banner__tos-blurb"><?php jetpack_render_tos_blurb(); ?></span>
								<a
										href="<?php echo esc_url( $this->build_connect_url_for_slide( '72' ) ); ?>"
										class="dops-button is-primary jp-banner__alt-connect-button">
									<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
								</a>
							</div>

						</div>
					</div> <!-- end slide 1 -->
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the license-away version of the connection banner.
	 *
	 * @since 9.0.0
	 */
	public function render_license_aware_banner() {
		?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__inner-container">
				<div class="jp-wpcom-connect__content-container">
					<!-- slide 1: intro -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-one jp__slide-is-active">

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<?php echo ( new Logo() )->render(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Returns SVG. ?>
							<img
								src="<?php echo esc_url( plugins_url( 'images/jetpack-powering-up.svg', JETPACK__PLUGIN_FILE ) ); ?>"
								class="jp-wpcom-connect__hide-phone-and-smaller"
								alt="
								<?php
								esc_attr_e(
									'Jetpack premium services offer even more powerful performance, security, and revenue tools to help you keep your site safe, fast, and help generate income.',
									'jetpack'
								);
								?>
								"
								height="auto"
								width="225"
								/>
						</div>

						<div class="jp-wpcom-connect__slide-text">
							<h2 class="jp-wpcom-connect__quest">
								<svg class="gridicon gridicons-notice jp-wpcom-connect__quest-marker" height="38" width="38" viewBox="0 0 24 24">
									<g>
										<rect x="8" y="6" width="8" height="12" style="fill:#000000" />
										<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path>
									</g>
								</svg>
								<?php esc_html_e( 'Your Jetpack purchase needs completion! Please set up the plugin for your subscription.', 'jetpack' ); ?>
							</h2>

							<p>
								<?php
								esc_html_e(
									'Jetpack offers security, performance, and marketing tools made for WordPress sites by WordPress experts. Set up Jetpack to enable new features for this site; don\'t let your subscription go to waste!',
									'jetpack'
								);
								?>
							</p>

							<div class="jp-banner__button-container">
								<span class="jp-banner__tos-blurb"><?php jetpack_render_tos_blurb(); ?></span>
								<a
									href="<?php echo esc_url( $this->build_connect_url_for_slide( '90' ) ); ?>"
									class="dops-button is-primary jp-banner__alt-connect-button">
									<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
								</a>
							</div>

						</div>
					</div> <!-- end slide 1 -->
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the full-screen connection prompt.  Only shown once and on plugin activation.
	 */
	public static function render_connect_prompt_full_screen() {
		$current_screen = get_current_screen();
		if ( 'plugins' === $current_screen->base ) {
			$bottom_connect_url_from = 'full-screen-prompt';
		} else {
			$bottom_connect_url_from = 'landing-page-bottom';
		}

		$has_no_owner = ! Jetpack::connection()->has_connected_owner();
		?>
		<div class="jp-connect-full__container <?php echo $has_no_owner ? 'jp-jetpack-connect__site_connection' : ''; ?>"><div class="jp-connect-full__container-card">

				<?php if ( 'plugins' === $current_screen->base ) : ?>
					<?php
					$logo = new Logo();
					echo $logo->render(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Returns SVG.
					?>

					<?php
					if ( ! self::force_display() ) :
						?>

						<div class="jp-connect-full__dismiss">
							<svg class="jp-connect-full__svg-dismiss" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Dismiss Jetpack Connection Window</title><rect x="0" fill="none" /><g><path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z"/></g></svg>
						</div>

						<?php
					endif;
					?>

				<?php endif; ?>

				<div id="jp-connect-full__step1-header" class="jp-connect-full__step-header">
					<h2 class="jp-connect-full__step-header-title"><?php esc_html_e( 'Activate essential WordPress security and performance tools by setting up Jetpack', 'jetpack' ); ?></h2>
				</div>

				<div id="jp-connect-full__step2-header" class="jp-connect-full__step-header">
					<h2 class="jp-connect-full__step-header-title"><?php esc_html_e( 'Jetpack is activated!', 'jetpack' ); ?><br /><?php esc_html_e( 'Unlock more amazing features by connecting a user account', 'jetpack' ); ?></h2>
				</div>

				<p class="jp-connect-full__tos-blurb">
					<?php jetpack_render_tos_blurb(); ?>
				</p>

				<p class="jp-connect-full__button-container">
					<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, $bottom_connect_url_from ) ); ?>"
						class="dops-button is-primary jp-connect-button">
						<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
					</a>
				</p>

				<div class="jp-connect-full__row" id="jetpack-connection-cards">
					<div class="jp-connect-full__slide">
						<div class="jp-connect-full__slide-card illustration">
							<img
									src="<?php echo esc_url( plugins_url( 'images/jetpack-connection-security.svg', JETPACK__PLUGIN_FILE ) ); ?>"
									alt="<?php esc_attr_e( 'Security & Backups', 'jetpack' ); ?>"
							/>
						</div>
						<div class="jp-connect-full__slide-card">
							<h3><?php esc_html_e( 'Always-on Security', 'jetpack' ); ?></h3>
							<ul>
								<li><?php esc_html_e( 'Stay one step ahead of security threats with automatic scanning, one-click fixes, and spam protection.', 'jetpack' ); ?></li>
								<li><?php esc_html_e( 'Real-time backups save every change and one-click restores get you back online quickly.', 'jetpack' ); ?></li>
								<li><?php esc_html_e( 'Free protection against brute force attacks and instant notifications if your site goes down.', 'jetpack' ); ?></li>
							</ul>
						</div>
					</div>
					<div class="jp-connect-full__slide">
						<div class="jp-connect-full__slide-card illustration">
							<img
									src="<?php echo esc_url( plugins_url( 'images/jetpack-connection-performance.svg', JETPACK__PLUGIN_FILE ) ); ?>"
									alt="<?php esc_attr_e( 'Built-in Performance', 'jetpack' ); ?>"
							/>
						</div>
						<div class="jp-connect-full__slide-card">
							<h3><?php esc_html_e( 'Built-in Performance', 'jetpack' ); ?></h3>
							<ul>
								<li><?php esc_html_e( 'Keep people on your site longer with lightning-fast page load times through our free global CDN.', 'jetpack' ); ?></li>
								<li><?php esc_html_e( 'Speed up your mobile site and reduce bandwidth usage automatically.', 'jetpack' ); ?></li>
								<li><?php esc_html_e( 'Improve visitor engagement and sales with a customized search experience.', 'jetpack' ); ?></li>
							</ul>
						</div>
					</div>
				</div>

				<h2 class="jp-connect-full__testimonial"><?php esc_html_e( 'More than 5 million WordPress sites trust Jetpack for their website security and performance.', 'jetpack' ); ?></h2>

				<?php if ( 'plugins' === $current_screen->base ) : ?>

					<?php
					if ( ! self::force_display() ) :
						?>

						<p class="jp-connect-full__dismiss-paragraph">
							<a>
								<?php
								echo esc_html_x(
									'Not now, thank you.',
									'a link that closes the modal window that offers to connect Jetpack',
									'jetpack'
								);
								?>
							</a>
						</p>

						<?php
						endif;
					?>

				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the legacy network connection banner.
	 */
	public function network_connect_notice() {
		?>
		<div id="message" class="updated jetpack-message">
			<div class="squeezer">
				<h2>
					<?php
						echo wp_kses(
							__(
								'<strong>Jetpack is activated!</strong> Each site on your network must be connected individually by an admin on that site.',
								'jetpack'
							),
							array( 'strong' => array() )
						);
					?>
				</h2>
			</div>
		</div>
		<?php
	}
}
