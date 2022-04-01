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
 * This function checks if we're on an Atomic (WPCOMSH) or Simple (WPCOM) site, and pulls the purchases for that current
 * site. It then uses WPCOM_Features to check if any of those purchases include the requested $feature.
 *
 * @param string $feature A singular feature.
 * @param int    $blog_id Optional blog_id. Default is the current_blog_id.
 *
 * @return bool Does the site have the feature?
 * @throws Error If $blog_id !== current_blog_id on Atomic sites.
 */
function wpcom_site_has_feature( $feature, $blog_id = 0 ) {
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

		$is_wpcom_site = true;
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

		$blog          = get_blog_details( $blog_id, false );
		$is_wpcom_site = is_blog_wpcom( $blog ) || is_blog_atomic( $blog );
	}

	return WPCOM_Features::has_feature( $feature, $purchases, $is_wpcom_site );
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
