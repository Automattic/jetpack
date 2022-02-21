<?php
/**
 * THIS FILE EXISTS VERBATIM IN WPCOM AND WPCOMSH.
 *
 * DANGER DANGER DANGER!!!
 * If you make any changes to this class you must MANUALLY update this file in both WPCOM and WPCOMSH.
 *
 * @package Purchases_Feature_Map
 */

/**
 * Map features to purchases.
 */
class WPCOM_Features {
	/*
	 * Private const for every mapped purchase, sorted alphabetically.
	 */
	private const PLAN_BUSINESS          = 'business-bundle';
	private const PLAN_BUSINESS_MONTHLY  = 'business-bundle-monthly';
	private const PLAN_BUSINESS_2Y       = 'business-bundle-2y';
	private const PLAN_ECOMMERCE         = 'ecommerce-bundle';
	private const PLAN_ECOMMERCE_MONTHLY = 'ecommerce-bundle-monthly';
	private const PLAN_ECOMMERCE_2Y      = 'ecommerce-bundle-2y';

	/*
	 * Public const for every mapped feature, sorted alphabetically.
	 */
	public const NO_WPCOM_BRANDING     = 'no-wpcom-branding';
	public const A_PLACEHOLDER_FEATURE = 'a-placeholder-feature';

	/*
	 * Private const array of features with sub-array of purchases that include that feature.
	 */
	private const FEATURES_MAP = array(

		// Enable the ability to hide the WP.com branding in the site footer.
		self::NO_WPCOM_BRANDING     => array(
			self::PLAN_BUSINESS,
			self::PLAN_BUSINESS_MONTHLY,
			self::PLAN_BUSINESS_2Y,
			self::PLAN_ECOMMERCE,
			self::PLAN_ECOMMERCE_MONTHLY,
			self::PLAN_ECOMMERCE_2Y,
		),

		/*
		 * An example of another feature. Maybe some features need room for a big comment to explain what they actually
		 * do. Please delete this example later.
		 */
		self::A_PLACEHOLDER_FEATURE => array(
			self::PLAN_ECOMMERCE,
		),
	);

	/**
	 * Given an array of $purchases and a single feature name, consult the FEATURES_MAP to determine if the feature
	 * is included in one of the $purchases.
	 *
	 * @param string $feature A singular feature.
	 * @param array  $purchases A collection of purchases.
	 *
	 * @return bool Is the feature included in one of the purchases.
	 */
	public static function has_feature( $feature, $purchases ) {
		if ( empty( $purchases ) || empty( self::FEATURES_MAP[ $feature ] ) ) {
			return false;
		}
		foreach ( $purchases as $purchase ) {
			if ( in_array( $purchase, self::FEATURES_MAP[ $feature ], true ) ) {
				return true;
			}
		}
		return false;
	}
}
