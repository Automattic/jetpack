<?php
/**
 * Creator product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Creator product
 */
class Creator extends Product {

	const FREE_TIER_SLUG             = 'free';
	const UPGRADED_TIER_SLUG         = 'upgraded';
	const UPGRADED_TIER_PRODUCT_SLUG = 'jetpack_creator_yearly';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'creator';

	/**
	 * The slug of the plugin associated with this product - Creator functionalities are part of Jetpack's main plugin
	 *
	 * @var string
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * Get the plugin filename - ovewrite it and return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_filename() {
		return self::JETPACK_PLUGIN_FILENAME;
	}

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Creator', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Creator', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Create, grow, and monetize your audience', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Create, grow, and monetize your audience with powerful tools for creators.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Features list
	 */
	public static function get_features() {
		return array(
			__( 'Create content that stands out', 'jetpack-my-jetpack' ),
			__( 'Grow your subscribers through our creator network and tools', 'jetpack-my-jetpack' ),
			__( 'Monetize your online presence and earn from your website', 'jetpack-my-jetpack' ),
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
				'name'  => __( 'Import subscribers', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Import a CSV file of your existing subscribers to be sent your Newsletter.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => true,
						'description' => __( '100 subscribers', 'jetpack-my-jetpack' ),
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Unlimited subscribers', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Transaction fees', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'<p>Fees are only collected when you accept payments.</p>
                        <p>Fees are based on the Jetpack plan you have and are calculated as a percentage of your revenue from 10% on the Free plan to 2% on the Creator plan (plus Stripe fees).</p>',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => true,
						'description' => __( '10%', 'jetpack-my-jetpack' ),
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( '2%', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Creator network', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'<p>The creator network is the network of websites either hosted with WordPress.com or self-hosted and connected with Jetpack.</p>
                        <p>Sites that are part of the creator network can gain exposure to new readers. Sites on the Creator plan have enhanced distribution to more areas of the Reader.</p>',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Jetpack Blocks', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Jetpack has over 40 Gutenberg blocks to help you with your content creation, such as displaying your podcasts, showing different content to repeat visitors, creating contact forms and many more.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Paid content gating', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Lock your content behind a paid content block. To access the content, readers will need to pay a one-time fee or a recurring subscription.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Paywall access', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Add a Paywall to your content which lets your visitors read a section of your content before being asked to subscribe to continue reading.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Newsletter', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Start a Newsletter by sending your content as an email newsletter direct to your fans email inboxes.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Pay with PayPal', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'Accept payment with PayPal for simple payments like eBooks, courses and more.',
						'jetpack-my-jetpack'
					),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'WordAds', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __(
						'<p>WordAds adds advertisements to your website. Start earning from your website traffic.</p>
                        <p>Over 50 internet advertisers — including Google AdSense & Adx, AppNexus, Amazon A9, AOL Marketplace, Yahoo, Criteo, and more — bid to display ads in WordAds spots.</p>',
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
		);
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
		return admin_url( 'admin.php?page=jetpack#/settings?term=creator' );
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_creator_yearly';
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_biyearly_product_slug() {
		return 'jetpack_creator_bi_yearly';
	}

	/**
	 * Get the WPCOM monthly product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_monthly_product_slug() {
		return 'jetpack_creator_monthly';
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
				// Creator is available as standalone bundle and as part of the Complete plan.
				if ( strpos( $purchase->product_slug, 'jetpack_creator' ) !== false || str_starts_with( $purchase->product_slug, 'jetpack_complete' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Checks whether the product can be upgraded - i.e. this shows the /#add-creator interstitial
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		$has_required_plan = self::has_required_plan();
		return ! $has_required_plan;
	}
}
