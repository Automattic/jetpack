<?php

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\{
	Subscription_Service,
	Jetpack_Token_Subscription_Service,
	Unconfigured_Subscription_Service,
	WPCOM_Offline_Subscription_Service,
	WPCOM_Token_Subscription_Service
};

require_once __DIR__ . '/class-jwt.php';
require_once __DIR__ . '/class-subscription-service.php';
require_once __DIR__ . '/class-token-subscription.php';
require_once __DIR__ . '/class-token-subscription-service.php';
require_once __DIR__ . '/class-wpcom-token-subscription-service.php';
require_once __DIR__ . '/class-wpcom-offline-subscription-service.php';
require_once __DIR__ . '/class-jetpack-token-subscription-service.php';
require_once __DIR__ . '/class-unconfigured-subscription-service.php';

const PAYWALL_FILTER = 'earn_premium_content_subscription_service';

/**
 * Initializes the premium content subscription service.
 */
function paywall_initialize() {
	$paywall = subscription_service();
	if ( $paywall ) {
		$paywall->initialize();
	}
}
add_action( 'init', 'Automattic\Jetpack\Extensions\Premium_Content\paywall_initialize', 9 );

/**
 * Gets the service handling the premium content subscriptions.
 *
 * @return Subscription_Service Service that will handle the premium content subscriptions.
 */
function subscription_service() {
	$interface = apply_filters( 'earn_premium_content_subscription_service', null );
	if ( ! $interface instanceof Subscription_Service ) {
		_doing_it_wrong( __FUNCTION__, 'No Subscription_Service registered for the earn_premium_content_subscription_service filter', 'full-site-editing' );
	}
	return $interface;
}

/**
 * Gets the default service handling the premium content.
 *
 * @param  Subscription_Service $service If set, this service will be used by default.
 * @return Subscription_Service Service that will handle the premium content.
 */
function default_service( $service ) {
	if ( null !== $service ) {
		return $service;
	}

	if ( WPCOM_Offline_Subscription_Service::available() ) {
		return new WPCOM_Offline_Subscription_Service();
	}

	if ( WPCOM_Token_Subscription_Service::available() ) {
		return new WPCOM_Token_Subscription_Service();
	}

	if ( Jetpack_Token_Subscription_Service::available() ) {
		return new Jetpack_Token_Subscription_Service();
	}

	return new Unconfigured_Subscription_Service();
}
add_filter( PAYWALL_FILTER, 'Automattic\Jetpack\Extensions\Premium_Content\default_service' );
