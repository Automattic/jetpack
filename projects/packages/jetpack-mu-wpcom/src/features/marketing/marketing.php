<?php
/**
 * WordPress.com Marketing Tools
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds some Tools menus that are missing on Simple sites.
 */
function wpcom_add_marketing_submenu() {
	add_submenu_page(
		'tools.php',
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		'publish_posts',
		'wpcom-marketing-tools',
		'wpcom_display_marketing_tools_page',
		1
	);
}
add_action( 'admin_menu', 'wpcom_add_marketing_submenu', 999999 );

/**
 * Displays the WordPress Marketing Tools page.
 */
function wpcom_display_marketing_tools_page() {
	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	?>
	<style>
		.wpcom-marketing-tools-description {
			margin-top: 0;
			font-size: 14px;
			line-height: 20px;
		}

		.wpcom-marketing-tools-premium-plugins {
			display: flex;
			background-color: white;
			border-radius: 4px;
		}

		.wpcom-marketing-tools-premium-plugins__info {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: flex-start;
			padding: 32px 0 32px 32px;
			gap: 16px;
		}

		.wpcom-marketing-tools-premium-plugins__info h2 {
			margin: 0;
			font-family: Recoleta, serif;
			font-size: 32px;
			line-height: 40px;
			letter-spacing: -0.32px;
			text-wrap: pretty;
			font-weight: 400;
		}

		.wpcom-marketing-tools-premium-plugins__info p {
			margin: 0;
			font-size: 16px;
			line-height: 24px;
			letter-spacing: -0.32px;
			font-weight: 400;
			text-wrap: pretty;
			color: #787c82;
		}

		.wpcom-marketing-tools-premium-plugins__info .button.button-primary {
			display: flex;
			gap: 8px;
			align-items: center;
		}

		.wpcom-marketing-tools-premium-plugins__image {
			background-image:
				linear-gradient(
					to left,
					rgba(255, 255, 255, 0),
					rgba(255, 255, 255, 0) 75%,
					rgba(255, 255, 255, 1) 100%
				),
				url( <?php echo esc_url( plugins_url( 'images/dot-grid.png', __FILE__ ) ); ?>);
			background-size: cover;
			padding: 48px 64px 48px 96px;
			flex-grow: 1;
			display: flex;
			align-items: center;
			justify-content: flex-end;
		}

		.wpcom-marketing-tools-premium-plugins__image img {
			max-width: 350px;
		}

		@media (max-width: 1200px) {
			.wpcom-marketing-tools-premium-plugins__image img {
				max-width: 300px;
			}
		}

		@media (max-width: 1080px) {
			.wpcom-marketing-tools-premium-plugins__info h2 {
				font-size: 24px;
				line-height: 32px;
			}

			.wpcom-marketing-tools-premium-plugins__info {
				padding: 24px 0 24px 24px;
			}

			.wpcom-marketing-tools-premium-plugins__image {
				padding: 24px 32px 24px 48px;
			}
		}

		@media (max-width: 600px) {
			.wpcom-marketing-tools-premium-plugins__info {
				padding: 16px;
			}

			.wpcom-marketing-tools-premium-plugins__image {
				display: none;
			}
		}
	</style>
	<div class="wrap">
		<h1><?php esc_html_e( 'Marketing Tools', 'jetpack-mu-wpcom' ); ?></h1>
		<p class="wpcom-marketing-tools-description"><?php esc_html_e( 'Explore tools to build your audience, market your site, and engage your visitors.', 'jetpack-mu-wpcom' ); ?></p>
		<div class="wpcom-marketing-tools-premium-plugins">
			<div class="wpcom-marketing-tools-premium-plugins__info">
				<h2><?php esc_html_e( 'Explore our premium plugins', 'jetpack-mu-wpcom' ); ?></h2>
				<p><?php esc_html_e( "We've added premium plugins to boost your site's capabilities. From bookings and subscriptions to email marketing and SEO tools, we have you covered.", 'jetpack-mu-wpcom' ); ?></p>
				<a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $domain . '?ref=wpcom-marketing-tools' ); ?>" class="button button-primary">
					<?php esc_html_e( 'Get started', 'jetpack-mu-wpcom' ); ?>
					<span class="dashicons dashicons-arrow-right-alt"></span>
				</a>
			</div>
			<div class="wpcom-marketing-tools-premium-plugins__image">
				<img src="<?php echo esc_url( plugins_url( 'images/premium-plugins.png', __FILE__ ) ); ?>" alt="">
			</div>
		</div>
	</div>
	<?php
}
