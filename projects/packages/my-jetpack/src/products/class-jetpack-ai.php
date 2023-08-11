<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Jetpack AI product
 */
class Jetpack_Ai extends Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'jetpack-ai';

	/**
	 * Get the Product info for the API
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_info() {
		// Call parent method to get the default info.
		$info = parent::get_info();

		// Populate the product with the feature data.
		$info['ai-assistant-feature'] = self::get_ai_assistant_feature();

		return $info;
	}

	/**
	 * Get the plugin slug - ovewrite it and return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_slug() {
		return self::JETPACK_PLUGIN_SLUG;
	}

	/**
	 * Get the plugin filename - ovewrite it and return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_filename() {
		return self::JETPACK_PLUGIN_FILENAME;
	}

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Jetpack AI', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack AI', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Experimental tool to add AI to your editor', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Jetpack AI Assistant brings the power of AI right into your WordPress editor, letting your content creation soar to new heights.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array CRM features list
	 */
	public static function get_features() {
		return array(
			__( 'Artificial intelligence chatbot', 'jetpack-my-jetpack' ),
			__( 'Generate text, tables, lists, and forms', 'jetpack-my-jetpack' ),
			__( 'Refine the tone and content to your liking', 'jetpack-my-jetpack' ),
			__( 'Get feedback about your post', 'jetpack-my-jetpack' ),
			__( 'Seamless WordPress editor Integration', 'jetpack-my-jetpack' ),
		);
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
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_ai_monthly';
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if (
					0 === strpos( $purchase->product_slug, static::get_wpcom_product_slug() )
				) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '';
	}

	/**
	 * Get data about the AI Assistant feature
	 *
	 * @return array
	 */
	public static function get_ai_assistant_feature() {
		// Bail early if the plugin is not active.
		if ( ! self::is_jetpack_plugin_installed() ) {
			return array();
		}

		// Check if the global constant is defined.
		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return array();
		}

		// Check if class exists. If not, try to require it once.
		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			$class_file_path = JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';

			// Check whether the file exists
			if ( ! file_exists( $class_file_path ) ) {
				return array();
			}

			require_once $class_file_path;
		}

		return \Jetpack_AI_Helper::get_ai_assistance_feature();
	}
}
