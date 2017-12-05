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
		add_action( 'updating_jetpack_version', array( $this, 'cleanup_on_upgrade' ), 10, 2 );
	}

	function cleanup_on_upgrade( $new_version = null, $old_version = null ) {
		if ( version_compare( $old_version, '4.4', '>=' ) && version_compare( $old_version, '5.3', '<' ) ) {
			delete_option( 'jetpack_connection_banner_ab' );
		}
	}

	/**
	 * Checks whether the connection banner A/B test should be ran.
	 *
	 * @since 5.3.0
	 *
	 * @param null $now
	 *
	 * @return bool
	 */
	static function check_ab_test_not_expired( $now = null ) {
		// Get the current timestamp in GMT
		$now = empty( $now ) ? current_time( 'timestamp', 1 ) : $now;

		// Arguments are hour, minute, second, month, day, year. So, we are getting the timestamp for GMT timestamp
		// for the October 5th, 2017.
		$expiration = gmmktime( 0, 0, 0, 10, 5, 2017 );

		return $expiration >= $now;
	}

	/**
	 * Gets the value for which connection banner to show, and initializes if not set.
	 *
	 * @since 5.3.0
	 *
	 * @return int
	 */
	static function get_random_connection_banner_value() {
		$random_connection_banner = get_option( 'jetpack_connection_banner_ab' );
		if ( ! $random_connection_banner ) {
			$random_connection_banner = mt_rand( 1, 2 );
			update_option( 'jetpack_connection_banner_ab', $random_connection_banner );
		}

		return $random_connection_banner;
	}

	/**
	 * Given a string for the the banner was added, and an int that represents the slide to
	 * a URL for, this function returns a connection URL with a from parameter that will
	 * support split testing.
	 *
	 * @param string     $jp_version_banner_added A short version of when the banner was added. Ex. 44
	 * @param string|int $slide_num               The index of the slide, 1-indexed.
	 * @return string
	 */
	function build_connect_url_for_slide( $jp_version_banner_added, $slide_num ) {
		global $current_screen;
		return Jetpack::init()->build_connect_url(
			true,
			false,
			sprintf( 'banner-%s-slide-%s-%s', $jp_version_banner_added, $slide_num, $current_screen->base )
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

		if ( self::check_ab_test_not_expired() && 2 == self::get_random_connection_banner_value() ) {
			add_action( 'admin_notices', array( $this, 'render_banner_b' ) );
		} else {
			add_action( 'admin_notices', array( $this, 'render_banner' ) );
		}

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
	function enqueue_banner_scripts() {
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
	 * @since 4.4.0
	 */
	function render_banner() { ?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__inner-container">
				<span
					class="notice-dismiss connection-banner-dismiss"
					title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
				</span>

				<div class="jp-wpcom-connect__vertical-nav">
					<div class="jp-wpcom-connect__vertical-nav-container">
						<div class="vertical-menu__feature-item jp-feature-intro vertical-menu__feature-item-is-selected">
							<div class="vertical-menu__feature-item-icon">
								<svg class="jp-wpcom-connect__svg-jetpack" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" version="1.1"><path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M11,14H6l5-10V14z M13,20V10h5L13,20z"/></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Welcome to Jetpack', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 20 20" version="1.1"><path d="M7.8 17.6L12.2 17.6 12.2 2 7.8 2 7.8 17.6ZM14.4 17.6L18.9 17.6 18.9 5.3 14.4 5.3 14.4 17.6ZM1.1 17.6L5.6 17.6 5.6 9.8 1.1 9.8 1.1 17.6ZM0 22L20 22 20 19.8 0 19.8 0 22Z" /></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Stats &amp; Traffic Tools', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 1 16 20" version="1.1"><defs><polygon points="16 10 16 0 0 0 0 10 0 20 16 20"/></defs><g stroke="none" stroke-width="1" transform="translate(0.000000, 1.000000)"><mask fill="white"/><path d="M9 13.7L9 16 7 16 7 13.7C6.4 13.4 6 12.7 6 12 6 10.9 6.9 10 8 10 9.1 10 10 10.9 10 12 10 12.7 9.6 13.4 9 13.7L9 13.7ZM5 5C5 3.3 6.3 2 8 2 9.7 2 11 3.3 11 5L11 6 5 6 5 5ZM14 6L13 6 13 5C13 2.2 10.8 0 8 0 5.2 0 3 2.2 3 5L3 6 2 6C0.9 6 0 6.9 0 8L0 18C0 19.1 0.9 20 2 20L14 20C15.1 20 16 19.1 16 18L16 8C16 6.9 15.1 6 14 6L14 6Z" mask="url(#mask-2)"/></g></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Site Security', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="20" height="20"/><g><path d="M4 6c-1.105 0-2 .895-2 2v12c0 1.1.9 2 2 2h12c1.105 0 2-.895 2-2H4V6zm16-4H8c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2V4c0-1.105-.895-2-2-2zm-5 14H8V9h7v7zm5 0h-3V9h3v7zm0-9H8V4h12v3z"/></g></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Professional Themes', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 20 20" version="1.1"><path d="M6 4L6 10.3 9 7 13.9 12.4 14.5 11.7C15.3 10.8 16.7 10.8 17.5 11.7L18 12.2 18 4 6 4ZM20 4L20 16C20 17.1 19.1 18 18 18L6 18C4.9 18 4 17.1 4 16L4 4C4 2.9 4.9 2 6 2L18 2C19.1 2 20 2.9 20 4L20 4ZM2 20L16 20 16 20C16 21.1 15.1 22 14 22L2 22C0.9 22 0 21.1 0 20L0 8C0 6.9 0.9 6 2 6L2 6 2 20ZM13 7.5C13 6.7 13.7 6 14.5 6 15.3 6 16 6.7 16 7.5 16 8.3 15.3 9 14.5 9 13.7 9 13 8.3 13 7.5L13 7.5Z" /></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Performance', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item wp-app-logo">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 20 20" version="1.1"><defs><polygon points="0 20 20 20 20 0 0 0 0 20"/></defs><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 2.000000)"><mask fill="white"/><path d="M14.3 17.3L16.9 9.8C17.4 8.6 17.5 7.7 17.5 6.8 17.5 6.5 17.5 6.2 17.5 5.9 18.1 7.1 18.5 8.5 18.5 10 18.5 13.1 16.8 15.9 14.3 17.3L14.3 17.3ZM11.2 6C11.7 6 12.1 5.9 12.1 5.9 12.6 5.9 12.5 5.2 12.1 5.2 12.1 5.2 10.7 5.3 9.8 5.3 9 5.3 7.6 5.2 7.6 5.2 7.1 5.2 7.1 5.9 7.5 5.9 7.5 5.9 8 6 8.4 6L9.7 9.6 7.9 15.2 4.8 6C5.3 6 5.8 5.9 5.8 5.9 6.2 5.9 6.2 5.2 5.7 5.2 5.7 5.2 4.3 5.3 3.4 5.3 3.3 5.3 3.1 5.3 2.9 5.3 4.4 3 7 1.5 10 1.5 12.2 1.5 14.2 2.3 15.7 3.7 15.7 3.7 15.7 3.7 15.6 3.7 14.8 3.7 14.2 4.5 14.2 5.2 14.2 5.9 14.6 6.5 15 7.2 15.4 7.8 15.7 8.5 15.7 9.6 15.7 10.3 15.5 11.1 15.1 12.3L14.2 15.2 11.2 6ZM10 18.5C9.2 18.5 8.4 18.4 7.6 18.2L10.1 10.7 12.8 17.9C12.8 17.9 12.8 18 12.8 18 11.9 18.3 11 18.5 10 18.5L10 18.5ZM1.5 10C1.5 8.8 1.8 7.6 2.2 6.5L6.3 17.7C3.5 16.3 1.5 13.4 1.5 10L1.5 10ZM10 0C4.5 0 0 4.5 0 10 0 15.5 4.5 20 10 20 15.5 20 20 15.5 20 10 20 4.5 15.5 0 10 0L10 0Z" fill="#86A6BD" mask="url(#mask-2)"/></g></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'WordPress Apps', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 4 15 15" version="1.1"><polygon points="6.6 4 6.6 10.6 0 10.6 0 12.4 6.6 12.4 6.6 19 8.4 19 8.4 12.4 15 12.4 15 10.6 8.4 10.6 8.4 4"/></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'More Features', 'jetpack' ); ?></span>
						</div>
					</div>
				</div>
				<div class="jp-wpcom-connect__content-container">

					<!-- slide 1: intro -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-one jp__slide-is-active">
						<h2><?php esc_html_e( 'Jetpack simplifies site security, customization, and management.', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/jetpack-welcome.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
									'jetpack'
								); ?>" height="auto" width="250" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'You get detailed visitor stats, state-of-the-art security services, image performance upgrades, traffic generation tools, and more.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Connect to WordPress.com (free) to get started!',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 1 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a
								href="#"
								class="dops-button next-feature"
								title="<?php
								esc_attr_e(
									'Start tour to Learn about the benefits you receive when you connect Jetpack to WordPress.com',
									'jetpack'
								);
								?>">
								<?php esc_html_e( 'Start quick tour', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 1 -->

					<!-- slide 2: stats -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-two">
						<h2><?php esc_html_e( 'Detailed stats and traffic tools to help your site grow', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/stats-people.svg', dirname( __FILE__ ) ); ?>" alt="<?php
								esc_attr_e(
									'Get clear and concise stats and analytics about your visitors',
								 'jetpack'
								); ?>" height="auto" width="225" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack provides detailed stats and insights about your viewers.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'This helps you make informed decisions about your content and drive more traffic to your site with our related posts, social, and enhanced distribution features.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Professional Plan customers get access to advanced SEO tools.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 2 ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 2 -->

					<!-- slide 3: security -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-three">
						<h2><?php esc_html_e( 'Multiple security tools to give you peace of mind', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/security.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security',
									'jetpack'
								); ?>" height="auto" width="250" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack protects your site against brute force attacks and unauthorized logins. We also monitor your site for downtime and keep your plugins updated.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Customers on paid plans also benefit from unlimited backups of your entire site, spam protection, malware scanning, and automated fixes.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'We also offer free support to all users, and priority assistance to paid customers.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 3 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 3 -->

					<!-- slide 3A: themes -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-three-a">
						<h2><?php esc_html_e( 'Hundreds of beautiful themes to choose from', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/customize-theme.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Choosing a design for your site is essential. It defines your brand, your layout, and your visitors’ reading experience',
									'jetpack'
								); ?>" height="auto" width="250" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Choosing a design for your site is essential. It defines your brand, your layout, and your visitors’ reading experience.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Jetpack reduces complexity and makes this previously difficult process a breeze. Browse hundreds of themes in our showcase, or search by theme, name, style, color, or type.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Preview, install, and activate with one-click, then use our suite of design tools to make it look just as you need it to.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', '3a' ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 3A -->


					<!-- slide 4: Performance -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-four">
						<h2><?php esc_html_e( 'Faster site speeds through the WordPress.com CDN', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/cloud-based.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Jetpack automatically optimizes and speeds up images using the global WordPress.com Content Delivery Network (CDN)',
									'jetpack'
								); ?>" height="auto" width="225" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack automatically optimizes and speeds up images using the global WordPress.com Content Delivery Network (CDN). Let us do the heavy lifting for you by reducing bandwidth usage which could potentially lower your hosting costs.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Use of our CDN is unlimited and scales with your site for free. You can also use it for your theme images to further speed up your site.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 4 ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 4 -->

					<!-- slide 5: Apps -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-five">
						<h2><?php esc_html_e( 'Free WordPress apps to manage your site(s) from any device', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/apps.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Our mobile and desktop apps are free and available to you on Apple or Android devices once Jetpack is connected to WordPress.com',
									'jetpack'
								); ?>" height="auto" width="225" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Publish content, track stats, moderate comments and so much more from anywhere in the world. Our mobile and desktop apps are free and available to you on Apple or Android devices once Jetpack is connected to WordPress.com.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'When Jetpack is connected to WordPress.com, head over to the Apps tab within Jetpack for direct links to the mobile and desktop apps.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 5 ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 5 -->

					<!-- slide 6: more features -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-six">
						<h2><?php esc_html_e( 'More Jetpack features our users love', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/customize-theme-2.svg', dirname( __FILE__ ) ); ?>" alt="<?php
									esc_attr_e(
										'Jetpack includes other features that help you customize your site',
									'jetpack'
								); ?>" height="auto" width="225" />
						</div>

						<p>
							<?php
							esc_html_e(  'Jetpack includes other features that help you customize your site including Custom CSS, Contact Forms, Galleries and Carousels, Notifications and Subscriptions, Configurable Widgets, and many more.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(  'Connect to WordPress.com to get started',
								'jetpack'
							);
							?>
							<a href="https://jetpack.com/features" target="_blank">
								<?php esc_html_e( 'or visit our site for the full feature list.', 'jetpack' ); ?>
							</a>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '44', 6 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 6 -->
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders a split-test banner as of 5.3.0.
	 *
	 * @since 5.3.0
	 */
	function render_banner_b() { ?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__inner-container">
				<span
					class="notice-dismiss connection-banner-dismiss"
					title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
				</span>

				<div class="jp-wpcom-connect__vertical-nav">
					<div class="jp-wpcom-connect__vertical-nav-container">
						<div class="vertical-menu__feature-item jp-feature-intro vertical-menu__feature-item-is-selected">
							<div class="vertical-menu__feature-item-icon">
								<svg class="jp-wpcom-connect__svg-jetpack" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" version="1.1"><path d="M14.4 11.3L10.5 18.1 10.5 8.7 13.7 9.5C14.5 9.7 14.9 10.6 14.4 11.3L14.4 11.3ZM9.6 13.3L6.5 12.5C5.7 12.3 5.3 11.4 5.7 10.7L9.6 3.9 9.6 13.3ZM10 1C4.5 1 0 5.5 0 11 0 16.5 4.5 21 10 21 15.5 21 20 16.5 20 11 20 5.5 15.5 1 10 1L10 1Z" /></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Welcome to Jetpack', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 20 20" version="1.1"><path d="M6 4L6 10.3 9 7 13.9 12.4 14.5 11.7C15.3 10.8 16.7 10.8 17.5 11.7L18 12.2 18 4 6 4ZM20 4L20 16C20 17.1 19.1 18 18 18L6 18C4.9 18 4 17.1 4 16L4 4C4 2.9 4.9 2 6 2L18 2C19.1 2 20 2.9 20 4L20 4ZM2 20L16 20 16 20C16 21.1 15.1 22 14 22L2 22C0.9 22 0 21.1 0 20L0 8C0 6.9 0.9 6 2 6L2 6 2 20ZM13 7.5C13 6.7 13.7 6 14.5 6 15.3 6 16 6.7 16 7.5 16 8.3 15.3 9 14.5 9 13.7 9 13 8.3 13 7.5L13 7.5Z" /></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Create Your Site', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 20 20" version="1.1"><path d="M7.8 17.6L12.2 17.6 12.2 2 7.8 2 7.8 17.6ZM14.4 17.6L18.9 17.6 18.9 5.3 14.4 5.3 14.4 17.6ZM1.1 17.6L5.6 17.6 5.6 9.8 1.1 9.8 1.1 17.6ZM0 22L20 22 20 19.8 0 19.8 0 22Z" /></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Make It Successful', 'jetpack' ); ?></span>
						</div>
						<div class="vertical-menu__feature-item">
							<div class="vertical-menu__feature-item-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 1 16 20" version="1.1"><defs><polygon points="16 10 16 0 0 0 0 10 0 20 16 20"/></defs><g stroke="none" stroke-width="1" transform="translate(0.000000, 1.000000)"><mask fill="white"/><path d="M9 13.7L9 16 7 16 7 13.7C6.4 13.4 6 12.7 6 12 6 10.9 6.9 10 8 10 9.1 10 10 10.9 10 12 10 12.7 9.6 13.4 9 13.7L9 13.7ZM5 5C5 3.3 6.3 2 8 2 9.7 2 11 3.3 11 5L11 6 5 6 5 5ZM14 6L13 6 13 5C13 2.2 10.8 0 8 0 5.2 0 3 2.2 3 5L3 6 2 6C0.9 6 0 6.9 0 8L0 18C0 19.1 0.9 20 2 20L14 20C15.1 20 16 19.1 16 18L16 8C16 6.9 15.1 6 14 6L14 6Z" mask="url(#mask-2)"/></g></svg>
							</div>
							<span class="vertical-menu__feature-item-label"><?php esc_html_e( 'Keep It Safe', 'jetpack' ); ?></span>
						</div>
					</div>
				</div>
				<div class="jp-wpcom-connect__content-container">

					<!-- slide 1: intro -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-one jp__slide-is-active">
						<h2><?php esc_html_e( 'Welcome to Jetpack', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/jetpack-welcome.svg', dirname( __FILE__ ) ); ?>" alt="Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security." height="auto" width="250" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack is the best way to experience WordPress, whether your site is brand new or already well established.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'You get themes and tools to design your site, marketing services to make it successful, and state-of-the-art security.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Connect to WordPress.com (free) to get started.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 1 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a
								href="#"
								class="dops-button next-feature"
								title="<?php
								esc_attr_e(
									'Start tour to Learn about the benefits you receive when you connect Jetpack to WordPress.com',
									'jetpack'
								);
								?>">
								<?php esc_html_e( 'Start quick tour', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 1 -->

					<!-- slide 2: design -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-two">
						<h2><?php esc_html_e( 'Code-Free Design and Publishing', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/customize-theme.svg', dirname( __FILE__ ) ); ?>" alt="Customization tools and widgets help you make your site look great without writing any code" height="auto" width="225" />
						</div>

						<p>
							<?php
							esc_html_e(
								'Jetpack gives you access to more than 100 free and 200 premium WordPress themes.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Customization tools and widgets help you make your site look great without writing any code, and our CDN speeds up your images.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Publish with ease using WordPress.com or the official WordPress mobile apps.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 2 ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 2 -->

					<!-- slide 3: marketing -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-three">
						<h2><?php esc_html_e( 'Get The Traffic You Deserve', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/stats-people.svg', dirname( __FILE__ ) ); ?>" alt="Get clear and concise stats and analytics about your visitors." height="auto" width="265" />
						</div>

						<p>
							<?php
							esc_html_e(
								'A site without traffic is like a car without gas. Jetpack helps you fill up so that you can achieve your goals.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'Kickstart your marketing with social media automation tools, related content, email subscriptions, and sharing tools.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(
								'You also get clear and concise stats and analytics about your visitors.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 3 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 3 -->

					<!-- slide 4: security -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-four">
						<h2><?php esc_html_e( 'Make Sure Your Site Is Always Online', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'jetpack/images/security.svg', dirname( __FILE__ ) ); ?>" alt="Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security." height="auto" width="250" />
						</div>

						<p>
							<?php
							esc_html_e(  'Jetpack checks your site every few minutes, and if it\'s offline we\'ll notify you instantly.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(  'Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security.',
								'jetpack'
							);
							?>
						</p>

						<p>
							<?php
							esc_html_e(  'Paying customers also benefit from automated backups, malware scans, and priority support.',
								'jetpack'
							);
							?>
						</p>

						<p class="jp-banner__button-container">
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 4 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
						</p>
					</div> <!-- end slide 4 -->
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the full-screen connection prompt.  Only shown once and on plugin activation.
	 */
	function render_connect_prompt_full_screen() {
		?>
		<div class="jp-connect-full__container">

			<?php // planet + star svgs ?>

			<svg class="jp-connect-full__svg-stars" xmlns="http://www.w3.org/2000/svg" width="56" height="54" viewBox="0 0 56 54" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.95"><g transform="translate(-268.000000, -101.000000)" fill="#C8D7E1"><g transform="translate(160.000000, 32.000000)"><g transform="translate(104.000000, 69.000000)"><polyline points="53.6 10.3 59.3 8 53.6 5.7 51.3 0 49 5.7 43.3 8 49 10.3 51.3 16 53.6 10.3"/><polyline transform="translate(8.757724, 49.487494) rotate(315.000000) translate(-8.757724, -49.487494) " points="10.5 51.2 14.8 49.5 10.5 47.8 8.8 43.5 7 47.8 2.8 49.5 7 51.2 8.8 55.5 10.5 51.2"/></g></g></g></g></svg>

			<svg class="jp-connect-full__svg-jupiter" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="100" viewBox="0 0 50 100" version="1.1"><defs><path d="M0.95 40.37C-4.37 67.46 13.27 93.73 40.37 99.05 67.46 104.37 93.73 86.73 99.05 59.63 104.37 32.54 86.73 6.27 59.63 0.95 32.54-4.37 6.27 13.27 0.95 40.37" id="path-1"/></defs><g id="Welcome" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.5"><g id="v1.2" transform="translate(-1215.000000, -93.000000)"><g id="lrg-planet-+-jupiter-Mask" transform="translate(160.000000, 32.000000)"><g id="jupiter" transform="translate(1055.000000, 61.000000)"><path d="M0.94 40.19C-4.36 67.16 13.22 93.32 40.19 98.62 67.16 103.92 93.32 86.35 98.62 59.37 103.92 32.4 86.35 6.24 59.37 0.94 32.4-4.36 6.24 13.22 0.94 40.19" id="jupFill-1" fill="#C8D7E1"/><g id="jupGroup-17"><mask id="mask-jup" fill="white"><use xlink:href="#path-1"/></mask><g id="jupClip-3"/><path d="M49.59 38.06C51.29 29.39 59.7 23.73 68.38 25.44 77.05 27.14 82.7 35.55 81 44.23 79.3 52.9 70.88 58.55 62.21 56.85 53.53 55.15 47.88 46.73 49.59 38.06" id="jupFill-2" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M53.93 52.41C48.66 47.1 42.15 43.21 34.98 41.08L37.21 29.74C44.64 30.48 52.15 29.34 59.03 26.41L53.93 52.41" id="jupFill-4" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M30.93 34.4C31.55 31.25 34.6 29.2 37.75 29.82 40.89 30.43 42.94 33.49 42.32 36.63 41.71 39.78 38.65 41.83 35.51 41.21 32.36 40.59 30.31 37.54 30.93 34.4" id="jupFill-5" fill="#E9EFF3" mask="url(#mask-jup)"/><polyline id="jupFill-9" fill="#E9EFF3" mask="url(#mask-jup)" points="35.54 41.22 -14.22 31.44 -11.99 20.08 37.77 29.85 35.54 41.22"/><path d="M30.34 67.29C31.4 61.93 36.59 58.44 41.95 59.49 47.31 60.54 50.8 65.74 49.75 71.1 48.69 76.46 43.5 79.95 38.14 78.89 32.78 77.84 29.29 72.65 30.34 67.29" id="jupFill-10" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M33.02 76.15C29.77 72.87 25.75 70.47 21.32 69.15L22.7 62.15C27.29 62.61 31.93 61.9 36.18 60.09L33.02 76.15" id="jupFill-11" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M18.82 65.02C19.2 63.08 21.09 61.82 23.03 62.2 24.97 62.58 26.24 64.46 25.86 66.41 25.48 68.35 23.59 69.62 21.65 69.23 19.7 68.85 18.44 66.97 18.82 65.02" id="jupFill-12" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M43.91 78.29C48.16 76.49 52.8 75.78 57.39 76.24L58.77 69.23C54.34 67.92 50.32 65.51 47.07 62.23L43.91 78.29" id="jupFill-13" fill="#E9EFF3" mask="url(#mask-jup)"/><polyline id="jupFill-16" fill="#E9EFF3" mask="url(#mask-jup)" points="21.67 69.24 -67.61 51.7 -66.23 44.68 23.05 62.22 21.67 69.24"/></g><path d="M35.02 68.89C35.07 65.99 37.47 63.68 40.37 63.74 43.28 63.79 45.58 66.19 45.53 69.09 45.47 72 43.07 74.3 40.17 74.25 37.27 74.19 34.96 71.79 35.02 68.89" id="jupFill-18" fill="#E9EFF3"/></g></g></g></g></svg>


			<div class="jp-connect-full__dismiss">
				<svg class="jp-connect-full__svg-dismiss" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Dismiss Jetpack Connection Window</title><rect x="0" fill="none" /><g><path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z"/></g></svg>
			</div>

			<div class="jp-connect-full__step-header">
				<div class="jp-connect-full__step-header-logos">

					<svg class="jp-connect-full__svg-jetpack" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" version="1.1"><path d="M30,0C13.5,0,0,13.5,0,30s13.5,30,30,30s30-13.5,30-30S46.5,0,30,0z M29,35H13L29,6V35z M31,54V25h16L31,54z"/></svg>

					<svg class="jp-connect-full__svg-sync" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Connect Jetpack to WordPress.com</title><rect x="0" fill="none" /><g><path d="M23.5 13.5l-3.086 3.086L19 18l-4.5-4.5 1.414-1.414L18 14.172V12c0-3.308-2.692-6-6-6V4c4.418 0 8 3.582 8 8v2.172l2.086-2.086L23.5 13.5zM6 12V9.828l2.086 2.086L9.5 10.5 5 6 3.586 7.414.5 10.5l1.414 1.414L4 9.828V12c0 4.418 3.582 8 8 8v-2c-3.308 0-6-2.692-6-6z"/></g></svg>

					<svg class="jp-connect-full__svg-wpcom" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 2 20 20" version="1.1"><defs><polygon points="0 20 20 20 20 0 0 0 0 20"/></defs><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 2.000000)"><mask fill="white"/><path d="M14.3 17.3L16.9 9.8C17.4 8.6 17.5 7.7 17.5 6.8 17.5 6.5 17.5 6.2 17.5 5.9 18.1 7.1 18.5 8.5 18.5 10 18.5 13.1 16.8 15.9 14.3 17.3L14.3 17.3ZM11.2 6C11.7 6 12.1 5.9 12.1 5.9 12.6 5.9 12.5 5.2 12.1 5.2 12.1 5.2 10.7 5.3 9.8 5.3 9 5.3 7.6 5.2 7.6 5.2 7.1 5.2 7.1 5.9 7.5 5.9 7.5 5.9 8 6 8.4 6L9.7 9.6 7.9 15.2 4.8 6C5.3 6 5.8 5.9 5.8 5.9 6.2 5.9 6.2 5.2 5.7 5.2 5.7 5.2 4.3 5.3 3.4 5.3 3.3 5.3 3.1 5.3 2.9 5.3 4.4 3 7 1.5 10 1.5 12.2 1.5 14.2 2.3 15.7 3.7 15.7 3.7 15.7 3.7 15.6 3.7 14.8 3.7 14.2 4.5 14.2 5.2 14.2 5.9 14.6 6.5 15 7.2 15.4 7.8 15.7 8.5 15.7 9.6 15.7 10.3 15.5 11.1 15.1 12.3L14.2 15.2 11.2 6ZM10 18.5C9.2 18.5 8.4 18.4 7.6 18.2L10.1 10.7 12.8 17.9C12.8 17.9 12.8 18 12.8 18 11.9 18.3 11 18.5 10 18.5L10 18.5ZM1.5 10C1.5 8.8 1.8 7.6 2.2 6.5L6.3 17.7C3.5 16.3 1.5 13.4 1.5 10L1.5 10ZM10 0C4.5 0 0 4.5 0 10 0 15.5 4.5 20 10 20 15.5 20 20 15.5 20 10 20 4.5 15.5 0 10 0L10 0Z" fill="#86A6BD" mask="url(#mask-2)"/></g></svg>

				</div>
				<h2 class="jp-connect-full__step-header-title"><?php esc_html_e( 'Connect Jetpack to WordPress.com', 'jetpack' ) ?></h2>
			</div>

			<div class="jp-connect-full__card">
				<div class="jp-connect-full__card-inner">
					<p class="jp-connect-full__card-description">
						<?php
						esc_html_e(
							'Get detailed visitor stats, state-of-the-art security services, image performance upgrades, traffic generation tools, and more. Connect to WordPress.com to get started!',
							'jetpack'
						);
						?>
					</p>
				</div>
				<div class="jp-connect-full__card-footer">
					<p class="jp-connect-full__tos-blurb">
						<?php jetpack_render_tos_blurb(); ?>
					</p>
					<p class="jp-connect-full__button-container">
						<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'full-screen-prompt' ) ); ?>" class="dops-button is-primary">
							<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
						</a>
					</p>
				</div>
			</div>
			<a class="jp-connect-full__help-button" href="https://jetpack.com/contact-support" target="_blank">
				<svg class="gridicon gridicons-help-outline" height="18" width="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4 8c0-2.21-1.79-4-4-4s-4 1.79-4 4h2c0-1.103.897-2 2-2s2 .897 2 2-.897 2-2 2c-.552 0-1 .448-1 1v2h2v-1.14c1.722-.447 3-1.998 3-3.86zm-3 6h-2v2h2v-2z"></path></g></svg>
				<?php esc_html_e( 'Get help connecting your site', 'jetpack' ); ?>
			</a>
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
