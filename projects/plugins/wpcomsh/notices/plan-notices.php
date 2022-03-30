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

	$persistent_data = new Atomic_Persistent_Data();
	// phpcs:disable WordPress.NamingConventions.ValidVariableName
	$plan                  = $persistent_data->WPCOM_PLAN;
	$plan_date             = $persistent_data->WPCOM_PLAN_EXPIRATION;
	$seconds_to_expiration = $persistent_data->WPCOM_PLAN_EXPIRATION - time();
	// phpcs:enable

	if ( empty( $plan ) || empty( $plan_date ) ) {
		return;
	}

	if ( $seconds_to_expiration > 29 * DAY_IN_SECONDS ) {
		return;
	}

	$domain      = preg_replace( '#^https?://#', '', network_site_url() );
	$plan_slug   = 'pro-plan' === $plan ? $plan : "{$plan}-bundle";
	$renewal_url = sprintf( 'https://wordpress.com/checkout/%1$s/%2$s', $plan_slug, $domain );

	// Pre-expiration message for annual plans.
	$plan_messages = array(
		/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
		'personal'  => __(
			'The Personal plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Personal plan features such as 6 GB storage space, no WordPress.com ads, and Subscriber-only content.',
			'wpcomsh'
		),
		/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
		'premium'   => __(
			'The Premium plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Premium plan features such as site monetization, VideoPress, and Google Analytics support.',
			'wpcomsh'
		),
		/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
		'business'  => __(
			'The Business plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Business plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
			'wpcomsh'
		),
		/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
		'ecommerce' => __(
			'The eCommerce plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain eCommerce plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
			'wpcomsh'
		),
		/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
		'pro'       => __(
			'The Pro plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Pro plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
			'wpcomsh'
		),
	);

	// Expired message for annual plans.
	if ( $seconds_to_expiration < 0 ) {
		$plan_messages = array(
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'personal'  => __(
				'The Personal plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Personal plan features such as 6 GB storage space, no WordPress.com ads, and Subscriber-only content.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'premium'   => __(
				'The Premium plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Premium plan features such as site monetization, VideoPress, and Google Analytics support.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'business'  => __(
				'The Business plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Business plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'ecommerce' => __(
				'The eCommerce plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain eCommerce plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'pro'       => __(
				'The Pro plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Pro plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
		);
	}

	if ( empty( $plan_messages[ $plan ] ) ) {
		return;
	}

	wpcomsh_record_tracks_event(
		'atomic_wpcomsh_renewal_notice',
		array(
			'plan_slug' => $plan,
		)
	);

	$message = sprintf(
		$plan_messages[ $plan ],
		esc_url( $renewal_url ),
		date_i18n( get_option( 'date_format' ), $plan_date ),
		$domain
	);

	printf( '<div class="notice notice-warning"><p>%s</p></div>', $message );
}
add_action( 'admin_notices', 'wpcomsh_plan_notices' );
