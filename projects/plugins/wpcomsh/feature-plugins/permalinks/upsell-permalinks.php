<?php
/**
 * Permalinks admin upsell pages for Atomic sites.
 *
 * Registers an upsell page in `Settings → Permalinks` and provides a small
 * template loader used to render the upsell UI.
 *
 * @package wpcomsh
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Plans;

/**
 * Upsell page for options-permalink.php
 */
function wpcomsh_upsell_page_permalink() {
	// Template variables
	$slug                 = 'options-permalink';
	$title                = __( 'Unlock permalinks', 'wpcomsh' );
	$description          = __( 'Upgrade your plan to create a custom URL structure for your permalinks and archives. Clear, informative URLs improve the aesthetics, usability, and forward-compatibility of your links.', 'wpcomsh' );
	$support_link         = 'change-the-permalink-structure';
	$checkout_redirect_to = '/wp-admin/options-permalink.php';

	// Prepare plan info (Business plan on wp.com).
	$plan = null;
	if ( class_exists( '\\Automattic\\Jetpack\\Plans' ) ) {
		$plan = Plans::get_plan( 'business-bundle' );
	}
	$plan_name = $plan->product_name_short ?? 'Business';
	?>
	<div class="wpcom_upsell_page_wrapper">
		<div class="wpcom_upsell_page">
			<div class="wpcom_upsell_page__column">
				<h1><?php echo esc_html( $title ); ?></h1>
				<p>
					<?php echo esc_html( $description ); ?>
					<a href="https://wordpress.com/support/<?php echo esc_attr( $support_link ); ?>" target="_blank" rel="noopener noreferrer" data-target="wpcom-help-center"><?php echo esc_html( __( 'Learn more', 'wpcomsh' ) ); ?></a>
				</p>
				<a class="button button-primary" href="https://wordpress.com/checkout/<?php echo esc_attr( \Jetpack_Options::get_option( 'id' ) ); ?>/business?redirect_to=<?php echo esc_attr( get_site_url() . $checkout_redirect_to ); ?>&ref=<?php echo esc_attr( $slug ); ?>">
					<?php
					/* translators: %s: Plan name. */
					echo esc_html( sprintf( __( 'Get %s plan', 'wpcomsh' ), $plan_name ) );
					?>
				</a>
			</div>
			<div class="wpcom_upsell_page__column wpcom_upsell_page__plan">
				<h2><?php echo esc_html( $plan_name ); ?></h2>
				<h3>
					<?php
					/* translators: %s: Plan name. */
					echo esc_html( sprintf( __( 'Included in the %s plan', 'wpcomsh' ), $plan_name ) );
					?>
				</h3>
				<ul class="wpcom_upsell_page__plan__features">
					<li><strong><?php echo esc_html__( 'Free domain for one year', 'wpcomsh' ); ?></strong></li>
					<li><strong><?php echo esc_html__( 'Permalinks', 'wpcomsh' ); ?></strong></li>
					<li><strong><?php echo esc_html__( 'Privacy policy page', 'wpcomsh' ); ?></strong></li>
					<li><strong><?php echo esc_html__( 'Install plugins & themes', 'wpcomsh' ); ?></strong></li>
					<li><?php echo esc_html__( 'Remove WordPress.com Ads', 'wpcomsh' ); ?></li>
					<li><?php echo esc_html__( 'Collect payments', 'wpcomsh' ); ?></li>
					<li><?php echo esc_html__( 'Best-in-class hosting', 'wpcomsh' ); ?></li>
				</ul>
			</div>
		</div>
	</div>
	<?php
}

/**
 * Enqueue styles
 */
function wpcomsh_upsell_page_enqueue_styles() {
	wp_enqueue_style(
		'wpcomsh_feature_upsell_permalinks',
		plugins_url( 'upsell-page-styles.css', __FILE__ ),
		array(),
		filemtime( plugin_dir_path( __FILE__ ) . 'upsell-page-styles.css' )
	);
}

/**
 * Upsell pages for missing features on Atomic
 */
function wpcomsh_permalinks_upsell_page_on_atomic_sites() {
	// Only show the Permalinks upsell on Atomic sites that do not support the feature.
	if ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC ) {
		return;
	}
	if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
		return;
	}

	// If the site already has the Permalinks feature, do not add the upsell page.
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}

	add_submenu_page( 'options-general.php', 'Permalinks', 'Permalinks', 'manage_options', 'options-permalink', 'wpcomsh_upsell_page_permalink' );
	add_action( 'admin_print_styles-settings_page_options-permalink', 'wpcomsh_upsell_page_enqueue_styles' );
}
