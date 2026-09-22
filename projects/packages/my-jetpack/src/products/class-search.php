<?php
/**
 * Search product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Search\Module_Control as Search_Module_Control;
use Automattic\Jetpack\Status\Host;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Search product
 */
class Search extends Hybrid_Product {
	/**
	 * Fallback starting price (USD, billed yearly) for the entry record tier, used when
	 * the WPCOM pricing fetch fails so the dashboard still shows a price, not "$0".
	 *
	 * @var float
	 */
	const FALLBACK_STARTING_PRICE_USD = 100;

	/**
	 * Search "new pricing" version identifier (introduced 202208).
	 *
	 * Intentionally duplicated from Automattic\Jetpack\Search\Plan::JETPACK_SEARCH_NEW_PRICING_VERSION
	 * rather than referencing that class. My Jetpack is bundled into standalone plugins (e.g. Jetpack
	 * Boost) that do NOT ship the jetpack-search package, so referencing Search\Plan here fatals with
	 * "Class not found" the moment this product builds its pricing data (introduced by PR #48892).
	 *
	 * @var string
	 */
	const SEARCH_NEW_PRICING_VERSION = '202208';

	/**
	 * Accepted `source` values for {@see self::activate_free_product()}. Mirrors the enum the
	 * WordPress.com endpoint validates against; anything else is dropped rather than rejected.
	 *
	 * @var string[]
	 */
	const ACTIVATE_FREE_SOURCES = array( 'search-dashboard', 'my-jetpack', 'wp-admin', 'calypso' );

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'search';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'search';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-search';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'performance';

