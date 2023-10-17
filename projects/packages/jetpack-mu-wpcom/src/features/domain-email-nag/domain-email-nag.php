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
	return true;
}

/**
 * Returns the domain url for site that has a domain with an
 * univerified email address.
 *
 * @return string account url
 */
function get_account_url() {
	return 'https://wordpress.com/domains/manage/' . wpcom_get_site_slug();
}

/**
 * Find the domain, if any, that has an unverified email address.
 */
function get_domain_with_unverified_email() {
	if ( ! class_exists( 'Domain_Management' ) ) {
		return false;
	}

	$domains = \Domain_Management::get_paid_domains_with_icann_verification_status();

	foreach ( $domains as $domain ) {
		if ( $domain['is_pending_icann_verification'] === true ) {
			return $domain['domain'];
		}
	}
	return false;
}

/**
 * Decides whether to render to the email nag.
 */
function domain_email_nag() {
	if ( ! should_show_domain_frontend_email_nag() ) {
		return;
	}

	$domain = get_domain_with_unverified_email();

	if ( ! $domain ) {
		return;
	}

	wp_enqueue_style( 'wpcom-domain-email-nag-style', plugins_url( 'domain-nag.style.css', __FILE__ ), array(), Jetpack_Mu_Wpcom::PACKAGE_VERSION );

	$notice = sprintf(
	/* translators: %1 User's email address, %2 current domain */
		__( 'You need to confirm your domain email address to avoid having your domain <strong>%1$s</strong> suspended. Please check your inbox.', 'jetpack-mu-wpcom' ),
		$domain
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

