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
function is_on_frontend_and_logged_in() {
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
 * Get the current domain for the site.
 */
function get_domain() {
	$urlparts = wp_parse_url( home_url() );
	return $urlparts['host'];
}

/**
 * Checks if the site is using a custom domain.
 */
function is_custom_domain() {
	$domain = get_domain();
	return ! str_ends_with( $domain, 'wpcomstaging.com' ) && ! str_ends_with( $domain, 'wordpress.com' );
}

/**
 * Decides whether to render to the email nag.
 */
function domain_email_nag() {
	if ( ! is_on_frontend_and_logged_in() && is_custom_domain() ) {

		wp_enqueue_style( 'wpcom-domain-email-nag-style', plugins_url( 'domain-nag.style.css', __FILE__ ), array(), Jetpack_Mu_Wpcom::PACKAGE_VERSION );
		$blog_id = Jetpack_Options::get_option( 'id' );

		wc_enqueue_js(
			sprintf(
				"
				const base = 'https://public-api.wordpress.com';
				const path = '/v1/domains/%s/is-domain-email-unverified';
				
				fetch(base + path).then(function (result) {
					if (result) {
						result.json().then(function (body) {
							if (body.unverified) {
								const nag = document.querySelector('.wp-domain-nag-sticky-message');
								if (nag) {
									nag.style.display = 'block';
									const statUrl =
										'http://pixel.wp.com/b.gif?v=wpcom-no-pv&x_wpcom_frontend_unverified_domain_email_nag=shown';
									fetch(statUrl);
								}
							}
						});
					}
				});
			",
				$blog_id
			)
		);
	}
	$domain = get_domain();

	$notice = sprintf(
		/* translators: %1 User's email address, %2 current domain */
		__( 'You need to confirm your domain email address to avoid having your domain <strong>%1$s</strong> suspended. Please check your inbox.', 'jetpack-mu-wpcom' ),
		$domain
	);

	?>
	<div class="wp-domain-nag-sticky-message" style="display:none;">
		<div class="wp-domain-nag-inner">
			<p class="wp-domain-nag-text"><?php echo wp_kses( $notice, array( 'strong' => array() ) ); ?></p>
			<a class="button" href="<?php echo esc_url( get_account_url() ); ?>"><?php esc_html_e( 'Fix', 'jetpack-mu-wpcom' ); ?></a>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', __NAMESPACE__ . '\domain_email_nag' );

