<?php
/**
 * Class for the Jetpack partner coupon logic.
 *
 * @package automattic/jetpack-partner
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client as Connection_Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_Partner_Coupon
 *
 * @since $$next_version$$
 */
class Partner_Coupon {

	/**
	 * Name of the Jetpack_Option coupon option.
	 *
	 * @var string
	 */
	public static $coupon_option = 'partner_coupon';

	/**
	 * Name of the Jetpack_Option added option.
	 *
	 * @var string
	 */
	public static $added_option = 'partner_coupon_added';

	/**
	 * Name of "last availability check" transient.
	 *
	 * @var string
	 */
	public static $last_check_option = 'jetpack_partner_coupon_last_check';

	/**
	 * Jetpack_Partner_Coupon
	 *
	 * @var Partner_Coupon|null
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
	 * Get singleton instance of class.
	 *
	 * @return Partner_Coupon
	 */
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Partner_Coupon();
		}

		return self::$instance;
	}

	/**
	 * Register hooks to catch and purge coupon.
	 *
	 * @param string $plugin_slug The plugin slug to differentiate between Jetpack connections.
	 * @param string $redirect_location The location we should redirect to after catching the coupon.
	 */
	public static function register_coupon_admin_hooks( $plugin_slug, $redirect_location ) {
		$instance = self::get_instance();

		add_action( 'admin_init', array( $instance, 'maybe_purge_coupon' ) );

		// We have to use an anonymous function, so we can pass along relevant information
		// and not have to hardcode values for a single plugin.
		// This open up the opportunity for e.g. the "all-in-one" and backup plugins
		// to both implement partner coupon logic.
		add_action(
			'admin_init',
			function () use ( $plugin_slug, $redirect_location, $instance ) {
				$instance->catch_coupon( $plugin_slug, $redirect_location );
			}
		);
	}

	/**
	 * Catch partner coupon and redirect to claim component.
	 *
	 * @param string $plugin_slug The plugin slug to differentiate between Jetpack connections.
	 * @param string $redirect_location The location we should redirect to after catching the coupon.
	 */
	public function catch_coupon( $plugin_slug, $redirect_location ) {
		// Accept and store a partner coupon if present, and redirect to Jetpack connection screen.
		$partner_coupon = isset( $_GET['jetpack-partner-coupon'] ) ? sanitize_text_field( $_GET['jetpack-partner-coupon'] ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $partner_coupon ) {
			Jetpack_Options::update_options(
				array(
					self::$coupon_option => $partner_coupon,
					self::$added_option  => time(),
				)
			);

			$connection = new Connection_Manager( $plugin_slug );
			if ( $connection->is_connected() ) {
				$redirect_location = add_query_arg( array( 'showCouponRedemption' => 1 ), $redirect_location );
				wp_safe_redirect( $redirect_location );
			} else {
				wp_safe_redirect( $redirect_location );
			}
		}
	}

	/**
	 * Purge partner coupon.
	 *
	 * We try to remotely check if a coupon looks valid. We also automatically purge
	 * partner coupons after a certain amount of time to prevent unnecessary look-ups
	 * and/or promoting a product for months or years in the future due to unknown
	 * errors.
	 */
	public function maybe_purge_coupon() {
		// Only run coupon checks on Jetpack admin pages.
		// The "admin-ui" package is responsible for registering the Jetpack admin
		// page for all Jetpack plugins and has hardcoded the settings page to be
		// "jetpack", so we shouldn't need to allow for dynamic/custom values.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['page'] ) || 'jetpack' !== $_GET['page'] ) {
			return;
		}

		if ( $this->maybe_purge_coupon_by_added_date() ) {
			return;
		}

		// Limit checks to happen every minute instead of on all page requests.
		if ( get_transient( self::$last_check_option ) ) {
			return;
		}

		set_transient( self::$last_check_option, true, MINUTE_IN_SECONDS );

		$this->maybe_purge_coupon_by_availability_check();
	}

	/**
	 * Purge coupon based on local added date.
	 *
	 * We automatically remove the coupon after a month to "self-heal" if
	 * something in the claim process has broken with the site.
	 *
	 * @return bool Return whether we should skip further purge checks.
	 */
	protected function maybe_purge_coupon_by_added_date() {
		$date = Jetpack_Options::get_option( self::$added_option, '' );

		if ( empty( $date ) ) {
			return true;
		}

		$expire_date = strtotime( '+30 days', $date );
		$today       = time();

		if ( $today >= $expire_date ) {
			$this->delete_coupon_data();

			return true;
		}

		return false;
	}

	/**
	 * Purge coupon based on availability check.
	 *
	 * @param string|null $connection_client The connection client to remotely look up availability.
	 * @return bool Return whether we deleted coupon data.
	 */
	protected function maybe_purge_coupon_by_availability_check( $connection_client = null ) {
		// Allow for client dependency injection to allow for mock client during unit testing.
		if (
			empty( $connection_client ) ||
			! class_exists( $connection_client ) ||
			! method_exists( $connection_client, 'wpcom_json_api_request_as_blog' )
		) {
			$connection_client = Connection_Client::class;
		}

		$jetpack_id = Jetpack_Options::get_option( 'id', false );
		if ( ! $jetpack_id ) {
			return false;
		}

		$coupon   = self::get_coupon();
		$response = $connection_client::wpcom_json_api_request_as_blog(
			sprintf(
				'/sites/%d/jetpack-partner/coupon/v1/site/coupon?coupon_code=%s',
				$jetpack_id,
				$coupon['coupon_code']
			),
			2,
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if (
			200 === wp_remote_retrieve_response_code( $response ) &&
			isset( $body['available'] ) &&
			false === $body['available']
		) {
			$this->delete_coupon_data();

			return true;
		}

		return false;
	}

	/**
	 * Delete all coupon data.
	 */
	protected function delete_coupon_data() {
		Jetpack_Options::delete_option(
			array(
				self::$coupon_option,
				self::$added_option,
			)
		);

		Jetpack_Options::delete_raw_option( self::$last_check_option );
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

		$instance = self::get_instance();
		$partner  = $instance->get_coupon_partner( $coupon_code );

		if ( ! $partner ) {
			return false;
		}

		$preset = $instance->get_coupon_preset( $coupon_code );

		if ( ! $preset ) {
			return false;
		}

		$product = $instance->get_coupon_product( $preset );

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

		/**
		 * Allow for plugins to register supported products.
		 *
		 * @since $$next_version$$
		 *
		 * @param array A list of product details.
		 * @return array
		 */
		$product_details = apply_filters( 'jetpack_partner_coupon_products', array() );
		$product_slug    = $this->get_supported_presets()[ $coupon_preset ];

		foreach ( $product_details as $product ) {
			if ( ! $this->array_keys_exist( array( 'title', 'slug', 'description', 'features' ), $product ) ) {
				continue;
			}

			if ( $product_slug === $product['slug'] ) {
				return $product;
			}
		}

		return false;
	}

	/**
	 * Checks if multiple keys are present in an array.
	 *
	 * @param array $needles The keys we wish to check for.
	 * @param array $haystack The array we want to compare keys against.
	 *
	 * @return bool
	 */
	private function array_keys_exist( $needles, $haystack ) {
		foreach ( $needles as $needle ) {
			if ( ! isset( $haystack[ $needle ] ) ) {
				return false;
			}
		}

		return true;
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
		 * @since $$next_version$$
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
		 * @since $$next_version$$
		 *
		 * @param array $supported_presets A list of supported presets.
		 * @return array
		 */
		return apply_filters( 'jetpack_partner_coupon_supported_presets', self::$supported_presets );
	}

}
