<?php
/**
 * A collection of helper functions used in the SSO module.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Subscriptions;

use Blog_Subscription;
use Blog_Subscriber;
use Jetpack_IXR_Client;

/**
 * A collection of helper functions used in the SSO module.
 *
 * @since 8.6.0
 */
class Helpers {
	/**
	 * Is this script running in the wordpress.com environment?
	 *
	 * @return bool
	 */
	public static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}

	/**
	 * Is this script running in a self-hosted environment?
	 *
	 * @return bool
	 */
	public static function is_jetpack() {
		return ! self::is_wpcom();
	}

	/**
	 * Get the Subscriptions name,
	 * based on the platform we're on.
	 *
	 * @return string
	 */
	public static function widget_classname() {
		if ( self::is_wpcom() ) {
			return 'Automattic\Jetpack\Subscriptions\Widget';
		} else {
			return 'Jetpack_Subscriptions_Widget';
		}
	}

	/**
	 * Determines if the current user is subscribed to the blog.
	 *
	 * @return bool Is the person already subscribed.
	 */
	public static function is_current_user_subscribed() {
		$subscribed = isset( $_GET['subscribe'] ) && 'success' === $_GET['subscribe']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( self::is_wpcom() && class_exists( 'Blog_Subscription' ) && class_exists( 'Blog_Subscriber' ) ) {
			$subscribed = is_user_logged_in() && Blog_Subscription::is_subscribed( new Blog_Subscriber() );
		}

		return $subscribed;
	}

	/**
	 * Determine the amount of folks currently subscribed to the blog.
	 *
	 * @return int|array
	 */
	public static function fetch_subscriber_count() {
		$subs_count = 0;

		if ( self::is_jetpack() ) {
			$subs_count = get_transient( 'wpcom_subscribers_total' );
			if ( false === $subs_count || 'failed' === $subs_count['status'] ) {
				$xml = new Jetpack_IXR_Client( array( 'user_id' => JETPACK_MASTER_USER ) );

				$xml->query( 'jetpack.fetchSubscriberCount' );

				/*
				 * if we get an error from .com,
				 * set the status to failed
				 * so that we will try again next time the data is requested
				 */
				if ( $xml->isError() ) {
					$subs_count = array(
						'status'  => 'failed',
						'code'    => $xml->getErrorCode(),
						'message' => $xml->getErrorMessage(),
						'value'   => ( isset( $subs_count['value'] ) ) ? $subs_count['value'] : 0,
					);
				} else {
					$subs_count = array(
						'status' => 'success',
						'value'  => $xml->getResponse(),
					);
				}

				// try to cache the result for at least 1 hour.
				set_transient( 'wpcom_subscribers_total', $subs_count, 3600 );
			}
		}

		if ( self::is_wpcom() && function_exists( 'wpcom_reach_total_for_blog' ) ) {
			$subs_count = wpcom_reach_total_for_blog();
		}

		return $subs_count;
	}

	/**
	 * Used to determine if there is a valid status slug within the wordpress.com environment.
	 *
	 * @return bool
	 */
	public static function has_status_message() {
		return isset( $_GET['blogsub'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			&& in_array(
				$_GET['blogsub'], // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				array(
					'confirming',
					'blocked',
					'flooded',
					'spammed',
					'subscribed',
					'pending',
					'confirmed',
				),
				true
			);
	}
}