	/**
	 * Search has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Whether this product requires a plan to work at all
	 *
	 * @var bool
	 */
	public static $requires_plan = true;

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-search/jetpack-search.php',
		'search/jetpack-search.php',
		'jetpack-search-dev/jetpack-search.php',
	);

	/**
	 * Search only requires site connection
	 *
	 * @var boolean
	 */
	public static $requires_user_connection = true;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'search';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Search';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Search';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Instantly deliver the most relevant results to your visitors.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Help your site visitors find answers instantly so they keep reading and buying. Great for sites with a lot of content.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			__( 'Instant search and indexing', 'jetpack-my-jetpack' ),
			__( 'Powerful filtering', 'jetpack-my-jetpack' ),
			__( 'Supports 38 languages', 'jetpack-my-jetpack' ),
			__( 'Spelling correction', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		// Basic pricing info.
		$pricing = array_merge(
			array(
				'available'               => true,
				'trial_available'         => static::has_trial_support(),
				'wpcom_product_slug'      => static::get_wpcom_product_slug(),
				'wpcom_free_product_slug' => static::get_wpcom_free_product_slug(),
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);

		$record_count   = intval( Search_Stats::estimate_count() );
		$search_pricing = static::get_pricing_from_wpcom( $record_count );

		if ( is_wp_error( $search_pricing ) ) {
			// Default to the current pricing experience when the WPCOM fetch fails so the
			// dashboard degrades to the production default, not the legacy single-card view.
			$pricing['pricing_version'] = self::SEARCH_NEW_PRICING_VERSION;

			// If the generic product pricing was also unavailable, fall back to a USD
			// starting price so the pricing grid renders a price instead of "$0".
			if ( empty( $pricing['full_price'] ) ) {
				$pricing['currency_code']  = 'USD';
				$pricing['full_price']     = self::FALLBACK_STARTING_PRICE_USD;
				$pricing['discount_price'] = self::FALLBACK_STARTING_PRICE_USD;
			}

			return $pricing;
		}

		$pricing['estimated_record_count'] = $record_count;

		return array_merge( $pricing, $search_pricing );
	}

	/**
	 * Get the URL the user is taken after purchasing the product through the checkout
	 *
	 * @return ?string
	 */
	public static function get_post_checkout_url() {
		return self::get_manage_url();
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_search';
	}

	/**
	 * Get the WPCOM free product slug
	 *
	 * @return ?string
	 */
	public static function get_wpcom_free_product_slug() {
		return 'jetpack_search_free';
	}

	/**
	 * Returns true if the new_pricing_202208 is set to not empty in URL for testing purpose, or it's active.
	 */
	public static function is_new_pricing_202208() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		if ( isset( $_GET['new_pricing_202208'] ) && $_GET['new_pricing_202208'] ) {
			return true;
		}

		$record_count   = intval( Search_Stats::estimate_count() );
		$search_pricing = static::get_pricing_from_wpcom( $record_count );
		if ( is_wp_error( $search_pricing ) ) {
			// Default to the current pricing experience when the WPCOM fetch fails.
			return true;
		}

		return self::SEARCH_NEW_PRICING_VERSION === $search_pricing['pricing_version'];
	}

	/**
	 * Override status to `needs_activation` when status is `needs_plan`.
	 */
	public static function get_status() {
		$status = parent::get_status();
		return $status;
	}

	/**
	 * Use centralized Search pricing API.
	 *
	 * The function is also used by the search package, as a result it could be called before site connection - i.e. blog token might not be available.
	 *
	 * @param int $record_count Record count to estimate pricing.
	 *
	 * @return array|WP_Error
	 */
	public static function get_pricing_from_wpcom( $record_count ) {
		static $pricings = array();
		$connection      = new Connection_Manager();
		$blog_id         = \Jetpack_Options::get_option( 'id' );

		if ( isset( $pricings[ $record_count ] ) ) {
			return $pricings[ $record_count ];
		}

		// If the site is connected, request pricing with the blog token
		if ( $blog_id ) {
			$endpoint = sprintf( '/jetpack-search/pricing?record_count=%1$d&locale=%2$s', $record_count, get_user_locale() );

			// If available in the user data, set the user's currency as one of the params
			if ( $connection->is_user_connected() ) {
				$user_details = $connection->get_connected_user_data();
				if ( ! empty( $user_details['user_currency'] ) && $user_details['user_currency'] !== 'USD' ) {
					$endpoint .= sprintf( '&currency=%s', $user_details['user_currency'] );
				}
			}

			$response = Client::wpcom_json_api_request_as_blog(
				$endpoint,
				'2',
				array( 'timeout' => 5 ),
				null,
				'wpcom'
			);
		} else {
			$response = wp_remote_get(
				sprintf( Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) . '/wpcom/v2/jetpack-search/pricing?record_count=%1$d&locale=%2$s', $record_count, get_user_locale() ),
				array( 'timeout' => 5 )
			);
		}

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			// Cache the failure too: get_pricing_for_ui() reaches this twice per request
			// (once via has_trial_support(), once directly), and each miss is a 5s timeout.
			$pricings[ $record_count ] = new WP_Error( 'search_pricing_fetch_failed' );
			return $pricings[ $record_count ];
		}

		$body                      = wp_remote_retrieve_body( $response );
		$pricings[ $record_count ] = json_decode( $body, true );
		return $pricings[ $record_count ];
	}

	/**
	 * Checks whether the product supports trial or not
	 *
	 * Returns true if it supports. Return false otherwise.
	 *
	 * Free products will always return false.
	 *
	 * @return boolean
	 */
	public static function has_trial_support() {
		return static::is_new_pricing_202208();
	}

	/**
	 * Get the product-slugs of the paid plans for this product (not including bundles)
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_search',
			'jetpack_search_monthly',
			'jetpack_search_bi_yearly',
		);
	}

	/**
	 * Checks if the site purchases contain a free search plan
	 *
	 * @return bool
	 */
	public static function has_free_plan_for_product() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if ( str_contains( $purchase->product_slug, 'jetpack_search_free' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Grant this site the free Search product without sending the user through a $0 checkout.
	 *
	 * Lives here rather than in the jetpack-search package because My Jetpack renders the
	 * Search card in plugins that do not ship that package, and because this replaces
	 * `get_wpcom_free_product_slug()`, which this class already owns.
	 *
	 * @since $$next-version$$
	 *
	 * @param string|null $source One of self::ACTIVATE_FREE_SOURCES, for WordPress.com reporting.
	 * @return array|WP_Error Decoded response body on success; on failure a WP_Error whose data
	 *                        carries `checkout_fallback` — true when the $0 checkout could still
	 *                        succeed, false when it would refuse the product too.
	 */
	public static function activate_free_product( $source = null ) {
		/*
		 * A Simple site has no Jetpack connection to sign the request with, and buys the
		 * product from within WordPress.com anyway.
		 */
		if ( ( new Host() )->is_wpcom_simple() ) {
			return self::activation_error(
				'not_supported_on_wpcom_simple',
				__( 'Jetpack Search Free is activated through WordPress.com on this site.', 'jetpack-my-jetpack' ),
				400,
				true
			);
		}

		$blog_id = \Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return self::activation_error(
				'site_not_registered',
				__( 'Connect your site to WordPress.com to activate Jetpack Search.', 'jetpack-my-jetpack' ),
				403,
				true
			);
		}

		/*
		 * Checked before the request because the subscription needs a WordPress.com user to own
		 * it and a blog token names nobody. Checkout signs the user in itself, so this is a
		 * fallback rather than a failure.
		 */
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return self::activation_error(
				'no_connected_user',
				__( 'Activating Jetpack Search Free requires a connected WordPress.com user.', 'jetpack-my-jetpack' ),
				403,
				true
			);
		}

		$body = array();
		if ( in_array( $source, self::ACTIVATE_FREE_SOURCES, true ) ) {
			$body['source'] = $source;
		}

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/jetpack-search/activate-free',
			'2',
			array( 'method' => 'POST' ),
			$body,
			'wpcom'
		);

		// Never reached WordPress.com, so checkout may still work.
		if ( is_wp_error( $response ) ) {
			return self::activation_error(
				'jetpack_search_free_activation_failed',
				$response->get_error_message(),
				500,
				true
			);
		}

		$status = wp_remote_retrieve_response_code( $response );
		$result = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status || ! is_array( $result ) || empty( $result['success'] ) ) {
			return self::wpcom_activation_error( $result, $status );
		}

		self::sync_local_state_after_free_activation();

		return $result;
	}

	/**
	 * Rebuild a refusal from WordPress.com as a local WP_Error.
	 *
	 * `checkout_fallback` defaults to false: the endpoint sets it on every error it raises, so
	 * a missing flag means an unrecognized response, and sending the user to a checkout that
	 * may also refuse them is worse than showing the error.
	 *
	 * @param array|null $result Decoded response body, when it parsed.
	 * @param int        $status HTTP status code.
	 * @return WP_Error
	 */
	private static function wpcom_activation_error( $result, $status ) {
		$data = isset( $result['data'] ) && is_array( $result['data'] ) ? $result['data'] : array();

		return self::activation_error(
			$result['code'] ?? 'jetpack_search_free_activation_failed',
			$result['message'] ?? __( 'Jetpack Search Free could not be activated for this site.', 'jetpack-my-jetpack' ),
			isset( $data['status'] ) ? (int) $data['status'] : (int) $status,
			! empty( $data['checkout_fallback'] ),
			$data
		);
	}

	/**
	 * Build a refusal carrying the `checkout_fallback` flag the UI branches on.
	 *
	 * @param string $code              Machine readable error code.
	 * @param string $message           Human readable message.
	 * @param int    $status            HTTP status.
	 * @param bool   $checkout_fallback Whether the caller should fall back to checkout.
	 * @param array  $extra_data        Extra data from WordPress.com to preserve.
	 * @return WP_Error
	 */
	private static function activation_error( $code, $message, $status, $checkout_fallback, $extra_data = array() ) {
		return new WP_Error(
			$code,
			$message,
			array_merge(
				$extra_data,
				array(
					'status'            => $status,
					'checkout_fallback' => (bool) $checkout_fallback,
				)
			)
		);
	}

	/**
	 * Bring this site's Search state in line after WordPress.com grants the product.
	 *
	 * WordPress.com configures Search over a separate request to this site, so the plan option
	 * cached in this process predates it — and on the `already_entitled` path, where no
	 * subscription is created, that request never happens at all. Both calls are idempotent.
	 *
	 * The search experience is deliberately not set here: WordPress.com owns that default, and
	 * a second copy of it would drift.
	 */
	private static function sync_local_state_after_free_activation() {
		if ( ! class_exists( 'Automattic\Jetpack\Search\Plan' ) ) {
			return;
		}

		( new \Automattic\Jetpack\Search\Plan() )->get_plan_info_from_wpcom();

		if ( class_exists( 'Automattic\Jetpack\Search\Module_Control' ) ) {
			( new Search_Module_Control() )->activate();
		}
	}

	/**
	 * Activates the product. Try to enable instant search after the Search module was enabled.
	 *
	 * @param bool|WP_Error $product_activation Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return bool|WP_Error
	 */
	public static function do_product_specific_activation( $product_activation ) {
		$product_activation = parent::do_product_specific_activation( $product_activation );
		if ( is_wp_error( $product_activation ) ) {
			return $product_activation;
		}

		if ( class_exists( 'Automattic\Jetpack\Search\Module_Control' ) ) {
			( new Search_Module_Control() )->enable_instant_search();
		}

		// we don't want to change the success of the activation if we fail to activate instant search. That's not mandatory.
		return $product_activation;
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return ''; // stay in My Jetpack page or continue the purchase flow if needed.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-search' );
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return boolean|array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'complete' );
	}
}
