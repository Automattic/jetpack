<?php
/**
 * VideoPress product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\VideoPress\Stats as VideoPress_Stats;
use WP_Error;
use WP_REST_Response;

/**
 * Class responsible for handling the VideoPress product
 */
class Videopress extends Hybrid_Product {
	private const VIDEOPRESS_STATS_KEY  = 'my-jetpack-videopress-stats';
	private const VIDEOPRESS_PERIOD_KEY = 'my-jetpack-videopress-period';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'videopress';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'videopress';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-videopress';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'performance';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-videopress/jetpack-videopress.php',
		'videopress/jetpack-videopress.php',
		'jetpack-videopress-dev/jetpack-videopress.php',
	);

	/**
	 * Search only requires site connection
	 *
	 * @var boolean
	 */
	public static $requires_user_connection = true;

	/**
	 * VideoPress has a standalone plugin
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
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'videopress';

		/**
		 * Setup VideoPress REST API endpoints
		 *
		 * @return void
		 */
	public static function register_endpoints(): void {
		parent::register_endpoints();
		// Get Jetpack VideoPress data.
		register_rest_route(
			'my-jetpack/v1',
			'/site/videopress/data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_videopress_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks if the user has the correct permissions
	 */
	public static function permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'VideoPress';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack VideoPress';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Powerful and flexible video hosting.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Stunning-quality, ad-free video in the WordPress Editor', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			_x( '1TB of storage', 'VideoPress Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Built into WordPress editor', 'VideoPress Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Ad-free and customizable player', 'VideoPress Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Unlimited users', 'VideoPress Product Feature', 'jetpack-my-jetpack' ),
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
		return 'jetpack_videopress';
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return ''; // stay in My Jetpack page.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		if ( method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'should_initialize_admin_ui' ) && \Automattic\Jetpack\VideoPress\Initializer::should_initialize_admin_ui() ) {
			return \Automattic\Jetpack\VideoPress\Admin_UI::get_admin_page_url();
		} else {
			return admin_url( 'admin.php?page=jetpack#/settings?term=videopress' );
		}
	}

	/**
	 * Get the product-slugs of the paid plans for this product (not including bundles)
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_videopress',
			'jetpack_videopress_monthly',
			'jetpack_videopress_bi_yearly',
		);
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

	/**
	 * Get stats for VideoPress
	 *
	 * @return array|WP_Error
	 */
	private static function get_videopress_stats() {
		$video_count = array_sum( (array) wp_count_attachments( 'video' ) );

		if ( ! class_exists( 'Automattic\Jetpack\VideoPress\Stats' ) ) {
			return array(
				'videoCount' => $video_count,
			);
		}

		$featured_stats = get_transient( self::VIDEOPRESS_STATS_KEY );

		if ( $featured_stats ) {
			return array(
				'featuredStats' => $featured_stats,
				'videoCount'    => $video_count,
			);
		}

		$stats_period     = get_transient( self::VIDEOPRESS_PERIOD_KEY );
		$videopress_stats = new VideoPress_Stats();

		// If the stats period exists, retrieve that information without checking the view count.
		// If it does not, check the view count of monthly stats and determine if we want to show yearly or monthly stats.
		if ( $stats_period ) {
			if ( $stats_period === 'day' ) {
				$featured_stats = $videopress_stats->get_featured_stats( 60, 'day' );
			} else {
				$featured_stats = $videopress_stats->get_featured_stats( 2, 'year' );
			}
		} else {
			$featured_stats = $videopress_stats->get_featured_stats( 60, 'day' );

			if (
				! is_wp_error( $featured_stats ) &&
				$featured_stats &&
				( $featured_stats['data']['views']['current'] < 500 || $featured_stats['data']['views']['previous'] < 500 )
			) {
				$featured_stats = $videopress_stats->get_featured_stats( 2, 'year' );
			}
		}

		if ( is_wp_error( $featured_stats ) || ! $featured_stats ) {
			return array(
				'videoCount' => $video_count,
			);
		}

		set_transient( self::VIDEOPRESS_PERIOD_KEY, $featured_stats['period'], WEEK_IN_SECONDS );
		set_transient( self::VIDEOPRESS_STATS_KEY, $featured_stats, DAY_IN_SECONDS );

		return array(
			'featuredStats' => $featured_stats,
			'videoCount'    => $video_count,
		);
	}

	/**
	 * Get VideoPress data for the REST API
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_site_videopress_data() {
		$videopress_stats = self::get_videopress_stats();

		return rest_ensure_response( $videopress_stats );
	}
}
