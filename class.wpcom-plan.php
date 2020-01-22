<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Get a WordPress.com site's plan, and see if it supports a given feature.
 *
 * @package Jetpack
 */

/**
 * Provides methods methods for fetching the plan from WordPress.com.
 */
class Wpcom_Plan {
	/**
	 * Check if a site is a WordPress.com site.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if the site is a WordPress.com Simple Site.
	 */
	public static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'get_blog_stickers' );
	}

	/**
	 * Return an array of features supported by current plan.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $plan Current wpcom plan.
	 *
	 * @return array $features Array of supported features.
	 */
	public static function features( $plan ) {
		$plan_features = array(
			'blogger-plan'    => array(),
			'personal-plan'   => array(
				'recurring-payments',
			),
			'personal-bundle' => array(
				'recurring-payments',
			),
			'premium-plan'    => array(
				'calendly',
				'opentable',
				'recurring-payments',
				'simple-payments',
			),
			'business-plan'   => array(
				'calendly',
				'opentable',
				'recurring-payments',
				'simple-payments',
			),
			'ecommerce-plan'  => array(
				'calendly',
				'opentable',
				'recurring-payments',
				'simple-payments',
			),
		);

		if ( ! isset( $plan_features[ $plan ] ) ) {
			return array();
		}

		return $plan_features[ $plan ];
	}

	/**
	 * Check if a WordPress.com site supports a specific feature.
	 *
	 * @uses get_option()
	 *
	 * @access public
	 * @static
	 *
	 * @param string $feature      The module or feature to check.
	 *
	 * @return bool True if plan supports feature, false if not.
	 */
	public static function supports( $feature ) {
		// If the site is not a WordPress.com site, bail.
		if ( ! self::is_wpcom() ) {
			return false;
		}

		// Get all the site's plan stickers.
		$plan_stickers = array_intersect(
			get_blog_stickers( get_current_blog_id() ),
			array( 'blogger-plan', 'personal-plan', 'premium-plan', 'business-plan', 'ecommerce-plan' )
		);

		foreach ( $plan_stickers as $plan_sticker ) {
			if ( in_array( $feature, self::features( $plan_sticker ), true ) ) {
				return true;
			}
		}

		return false;
	}
}
