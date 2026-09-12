<?php
/**
 * The WordPress.com marketplace catalog, shaped for core's plugin browser.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;

/**
 * Reads the plugins WordPress.com sells and normalizes them into the array shape
 * `WP_Plugin_Install_List_Table` expects to get back from `plugins_api()`.
 *
 * Descriptions are most of the payload and are only read by the details modal, so
 * they are dropped from the cached list and re-fetched per product when it opens.
 */
class Marketplace_Catalog {

	/**
	 * Transient holding the normalized product list.
	 */
	const LIST_CACHE_KEY = 'wpcom_marketplace_catalog';

	/**
	 * Transient prefix for a single product's full details.
	 */
	const PRODUCT_CACHE_PREFIX = 'wpcom_marketplace_product_';

	/**
	 * How long a successful read is cached for.
	 */
	const CACHE_TTL = 6 * HOUR_IN_SECONDS;

	/**
	 * How long a failed read is cached for. Short, but non-zero, so an outage does
	 * not mean an outbound request per page load.
	 */
	const MISS_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Every purchasable plugin, keyed by slug, in the order wpcom returns them.
	 *
	 * @return array<string, array> Normalized product data, empty when the catalog cannot be read.
	 */
	public static function get_products() {
		$cached = get_transient( self::LIST_CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = self::request( '/marketplace/products?type=launched' );

		if ( ! is_array( $response ) || ! is_array( $response['results'] ?? null ) ) {
			set_transient( self::LIST_CACHE_KEY, array(), self::MISS_CACHE_TTL );
			return array();
		}

		$products = self::to_catalog( $response['results'] );

		set_transient( self::LIST_CACHE_KEY, $products, self::CACHE_TTL );

		return $products;
	}

	/**
	 * Turns an endpoint response into the catalog we list.
	 *
	 * @param array $results Products as the marketplace endpoint returns them.
	 * @return array<string, array> Normalized products, keyed by slug.
	 */
	public static function to_catalog( array $results ) {
		$products = array();

		foreach ( $results as $product ) {
			if ( ! is_array( $product ) || empty( $product['slug'] ) ) {
				continue;
			}

			// Retired products stay available to existing subscribers but are no longer sold.
			if ( ! empty( $product['is_retired'] ) || ! empty( $product['is_hidden'] ) ) {
				continue;
			}

			$card = self::to_card( $product );

			$products[ $card['slug'] ] = $card;
		}

		return $products;
	}

	/**
	 * Whether a slug belongs to the marketplace catalog.
	 *
	 * @param string $slug Plugin slug.
	 * @return bool
	 */
	public static function has_product( $slug ) {
		$products = self::get_products();

		return isset( $products[ $slug ] );
	}

	/**
	 * One product's card data, as it appears in the browse list.
	 *
	 * @param string $slug Plugin slug.
	 * @return array|null Normalized product data, or null when the slug is not ours.
	 */
	public static function get_product( $slug ) {
		$products = self::get_products();

		return $products[ $slug ] ?? null;
	}

	/**
	 * One product with the long-form fields the details modal renders.
	 *
	 * @param string $slug Plugin slug.
	 * @return array|null Normalized product data, or null when the slug is not ours.
	 */
	public static function get_product_details( $slug ) {
		$card = self::get_product( $slug );
		if ( null === $card ) {
			return null;
		}

		$cache_key = self::PRODUCT_CACHE_PREFIX . $slug;
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$product = self::request( '/marketplace/products/' . rawurlencode( $card['wpcom_product_slug'] ?? $slug ) );

		// The card carries every field the modal needs except the long description.
		if ( ! is_array( $product ) || empty( $product['slug'] ) ) {
			$details = self::to_details( $card );

			set_transient( $cache_key, $details, self::MISS_CACHE_TTL );

			return $details;
		}

		$details = self::to_details( self::to_card( $product ) );

		$description = is_string( $product['description'] ?? null ) ? $product['description'] : '';
		if ( '' !== $description ) {
			$details['sections']['description'] = $description;
		}

		set_transient( $cache_key, $details, self::CACHE_TTL );

		return $details;
	}

	/**
	 * Strips the fields that only exist to satisfy the browse list.
	 *
	 * The list table reads active_installs unguarded, so a card has to carry it, but
	 * the details modal guards on isset() and renders 0 as "Less Than 10", which we
	 * would be stating as fact about a plugin we have no install count for.
	 *
	 * @param array $card Normalized card data.
	 * @return array
	 */
	private static function to_details( array $card ) {
		unset( $card['active_installs'], $card['downloaded'] );

		return $card;
	}

	/**
	 * Reads a wpcom marketplace endpoint.
	 *
	 * @param string $path Path below `wpcom/v2`, query string included.
	 * @return array|null Decoded response body, or null on any failure.
	 */
	private static function request( $path ) {
		if ( ! method_exists( Client::class, 'wpcom_json_api_request_as_blog' ) ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog( $path, '2', array(), null, 'wpcom' );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return is_array( $body ) ? $body : null;
	}

	/**
	 * Turns one wpcom product into the array a plugin card is rendered from.
	 *
	 * Core reads several of these keys without checking they exist, so every one it
	 * touches is set here even when we have nothing to put in it.
	 *
	 * @param array $product Product data from the marketplace endpoint.
	 * @return array
	 */
	public static function to_card( array $product ) {
		$product_slug = (string) ( $product['slug'] ?? '' );
		$icon         = is_string( $product['icons'] ?? null ) ? $product['icons'] : '';

		// Core resolves installed state from the plugin directory name, and
		// Marketplace_Products_Updater keys its updates the same way, so the card has
		// to carry the software slug. The two differ for a handful of products.
		$slug = (string) ( $product['software_slug'] ?? '' );
		if ( '' === $slug ) {
			$slug = $product_slug;
		}

		return array(
			'name'               => (string) ( $product['name'] ?? '' ),
			'slug'               => $slug,
			'version'            => (string) ( $product['version'] ?? '' ),
			// wpcom wraps the author name in a placeholder link that goes nowhere.
			'author'             => wp_strip_all_tags( (string) ( $product['author'] ?? '' ) ),
			'author_profile'     => '',
			'contributors'       => array(),
			'short_description'  => (string) ( $product['short_description'] ?? '' ),
			'sections'           => array( 'description' => (string) ( $product['short_description'] ?? '' ) ),
			'icons'              => array(
				'1x'      => $icon,
				'2x'      => $icon,
				'default' => $icon,
			),
			'banners'            => is_array( $product['banners'] ?? null ) ? $product['banners'] : array(),
			// The payload has an average but no count, and core renders stars from the
			// average alone, so showing one would mean "(based on 0 ratings)".
			'rating'             => 0,
			'num_ratings'        => 0,
			'ratings'            => array(),
			'active_installs'    => 0,
			'downloaded'         => 0,
			'last_updated'       => (string) ( $product['last_updated'] ?? '' ),
			'added'              => '',
			'homepage'           => self::product_url( $product_slug ),
			'donate_link'        => '',
			// No download link: these install through a purchase, and its absence is also
			// what keeps core from offering an Install button in the details modal.
			'download_link'      => '',
			'requires'           => false,
			'requires_php'       => false,
			'tested'             => '',
			'upgrade_notice'     => '',
			// Suppresses core's "WordPress.org Plugin Page" link. These are not on .org.
			'external'           => true,
			'wpcom_marketplace'  => true,
			'wpcom_product_slug' => $product_slug,
		);
	}

	/**
	 * The WordPress.com page a product is bought from.
	 *
	 * @param string $slug Plugin slug.
	 * @return string
	 */
	public static function product_url( $slug ) {
		$site_slug = wp_parse_url( home_url(), PHP_URL_HOST );

		return sprintf(
			'https://wordpress.com/plugins/%s/%s?ref=wpcom-marketplace-tab',
			rawurlencode( $slug ),
			rawurlencode( (string) $site_slug )
		);
	}
}
