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
							<img src="<?php echo plugins_url( 'images/jetpack-welcome.svg', JETPACK__PLUGIN_FILE ); ?>" alt="Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security." height="auto" width="250" />
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
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 1 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
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
						</p>
					</div> <!-- end slide 1 -->

					<!-- slide 2: design -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-two">
						<h2><?php esc_html_e( 'Code-Free Design and Publishing', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'images/customize-theme.svg', JETPACK__PLUGIN_FILE ); ?>" alt="Customization tools and widgets help you make your site look great without writing any code" height="auto" width="225" />
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
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
							<a href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 2 ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 2 -->

					<!-- slide 3: marketing -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-three">
						<h2><?php esc_html_e( 'Get The Traffic You Deserve', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'images/stats-people.svg', JETPACK__PLUGIN_FILE ); ?>" alt="Get clear and concise stats and analytics about your visitors." height="auto" width="265" />
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
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 3 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 3 -->

					<!-- slide 4: security -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-four">
						<h2><?php esc_html_e( 'Make Sure Your Site Is Always Online', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon jp-connect-illo">
							<img src="<?php echo plugins_url( 'images/security.svg', JETPACK__PLUGIN_FILE ); ?>" alt="Your site is automatically protected from brute force attacks, plus you can use single sign-on for extra security." height="auto" width="250" />
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

						<?php if ( Jetpack::show_backups_ui() ): ?>
							<p>
								<?php
								esc_html_e(  'Paying customers also benefit from automated backups, malware scans, and priority support.',
									'jetpack'
								);
								?>
							</p>
						<?php endif; ?>

						<p class="jp-banner__button-container">
							<span class="jp-banner__tos-blurb">
								<?php jetpack_render_tos_blurb(); ?>
							</span>
							<a
								href="<?php echo esc_url( $this->build_connect_url_for_slide( '53', 4 ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
							</a>
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
	public static function render_connect_prompt_full_screen() {
		$current_screen = get_current_screen();

		if ( 'plugins' === $current_screen->base ) {
			$bottom_connect_url_from = 'full-screen-prompt';
		} else {
			$bottom_connect_url_from = 'landing-page-bottom';
		}
		?>
		<div class="jp-connect-full__container"><div class="jp-connect-full__container-card">

			<?php if ( 'plugins' === $current_screen->base ) : ?>
				<?php echo self::get_jetpack_logo(); ?>

				<div class="jp-connect-full__dismiss">
					<svg class="jp-connect-full__svg-dismiss" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Dismiss Jetpack Connection Window</title><rect x="0" fill="none" /><g><path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z"/></g></svg>
				</div>
			<?php endif; ?>

			<div class="jp-connect-full__step-header">
				<h2 class="jp-connect-full__step-header-title"><?php esc_html_e( 'Activate essential WordPress security and performance tools by setting up Jetpack', 'jetpack' ) ?></h2>
			</div>

			<div class="jp-connect-full__row">
				<div class="jp-connect-full__slide">
					<div class="jp-connect-full__slide-card illustration">
						<img
								src="<?php echo plugins_url( 'images/security.svg', JETPACK__PLUGIN_FILE ); ?>"
								alt="<?php esc_attr_e( 'Security & Backups', 'jetpack' ); ?>"
						/>
					</div>
					<div class="jp-connect-full__slide-card">
						<p><?php
							esc_html_e(
								'Jetpack protects you against brute force attacks and unauthorized logins. ' .
								'Basic protection is always free, while premium plans add unlimited backups of your whole site, ' .
								'spam protection, malware scanning, and automated fixes.',
								'jetpack'
							);
						?></p>
					</div>
				</div>
				<div class="jp-connect-full__slide">
					<div class="jp-connect-full__slide-card illustration">
						<img
								src="<?php echo plugins_url( 'images/jetpack-speed.svg', JETPACK__PLUGIN_FILE ); ?>"
								alt="<?php esc_attr_e( 'Built-in Performance', 'jetpack' ); ?>"
						/>
					</div>
					<div class="jp-connect-full__slide-card">
						<p><?php
							esc_html_e(
								"Activate site accelerator tools and watch your page load times and hosting costs drop—" .
								"we'll optimize your images and serve them from our own powerful global network of servers, " .
								"and speed up your mobile site to reduce bandwidth usage.",
								'jetpack'
							);
							?></p>
					</div>
				</div>
			</div>

			<p class="jp-connect-full__tos-blurb">
				<?php jetpack_render_tos_blurb(); ?>
			</p>
			<p class="jp-connect-full__button-container">
				<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, $bottom_connect_url_from ) ); ?>" class="dops-button is-primary">
					<?php esc_html_e( 'Set up Jetpack', 'jetpack' ); ?>
				</a>
			</p>
			<?php if ( 'plugins' === $current_screen->base ) : ?>
				<p class="jp-connect-full__dismiss-paragraph">
					<a>
						<?php echo esc_html_x(
							'Not now, thank you.', 'a link that closes the modal window that offers to connect Jetpack', 'jetpack'
						); ?>
					</a>
				</p>
			<?php endif; ?>
		</div></div>
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
