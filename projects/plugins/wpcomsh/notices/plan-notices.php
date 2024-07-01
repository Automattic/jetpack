<?php
/**
 * Plan notices file.
 *
 * @package wpcomsh
 */

/**
 * This section controls expiration and autorenewal messaging in WP-Admin on Atomic sites. There are similar functions for WPCOM Simple Sites.
 *
 * Simple Site WP-Admin: fbhepr%2Skers%2Sgehax%2Sjc%2Qpbagrag%2Snqzva%2Qcyhtvaf%2Scyna%2Qerarj%2Qcebzcg.cuc%3Se%3Q225047%2320-og
 * Simple Site Calypso: fbhepr%2Skers%2Sgehax%2Sjc%2Qpbagrag%2Syvo%2Subzr%2Sivrjf.cuc%3Se%3Q232480%23179-og
 */
function wpcomsh_plan_notices() {
	// phpcs:ignore WordPress.WP.Capabilities.RoleFound
	if ( ! current_user_can( 'editor' ) && ! current_user_can( 'administrator' ) ) {
		return;
	}

	$persistent_data = new Atomic_Persistent_Data();

	if ( ! $persistent_data || ! $persistent_data->WPCOM_PURCHASES ) { // phpcs:ignore WordPress.NamingConventions
		return;
	}

	$purchases = json_decode( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions

	if ( empty( $purchases ) ) {
		return;
	}

	$atomic_supported_purchases = array_filter(
		$purchases,
		function ( $purchase ) {
			return wpcom_purchase_has_feature( $purchase, WPCOM_Features::ATOMIC );
		}
	);

	if ( empty( $atomic_supported_purchases ) ) {
		return;
	}

	// For the off chance that there are more than one purchase, pick the one with the latest expiration.
	usort(
		$atomic_supported_purchases,
		function ( $purchase1, $purchase2 ) {
			if ( strtotime( $purchase1->expiry_date ) === strtotime( $purchase2->expiry_date ) ) {
				return 0;
			}
			return ( strtotime( $purchase1->expiry_date ) > strtotime( $purchase2->expiry_date ) ) ? -1 : 1;
		}
	);
	$atomic_supported_purchase = $atomic_supported_purchases[0];
	$slug                      = $atomic_supported_purchase->product_slug;
	$expiration                = strtotime( $atomic_supported_purchase->expiry_date );
	$seconds_to_expiration     = $expiration - time();

	if ( $seconds_to_expiration > 29 * DAY_IN_SECONDS ) {
		return;
	}

	if ( strpos( $slug, 'personal' ) !== false ) {
		$plan_level = 'personal';
	} elseif ( strpos( $slug, 'value_bundle' ) !== false || 'bundle_pro' === $slug ) {
		$plan_level = 'premium';
	} elseif ( strpos( $slug, 'business' ) !== false ) {
		$plan_level = 'business';
	} elseif ( strpos( $slug, 'ecommerce' ) !== false ) {
		$plan_level = 'ecommerce';
	} elseif ( strpos( $slug, 'pro' ) !== false ) {
		$plan_level = 'pro';
	}

	if ( empty( $plan_level ) ) {
		return;
	}

	$domain      = preg_replace( '#^https?://#', '', network_site_url() );
	$renewal_url = sprintf( 'https://wordpress.com/checkout/%1$s/%2$s', $slug, $domain );
	// By default, display the notice 1 day after expiration
	$notice_offset = -1 * DAY_IN_SECONDS;

	// Pre-expiration message for non-monthly plans only.
	if ( false === stripos( $slug, 'monthly' ) ) {
		$notice_offset = 0;
		$plan_messages = array(
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'personal'  => __(
				'The Starter plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Starter plan features such as 6 GB storage space, no WordPress.com ads, and Subscriber-only content.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'premium'   => __(
				'The Explorer plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Explorer plan features such as site monetization, VideoPress, and Google Analytics support.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'business'  => __(
				'The Creator plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Creator plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'ecommerce' => __(
				'The Entrepreneur plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Entrepreneur plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'pro'       => __(
				'The Pro plan for <strong>%3$s</strong> expires on %2$s. <a href="%1$s">Renew your plan</a> to retain Pro plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
		);
	}

	// Expired message for annual and monthly plans.
	if ( $seconds_to_expiration < $notice_offset ) {
		$plan_messages = array(
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'personal'  => __(
				'The Starter plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Starter plan features such as 6 GB storage space, no WordPress.com ads, and Subscriber-only content.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'premium'   => __(
				'The Explorer plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Explorer plan features such as site monetization, VideoPress, and Google Analytics support.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'business'  => __(
				'The Creator plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Creator plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'ecommerce' => __(
				'The Entrepreneur plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Entrepreneur plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
			/* translators: %1$s is a link for plan renewal, %2$s human readable time e.g. January 1, 2021, %3$s site URL */
			'pro'       => __(
				'The Pro plan for <strong>%3$s</strong> expired on %2$s. <a href="%1$s">Reactivate your plan</a> to retain Pro plan features such as custom plugins and themes, SFTP, and phpMyAdmin access.',
				'wpcomsh'
			),
		);
	}

	if ( empty( $plan_messages[ $plan_level ] ) ) {
		return;
	}

	wpcomsh_record_tracks_event(
		'atomic_wpcomsh_renewal_notice',
		array(
			'plan_slug' => $plan_level,
		)
	);

	$message = sprintf(
		$plan_messages[ $plan_level ],
		esc_url( $renewal_url ),
		date_i18n( get_option( 'date_format' ), $expiration ),
		$domain
	);

	printf(
		'<div class="notice wpcomsh-notice">
			<span class="notice__icon-wrapper notice__icon-wrapper-pink">
				<span class="dashicons dashicons-info"></span>
			</span>
			<span class="notice__content">
				<span class="notice__text">%s</span>
			</span>
		</div>',
		wp_kses_post( $message )
	);
}
add_action( 'admin_notices', 'wpcomsh_plan_notices' );
