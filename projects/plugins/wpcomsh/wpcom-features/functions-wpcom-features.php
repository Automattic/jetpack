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
		$site_type = 'wpcom';
	} else {
		$blog      = get_blog_details( $blog_id, false );
		$site_type = is_blog_wpcom( $blog ) || is_blog_atomic( $blog ) ? 'wpcom' : 'jetpack';
	}

	return WPCOM_Features::has_feature( $feature, $purchases, $site_type );
}

/**
 * Returns a list of purchased products.
 *
 * This function checks if we're on an Atomic (WPCOMSH) or Simple (WPCOM) site, and pulls the purchases for that current
 * site.
 *
 * @throws Error If $blog_id !== current_blog_id on Atomic sites.
 *
 * @param int $blog_id Optional. Blog ID. Defaults to current blog.
 *
 * @return array An array of product objects containing product_slug, product_id, subscribed_date, and expiry_date.
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

		if ( ! $persistent_data || ! $persistent_data->WPCOM_PURCHASES ) { // phpcs:ignore WordPress.NamingConventions
			return array();
		}

		$purchases = (array) json_decode( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions

	} else {
		global $wpdb;

		// Allow overriding the blog ID for feature checks.
		$blog_id = apply_filters( 'wpcom_site_has_feature_blog_id', $blog_id );

		// 'site_purchases' belong to $global_groups in ./wp-content/object-cache.php
		$wp_cache_group = 'site_purchases';
		$wp_cache_found = false;

		// The DB table is included in $wp_cache_key to avoid cache pollution between the production and test store.
		$wp_cache_key = "$blog_id-{$wpdb->store_subscriptions}";

		// Check wp_cache_get for $purchases. If none exist $wp_cache_found will return false.
		$purchases = wp_cache_get( $wp_cache_key, $wp_cache_group, false, $wp_cache_found );

		if ( false === $wp_cache_found ) {
			// For optimal performance, get $purchases with a direct SQL query.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$purchases = $wpdb->get_results(
				$wpdb->prepare(
					"
					SELECT sp.product_slug, sp.product_id, sp.product_type, ss.subscribed_date, ss.expiry as 'expiry_date'
					FROM `$wpdb->store_subscriptions` AS ss
					LEFT JOIN `$wpdb->store_products` AS sp ON ss.product_id = sp.product_id
					WHERE ss.blog_id=%d AND ss.active=1
					",
					$blog_id
				)
			);

			// Format the dates to match WPCOMSH data.
			foreach ( $purchases as $purchase ) {
				$purchase->subscribed_date = wpcom_datetime_to_iso8601( $purchase->subscribed_date );
				$purchase->expiry_date     = wpcom_datetime_to_iso8601( $purchase->expiry_date );
			}

			/*
			 * Cache the $purchases for 3 hours. Otherwise, the cache is invalidated when a purchase is made, using:
			 * add_action( 'subscription_changed', 'clear_wp_cache_site_purchases', 10, 1 );
			 * Found in ./wp-content/mu-plugins/wpcom-features.php
			 */
			wp_cache_set( $wp_cache_key, $purchases, $wp_cache_group, 60 * 60 * 3 );
		}
	}

	return $purchases;
}

/**
 * Parse and format a date string to ISO8601, but fall back to $default if the string is bad or '0000-00-00'.
 *
 * @param string $date A string representing a datetime that we wish to format to ISO8601.
 * @param string $default Use this datetime if $date errors. Useful for predictable unit testing. Defaults to 'now'.
 *
 * @return string A date string in ISO8601 format.
 */
function wpcom_datetime_to_iso8601( $date, $default = 'now' ) {
	/*
	 * Datetimes containing '0000-00-00' convert to '-001-11-30T00:00:00+00:00' which is not useful, so set it or
	 * empty $date to $default.
	 */
	if ( empty( $date ) || false !== strpos( $date, '0000-00-00' ) ) {
		$date = $default;
	}

	try {
		return ( new DateTime( $date ) )->format( 'c' );
	} catch ( Exception $e ) {
		return ( new DateTime( $default ) )->format( 'c' );
	}
}

