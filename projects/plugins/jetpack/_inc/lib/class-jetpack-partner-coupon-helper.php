<?php
/**
 * Class for the Jetpack partner coupon logic.
 *
 * @package automattic/jetpack
 */

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_Partner_Coupon_Helper
 *
 * @since 10.4.0
 */
class Jetpack_Partner_Coupon_Helper {

	/**
	 * Name of the Jetpack_Option coupon option.
	 *
	 * @var string
	 */
	private static $coupon_option = 'partner_coupon';

	/**
	 * Name of the Jetpack_Option added option.
	 *
	 * @var string
	 */
	private static $added_option = 'partner_coupon_added';

	/**
	 * Jetpack_Partner_Coupon_Helper
	 *
	 * @var Jetpack_Partner_Coupon_Helper|null
	 **/
	private static $instance = null;

	/**
	 * A list of supported partners.
	 *
	 * @var array
	 */
	private static $supported_partners = array(
		'IONOS' => 'IONOS',
	);

	/**
	 * A list of supported presets.
	 *
	 * @var array
	 */
	private static $supported_presets = array(
		'IONA' => 'jetpack_backup_daily',
	);

	/**
	 * Initialize class.
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Partner_Coupon_Helper();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'admin_init', array( $this, 'catch_coupon' ) );
		add_action( 'admin_init', array( $this, 'purge_coupon' ) );
	}

	/**
	 * Catch partner coupon and redirect to claim component.
	 */
	public function catch_coupon() {
		// Accept and store a partner coupon if present, and redirect to Jetpack connection screen.
		$partner_coupon = isset( $_GET['jetpack-partner-coupon'] ) ? sanitize_text_field( $_GET['jetpack-partner-coupon'] ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $partner_coupon ) {
			Jetpack_Options::update_options(
				array(
					self::$coupon_option => $partner_coupon,
					self::$added_option  => gmdate( 'Y-m-d H:i:s' ),
				)
			);

			if ( Jetpack::connection()->is_connected() ) {
				wp_safe_redirect( Jetpack::admin_url( 'showCouponRedemption=1' ) );
			} else {
				wp_safe_redirect( Jetpack::admin_url() );
			}
		}
	}

	/**
	 * Purge partner coupon.
	 *
	 * We automatically purge partner coupons after a certain amount of time to prevent
	 * us from unnecessarily promoting a product for months or years in the future.
	 */
	public function purge_coupon() {
		$date = Jetpack_Options::get_option( self::$added_option, '' );

		if ( empty( $date ) ) {
			return;
		}

		$date        = strtotime( $date );
		$purge_after = strtotime( '+1 month' );

		if ( $date > $purge_after ) {
			Jetpack_Options::delete_option( self::$coupon_option );
			Jetpack_Options::delete_option( self::$added_option );
		}
	}

	/**
	 * Get partner coupon data.
	 *
	 * @return array|bool
	 */
	public static function get_coupon() {
		$coupon_code = Jetpack_Options::get_option( self::$coupon_option, '' );

		if ( ! is_string( $coupon_code ) || empty( $coupon_code ) ) {
			return false;
		}

		$partner = self::$instance->get_coupon_partner( $coupon_code );

		if ( ! $partner ) {
			return false;
		}

		$preset = self::$instance->get_coupon_preset( $coupon_code );

		if ( ! $preset ) {
			return false;
		}

		$product = self::$instance->get_coupon_product( $preset );

		if ( ! $product ) {
			return false;
		}

		return array(
			'coupon_code' => $coupon_code,
			'partner'     => $partner,
			'preset'      => $preset,
			'product'     => $product,
		);
	}

	/**
	 * Get coupon partner.
	 *
	 * @param string $coupon_code Coupon code to go through.
	 * @return array|bool
	 */
	private function get_coupon_partner( $coupon_code ) {
		if ( ! is_string( $coupon_code ) || false === strpos( $coupon_code, '_' ) ) {
			return false;
		}

		$prefix             = strtok( $coupon_code, '_' );
		$supported_partners = $this->get_supported_partners();

		if ( ! isset( $supported_partners[ $prefix ] ) ) {
			return false;
		}

		return array(
			'name'   => $supported_partners[ $prefix ],
			'prefix' => $prefix,
		);
	}

	/**
	 * Get coupon product.
	 *
	 * @param string $coupon_preset The preset we wish to find a product for.
	 * @return array|bool
	 */
	private function get_coupon_product( $coupon_preset ) {
		if ( ! is_string( $coupon_preset ) ) {
			return false;
		}

		$product_details = Jetpack::get_products_for_purchase( true );
		$product_slug    = $this->get_supported_presets()[ $coupon_preset ];

		foreach ( $product_details as $product ) {
			if ( $product_slug === $product['slug'] ) {
				return $product;
			}
		}

		return false;
	}

	/**
	 * Get coupon preset.
	 *
	 * @param string $coupon_code Coupon code to go through.
	 * @return string|bool
	 */
	private function get_coupon_preset( $coupon_code ) {
		if ( ! is_string( $coupon_code ) ) {
			return false;
		}

		$regex   = '/^.*?_(?P<slug>.*?)_.+$/';
		$matches = array();

		if ( ! preg_match( $regex, $coupon_code, $matches ) ) {
			return false;
		}

		return isset( $this->get_supported_presets()[ $matches['slug'] ] ) ? $matches['slug'] : false;
	}

	/**
	 * Get supported partners.
	 *
	 * @return array
	 */
	private function get_supported_partners() {
		/**
		 * Allow external code to add additional supported partners.
		 *
		 * @since 10.4.0
		 *
		 * @param array $supported_partners A list of supported partners.
		 * @return array
		 */
		return apply_filters( 'jetpack_partner_coupon_supported_partners', self::$supported_partners );
	}

	/**
	 * Get supported presets.
	 *
	 * @return array
	 */
	private function get_supported_presets() {
		/**
		 * Allow external code to add additional supported presets.
		 *
		 * @since 10.4.0
		 *
		 * @param array $supported_presets A list of supported presets.
		 * @return array
		 */
		return apply_filters( 'jetpack_partner_coupon_supported_presets', self::$supported_presets );
	}

}
