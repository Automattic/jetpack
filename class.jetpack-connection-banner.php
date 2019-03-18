<?php

class Jetpack_Connection_Banner {
	/**
	 * @var Jetpack_Connection_Banner
	 **/
	private static $instance = null;

	static function init() {
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
	 * Given a string for the the banner was added, and an int that represents the slide to
	 * a URL for, this function returns a connection URL with a from parameter that will
	 * support split testing.
	 *
	 * @since 7.2   Event key format is now banner-connect-banner-72-dashboard or connect-banner-72-plugins.
	 *              The param $slide_num was removed since we removed all slides but the first one.
	 * @since 4.4.0
	 *
	 * @param string     $jp_version_banner_added A short version of when the banner was added. Ex. 44
	 *
	 * @return string
	 */
	function build_connect_url_for_slide( $jp_version_banner_added ) {
		global $current_screen;
		$url = Jetpack::init()->build_connect_url(
			true,
			false,
			sprintf( 'connect-banner-%s-%s', $jp_version_banner_added, $current_screen->base )
		);
		return add_query_arg( 'auth_approved', 'true', $url );
	}

	/**
	 * Return an img HTML tag pointing to the Jetpack logo. Includes alt text.
	 *
	 * @since 7.2
	 *
	 * @return string
	 */
	public static function get_jetpack_logo() {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			esc_url( plugins_url( 'images/jetpack-logo-green.svg', JETPACK__PLUGIN_FILE ) ),
			esc_attr__(
				'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
				'jetpack'
			)
		);
	}

	/**
	 * Will initialize hooks to display the new (as of 4.4) connection banner if the current user can
	 * connect Jetpack, if Jetpack has not been deactivated, and if the current page is the plugins page.
	 *
	 * This method should not be called if the site is connected to WordPress.com or if the site is in development mode.
	 *
	 * @since 4.4.0
	 * @since 4.5.0 Made the new (as of 4.4) connection banner display to everyone by default.
	 * @since 5.3.0 Running another split test between 4.4 banner and a new one in 5.3.
	 * @since 7.2   B test was removed.
	 *
	 * @param $current_screen
	 */
	function maybe_initialize_hooks( $current_screen ) {
		// Kill if banner has been dismissed
		if ( Jetpack_Options::get_option( 'dismissed_connection_banner' ) ) {
			return;
		}

		// Don't show the connect notice anywhere but the plugins.php after activating
		if ( 'plugins' !== $current_screen->base && 'dashboard' !== $current_screen->base ) {
			return;
		}

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}

		add_action( 'admin_notices', array( $this, 'render_banner' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_banner_scripts' ) );
		add_action( 'admin_print_styles', array( Jetpack::init(), 'admin_banner_styles' ) );

		if ( Jetpack::state( 'network_nag' ) ) {
			add_action( 'network_admin_notices', array( $this, 'network_connect_notice' ) );
		}

		// Only fires immediately after plugin activation
		if ( get_transient( 'activated_jetpack' ) ) {
			add_action( 'admin_notices', array( $this, 'render_connect_prompt_full_screen' ) );
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
			Jetpack::get_file_url_for_environment(
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
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'connectionBannerNonce' => wp_create_nonce( 'jp-connection-banner-nonce' ),
			)
		);
	}

	/**
	 * Renders the new connection banner as of 4.4.0.
	 *
	 * @since 7.2   Copy and visual elements reduced to show the new focus of Jetpack on Security and Performance.
	 * @since 4.4.0
	 */
	function render_banner() { ?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__container-top-text">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"/></g></svg>
				<span><?php esc_html_e( 'You’re almost done. Set up Jetpack to boost your site performance and unlock powerful customization, marketing, and security tools.', 'jetpack' ); ?></span>
			</div>
			<div class="jp-wpcom-connect__inner-container">
				<span
					class="notice-dismiss connection-banner-dismiss"
					title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
				</span>

				<div class="jp-wpcom-connect__content-container">

					<!-- slide 1: intro -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-one jp__slide-is-active">

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<?php echo self::get_jetpack_logo(); ?>
							<img
								src="<?php echo plugins_url( 'images/jetpack-powering-up.svg', JETPACK__PLUGIN_FILE ); ?>"
								class="jp-wpcom-connect__hide-phone-and-smaller"
								alt="<?php esc_attr_e(
									'Jetpack premium services offer even more powerful performance, security, ' .
									'and revenue tools to help you keep your site safe, fast, and help generate income.',
									'jetpack'
								); ?>"
								height="auto"
								width="225"
								/>
						</div>

						<div class="jp-wpcom-connect__slide-text">
							<h2><?php esc_html_e( 'Simplify your site security and performance with Jetpack', 'jetpack' ) ?></h2>

							<p>
								<?php
								esc_html_e(
									'Jetpack free protects your site against brute force attacks and unauthorized logins. Our premium security servives also include unlimited backups of your entire site, spam protection, malware scanning, and automated fixes.',
									'jetpack'
								);
								?>
							</p>

							<p>
								<?php
								esc_html_e(
									'Activate Jetpack’s site accelerator to load pages faster, optimize your images, and serve your images and static files (like CSS and JavaScript) from our global network of WordPress.com servers. Speed up your site for mobile viewers and reduce bandwidth usage, which may lead to lower hosting costs.',
									'jetpack'
								);
								?>
							</p>

							<div class="jp-banner__button-container">
								<span class="jp-banner__tos-blurb"><?php jetpack_render_tos_blurb(); ?></span>
								<a
									href="<?php echo esc_url( $this->build_connect_url_for_slide( '72' ) ); ?>"
									class="dops-button is-primary">
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
	 * Renders the legacy network connection banner.
	 */
	function network_connect_notice() {
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
