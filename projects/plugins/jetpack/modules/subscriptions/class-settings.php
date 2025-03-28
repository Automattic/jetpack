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
	 * We currently only automatically enabled this for sites that were connected to WordPress.com after 2025-03-28.
	 *
	 * @return bool Whether Featured Images in emails should be automatically enabled.
	 */
	public static function should_auto_enable_featured_images_emails() {
		if ( ! ( new Manager() )->is_connected() ) {
			return false;
		}

		$site_creation_date = get_transient( 'jetpack_subscriptions_site_creation' );
		if ( false !== $site_creation_date ) {
			$site_id       = Manager::get_site_id();
			$site_response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d', $site_id ) . '?force=wpcom&options=created_at',
				'1.1'
			);

			if ( is_wp_error( $site_response ) ) {
				return false;
			}

			$site_data = json_decode( wp_remote_retrieve_body( $site_response ) );

			if ( ! $site_data || ! isset( $site_data->options->created_at ) ) {
				return false;
			}

			$site_creation_date = new DateTimeImmutable(
				$site_data->options->created_at,
				wp_timezone()
			);

			set_transient( 'jetpack_subscriptions_site_creation', $site_creation_date, DAY_IN_SECONDS );
		}

		// Check if the site was created after 2025-03-28.
		return $site_creation_date > new DateTimeImmutable( '2025-03-28 00:00:00.000', wp_timezone() );
	}
}
