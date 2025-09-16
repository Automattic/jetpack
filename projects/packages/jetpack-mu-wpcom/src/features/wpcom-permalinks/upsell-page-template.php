<?php
/**
 * Upsell page template for the Permalinks feature.
 *
 * Expects template variables to be defined by the caller:
 * $slug, $title, $description, $feature_name, $support_link, $checkout_redirect_to, $activation_redirect_to.
 *
 * @package automattic/jetpack-mu-wpcom
 * @since $$next-version$$
 */

	declare( strict_types = 1 );
	use Automattic\Jetpack\Plans;

	// Ensure currency utilities are available.
if ( ! class_exists( 'Jetpack_Currencies' ) && defined( 'JETPACK__PLUGIN_DIR' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-currencies.php';
}

	// Price and currency from Creator plan
	$plan = Plans::get_plan( 'business-bundle' );
?>
<div class="wpcom_upsell_page_wrapper">
	<div class="wpcom_upsell_page">
		<div class="wpcom_upsell_page__column">
			<?php // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable ?>
			<h1><?php echo esc_html( $title ); ?></h1>
			<p>
				<?php // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable ?>
				<?php echo esc_html( $description ); ?> <a href="https://wordpress.com/support/<?php echo esc_attr( $support_link ); ?>" target="_blank" rel="noopener noreferrer" data-target="wpcom-help-center"><?php echo esc_html( __( 'Learn more', 'jetpack-mu-wpcom' ) ); ?></a>
			</p>
			<?php // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable ?>
			<a class="button button-primary" href="https://wordpress.com/checkout/<?php echo esc_attr( (int) \Jetpack_Options::get_option( 'id' ) ); ?>/business?redirect_to=<?php echo esc_attr( get_site_url() . $checkout_redirect_to ); ?>&ref=<?php echo esc_attr( $slug ); ?>">
				<?php // translators: %s is the name of the plan (e.g “Creator”). ?>
				<?php echo esc_html( sprintf( __( 'Get %s plan', 'jetpack-mu-wpcom' ), $plan->product_name_short ) ); ?>
			</a>
		</div>
		<div class="wpcom_upsell_page__column wpcom_upsell_page__plan">
			<h2><?php echo esc_html( $plan->product_name_short ); ?></h2>
			<?php // translators: %s is the name of the plan (e.g “Creator”). ?>
			<h3><?php echo esc_html( sprintf( __( 'Included in the %s plan', 'jetpack-mu-wpcom' ), $plan->product_name_short ) ); ?></h3>
			<ul class="wpcom_upsell_page__plan__features">
				<li><strong><?php echo esc_html( __( 'Free domain for one year', 'jetpack-mu-wpcom' ) ); ?></strong></li>
				<li><strong><?php echo esc_html( __( 'Permalinks', 'jetpack-mu-wpcom' ) ); ?></strong></li>
				<li><strong><?php echo esc_html( __( 'Privacy policy page', 'jetpack-mu-wpcom' ) ); ?></strong></li>
				<li><strong><?php echo esc_html( __( 'Install plugins & themes', 'jetpack-mu-wpcom' ) ); ?></strong></li>
				<li><?php echo esc_html( __( 'Remove WordPress.com Ads', 'jetpack-mu-wpcom' ) ); ?></li>
				<li><?php echo esc_html( __( 'Collect payments', 'jetpack-mu-wpcom' ) ); ?></li>
				<li><?php echo esc_html( __( 'Best-in-class hosting', 'jetpack-mu-wpcom' ) ); ?></li>
			</ul>
		</div>
	</div>
</div>
