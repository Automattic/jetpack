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
	 * Cutoff date for automatically enabling featured images in emails.
	 * Sites created/connected after this date get the new default (true/1).
	 *
	 * @var string
	 */
	public const FEATURED_IMAGE_EMAIL_CUTOFF_DATE = '2025-04-01 00:00:00.000';

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
	 * Get the default setting value for wpcom_featured_image_in_email.
	 *
	 * This method determines the site environment (WPCOM vs Jetpack),
	 * retrieves the appropriate site creation date, and compares it
	 * against a cutoff date to determine the default setting.
	 *
	 * @return int 1 if featured images should be enabled by default, 0 otherwise.
	 */
	public static function get_wpcom_featured_image_in_email_default() {
		$creation_date = null;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$creation_date = self::get_wpcom_site_creation_date();
		} else {
			$manager       = new Manager();
			$creation_date = self::get_jetpack_cache_site_creation_date( $manager );
		}

		// If $creation_date remained null for some reason, fallback to the default value.
		if ( ! $creation_date instanceof DateTimeImmutable ) {
			return 0;
		}

		return (int) self::is_site_eligible_for_new_default( $creation_date );
	}

	/**
	 * Checks if a site, based on its creation date, qualifies for the new default.
	 *
	 * @param DateTimeImmutable $creation_date The site's creation date.
	 * @return bool True if the site date is after the cutoff, false otherwise.
	 */
	public static function is_site_eligible_for_new_default( DateTimeImmutable $creation_date ) {

		$cutoff_date = new DateTimeImmutable(
			self::FEATURED_IMAGE_EMAIL_CUTOFF_DATE,
			wp_timezone()
		);

		return $creation_date > $cutoff_date;
	}

	/**
	 * Get the WordPress.com site creation date.
	 *
	 * @return DateTimeImmutable The site creation date or default fallback date.
	 */
	public static function get_wpcom_site_creation_date() {
		$default_date = new DateTimeImmutable( '0000-00-00 00:00:00.000', wp_timezone() );
		$blog_id      = get_current_blog_id();

		if ( ! function_exists( 'get_blog_details' ) || ! $blog_id ) {
			return $default_date;
		}

		$details = get_blog_details( $blog_id );
		if ( ! $details || empty( $details->registered ) ) {
			return $default_date;
		}

		return new DateTimeImmutable( $details->registered, wp_timezone() );
	}

	/**
	 * Get the Jetpack site's creation date (fetched via API).
	 * Requires an instantiated Connection_Manager.
	 *
	 * @param Manager $manager Instantiated Connection Manager.
	 * @return DateTimeImmutable The site creation date or default fallback date.
	 */
	public static function get_jetpack_cache_site_creation_date( Manager $manager ) {
		$default_date = new DateTimeImmutable( '0000-00-00 00:00:00.000', wp_timezone() );

		if ( ! $manager->is_connected() ) {
			return $default_date;
		}

		$transient_key        = 'jetpack_subscriptions_site_creation';
		$cached_creation_date = get_transient( $transient_key );

		if ( false !== $cached_creation_date ) {
			return $cached_creation_date;
		}

		$site_id = Manager::get_site_id();

		if ( is_wp_error( $site_id ) || ! $site_id ) {
			return $default_date;
		}

		$site_response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d', $site_id ) . '?force=wpcom&options=created_at',
			'1.1'
		);

		if ( is_wp_error( $site_response ) ) {
			return $default_date;
		}

		$body      = wp_remote_retrieve_body( $site_response );
		$site_data = json_decode( $body );

		if ( ! $site_data || ! isset( $site_data->options->created_at ) ) {
			return $default_date;
		}

		$site_creation_date = new DateTimeImmutable(
			$site_data->options->created_at,
			wp_timezone()
		);

		set_transient( $transient_key, $site_creation_date, DAY_IN_SECONDS );

		return $site_creation_date;
	}
}
