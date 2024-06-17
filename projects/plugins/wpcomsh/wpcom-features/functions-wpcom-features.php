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
 * Internal function to retrieve the current WP.com blog ID depending on the environment.
 *
 * @return int The current blog ID.
 */
function _wpcom_get_current_blog_id() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return get_current_blog_id();
	}

	/*
	 * Atomic sites have the WP.com blog ID stored as a Jetpack option. This code deliberately
	 * doesn't use `Jetpack_Options::get_option` so it works even when Jetpack has not been loaded.
	 */
	$jetpack_options = get_option( 'jetpack_options' );
	if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
		return (int) $jetpack_options['id'];
	}

	return get_current_blog_id();
}

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
		$blog_id = _wpcom_get_current_blog_id();
	}

	$purchases = wpcom_get_site_purchases( $blog_id );

	$blog = null;
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		$site_type = 'wpcom';
	} else {
		$blog      = get_blog_details( $blog_id, false );
		$site_type = is_blog_wpcom( $blog ) || is_blog_atomic( $blog ) ? 'wpcom' : 'jetpack';
	}

	// A8C override for certain sites.
	if ( $feature === WPCOM_Features::ADVANCED_SEO && in_array( $blog_id, WPCOM_FEATURES::A8C_SITES_WITH_ADDITIONAL_SEO_FEATURES, true ) ) {
		return true;
	}

	/*
	 * A8C override for internal P2s
	 */
	if ( $feature === WPCOM_Features::AI_ASSISTANT && wpcom_is_automattic_p2_site( $blog_id ) ) {
		return true;
	}

	/*
	 * A8C override for wp.org sites to enable JP search
	 */
	if ( $feature === WPCOM_Features::CLASSIC_SEARCH && ( function_exists( 'wpcom_is_wporg_jp_index' ) && wpcom_is_wporg_jp_index( $blog_id ) ) ) {
		return true;
	}

	if ( isset( $blog->registered ) ) {
		WPCOM_Features::add_free_plan_purchase( $purchases, $site_type, $blog->registered );
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
		$blog_id = _wpcom_get_current_blog_id();
	}

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		if ( _wpcom_get_current_blog_id() !== $blog_id ) {
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
		// Allow overriding the blog ID for feature checks.
		$blog_id = apply_filters( 'wpcom_site_has_feature_blog_id', $blog_id );

		$purchases = _wpcom_features_get_simple_site_purchases( $blog_id );
	}

	return $purchases;
}

/**
 * INTERNAL function to fetch purchases for a WPCOM Simple site.
 * The function will return an empty array if we're running in an Atomic context.
 *
 * @param int $blog_id The blog ID to fetch purchases for.
 * @return array The currently active purchases on the site.
 */
function _wpcom_features_get_simple_site_purchases( $blog_id ) {
	global $wpdb;

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		// Make _super_ sure the function is available.
		if ( function_exists( '_doing_it_wrong' ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				'Support for this function is only in available in contexts where the WordPress.com Store databases are available.',
				false // No version.
			);
		}

		return array();
	}

	if ( ! $blog_id ) {
		$blog_id = _wpcom_get_current_blog_id();
	}

	// Optional skip, used for suspended/spam/deleted sites.
	$skip_purchase_lookup = apply_filters( 'wpcom_simple_skip_purchase_lookup', false, $blog_id );
	if ( $skip_purchase_lookup ) {
		return array();
	}

	// 'site_purchases' belong to $global_groups in ./wp-content/object-cache.php
	$wp_cache_group = 'site_purchases';
	$wp_cache_found = false;

	// The DB table is included in $wp_cache_key to avoid cache pollution between the production and test store.
	$wp_cache_key = "$blog_id-{$wpdb->store_subscriptions}";

	// Check wp_cache_get() for $purchases. If none exist $wp_cache_found will be false.
	$purchases = wp_cache_get( $wp_cache_key, $wp_cache_group, false, $wp_cache_found );

	if ( false !== $wp_cache_found ) {
		return (array) $purchases;
	}

	// Get $purchases with a direct SQL query.
	// We are intentionally NOT using the Purchases API as this code needs to be runnable
	// in some contexts where the billing code-base is not available.
	// See pdqkMK-18D-p2 for more discussion and context.

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery
	$purchases = $wpdb->get_results(
		$wpdb->prepare(
			"
					SELECT 
					    product.product_slug,
					    product.product_id,
					    product.billing_product_id,
					    product.product_type,
					    subscription.subscribed_date,
					    subscription.expiry AS 'expiry_date',
						subscription.id AS subscription_id,
					    subscription.auto_renew AS user_allows_auto_renew
					FROM `$wpdb->store_subscriptions` AS subscription
					LEFT JOIN `$wpdb->store_products` AS product ON subscription.product_id = product.product_id
					WHERE
						subscription.blog_id = %d
						AND subscription.active = 1
					ORDER BY subscription.id DESC
					",
			$blog_id
		)
	);

	static $billing_product_data = array();

	$billing_product_ids          = array_unique( wp_list_pluck( $purchases, 'billing_product_id' ) );
	$billing_product_ids_to_query = array_diff( $billing_product_ids, array_keys( $billing_product_data ) );
	if ( ! empty( $billing_product_ids_to_query ) ) {
		// We need to query the billing_products table via a separate query.

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$billing_products = $wpdb->get_results(
			"
					SELECT
						product_id,
						product_slug
					FROM
						`$wpdb->billing_products`
					WHERE
						" . $wpdb->build_IN_condition( 'product_id', $billing_product_ids_to_query, '%d' ) // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		);

		foreach ( $billing_products as $billing_product ) {
			$billing_product_data[ $billing_product->product_id ] = $billing_product->product_slug;
		}
	}

	// Format the dates to match WPCOMSH data.
	foreach ( $purchases as $purchase ) {
		$purchase->billing_product_slug   = $billing_product_data[ $purchase->billing_product_id ] ?? '';
		$purchase->subscribed_date        = wpcom_datetime_to_iso8601( $purchase->subscribed_date );
		$purchase->expiry_date            = wpcom_datetime_to_iso8601( $purchase->expiry_date );
		$purchase->user_allows_auto_renew = ! empty( $purchase->user_allows_auto_renew );
		// Ensure we remove billing_product_id from the purchase data.
		unset( $purchase->billing_product_id );
	}

	/*
	* Cache the $purchases for 3 hours. Otherwise, the cache is invalidated when a purchase is made, using:
	* add_action( 'subscription_changed', 'clear_wp_cache_site_purchases', 10, 1 );
	* Found in ./wp-content/mu-plugins/wpcom-features.php
	*/
	wp_cache_set( $wp_cache_key, $purchases, $wp_cache_group, 3 * HOUR_IN_SECONDS );

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
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		_doing_it_wrong(
			__FUNCTION__,
			'Support for this function is only in available in contexts where the store products database is available.',
			'' // No version.
		);
		return false;
	}

	$purchase = _convert_product_to_purchase( $product );
	if ( ! $purchase ) {
		return false;
	}

	return wpcom_purchase_has_feature( $purchase, $feature );
}

