<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;

/**
 * Class responsible for handling the CRM product
 */
class Backup extends Hybrid_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'backup';

	/**
	 * The filename (id) of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_filename = 'jetpack-backup/jetpack-backup.php';

	/**
	 * The slug of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
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
		return __( 'Real-time backups save every change and one-click restores get you back online quickly.', 'jetpack-my-jetpack' );
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

}
