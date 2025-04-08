<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use WP_Error;

/**
 * Class responsible for handling the Boost product
 */
class Boost extends Product {

	const FREE_TIER_SLUG             = 'free';
	const UPGRADED_TIER_SLUG         = 'upgraded';
	const UPGRADED_TIER_PRODUCT_SLUG = 'jetpack_boost_yearly';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'boost';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-boost/jetpack-boost.php',
		'boost/jetpack-boost.php',
		'jetpack-boost-dev/jetpack-boost.php',
	);
	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-boost';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'performance';

	/**
	 * Defines whether or not to show a product interstitial as tiered pricing or not
	 *
	 * @var bool
	 */
	public static $is_tiered_pricing = true;

	/**
	 * Boost has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

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
	public static $feature_identifying_paid_plan = 'cloud-critical-css';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Boost';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Boost';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Speed up your site and improve SEO in seconds', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Fast sites get more page visits, more conversions, and better SEO rankings. Boost speeds up your site in seconds.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			__( 'Check your site performance', 'jetpack-my-jetpack' ),
			__( 'Enable improvements in one click', 'jetpack-my-jetpack' ),
			__( 'Standalone free plugin for those focused on speed', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product's available tiers
	 *
	 * @return string[] Slugs of the available tiers
	 */
	public static function get_tiers() {
		return array(
			self::UPGRADED_TIER_SLUG,
			self::FREE_TIER_SLUG,
		);
	}

	/**
	 * Get the internationalized comparison of free vs upgraded features
	 *
	 * @return array[] Protect features comparison
	 */
	public static function get_features_by_tier() {
		return array(
			array(
				'name'  => __( 'Auto CSS Optimization', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => false,
						'description' => __( 'Manual', 'jetpack-my-jetpack' ),
						'info'        => array(
							'title'   => __( 'Manual Critical CSS regeneration', 'jetpack-my-jetpack' ),
							'content' => __(
								'<p>To enhance the speed of your site, with this plan you will need to optimize CSS by using the Manual Critical CSS generation feature whenever you:</p>
								<ul>
									<li>Make theme changes.</li>
									<li>Write a new post/page.</li>
									<li>Edit a post/page.</li>
									<li>Activate, deactivate, or update plugins that impact your site layout or HTML structure.</li>
									<li>Change settings of plugins that impact your site layout or HTML structure.</li>
									<li>Upgrade your WordPress version if the new release includes core CSS changes.</li>
								</ul>',
								'jetpack-my-jetpack'
							),
						),
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Included', 'jetpack-my-jetpack' ),
						'info'        => array(
							'title'   => __( 'Automatic Critical CSS regeneration', 'jetpack-my-jetpack' ),
							'content' => __(
								'<p>It’s essential to regenerate Critical CSS to optimize your site speed whenever your HTML or CSS structure changes. Being on top of this can be tedious and time-consuming.</p>
								 <p>Boost’s cloud service can automatically detect when your site needs the Critical CSS regenerated, and perform this function behind the scenes without requiring you to monitor it manually.</p>',
								'jetpack-my-jetpack'
							),
						),
					),
				),
			),
			array(
				'name'  => __( 'Automatic image size analysis', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Scan your site for images that aren’t properly sized for the device they’re being viewed on.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Historical performance scores', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Get access to your historical performance scores and see advanced Core Web Vitals data.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Dedicated email support', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'<p>Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.</p>
						 <p>All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.</p>',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Page Cache', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Page caching speeds up load times by storing a copy of each web page on the first visit, allowing subsequent visits to be served instantly. This reduces server load and improves user experience by delivering content faster, without waiting for the page to be generated again.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Image CDN Quality Settings', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Fine-tune image quality settings to your liking.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Image CDN Auto-Resize Lazy Images', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Optimizes lazy-loaded images by dynamically serving perfectly sized images for each device.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Image CDN', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Deliver images from Jetpack\'s Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Image guide', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Discover and fix images with a suboptimal resolution, aspect ratio, or file size, improving user experience and page speed.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Defer non-essential JavaScript', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Concatenate JS and CSS', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Boost your website performance by merging and compressing JavaScript and CSS files, reducing site loading time and number of requests.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
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
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'tiers' => array(
				self::FREE_TIER_SLUG     => array(
					'available' => true,
					'is_free'   => true,
				),
				self::UPGRADED_TIER_SLUG => array_merge(
					array(
						'available'          => true,
						'wpcom_product_slug' => self::UPGRADED_TIER_PRODUCT_SLUG,
					),
					Wpcom_Products::get_product_pricing( self::UPGRADED_TIER_PRODUCT_SLUG )
				),
			),
		);
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-boost' );
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @param bool|WP_Error $current_result Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return boolean|WP_Error
	 */
	public static function do_product_specific_activation( $current_result ) {

		$product_activation = parent::do_product_specific_activation( $current_result );

		if ( is_wp_error( $product_activation ) && 'module_activation_failed' === $product_activation->get_error_code() ) {
			// A bundle is not a module. There's nothing in the plugin to be activated, so it's ok to fail to activate the module.
			$product_activation = true;
		}

		// We just "got started" in My Jetpack, so skip the in-plugin experience.
		update_option( 'jb_get_started', false );

		return $product_activation;
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_boost_yearly',
			'jetpack_boost_monthly',
			'jetpack_boost_bi_yearly',
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
}
