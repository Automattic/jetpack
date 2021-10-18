<?php
/**
 * This section controls expiration and autorenewal messaging in WP-Admin on Atomic sites. There are similar functions for WPCOM Simple Sites.
 *
 * Simple Site WP-Admin: fbhepr%2Skers%2Sgehax%2Sjc%2Qpbagrag%2Snqzva%2Qcyhtvaf%2Scyna%2Qerarj%2Qcebzcg.cuc%3Se%3Q225047%2320-og
 * Simple Site Calypso: fbhepr%2Skers%2Sgehax%2Sjc%2Qpbagrag%2Syvo%2Subzr%2Sivrjf.cuc%3Se%3Q232480%23179-og
 */
function wpcomsh_plan_notices() {
	if ( ! current_user_can( 'editor' ) && ! current_user_can( 'administrator' ) ) {
		return;
	}

	$class       = 'notice';
	$domain      = preg_replace( '#^https?://#', '', network_site_url() );
	$renewal_url = esc_url(
		'https://wordpress.com/checkout/business-bundle,ecommerce-bundle/renew/0/' . $domain
	);

	$persistent_data = new Atomic_Persistent_Data();
	// phpcs:disable WordPress.NamingConventions.ValidVariableName
	$plan                  = $persistent_data->WPCOM_PLAN;
	$plan_date             = $persistent_data->WPCOM_PLAN_EXPIRATION;
	$seconds_to_expiration = $persistent_data->WPCOM_PLAN_EXPIRATION - time();
	// phpcs:enable

	if ( ! empty( $plan_date ) && $seconds_to_expiration > 29 * DAY_IN_SECONDS ) {
		return;
	}

	// Expired message for annual plans.
	if ( ! empty( $plan ) && ! empty( $plan_date ) && $seconds_to_expiration < 0 ) {
		$class .= ' notice-warning';

		if ( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG === $plan ) {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			$text = __(
				'The eCommerce plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain eCommerce plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		} else {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			$text = __(
				'The Business plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Business plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		}

		$message = sprintf( $text, $renewal_url, date_i18n( get_option( 'date_format' ), $plan_date ), $domain );

		wpcomsh_record_tracks_event(
			'atomic_wpcomsh_renewal_notice',
			array(
				'plan_slug' => $wpcom_plan,
			)
		);

		printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), $message );

		return;
	}

	// Pre-expiration message for annual plans.
	if ( ! empty( $plan ) && ! empty( $plan_date ) ) {
		$class .= ' notice-warning';

		if ( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG === $plan ) {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			$text = __(
				'The eCommerce plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain eCommerce plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		} else {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			$text = __(
				'The Business plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Business plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		}

		$message = sprintf( $text, $renewal_url, date_i18n( get_option( 'date_format' ), $plan_date ), $domain );

		wpcomsh_record_tracks_event(
			'atomic_wpcomsh_renewal_notice',
			array(
				'plan_slug' => $plan,
			)
		);

		printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), $message );

		return;
	}
}

add_action( 'admin_notices', 'wpcomsh_plan_notices' );
