<?php
/**
 * Premium Content Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use RuntimeException;
use function register_block_type;
use function plugin_dir_url;
use function apply_filters;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\{
	Subscription_Service,
	Jetpack_Token_Subscription_Service,
	Unconfigured_Subscription_Service,
	WPCOM_Offline_Subscription_Service,
	WPCOM_Token_Subscription_Service
};

require_once __DIR__ . '/subscription-service/include.php';
require_once '../_inc/access-check.php';

const FEATURE_NAME = 'premium-content/container';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;
const PAYWALL_FILTER = 'earn_premium_content_subscription_service';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	// Determine required `context` key based on Gutenberg version.
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$provides   = $deprecated ? 'providesContext' : 'provides_context';
	$uses       = $deprecated ? 'context' : 'uses_context';

    Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
            'plan_check'      => true,
            $provides         => array(
				'premium-content/planId' => 'selectedPlanId',
			),
		)
    );

	$asset_path = './dist/premium-content.asset.php';
	if ( ! file_exists( $asset_path ) ) {
		throw new RuntimeException(
			'You need to run `npm start` or `npm run build` for the "create-block/premium-content" block first.'
		);
	}
	$asset        = include $asset_path;
	$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
	$version      = isset( $asset['version'] ) ? $asset['version'] : filemtime( $asset_path );

	define( 'PREMIUM_CONTENT__ASSET_DEPENDENCIES', $dependencies );
	define( 'PREMIUM_CONTENT__ASSET_VERSION', $version );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if ( ! pre_render_checks() ) {
		return '';
	}

    Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
    return $content;
}

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
