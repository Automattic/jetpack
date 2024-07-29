<?php
/**
 * Jetpack Newsletter
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_jetpack\Products;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Jetpack Newsletter (subscriptions) module
 */
class Newsletter extends Module_Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'newsletter';

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'subscriptions';

	/**
	 * The Plugin slug associated with Newsletter
	 *
	 * @var string|null
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with Newsletter
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * Newsletter requires user connection
	 *
	 * @var bool
	 */
	public static $requires_user_connection = true;

	/**
	 * Newsletter does not have a standalone plugin yet
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = false;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Newsletter';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Newsletter';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Deliver your content with ease.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Write and share your content, get more subscribers, and monetize your writing.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Newsletter features list
	 */
	public static function get_features() {
		return array(
			__( 'Instant blog‑to‑newsletter delivery', 'jetpack-my-jetpack' ),
			__( 'Effortlessly reach your subscribers with fresh content', 'jetpack-my-jetpack' ),
			__( 'Earn money through your Newsletter', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
	 * Only showing the pricing details for the commercial product
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'available' => true,
			'is_free'   => true,
		);
	}

	/**
	 * Gets the 'status' of the Newsletter module
	 *
	 * @return string
	 */
	public static function get_status() {
		$status = parent::get_status();
		if ( Products::STATUS_MODULE_DISABLED === $status && ! Initializer::is_registered() ) {
			// If the site has never been connected before, show the "Learn more" CTA.
			// It should point to the settings page where the user can manage Newsletter
			$status = Products::STATUS_NEEDS_PURCHASE_OR_FREE;
		}
		return $status;
	}

	/**
	 * Checks whether the product can be upgraded to a different product.
	 * Newsletter is not upgradable.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		return false;
	}

	/**
	 * Checks if the site has a paid plan that supports this product
	 *
	 * @return boolean
	 */
	public static function has_paid_plan_for_product() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				// Newsletter is also part of Creator and Complete plans.
				if ( strpos( $purchase->product_slug, 'jetpack_complete' ) !== false || str_starts_with( $purchase->product_slug, 'jetpack_creator' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Checks whether the product supports trial or not.
	 * Since Jetpack Newsletter has a free product, it "supports" a trial.
	 *
	 * @return boolean
	 */
	public static function has_trial_support() {
		return true;
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack#/settings?term=newsletter' );
	}
}