/**
 * Checks whether the given product contains the passed feature.
 *
 * This function converts atomic supported plan slugs and other product aliases to product objects. It then uses
 * WPCOM_Features to check if product include the requested $feature.
 *
 * Do not pass a Store_Subscription to this function. For that case, use wpcom_purchase_has_feature().
 *
 * @param string|int|Store_Product $product A Store_Product object, a product slug, or ID.
 * @param string                   $feature The name of the feature to check.
 *
 * @return bool
 */
function wpcom_product_has_feature( $product, $feature ) {
	$product = _normalize_product( $product );

	return WPCOM_Features::has_feature( $feature, array( $product ) );
}

/**
 * Checks whether the given purchase (Store_Subscription) contains the passed feature.
 *
 * This function is similar to `wpcom_product_has_feature` with the difference that this function can check for legacy
 * features because purchases contain a `subscribed_date` field whereas products do not.
 *
 * Do not pass a Store_Product to this function. For that case, use wpcom_product_has_feature().
 *
 * @param Store_Subscription $purchase A Store_Subscription object.
 * @param string             $feature The name of the feature to check.
 *
 * @return bool
 */
function wpcom_purchase_has_feature( $purchase, $feature ) {
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		_doing_it_wrong(
			__FUNCTION__,
			'Support for this function is only in available in contexts where the store products database is available.',
			false // No version.
		);
	}
	if ( ! ( $purchase instanceof Store_Subscription ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			'The $purchase parameter should be of type Store_Subscription.',
			false // No version.
		);
	}
	/**
	 * We retrieve the product_slug directly from the Store_Product_List cache
	 * instead of relying on the internals of Store_Subscription to retrieve it.
	 *
	 * The issue is that simply "->product_slug" can call a custom __get(),
	 * which can issue SQL queries that take > 10ms for information is not needed.
	 * This assignment grabs the value directly from the cached store_products data
	 * avoiding any unnecessary queries.
	 */
	$purchase->product_slug = Store_Product_List::get_from_cache()[ $purchase->product_id ]['product_slug'];
	return WPCOM_Features::has_feature( $feature, array( $purchase ) );
}

/**
 * Returns a list of features that are associated with the passed product.
 *
 * @param string|int|Store_Product $product A Store_Product object, a product slug, or ID.
 *
 * @return string[]
 */
function wpcom_get_product_features( $product ) {
	$product = _normalize_product( $product );

	$cache_group = 'site_purchases';
	$cache_found = false;
	$cache_key   = $product->product_slug . filemtime( __DIR__ . '/class-wpcom-features.php' );

	$features = wp_cache_get( $cache_key, $cache_group, false, $cache_found );

	if ( false === $cache_found ) {
		$features = array();

		foreach ( WPCOM_Features::get_feature_slugs() as $feature ) {
			if ( wpcom_product_has_feature( $product, $feature ) ) {
				$features[] = $feature;
			}
		}

		wp_cache_set( $cache_key, $features, $cache_group, DAY_IN_SECONDS );
	}

	return $features;
}

/**
 * Normalizes Product input to always return an object with a product_slug property.
 *
 * @param string|int|Store_Product $product A Store_Product object, a product slug, or ID.
 *
 * @return false|object|Store_Product
 */
function _normalize_product( $product ) {
	if ( is_numeric( $product ) ) {
		if ( ! function_exists( 'get_store_product' ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				'Support for product IDs is only available in contexts where WP.com store functions are defined.',
				false // No version.
			);

			return false;
		}

		$product = get_store_product( $product );
	}

	if ( is_string( $product ) ) {
		$atomic_plan_aliases = array(
			'business'  => 'business-bundle',
			'ecommerce' => 'ecommerce-bundle',
			'pro'       => 'pro-plan',
		);

		/*
		 * Convert atomic plan slug to wpcom yearly plan in order to check against WPCOM_Features. This conversion is
		 * meant to be only for atomic plan slugs and should not affect other product checks.
		 */
		if ( ! empty( $atomic_plan_aliases[ $product ] ) ) {
			$product = $atomic_plan_aliases[ $product ];
		}

		// has_feature expects an object with a product_slug.
		$product = (object) array( 'product_slug' => $product );
	}

	return $product;
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
