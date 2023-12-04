<?php
/**
 * Subcription service includes to build out the service.
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

require_once __DIR__ . '/class-jwt.php';
require_once __DIR__ . '/class-subscription-service.php';
require_once __DIR__ . '/class-token-subscription.php';
require_once __DIR__ . '/class-token-subscription-service.php';
require_once __DIR__ . '/class-jetpack-token-subscription-service.php';
require_once __DIR__ . '/class-wpcom-online-subscription-service.php';
require_once __DIR__ . '/class-wpcom-offline-subscription-service.php';
require_once __DIR__ . '/class-unconfigured-subscription-service.php';

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Jetpack_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Unconfigured_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;

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
	/**
	 * Filter the Jetpack_Token_Subscription_Service class.
	 *
	 * @since 9.4.0
	 *
	 * @param null|Jetpack_Token_Subscription_Service $interface Registered Subscription_Service.
	 */
	$interface = apply_filters( PAYWALL_FILTER, null );
	if ( ! $interface instanceof Jetpack_Token_Subscription_Service ) {
		_doing_it_wrong( __FUNCTION__, 'No Subscription_Service registered for the ' . esc_html( PAYWALL_FILTER ) . ' filter', 'jetpack' );
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

	// Prefer to use the WPCOM_Online_Subscription_Service if this code is executing on WPCOM.
	if ( WPCOM_Online_Subscription_Service::available() ) {
		// Return the WPCOM Online subscription service when we are on WPCOM.
		return new WPCOM_Online_Subscription_Service();
	}

	// Fallback on using the Jetpack_Token_Subscription_Service if this is not executing on WPCOM but is executing on a Jetpack site.
	if ( Jetpack_Token_Subscription_Service::available() ) {
		// Return the Jetpack Token Subscription Service when it is available.
		return new Jetpack_Token_Subscription_Service();
	}

	// Return an Unconfigured Subscription Service if this is not a WPCOM or Jetpack site or if both of those services are not available.
	return new Unconfigured_Subscription_Service();
}
add_filter( PAYWALL_FILTER, 'Automattic\Jetpack\Extensions\Premium_Content\default_service' );
