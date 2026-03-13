<?php
/**
 * A paywall that exchanges JWT tokens from WordPress.com to allow
 * a current visitor to view content that has been deemed "Premium content".
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_Token_Subscription_Service
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service
 */
class Jetpack_Token_Subscription_Service extends Abstract_Token_Subscription_Service {

	/**
	 * Is the Jetpack_Options class available?
	 *
	 * @return bool Whether Jetpack_Options class exists.
	 */
	public static function available() {
		return ( new Host() )->is_wpcom_simple() || class_exists( '\Jetpack_Options' );
	}

	/**
	 * Get the site ID.
	 *
	 * @return int The site ID.
	 */
	public function get_site_id() {
		return \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Get the key.
	 *
	 * @return string The key.
	 */
	public function get_key() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// phpcs:ignore ImportDetection.Imports.RequireImports.Symbol
			return defined( 'EARN_JWT_SIGNING_KEY' ) ? EARN_JWT_SIGNING_KEY : false;
		}
		$token = ( new Tokens() )->get_access_token();
		if ( ! isset( $token->secret ) ) {
			return false;
		}
		return $token->secret;
	}

	/**
	 * Returns true if the current authenticated user has a pending subscription to the current site.
	 *
	 * @return bool
	 */
	public function is_current_user_pending_subscriber(): bool {

		return self::BLOG_SUB_PENDING === $this->get_token_property( 'blog_sub' );
	}
}
