<?php
/**
 * CCPA Opt-Out Page Content Template
 *
 * @package automattic/jetpack-cookie-consent
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// $config is supplied by Cookie_Consent::get_ccpa_page_content() when this template is included.
$config = isset( $config ) && is_array( $config ) ? $config : array();
$copy   = \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_copy( $config );
?>

<!-- wp:paragraph -->
<p><?php echo esc_html( $copy['ccpa_intro'] ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php echo esc_html( $copy['ccpa_laws_notice'] ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading"><?php echo esc_html( $copy['ccpa_heading'] ); ?></h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list">
<li><?php echo esc_html( $copy['ccpa_browser_opt_out'] ); ?></li>
<li><?php echo esc_html( $copy['ccpa_account_opt_out'] ); ?></li>
<li><?php echo esc_html( $copy['ccpa_gpc_opt_out'] ); ?></li>
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><?php echo esc_html( $copy['ccpa_preferences_notice'] ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php echo esc_html( $copy['ccpa_button_instruction'] ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"lock":{"move":false,"remove":true},"className":"jetpack-cookie-consent-ccpa-opt-out-section"} -->
<div class="wp-block-group jetpack-cookie-consent-ccpa-opt-out-section">
	<!-- wp:buttons {"lock":{"move":false,"remove":true}} -->
	<div class="wp-block-buttons">
		<!-- wp:button {"tagName":"button","lock":{"move":false,"remove":true},"className":"jetpack-cookie-consent-ccpa-opt-out-button"} -->
		<div class="wp-block-button jetpack-cookie-consent-ccpa-opt-out-button"><button type="button" class="wp-block-button__link wp-element-button"><?php echo esc_html( $copy['ccpa_opt_out_button'] ); ?></button></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
