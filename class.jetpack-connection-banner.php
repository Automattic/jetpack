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
		if ( version_compare( $old_version, '4.4', '>=' ) && version_compare( $old_version, '4.5', '<' ) ) {
			// We don't use `Jetpack_Options` here since the option is no longer in that class.
			delete_option( 'jetpack_connection_banner_ab' );
		}
	}

	/**
	 * Will initialize hooks to display the new (as of 4.4) connection banner if the current user can
	 * connect Jetpack, if Jetpack has not been deactivated, and if the current page is the plugins page.
	 *
	 * This method should not be called if the site is connected to WordPress.com or if the site is in development mode.
	 *
	 * @since 4.4.0
	 * @since 4.5.0 Made the new (as of 4.4) connection banner display to everyone by default.
	 *
	 * @param $current_screen
	 */
	function maybe_initialize_hooks( $current_screen ) {
		// Don't show the connect notice anywhere but the plugins.php after activating
		if ( 'plugins' !== $current_screen->base ) {
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
	function enqueue_banner_scripts() {
		wp_enqueue_script(
			'jetpack-connection-banner-js',
			plugins_url( '_inc/jetpack-connection-banner.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
	}

	/**
	 * Returns a URL that will dismiss allow the current user to dismiss the connection banner.
	 *
	 * @since 4.4.0
	 *
	 * @return string
	 */
	function get_dismiss_and_deactivate_url() {
		return wp_nonce_url(
			Jetpack::admin_url( '?page=jetpack&jetpack-notice=dismiss' ),
			'jetpack-deactivate'
		);
	}

	/**
	 * Renders the legacy connection banner.
	 */
	function render_legacy_banner() {
		$legacy_banner_from = self::check_ab_test_not_expired()
			? 'banner-legacy'
			: 'banner';
		?>
		<div id="message" class="updated jp-banner">
			<a
				href="<?php echo esc_url( $this->get_dismiss_and_deactivate_url() ); ?>"
				class="notice-dismiss" title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">

			</a>
			<div class="jp-banner__description-container">
				<h2 class="jp-banner__header"><?php esc_html_e( 'Your Jetpack is almost ready!', 'jetpack' ); ?></h2>
				<p class="jp-banner__description">
					<?php
					esc_html_e(
						'Please connect to or create a WordPress.com account to enable Jetpack, including
								powerful security, traffic, and customization services.',
						'jetpack'
					);
					?>
				</p>
				<p class="jp-banner__button-container">
					<a
						href="<?php echo Jetpack::init()->build_connect_url( false, false, $legacy_banner_from ) ?>"
						class="button button-primary">
						<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
					</a>
					<a
						href="<?php echo Jetpack::admin_url( 'admin.php?page=jetpack' ) ?>"
						class="button"
						title="<?php
						esc_attr_e(
							'Learn about the benefits you receive when you connect Jetpack to WordPress.com',
							'jetpack'
						);
						?> ">
						<?php esc_html_e( 'Learn more', 'jetpack' ); ?>
					</a>
				</p>
			</div>
		</div>
	<?php }

	/**
	 * Renders the new connection banner.
	 *
	 * @since 4.4.0
	 */
	function render_banner() { ?>
		<div id="message" class="updated jp-wpcom-connect__container">
			<div class="jp-wpcom-connect__inner-container">
				<a
					href="<?php echo esc_url( $this->get_dismiss_and_deactivate_url() ); ?>"
					class="notice-dismiss"
					title="<?php esc_attr_e( 'Dismiss this notice', 'jetpack' ); ?>">
				</a>

				<div class="jp-wpcom-connect__vertical-nav">
					<div class="jp-wpcom-connect__vertical-nav-container">
						<div class="vertical-menu__feature-item jp-feature-intro vertical-menu__feature-item-is-selected">
							<div class="vertical-menu__feature-item-icon">
								<svg class="jp-wpcom-connect__svg-jetpack" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 1 20 20" version="1.1"><path d="M14.4 11.3L10.5 18.1 10.5 8.7 13.7 9.5C14.5 9.7 14.9 10.6 14.4 11.3L14.4 11.3ZM9.6 13.3L6.5 12.5C5.7 12.3 5.3 11.4 5.7 10.7L9.6 3.9 9.6 13.3ZM10 1C4.5 1 0 5.5 0 11 0 16.5 4.5 21 10 21 15.5 21 20 16.5 20 11 20 5.5 15.5 1 10 1L10 1Z" /></svg>
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

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="103" viewBox="686 84 100 103" version="1.1">
								<g id="secondary-simple" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(686.000000, 84.000000)">
									<path d="M50.42 0.72C23.4 0.72 1.49 22.52 1.49 49.4 1.49 53.25 1.96 57 2.81 60.59 4.19 60.97 5.65 61.1 7.08 61.01 18.59 60.28 26.74 51.61 34.36 44.02 34.57 43.82 37.97 40.43 37.97 40.43L41.91 44.36C41.09 45.79 40.14 47.12 39.12 48.39L44.38 53.63 19.19 78.69 20.1 79.59 15.83 83.83C24.69 92.64 36.91 98.08 50.42 98.08 77.43 98.08 99.34 76.29 99.34 49.4 99.34 22.52 77.43 0.72 50.42 0.72" id="Fill-1" fill="#8CC258"/>
									<path d="M61.93 14.55L65.95 18.51 63.92 22.21C63.92 22.21 57.89 22.43 57.57 22.29 57.24 22.16 55.7 18.94 56.01 18.48 56.32 18.02 60.98 14.61 60.98 14.61L61.93 14.55" id="Fill-2" fill="#FFFFFF"/>
									<path d="M47.35 26.31L32.52 41.07 40.21 48.72 59.33 29.69 55.97 26.35 55.93 26.31C53.56 23.95 49.72 23.95 47.35 26.31" id="Fill-3" fill="#498E0B"/>
									<path d="M87.32 4.76C85.69 4.76 84.36 6.08 84.36 7.71L84.36 9.57 77.37 13.06C73.73 14.88 70.64 17.58 68.33 20.88L65.32 17.89 65.32 17.89 62.97 20.23C62.09 21.11 60.66 21.11 59.78 20.23L58.83 19.29C58.38 18.84 58.38 18.1 58.83 17.65L61.94 14.56C61.94 14.55 61.93 14.55 61.93 14.55L61.93 14.55 61.92 14.55C60.16 13.13 57.58 13.24 55.94 14.87L50.18 20.59 56 26.38C51.92 27.32 48.47 30.04 46.62 33.81L40.59 46.12C35.73 47.94 31.84 51.87 30.16 56.93L25.36 71.42 24.37 71.91C19.13 74.5 14.88 78.73 12.27 83.95L8.55 91.41 5.72 90.72C4.55 90.44 3.37 91.15 3.09 92.32L0.61 102.48 5.42 97.7 5.42 97.7 38.81 64.47C39.67 65.05 40.58 65.56 41.54 65.99L54.79 71.95C51.27 72.52 47.88 73.79 44.83 75.71L37.81 80.12 35.87 78.18C35.09 77.41 33.83 77.41 33.05 78.18L25.87 85.33 31.79 83.9 31.79 83.9 53.65 78.62 58.85 77.37C59.9 77.1 60.79 76.58 61.48 75.9 63.56 73.83 63.81 70.26 61.48 67.94L48.55 55.07 52.56 52.06 68.23 52.06 68.23 52.06 68.32 52.06C69.1 52.06 69.79 51.68 70.21 51.1 70.22 51.09 70.23 51.08 70.24 51.07L70.23 51.07C70.51 50.69 70.67 50.22 70.67 49.72L70.67 47.5C70.67 46.78 70.09 46.2 69.37 46.2L67.14 46.2C65.84 46.2 64.79 47.25 64.79 48.54L64.79 49.27 60.31 47.8C59.82 47.63 59.32 47.49 58.81 47.36L60.54 46.06C63.39 43.92 65.07 40.57 65.09 37.02L65.11 31.29 91.77 4.76 87.32 4.76" id="Fill-4" fill="#234705"/>
								</g>
							</svg>
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
								href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-1' ) ); ?>"
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
						</p>
					</div> <!-- end slide 1 -->

					<!-- slide 2: stats -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-two">
						<h2><?php esc_html_e( 'Detailed stats and traffic tools to help your site grow', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="687 83 100 100" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(687.000000, 83.000000)"><circle fill="#3D596D" cx="50" cy="50" r="50"/><path d="M45.5 63L55.5 63 55.5 28 45.5 28 45.5 63ZM60.5 63L70.5 63 70.5 35.5 60.5 35.5 60.5 63ZM30.5 63L40.5 63 40.5 45.5 30.5 45.5 30.5 63ZM28 73L73 73 73 68 28 68 28 73Z" fill="#FFFFFF"/></g></svg>
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
							<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-2' ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 2 -->

					<!-- slide 3: security -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-three">
						<h2><?php esc_html_e( 'Multiple security tools to give you peace of mind', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="2 3 100 100" version="1.1"><defs><polygon points="36 22.5 36 0 0 0 0 22.5 0 45 36 45"/></defs><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(2.000000, 3.000000)"><circle fill="#3D596D" cx="50" cy="50" r="50"/><g transform="translate(32.000000, 25.000000)"><mask fill="white"/><path d="M20.3 30.9L20.3 36 15.8 36 15.8 30.9C14.4 30.1 13.5 28.7 13.5 27 13.5 24.5 15.5 22.5 18 22.5 20.5 22.5 22.5 24.5 22.5 27 22.5 28.7 21.6 30.1 20.3 30.9L20.3 30.9ZM11.3 11.2C11.3 7.5 14.3 4.5 18 4.5 21.7 4.5 24.8 7.5 24.8 11.2L24.8 13.5 11.3 13.5 11.3 11.2ZM31.5 13.5L29.3 13.5 29.3 11.2C29.3 5 24.2 0 18 0 11.8 0 6.8 5 6.8 11.2L6.8 13.5 4.5 13.5C2 13.5 0 15.5 0 18L0 40.5C0 43 2 45 4.5 45L31.5 45C34 45 36 43 36 40.5L36 18C36 15.5 34 13.5 31.5 13.5L31.5 13.5Z" fill="#FFFFFF" mask="url(#mask-2)"/></g></g></svg>
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
								href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-3' ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 3 -->

					<!-- slide 4: Performance -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-four">
						<h2><?php esc_html_e( 'Faster site speeds through the WordPress.com CDN', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="2 3 100 100" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(2.000000, 3.000000)"><circle fill="#3D596D" cx="50" cy="50" r="50"/><path d="M41.5 32.5L41.5 46.7 48.3 39.3 59.2 51.4 60.7 49.7C62.4 47.8 65.6 47.8 67.3 49.7L68.5 51 68.5 32.5 41.5 32.5ZM73 32.5L73 59.5C73 62 71 64 68.5 64L41.5 64C39 64 37 62 37 59.5L37 32.5C37 30 39 28 41.5 28L68.5 28C71 28 73 30 73 32.5L73 32.5ZM32.5 68.5L64 68.5 64 68.5C64 71 62 73 59.5 73L32.5 73C30 73 28 71 28 68.5L28 41.5C28 39 30 37 32.5 37L32.5 37 32.5 68.5ZM57.3 40.4C57.3 38.5 58.8 37 60.6 37 62.5 37 64 38.5 64 40.4 64 42.2 62.5 43.8 60.6 43.8 58.8 43.8 57.3 42.2 57.3 40.4L57.3 40.4Z" fill="#FFFFFF"/></g></svg>
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
							<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-4' ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 4 -->

					<!-- slide 5: Apps -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-five">
						<h2><?php esc_html_e( 'Free WordPress apps to manage your site(s) from any device', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="2 3 100 100" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(2.000000, 3.000000)"><circle fill="#3D596D" cx="50" cy="50" r="50"/><path d="M36.5 66.3L63.5 66.3 63.5 34.8 36.5 34.8 36.5 66.3ZM47.8 70.8L52.3 70.8 52.3 68.5 47.8 68.5 47.8 70.8ZM63.5 28L36.5 28C34 28 32 30 32 32.5L32 68.5C32 71 34 73 36.5 73L63.5 73C66 73 68 71 68 68.5L68 32.5C68 30 66 28 63.5 28L63.5 28Z" fill="#FFFFFF"/></g></svg>
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
							<a href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-5' ) ); ?>" class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
							<a href="#" class="dops-button next-feature" title="<?php esc_attr_e( 'Jetpack Tour: Next Feature', 'jetpack' ); ?>">
								<?php esc_html_e( 'Next feature', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 5 -->

					<!-- slide 6: more features -->
					<div class="jp-wpcom-connect__slide jp-wpcom-connect__slide-six">
						<h2><?php esc_html_e( 'More Jetpack features our users love', 'jetpack' ) ?></h2>

						<div class="jp-wpcom-connect__content-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="2 3 100 100" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(2.000000, 3.000000)"><circle fill="#3D596D" cx="50" cy="50" r="50"/><path d="M55.3 51.4L58.4 48.4C59.7 49.1 61.2 49.5 62.9 49.5 68.5 49.5 73 45 73 39.4 73 37.7 72.6 36.2 71.9 34.9L64 42.8 59.5 38.3 67.4 30.4C66 29.7 64.5 29.3 62.9 29.3 57.3 29.3 52.8 33.8 52.8 39.4 52.8 41 53.2 42.5 53.9 43.9L30.3 67.5 34.8 72 50.2 56.6C54.4 60.9 58.9 65 63.6 68.9L66.8 71.4 70.2 68.1 67.6 64.9C63.8 60.1 59.7 55.6 55.3 51.4M28 36C28 32.6 29.8 29.1 32.5 27 32.5 28.9 34.1 31.5 37 31.5 40.7 31.5 43.8 34.5 43.8 38.3 43.8 39.1 43.6 39.9 43.3 40.7 44.9 42 46.6 43.4 48.2 44.8L43.5 49.5C42.1 47.8 40.8 46.2 39.5 44.5 38.7 44.8 37.9 45 37 45 32 45 28 41 28 36" fill="#FFFFFF"/></g></svg>
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
								href="<?php echo esc_url( Jetpack::init()->build_connect_url( true, false, 'banner-44-slide-6' ) ); ?>"
								class="dops-button is-primary">
								<?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?>
							</a>
						</p>
					</div> <!-- end slide 6 -->
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

			<?php // planet + star svgs for decoration ?>

			<svg class="jp-connect-full__svg-stars" xmlns="http://www.w3.org/2000/svg" width="56" height="54" viewBox="0 0 56 54" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.95"><g transform="translate(-268.000000, -101.000000)" fill="#C8D7E1"><g transform="translate(160.000000, 32.000000)"><g transform="translate(104.000000, 69.000000)"><polyline points="53.6 10.3 59.3 8 53.6 5.7 51.3 0 49 5.7 43.3 8 49 10.3 51.3 16 53.6 10.3"/><polyline transform="translate(8.757724, 49.487494) rotate(315.000000) translate(-8.757724, -49.487494) " points="10.5 51.2 14.8 49.5 10.5 47.8 8.8 43.5 7 47.8 2.8 49.5 7 51.2 8.8 55.5 10.5 51.2"/></g></g></g></g></svg>

			<svg class="jp-connect-full__svg-jupiter" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" height="100" viewBox="0 0 50 100" version="1.1"><defs><path d="M0.95 40.37C-4.37 67.46 13.27 93.73 40.37 99.05 67.46 104.37 93.73 86.73 99.05 59.63 104.37 32.54 86.73 6.27 59.63 0.95 32.54-4.37 6.27 13.27 0.95 40.37" id="path-1"/></defs><g id="Welcome" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.5"><g id="v1.2" transform="translate(-1215.000000, -93.000000)"><g id="lrg-planet-+-jupiter-Mask" transform="translate(160.000000, 32.000000)"><g id="jupiter" transform="translate(1055.000000, 61.000000)"><path d="M0.94 40.19C-4.36 67.16 13.22 93.32 40.19 98.62 67.16 103.92 93.32 86.35 98.62 59.37 103.92 32.4 86.35 6.24 59.37 0.94 32.4-4.36 6.24 13.22 0.94 40.19" id="jupFill-1" fill="#C8D7E1"/><g id="jupGroup-17"><mask id="mask-jup" fill="white"><use xlink:href="#path-1"/></mask><g id="jupClip-3"/><path d="M49.59 38.06C51.29 29.39 59.7 23.73 68.38 25.44 77.05 27.14 82.7 35.55 81 44.23 79.3 52.9 70.88 58.55 62.21 56.85 53.53 55.15 47.88 46.73 49.59 38.06" id="jupFill-2" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M53.93 52.41C48.66 47.1 42.15 43.21 34.98 41.08L37.21 29.74C44.64 30.48 52.15 29.34 59.03 26.41L53.93 52.41" id="jupFill-4" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M30.93 34.4C31.55 31.25 34.6 29.2 37.75 29.82 40.89 30.43 42.94 33.49 42.32 36.63 41.71 39.78 38.65 41.83 35.51 41.21 32.36 40.59 30.31 37.54 30.93 34.4" id="jupFill-5" fill="#E9EFF3" mask="url(#mask-jup)"/><polyline id="jupFill-9" fill="#E9EFF3" mask="url(#mask-jup)" points="35.54 41.22 -14.22 31.44 -11.99 20.08 37.77 29.85 35.54 41.22"/><path d="M30.34 67.29C31.4 61.93 36.59 58.44 41.95 59.49 47.31 60.54 50.8 65.74 49.75 71.1 48.69 76.46 43.5 79.95 38.14 78.89 32.78 77.84 29.29 72.65 30.34 67.29" id="jupFill-10" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M33.02 76.15C29.77 72.87 25.75 70.47 21.32 69.15L22.7 62.15C27.29 62.61 31.93 61.9 36.18 60.09L33.02 76.15" id="jupFill-11" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M18.82 65.02C19.2 63.08 21.09 61.82 23.03 62.2 24.97 62.58 26.24 64.46 25.86 66.41 25.48 68.35 23.59 69.62 21.65 69.23 19.7 68.85 18.44 66.97 18.82 65.02" id="jupFill-12" fill="#E9EFF3" mask="url(#mask-jup)"/><path d="M43.91 78.29C48.16 76.49 52.8 75.78 57.39 76.24L58.77 69.23C54.34 67.92 50.32 65.51 47.07 62.23L43.91 78.29" id="jupFill-13" fill="#E9EFF3" mask="url(#mask-jup)"/><polyline id="jupFill-16" fill="#E9EFF3" mask="url(#mask-jup)" points="21.67 69.24 -67.61 51.7 -66.23 44.68 23.05 62.22 21.67 69.24"/></g><path d="M35.02 68.89C35.07 65.99 37.47 63.68 40.37 63.74 43.28 63.79 45.58 66.19 45.53 69.09 45.47 72 43.07 74.3 40.17 74.25 37.27 74.19 34.96 71.79 35.02 68.89" id="jupFill-18" fill="#E9EFF3"/></g></g></g></g></svg>


			<div class="jp-connect-full__dismiss">
				<svg class="jp-connect-full__svg-dismiss" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Dismiss Jetpack Connection Window</title><rect x="0" fill="none" /><g><path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z"/></g></svg>
			</div>

			<div class="jp-connect-full__step-header">
				<div class="jp-connect-full__step-header-logos">

					<svg class="jp-connect-full__svg-jetpack" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 1 20 20" version="1.1"><path d="M14.4 11.3L10.5 18.1 10.5 8.7 13.7 9.5C14.5 9.7 14.9 10.6 14.4 11.3L14.4 11.3ZM9.6 13.3L6.5 12.5C5.7 12.3 5.3 11.4 5.7 10.7L9.6 3.9 9.6 13.3ZM10 1C4.5 1 0 5.5 0 11 0 16.5 4.5 21 10 21 15.5 21 20 16.5 20 11 20 5.5 15.5 1 10 1L10 1Z" /></svg>

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
						<?php
						printf(
							__( 'By connecting your site you agree to our fascinating <a href="%s" target="_blank" class="jp-connect-full__tos-a">Terms of Service</a> and to <a href="%s" target="_blank" class="jp-connect-full__tos-a">share details</a> with WordPress.com', 'jetpack' ),
							'https://wordpress.com/tos',
							'https://jetpack.com/support/what-data-does-jetpack-sync'
						);
						?>
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
