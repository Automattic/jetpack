<?php
/**
 * CCPA Opt-Out Page Content Template
 *
 * @package automattic/jetpack-cookie-consent
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<!-- wp:paragraph -->
<p><?php echo esc_html__( 'We value your privacy and want you to feel in control of your personal information. Like most websites, we use cookies and similar tools to improve your shopping experience and show you relevant ads. Sometimes we share this information with trusted partners to do so.', 'jetpack-cookie-consent' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php echo esc_html__( 'Some U.S. state laws consider this kind of data sharing a sale or sharing of personal information. Depending on where you live, you may have the right to opt out.', 'jetpack-cookie-consent' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading"><?php echo esc_html__( 'How to Opt Out', 'jetpack-cookie-consent' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list">
<li><?php echo esc_html__( 'Browser Opt-Out: Click the Opt Out button below to stop your browser from sharing this data.', 'jetpack-cookie-consent' ); ?></li>
<li><?php echo esc_html__( 'Account Opt-Out: To apply this choice to your customer account, check the box and enter your email.', 'jetpack-cookie-consent' ); ?></li>
<li><?php echo esc_html__( 'Automatic Opt-Out: If you use a browser with Global Privacy Control (GPC) turned on, we will recognize it and respect your choice automatically.', 'jetpack-cookie-consent' ); ?></li>
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><?php echo esc_html__( 'Your preferences will only affect how we use your information for personalized ads and similar activities. It will not affect how we use your information for other purposes, like security or site functionality.', 'jetpack-cookie-consent' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php echo esc_html__( 'Click the Opt Out button to stop this browser from sharing personal data.', 'jetpack-cookie-consent' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"lock":{"move":false,"remove":true},"className":"jetpack-cookie-consent-ccpa-opt-out-section"} -->
<div class="wp-block-group jetpack-cookie-consent-ccpa-opt-out-section">
	<!-- wp:buttons {"lock":{"move":false,"remove":true}} -->
	<div class="wp-block-buttons">
		<!-- wp:button {"tagName":"button","lock":{"move":false,"remove":true},"className":"jetpack-cookie-consent-ccpa-opt-out-button"} -->
		<div class="wp-block-button jetpack-cookie-consent-ccpa-opt-out-button"><button type="button" class="wp-block-button__link wp-element-button"><?php echo esc_html__( 'Opt Out', 'jetpack-cookie-consent' ); ?></button></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
