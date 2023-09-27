<?php
/**
 * Frontend Domain Email Nag
 *
 * @package A8C\Domain\Frontend_Email_Nag
 */

namespace A8C\Domain\Frontend_Email_Nag;

/**
 * Determines whether the email nag should be shown.
 *
 * @return boolean
 */
function should_show_domain_frontend_email_nag() {
	if ( ! is_front_page() && ! is_user_logged_in() && ! current_user_can( 'edit_post' ) ) {
		return false;
	}

	$should_show = ( (int) get_user_attribute( get_current_user_id(), 'is_email_unverified' ) === 1 );

	return apply_filters( 'a8c_show_domain_frontend_email_nag', $should_show );
}

/**
 * Decides whether to render to the email nag.
 *
 * @param string $template The template to render.
 */
function domain_email_nag( $template ) {
	if ( ! should_show_domain_frontend_email_nag() ) {
		return $template;
	}
}
add_filter( 'template_include', __NAMESPACE__ . '\domain_email_nag' );
