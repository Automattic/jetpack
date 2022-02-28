<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Redirect;
use Jetpack;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Backup product
 */
class Backup extends Hybrid_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'backup';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-backup/jetpack-backup.php',
		'backup/jetpack-backup.php',
		'jetpack-backup-dev/jetpack-backup.php',
	);

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-backup';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Backup', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Backup', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Save every change', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Never lose a word, image, page, or time worrying about your site with automated backups & one-click restores.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Backup features list
	 */
	public static function get_features() {
		return array(
			_x( 'Real-time cloud backups', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( '10GB of backup storage', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( '30-day archive & activity log', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( 'One-click restores', 'Backup Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_backup_t1_yearly';
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => static::get_wpcom_product_slug(),
				'discount'           => 50, // hardcoded - it could be overwritten by the wpcom product.
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);
	}

	/**
	 * Hits the wpcom api to check rewind status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_state_from_wpcom() {
		static $status = null;

		if ( ! is_null( $status ) ) {
			return $status;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/rewind', $site_id ) . '?force=wpcom', '2', array(), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'rewind_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$rewind_data = static::get_state_from_wpcom();
		if ( is_wp_error( $rewind_data ) ) {
			return false;
		}
		return is_object( $rewind_data ) && isset( $rewind_data->state ) && 'unavailable' !== $rewind_data->state;
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return boolean|array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'security' );
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		if ( ( new Connection_Manager() )->is_user_connected() ) {
			return ''; // Continue on the purchase flow or stay in My Jetpack page.
		} else {
			// If the user is not connected, the Backup purchase flow will not work properly. Let's redirect the user to a place where they can buy the plan from.
			if ( static::is_plugin_active() ) {
				return admin_url( 'admin.php?page=jetpack-backup' );
			} elseif ( static::is_jetpack_plugin_active() ) {
				return Jetpack::admin_url();
			}
		}
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		if ( static::is_plugin_active() ) {
			return admin_url( 'admin.php?page=jetpack-backup' );
		} elseif ( static::is_jetpack_plugin_active() ) {
			return Redirect::get_url( 'my-jetpack-manage-backup' );
		}
	}
}
