<?php
/**
 * WordPress.com Marketing Tools
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;
use Automattic\Jetpack\Plans;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Registers the Tools > Marketing menu.
 */
function wpcom_add_marketing_submenu() {
	$hook_suffix = add_submenu_page(
		'tools.php',
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		'manage_options',
		'wpcom-marketing-tools',
		'wpcom_display_marketing_tools_page',
		1
	);
	add_action( 'load-' . $hook_suffix, 'load_marketing_tools_page' );
}
add_action( 'admin_menu', 'wpcom_add_marketing_submenu', 999999 );

/**
 * Initializes the Marketing Tools page.
 */
function load_marketing_tools_page() {
	add_action( 'admin_enqueue_scripts', 'enqueue_marketing_tools_assets' );
}

/**
 * Enqueues the Marketing Tools assets.
 */
function enqueue_marketing_tools_assets() {
	jetpack_mu_wpcom_enqueue_assets( 'marketing', array( 'js', 'css' ) );
	wp_add_inline_script(
		'jetpack-mu-wpcom-marketing',
		'const wpcomMarketing = ' . wp_json_encode( array( 'siteId' => get_wpcom_blog_id() ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}

/**
 * Displays the WordPress Marketing Tools page.
 */
function wpcom_display_marketing_tools_page() {
	$domain     = wp_parse_url( home_url(), PHP_URL_HOST );
	$is_private = ( new Status() )->is_private_site();

	$features = array(
		array(
			'title'       => __( 'Let our WordPress.com experts build your site!', 'jetpack-mu-wpcom' ),
			'description' => __(
				"Hire our dedicated experts to build a handcrafted, personalized website. Share some details about what you're looking for, and we'll make it happen.",
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Get started', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/wordpress-logo.svg', __FILE__ ),
			'url'         => 'https://wordpress.com/start/do-it-for-me/new-or-existing-site',
			'event'       => 'calypso_marketing_tools_built_by_wp_button_click',
		),
		array(
			'title'       => __( 'Monetize your site', 'jetpack-mu-wpcom' ),
			'description' => __(
				'Accept payments or donations with our native payment blocks, limit content to paid subscribers only, opt into our ad network to earn revenue, and refer friends to WordPress.com for credits.',
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Start earning', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/earn.svg', __FILE__ ),
			'url'         => 'https://wordpress.com/earn/' . $domain,
			'event'       => 'calypso_marketing_tools_earn_button_click',
		),
		array(
			'title'       => __( 'Fiverr logo maker', 'jetpack-mu-wpcom' ),
			'description' => __(
				'Create a standout brand with a custom logo. Our partner makes it easy and quick to design a professional logo that leaves a lasting impression.',
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Make your brand', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/fiverr-logo.svg', __FILE__ ),
			'url'         => 'https://wp.me/logo-maker/?utm_campaign=marketing_tab',
			'event'       => 'calypso_marketing_tools_create_a_logo_button_click',
			'target'      => '_blank',
		),
	);

	// Show the Facebook feature only between July-October 2025 (see pfUMqg-5a-p2).
	$current_date  = new DateTime();
	$current_year  = (int) $current_date->format( 'Y' );
	$current_month = (int) $current_date->format( 'n' );
	if ( $current_year === 2025 && $current_month >= 7 && $current_month <= 10 ) {
		$features[] = array(
			'title'       => __( 'Want to connect with your audience on Facebook and Instagram?', 'jetpack-mu-wpcom' ),
			'description' => sprintf(
			/* translators: %1$s - Name of the Business plan, %2$s - Name of Commerce plan. */
				__(
					'Discover an easy way to advertise your brand across Facebook and Instagram. Capture website actions to help you target audiences and measure results. Available on %1$s and %2$s plans.',
					'jetpack-mu-wpcom'
				),
				Plans::get_plan_short_name( 'business-bundle' ),
				Plans::get_plan_short_name( 'ecommerce-bundle' )
			),
			'action'      => __( 'Add Facebook for WordPress.com', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/facebook-logo.png', __FILE__ ),
			'url'         => 'https://wordpress.com/plugins/official-facebook-pixel/' . $domain,
			'event'       => 'calypso_marketing_tools_facebook_button_click',
		);
	}

	if ( ( new Host() )->is_wpcom_simple() && ! $is_private && ! wpcom_activitypub_is_active() ) {
		$features[] = array(
			'title'       => __( 'Share your blog with a new audience', 'jetpack-mu-wpcom' ),
			'description' => __(
				'Connect your WordPress.com site to the social web. Let people follow your posts from platforms like Mastodon, Threads, and more—no extra work needed.',
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Join the open social web', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/activitypub-logo.svg', __FILE__ ),
			'url'         => admin_url( 'options-general.php?page=activitypub' ),
			'event'       => 'calypso_marketing_tools_activitypub_button_click',
			'callback'    => 'enableActivityPub',
		);
	}

	$features[] = array(
		'title'       => __( 'Hire an SEO expert', 'jetpack-mu-wpcom' ),
		'description' => __(
			'In today‘s digital age, visibility is key. Hire an SEO expert to boost your online presence and capture valuable opportunities.',
			'jetpack-mu-wpcom'
		),
		'action'      => __( 'Talk to an SEO expert today', 'jetpack-mu-wpcom' ),
		'icon'        => plugins_url( 'images/fiverr-logo.svg', __FILE__ ),
		'url'         => 'https://wp.me/hire-seo-expert/?utm_source=marketing_tab',
		'event'       => 'calypso_marketing_tools_hire_an_seo_expert_button_click',
		'target'      => '_blank',
	);

	if ( ! $is_private ) {
		$features[] = array(
			'title'       => __( 'Share your blog posts with everyone', 'jetpack-mu-wpcom' ),
			'description' => __(
				"Use your site's Jetpack Social tools to connect your site and your social media accounts, and share your new posts automatically. Connect to Facebook, LinkedIn, and more.",
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Start sharing', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/social-media-logos.svg', __FILE__ ),
			'url'         => admin_url( 'admin.php?page=jetpack-social' ),
			'event'       => 'calypso_marketing_tools_start_sharing_button_click',
		);
	}

	$locale = Common\determine_iso_639_locale();
	if ( $locale === 'en' ) {
		$features[] = array(
			'title'       => __( 'Increase traffic to your WordPress.com site', 'jetpack-mu-wpcom' ),
			'description' => __(
				'Take our free introductory course about search engine optimization (SEO) and learn how to improve your site or blog for both search engines and humans.',
				'jetpack-mu-wpcom'
			),
			'action'      => __( 'Watch the course', 'jetpack-mu-wpcom' ),
			'icon'        => plugins_url( 'images/rocket.svg', __FILE__ ),
			'url'         => 'https://wordpress.com/support/courses/seo/',
			'event'       => 'calypso_marketing_tools_seo_course_button_click',
			'target'      => '_blank',
		);
	}

	?>
	<style>
		:root {
			--premium-plugins-bg: url( <?php echo esc_url( plugins_url( 'images/dot-grid.png', __FILE__ ) ); ?> );
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
				</a>
			</div>
			<div class="wpcom-marketing-tools-premium-plugins__image">
				<img src="<?php echo esc_url( plugins_url( 'images/premium-plugins.png', __FILE__ ) ); ?>" alt="">
			</div>
		</div>

		<div class="wpcom-marketing-tools-features">
			<?php foreach ( $features as $feature ) { ?>
				<div class="wpcom-marketing-tools-feature">
					<img src="<?php echo esc_url( $feature['icon'] ); ?>" alt="">
					<h3><?php echo esc_html( $feature['title'] ); ?></h3>
					<p><?php echo esc_html( $feature['description'] ); ?></p>
					<a
						href="<?php echo esc_url( $feature['url'] ); ?>"
						target="<?php echo esc_attr( $feature['target'] ?? '_self' ); // @phan-suppress-current-line PhanCoalescingNeverNullInLoop ?>"
						data-event="<?php echo esc_attr( $feature['event'] ); ?>"
						data-callback="<?php echo esc_attr( $feature['callback'] ?? '' ); // @phan-suppress-current-line PhanCoalescingNeverNullInLoop ?>"
					>
						<?php echo esc_html( $feature['action'] ); ?>
						<span class="dashicons dashicons-arrow-right-alt"></span>
					</a>
				</div>
			<?php } ?>
		</div>
	</div>
	<?php
}
