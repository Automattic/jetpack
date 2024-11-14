<?php
/**
 * Set up custom priority headers for outbound email sent via SMTP.
 * See pMz3w-gAF-p2#comment-104972 for the specific header structure and
 * background discussion for our initial use cases.
 *
 * @since 3.5.36
 * @package wpcomsh
 */

/**
 * Maximum priority level.
 */
const WPCOMSH_SMTP_LEVEL_MAX = 9;
/**
 * Minimum priority level.
 */
const WPCOMSH_SMTP_LEVEL_MIN = 1;
/**
 * The default level for users with reduced email priority.
 */
const WPCOMSH_SMTP_LEVEL_REDUCED = 2;
/**
 * A slightly increased level for emails that should get priority, like password resets and new user registrations.
 */
const WPCOMSH_SMTP_LEVEL_LOCAL_PRIORITY = 5;

/**
 * Add the custom email priority SMTP header if that's something we need for this site.
 *
 * @param \PHPMailer\PHPMailer\PHPMailer $phpmailer The current PHPMailer instance, which is passed by reference.
 * @return void
 * @throws \PHPMailer\PHPMailer\Exception Exception may be thrown by the {@see PHP_Mailer::addCustomHeader()} function.
 */
function wpcomsh_smtp_add_priority_header( $phpmailer ): void {
	if ( ! wpcom_site_has_feature( \WPCOM_Features::REDUCED_ATOMIC_EMAIL_PRIORITY ) ) {
		return;
	}

	/**
	 * Filters the SMTP email priority.
	 *
	 * @since 3.5.36
	 *
	 * @param int|null  $priority The priority we should apply. Default is 2.
	 * @return int|null Return null if you want no priority. Otherwise the returned value must be 0-9.
	 */
	$atomic_email_priority = apply_filters( 'wpcomsh_smtp_email_priority', WPCOMSH_SMTP_LEVEL_REDUCED );

	// If the priority is null, assume we don't want any priority.
	if ( null === $atomic_email_priority ) {
		return;
	}

	// Ensure we have an integer between 1-9; if we don't have something int-like, use the default priority.
	if ( ! is_int( $atomic_email_priority ) ) {
		$atomic_email_priority = WPCOMSH_SMTP_LEVEL_REDUCED;
	}
	$atomic_email_priority = min( WPCOMSH_SMTP_LEVEL_MAX, $atomic_email_priority );
	$atomic_email_priority = max( WPCOMSH_SMTP_LEVEL_MIN, $atomic_email_priority );

	$phpmailer->addCustomHeader( 'X-Atomic-Email-Level', $atomic_email_priority );
}

// Run this relatively late to make sure standard SMTP configuration has already been completed
add_action( 'phpmailer_init', 'wpcomsh_smtp_add_priority_header', 100 );

/**
 * Helper function to return the local priority SMTP level - {@see WPCOMSH_SMTP_LEVEL_LOCAL_PRIORITY}.
 *
 * @since 3.5.36
 */
function wpcomsh_smtp_set_priority_local_priority(): int {
	return WPCOMSH_SMTP_LEVEL_LOCAL_PRIORITY;
}

/**
 * Helper function to ensure that we add a filter that sets the SMTP email priority to {@see WPCOMSH_SMTP_LEVEL_LOCAL_PRIORITY};
 *
 * @since 3.5.36
 */
function wpcomsh_smtp_add_local_priority_filter(): void {
	add_filter( 'wpcomsh_smtp_email_priority', 'wpcomsh_smtp_set_priority_local_priority' );
}

/**
 * Helper function to allow us to set up local priority from within a filter.
 * {@see wpcomsh_smtp_add_local_priority_filter()}.
 *
 * @since 3.5.36
 *
 * @param mixed $filtered_value The value for the filter. We return this as-is from the function.
 * @return mixed
 */
function wpcomsh_smtp_add_local_priority_filter_within_filter( $filtered_value ) {
	wpcomsh_smtp_add_local_priority_filter();

	return $filtered_value;
}

// Ensure emails sent as a result of password resets get local priority.
add_action( 'password_reset', 'wpcomsh_smtp_add_local_priority_filter' );
// Ensure emails sent as a result of a new user registration get local priority.
add_action( 'register_new_user', 'wpcomsh_smtp_add_local_priority_filter' );
// Ensure emails sent as part of a password retrieval/reset get local priority.
add_filter( 'retrieve_password_notification_email', 'wpcomsh_smtp_add_local_priority_filter_within_filter' );
