<?php
/**
 * The Subscriptions settings.
 *
 * This is a class that contains helper functions for the Subscriptions settings module.
 *
 * @package automattic/jetpack-subscriptions
 */

namespace Automattic\Jetpack\Modules\Subscriptions;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use DateTimeImmutable;

/**
 * Class Settings
 */
class Settings {
	/**
	 * The default reply-to option.
	 *
	 * @var string
	 */
	public static $default_reply_to = 'comment';

	/**
	 * Validate the reply-to option.
	 *
	 * @param string $reply_to The reply-to option to validate.
	 * @return bool Whether the reply-to option is valid or not.
	 */
	public static function is_valid_reply_to( $reply_to ) {
		$valid_values = array( 'author', 'no-reply', 'comment' );
		if ( in_array( $reply_to, $valid_values, true ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Check if Featured Images in emails should be automatically enabled.
	 * We currently only automatically enabled this for sites that were created on or connected to WordPress.com after 2025-03-28.
	 *
	 * @return bool Whether Featured Images in emails should be automatically enabled.
	 */
	public static function should_auto_enable_featured_images_emails() {
		$creation_date = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? self::get_wpcom_site_creation_date() : self::get_cache_site_creation_date();

		// Check if the site was created after 2025-03-28.
		return $creation_date > new DateTimeImmutable( '2025-03-28 00:00:00.000', wp_timezone() );
	}

	/**
	 * Get the default setting for wpcom_featured_image_in_email.
	 *
	 * @return int 1 if featured images should be enabled by default, 0 otherwise.
	 */
	public static function get_wpcom_featured_image_in_email_default() {
		$res = self::should_auto_enable_featured_images_emails();
		l( $res );
		return (int) $res;
	}

	/**
	 * Get the WordPress.com site creation date.
	 *
	 * @return DateTimeImmutable The site creation date or default date if not available.
	 */
	protected static function get_wpcom_site_creation_date() {
		$default_date = new DateTimeImmutable( '0000-00-00 00:00:00.000', wp_timezone() );
		$blog_id      = get_current_blog_id();

		if ( ! function_exists( 'get_blog_details' ) || ! $blog_id ) {
			return $default_date;
		}

		$details = get_blog_details( $blog_id );
		if ( ! $details || ! isset( $details->registered ) ) {
			return $default_date;
		}

		return new DateTimeImmutable( $details->registered, wp_timezone() );
	}

	/**
	 * Get the Jetpack cache site's creation date.
	 *
	 * @return DateTimeImmutable The site creation date or default date if not available.
	 */
	protected static function get_cache_site_creation_date() {
		$default_date = new DateTimeImmutable( '0000-00-00 00:00:00.000', wp_timezone() );

		if ( ! ( new Manager() )->is_connected() ) {
			return $default_date;
		}

		$site_creation_date = get_transient( 'jetpack_subscriptions_site_creation' );
		if ( false === $site_creation_date ) {
			$site_id       = Manager::get_site_id();
			$site_response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d', $site_id ) . '?force=wpcom&options=created_at',
				'1.1'
			);

			if ( is_wp_error( $site_response ) ) {
				return $default_date;
			}

			$site_data = json_decode( wp_remote_retrieve_body( $site_response ) );

			if ( ! $site_data || ! isset( $site_data->options->created_at ) ) {
				return $default_date;
			}

			$site_creation_date = new DateTimeImmutable(
				$site_data->options->created_at,
				wp_timezone()
			);

			set_transient( 'jetpack_subscriptions_site_creation', $site_creation_date, DAY_IN_SECONDS );
		}

		return $site_creation_date;
	}
}
