<?php

function wpcomsh_plan_notices() {
	if ( ! current_user_can( 'editor' ) && ! current_user_can( 'administrator' ) ) {
		return;
	}

	$class = 'notice';
	$domain = preg_replace( '#^https?://#', '', network_site_url() );
	$renewal_url = esc_url(
		'https://wordpress.com/checkout/business-bundle,ecommerce-bundle/renew/0/' . $domain
	);

	$persistent_data = new Atomic_Persistent_Data();
	$wpcom_plan = $persistent_data->WPCOM_PLAN;
	$wpcom_plan_expiration = $persistent_data->WPCOM_PLAN_EXPIRATION;

	/* No need for now, but will need it soon. :)
	if ( Atomic_Plan_Manager::FREE_PLAN_SLUG === $wpcom_plan ) {
		$class .= ' notice-error';

		$message = sprintf(
			__(
			'Your plan has expired. Please <a href="%1$s">renew</a> the plan, or you risk losing Business/eCommerce plan features.',
			'wpcomsh'
			),
			$renewal_url
		);
	}
	*/

	if ( ! empty( $wpcom_plan ) && ! empty( $wpcom_plan_expiration ) && $wpcom_plan_expiration < time() + ( 4 * WEEK_IN_SECONDS ) ) {
		$class .= ' notice-warning';

		if ( Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG === $wpcom_plan ) {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time until e.g. two weeks, %3$s site URL */
			$text = __(
				'The eCommerce plan for <strong>%3$s</strong> expires in %2$s. <a href="%1$s">Renew your plan</a> to retain eCommerce plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		} else {
			/* translators: %1$s is a link for plan renewal, %2$s human readable time until e.g. two weeks, %3$s site URL */
			$text = __(
				'The Business plan for <strong>%3$s</strong> expires in %2$s. <a href="%1$s">Renew your plan</a> to retain Business plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			);
		}

		$message = sprintf( $text, $renewal_url, human_time_diff( $wpcom_plan_expiration, time() ), $domain );
	}

	if ( ! empty( $message ) ) {
		printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), $message );
	}
}
add_action( 'admin_notices', 'wpcomsh_plan_notices' );
