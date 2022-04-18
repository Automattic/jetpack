<?php
/**
 * THIS FILE EXISTS VERBATIM IN WPCOM AND WPCOMSH.
 *
 * DANGER DANGER DANGER!!!
 * If you make any changes to this file you must MANUALLY update this file in both WPCOM and WPCOMSH.
 *
 * This file provides WPCOM_Features class wrapper functions that make checking for a specific feature easy and uniform
 * across WPCOM and WPCOMSH.
 *
 * @package WPCOM_Features
 */

/**
 * Load `WPCOM_Features` class.
 */
require_once __DIR__ . '/class-wpcom-features.php';

/**
 * Whether a given feature is available to the current (or specified) site.
 *
 * This function pulls the purchases for a given site and uses WPCOM_Features to check if any of those purchases
 * include the requested $feature.
 *
 * @param string $feature A singular feature.
 * @param int    $blog_id Optional. Blog ID. Defaults to current blog.
 *
 * @return bool Does the site have the feature?
 */
function wpcom_site_has_feature( $feature, $blog_id = 0 ) {
	if ( ! $blog_id ) {
		$blog_id = get_current_blog_id();
	}

	$purchases = wpcom_get_site_purchases( $blog_id );

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		$is_wpcom_site = true;
	} else {
		$blog          = get_blog_details( $blog_id, false );
		$is_wpcom_site = is_blog_wpcom( $blog ) || is_blog_atomic( $blog );
	}

	return WPCOM_Features::has_feature( $feature, $purchases, $is_wpcom_site );
}

/**
 * Returns a list of purchased product slugs.
 *
 * This function checks if we're on an Atomic (WPCOMSH) or Simple (WPCOM) site, and pulls the purchases for that current
 * site.
 *
 * @throws Error If $blog_id !== current_blog_id on Atomic sites.
 *
 * @param int $blog_id Optional. Blog ID. Defaults to current blog.
 *
 * @return string[] An array of product slugs.
 */
function wpcom_get_site_purchases( $blog_id = 0 ) {
	if ( ! $blog_id ) {
		$blog_id = get_current_blog_id();
	}

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		if ( get_current_blog_id() !== $blog_id ) {
			throw new Error(
				'Atomic sites do not support looking up features for sites other than the current site.'
			);
		}

		// Atomic site (WPCOMSH) purchases are stored in Atomic Persistent Data as a JSON encoded string.
		$persistent_data = new Atomic_Persistent_Data();
		$purchases       = json_decode( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions
		if ( null !== $purchases ) {
			// Each purchase has several fields, but we only want the product slug.
			$purchases = wp_list_pluck( $purchases, 'product_slug' );
		} else {
			// Fallback to old CSV format if the string cannot be JSON decoded.
			$purchases = str_getcsv( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions
		}
	} else {
		global $wpdb;

		// Allow overriding the blog ID for feature checks.
		$blog_id = apply_filters( 'wpcom_site_has_feature_blog_id', $blog_id );

		// 'site_purchases' belong to $global_groups in ./wp-content/object-cache.php
		$wp_cache_group = 'site_purchases';
		$wp_cache_found = false;

		// Check wp_cache_get for $purchases. If none exist $wp_cache_found will return false.
		$purchases = wp_cache_get( $blog_id, $wp_cache_group, false, $wp_cache_found );

		if ( false === $wp_cache_found ) {
			// For optimal performance, get $purchases with a direct SQL query.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$purchases = $wpdb->get_col(
				$wpdb->prepare(
					"
					SELECT sp.product_slug FROM `$wpdb->store_subscriptions` AS ss
						LEFT JOIN `$wpdb->store_products` AS sp ON ss.product_id = sp.product_id
					WHERE ss.blog_id=%d AND ss.active=1
					",
					$blog_id
				)
			);

			/*
			 * Cache the $purchases for 3 hours. Otherwise, the cache is invalidated when a purchase is made, using:
			 * add_action( 'subscription_changed', 'clear_wp_cache_site_purchases', 10, 1 );
			 * Found in ./wp-content/mu-plugins/wpcom-features.php
			 */
			wp_cache_set( $blog_id, $purchases, $wp_cache_group, 60 * 60 * 3 );
		}
	}

	return $purchases;
}

/**
 * Checks whether the given product contains the passed feature.
 *
 * This function converts atomic supported plan slugs and other product alias to wpcom plan slug. It then uses
 * WPCOM_Features to check if product include the requested $feature.
 *
 * @param string $product_slug     The product slug.
 * @param string $feature          The name of the feature to check.
 * @param bool   $is_wpcom_product Optional. Whether it's a wpcom product. Defaults to true.
 *
 * @return bool
 */
function wpcom_product_has_feature( $product_slug, $feature, $is_wpcom_product = true ) {
	$atomic_plan_aliases = array(
		'business'  => 'business-bundle',
		'ecommerce' => 'ecommerce-bundle',
		'pro'       => 'pro-plan',
	);

	/*
	 * Convert atomic plan slug to wpcom yearly plan in order to check against WPCOM_Features. This conversion is meant
	 * to be only for atomic plan slugs and should not affect other product checks.
	 */
	if ( ! empty( $atomic_plan_aliases[ $product_slug ] ) ) {
		$product_slug = $atomic_plan_aliases[ $product_slug ];
	}

	return WPCOM_Features::has_feature( $feature, array( $product_slug ), $is_wpcom_product );
}

/**
 * Checks whether the given feature exists in WordPress.com.
 *
 * @param string $feature The name of the feature to check.
 *
 * @return bool Whether the feature exists.
 */
function wpcom_feature_exists( $feature ) {
	return WPCOM_Features::feature_exists( $feature );
}
