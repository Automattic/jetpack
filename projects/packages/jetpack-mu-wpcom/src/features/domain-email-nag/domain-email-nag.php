<?php
/**
 * Frontend Domain Email Nag
 *
 * @package A8C\Domain\Frontend_Email_Nag
 */

namespace A8C\Domain\Frontend_Email_Nag;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Determines whether the email nag should be shown.
 *
 * @return boolean
 */
function should_show_domain_frontend_email_nag() {
	if ( ! is_front_page() || ( is_front_page() && ! is_user_logged_in() ) ) {
		return false;
	}

	if ( ! class_exists( 'Email_Verification' ) ) {
		return false;
	}

	$should_show = \Email_Verification::is_domain_email_unverified();

	return apply_filters( 'a8c_show_domain_frontend_email_nag', $should_show );
}

/**
 * Returns account url for fixing email issue
 *
 * @return string account url
 */
function get_account_url() {
	return 'https://wordpress.com/me/account';
}

/**
 * Decides whether to render to the email nag.
 */
function domain_email_nag() {
	if ( ! should_show_domain_frontend_email_nag() ) {
		return;
	}

	wp_enqueue_style( 'wpcom-domain-email-nag-style', plugins_url( 'domain-nag.style.css', __FILE__ ), array(), Jetpack_Mu_Wpcom::PACKAGE_VERSION );

	$notice = sprintf(
	/* translators: %1 User's email address, %2 current domain */
		__( 'You need to confirm your email address <strong>%1$s</strong> to avoid having your domain <strong>%2$s</strong> suspended. Please check your inbox.', 'jetpack-mu-wpcom' ),
		wp_get_current_user()->user_email,
		wp_parse_url( site_url(), PHP_URL_HOST )
	);

	?>
	<div class="wp-domain-nag-sticky-message">
		<div class="wp-domain-nag-inner">
			<p class="wp-domain-nag-text"><?php echo wp_kses( $notice, array( 'strong' => array() ) ); ?></p>
			<a class="button" href="<?php echo esc_url( get_account_url() ); ?>"><?php esc_html_e( 'Fix', 'jetpack-mu-wpcom' ); ?></a>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', __NAMESPACE__ . '\domain_email_nag' );

