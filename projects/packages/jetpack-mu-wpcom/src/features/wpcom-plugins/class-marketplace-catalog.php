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
	 * Bumped whenever the shape of a cached card or description changes, so sites
	 * do not keep serving data built by the previous version until it expires.
	 */
	const CACHE_VERSION = 3;

	/**
	 * Transient holding the normalized product list.
	 */
	const LIST_CACHE_KEY = 'wpcom_marketplace_catalog_v' . self::CACHE_VERSION;

	/**
	 * Transient prefix for a single product's full details.
	 */
	const PRODUCT_CACHE_PREFIX = 'wpcom_marketplace_product_v' . self::CACHE_VERSION . '_';

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

		$products = self::attach_pricing( self::to_catalog( $response['results'] ), self::fetch_store_products() );

		set_transient( self::LIST_CACHE_KEY, $products, self::CACHE_TTL );

		return $products;
	}

	/**
	 * Turns an endpoint response into the catalog we list.
	 *
	 * Order is load-bearing: wpcom ranks the response by active subscriptions, so
	 * the best sellers arrive first. Do not sort or re-key what comes back.
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

		$raw = is_string( $product['description'] ?? null ) ? $product['description'] : '';

		$description = self::to_modal_html( $raw );
		if ( '' !== $description ) {
			$details['sections']['description'] = $description;
		}

		$screenshots = self::to_screenshots_html( $raw );
		if ( '' !== $screenshots ) {
			$details['sections']['screenshots'] = $screenshots;
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
	 * Moves the vendor's images into a screenshots section.
	 *
	 * Core constrains images in `#section-screenshots` and nowhere else, which is why
	 * WordPress.org plugins put them there rather than in the description. Rebuilt
	 * from the source URLs alone so none of the vendor's own markup comes with them.
	 *
	 * @param string $html Description as the marketplace endpoint returns it.
	 * @return string Section markup, or an empty string when there are no images.
	 */
	public static function to_screenshots_html( $html ) {
		if ( '' === $html || ! preg_match_all( '#<img[^>]+src=[\'"]([^\'"]+)[\'"]#i', $html, $matches ) ) {
			return '';
		}

		$items = '';
		foreach ( array_unique( $matches[1] ) as $src ) {
			$url = esc_url( $src );
			if ( '' !== $url ) {
				$items .= sprintf( '<li><img src="%s" alt="" /></li>', $url );
			}
		}

		return '' === $items ? '' : '<ol>' . $items . '</ol>';
	}

	/**
	 * Reduces a vendor description to markup core's details modal can render.
	 *
	 * These are WooCommerce.com product pages: layout divs, full-width figures and
	 * inline styles, with the spacing living in a stylesheet the modal does not load.
	 * Left alone they overflow its ~600px column and the text runs together.
	 *
	 * @param string $html Description as the marketplace endpoint returns it.
	 * @return string
	 */
	public static function to_modal_html( $html ) {
		if ( '' === $html ) {
			return '';
		}

		// Block wrappers are about to be stripped, so keep the break they implied.
		$html = preg_replace( '#</(?:div|figure|section|article|table|tr)>#i', "\n\n", $html );

		$html = wp_kses(
			$html,
			array(
				'a'          => array(
					'href'  => array(),
					'title' => array(),
				),
				'b'          => array(),
				'blockquote' => array(),
				'br'         => array(),
				'code'       => array(),
				'em'         => array(),
				'h3'         => array(),
				'h4'         => array(),
				'i'          => array(),
				'li'         => array(),
				'ol'         => array(),
				'p'          => array(),
				'strong'     => array(),
				'ul'         => array(),
			)
		);

		return trim( wpautop( trim( $html ) ) );
	}

	/**
	 * Reads a wpcom marketplace endpoint.
	 *
	 * @param string $path    Path below the namespace, query string included.
	 * @param string $version API version.
	 * @param string $base    API base, `wpcom` or `rest`.
	 * @return array|null Decoded response body, or null on any failure.
	 */
	private static function request( $path, $version = '2', $base = 'wpcom' ) {
		if ( ! method_exists( Client::class, 'wpcom_json_api_request_as_blog' ) ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog( $path, $version, array(), null, $base );

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
			'wpcom_variations'   => self::to_variation_ids( $product['variations'] ?? null ),
			'wpcom_pricing'      => array(),
		);
	}

	/**
	 * Reads the store catalog, which is where a variation's slug and price live.
	 *
	 * The marketplace endpoint gives only a numeric product id, and checkout is
	 * addressed by slug, so this is needed for the button as much as for the price.
	 *
	 * @return array<int, array> Keyed by product id.
	 */
	private static function fetch_store_products() {
		// Site-scoped first, so prices come back in the site's own currency. Calypso
		// reads the same two paths in the same order, for the same reason.
		$blog_id  = function_exists( 'get_wpcom_blog_id' ) ? (int) get_wpcom_blog_id() : 0;
		$response = $blog_id > 0 ? self::request( '/sites/' . $blog_id . '/products', '1.1', 'rest' ) : null;

		if ( ! is_array( $response ) ) {
			$response = self::request( '/products', '1.1', 'rest' );
		}

		if ( ! is_array( $response ) ) {
			return array();
		}

		$store = array();
		foreach ( $response as $slug => $product ) {
			if ( ! is_array( $product ) || empty( $product['product_id'] ) ) {
				continue;
			}

			$store[ (int) $product['product_id'] ] = array(
				'slug'  => (string) $slug,
				'price' => (string) ( $product['cost_display'] ?? '' ),
			);
		}

		return $store;
	}

	/**
	 * Resolves each product's variations against the store catalog.
	 *
	 * @param array<string, array> $products Normalized products, keyed by slug.
	 * @param array<int, array>    $store    Store products, keyed by product id.
	 * @return array<string, array>
	 */
	public static function attach_pricing( array $products, array $store ) {
		foreach ( $products as $slug => $product ) {
			$pricing = array();

			foreach ( $product['wpcom_variations'] ?? array() as $term => $product_id ) {
				if ( isset( $store[ $product_id ] ) ) {
					$pricing[ $term ] = $store[ $product_id ];
				}
			}

			$products[ $slug ]['wpcom_pricing'] = $pricing;
		}

		return $products;
	}

	/**
	 * Flattens the endpoint's variations into term => product id.
	 *
	 * @param mixed $variations Variations as the marketplace endpoint returns them.
	 * @return array<string, int>
	 */
	private static function to_variation_ids( $variations ) {
		$ids = array();

		foreach ( is_array( $variations ) ? $variations : array() as $term => $variation ) {
			$product_id = is_array( $variation ) ? (int) ( $variation['product_id'] ?? 0 ) : 0;
			if ( $product_id > 0 ) {
				$ids[ (string) $term ] = $product_id;
			}
		}

		return $ids;
	}

	/**
	 * The checkout URL for one variation, which both buys and activates the plugin.
	 *
	 * @param array  $card Normalized product data.
	 * @param string $term 'yearly' or 'monthly'.
	 * @return string Checkout URL, or an empty string when there is no such variation.
	 */
	public static function checkout_url( array $card, $term ) {
		$store_slug = $card['wpcom_pricing'][ $term ]['slug'] ?? '';
		if ( '' === $store_slug ) {
			return '';
		}

		$site_slug = wp_parse_url( home_url(), PHP_URL_HOST );

		return sprintf(
			'https://wordpress.com/checkout/%s/%s#step2',
			rawurlencode( (string) $site_slug ),
			rawurlencode( $store_slug )
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