/**
 * Checks whether the given purchase (Store_Subscription) contains the passed feature.
 *
 * This function is similar to `wpcom_product_has_feature` with the difference that this function can check for legacy
 * features because purchases contain a `subscribed_date` field whereas products do not.
 *
 * Do not pass a Store_Product to this function. For that case, use wpcom_product_has_feature().
 *
 * @param Store_Subscription|object $purchase A Store_Subscription object or purchase serialized object.
 * @param string                    $feature The name of the feature to check.
 *
 * @return bool
 */
function wpcom_purchase_has_feature( $purchase, $feature ) {
	if ( $purchase instanceof Store_Subscription ) {
		/**
		 * We retrieve the product_slug and product_type directly from the Store_Product_List
		 * cache instead of relying on the internals of Store_Subscription to retrieve it.
		 *
		 * The issue is that simply "->product_slug" or "->product_type" can call a custom __get(),
		 * which can issue SQL queries that take > 10ms for information is not needed. This assignment
		 * grabs the value directly from the cached store_products data avoiding any unnecessary queries.
		 */
		$product = Store_Product_List::get_from_cache()[ $purchase->product_id ];

		$purchase = (object) array(
			'product_slug'    => $product['product_slug'],
			'product_id'      => (string) $purchase->product_id,
			'product_type'    => $product['product_type'],
			'subscribed_date' => wpcom_datetime_to_iso8601( $purchase->subscribed_date ),
			'expiry_date'     => wpcom_datetime_to_iso8601( $purchase->expiry ),
		);
	}

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
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		_doing_it_wrong(
			__FUNCTION__,
			'Support for this function is only in available in contexts where the store products database is available.',
			'' // No version.
		);
		return array();
	}

	$purchase = _convert_product_to_purchase( $product );
	if ( ! $purchase ) {
		return array();
	}

	$cache_group = 'site_purchases';
	$cache_found = false;
	$cache_key   = $purchase->product_slug . filemtime( __DIR__ . '/class-wpcom-features.php' );

	$features = wp_cache_get( $cache_key, $cache_group, false, $cache_found );

	if ( false === $cache_found ) {
		$features = array();

		foreach ( WPCOM_Features::get_feature_slugs() as $feature ) {
			if ( wpcom_purchase_has_feature( $purchase, $feature ) ) {
				$features[] = $feature;
			}
		}

		wp_cache_set( $cache_key, $features, $cache_group, DAY_IN_SECONDS );
	}

	return $features;
}

/**
 * Converts a store product to a purchase object compatible with `WPCOM_Features::has_feature`.
 *
 * @param string|int|Store_Product $product A Store_Product object, a product slug, or ID.
 *
 * @return null|object
 */
function _convert_product_to_purchase( $product ) {
	if ( ! is_numeric( $product ) && ! is_string( $product ) && ! ( $product instanceof Store_Product ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			'The $purchase parameter should be of type string|int|Store_Product.',
			false // No version.
		);
		return null;
	}

	if ( is_string( $product ) && ! is_numeric( $product ) ) {
		require_once WP_CONTENT_DIR . '/admin-plugins/wpcom-billing/class.wpcom-billingdaddy.php';
		$product = WPCOM_Billingdaddy::store_product_slug_to_product_id( $product );
	}

	if ( is_numeric( $product ) ) {
		$product_cache = Store_Product_List::get_from_cache();
		if ( ! array_key_exists( $product, $product_cache ) ) {
			return null;
		}
		$product = (object) $product_cache[ $product ];
	}

	return (object) array(
		'product_slug'    => $product->product_slug,
		'product_id'      => (string) $product->product_id,
		'product_type'    => $product->product_type,
		'subscribed_date' => null,
		'expiry_date'     => null,
	);
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
