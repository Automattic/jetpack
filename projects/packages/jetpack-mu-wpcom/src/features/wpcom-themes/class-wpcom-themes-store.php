<?php
/**
 * Class WPCom_Themes_Store.
 * How a theme is sold, and whether it is already paid for.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Reads the WordPress.com store for the themes a plan does not grant.
 *
 * Only the partner tier is sold this way: every other tier comes with a plan, which
 * WPCom_Themes_Tiers answers for. Prices are left out: the store quotes a request in the
 * currency of wherever it came from, so only the browser can ask for the reader's own.
 */
class WPCom_Themes_Store {

	/**
	 * The billing term a theme is offered by here.
	 *
	 * Yearly, as the plugins Marketplace tab offers plugins: the cheaper of the two terms,
	 * and one price rather than a choice to make on a card.
	 */
	const TERM = 'year';

	/**
	 * The store's name for a theme sold on its own.
	 */
	const PRODUCT_TYPE = 'marketplace_theme';

	/**
	 * The store's catalog, which the browser reads again to price a theme for its reader.
	 */
	const PRODUCTS_URL = 'https://public-api.wordpress.com/rest/v1.1/products';

	/**
	 * Cache handler.
	 *
	 * @var WPCom_Themes_Cache $cache
	 */
	private WPCom_Themes_Cache $cache;

	/**
	 * Class constructor.
	 *
	 * @param WPCom_Themes_Cache $cache Cache handler.
	 */
	public function __construct( WPCom_Themes_Cache $cache ) {
		$this->cache = $cache;
	}

	/**
	 * Every theme the store sells, by product slug.
	 *
	 * @return array<string, array{term: string, billing_slug: string}>
	 */
	public function products(): array {
		return $this->cache->run_cached(
			'wpcom-themes-store-products',
			fn() => $this->fetch_products()
		) ?? array();
	}

	/**
	 * The billing products this site already subscribes to.
	 *
	 * Billing slugs rather than product slugs, so a theme bought by the month is still
	 * recognised as bought. Calypso's isMarketplaceThemeSubscribed matches the same way.
	 *
	 * @return array<string> Billing product slugs.
	 */
	public function subscriptions(): array {
		$slugs = array();

		foreach ( (array) wpcom_themes_get_purchases() as $purchase ) {
			$slug = is_object( $purchase ) ? ( $purchase->billing_product_slug ?? '' ) : '';

			if ( is_string( $slug ) && '' !== $slug ) {
				$slugs[] = $slug;
			}
		}

		return $slugs;
	}

	/**
	 * Reads the store catalog, keeping the themes in it.
	 *
	 * @return array<string, array>|null Null when the store could not be read, which is not cached.
	 */
	private function fetch_products(): ?array {
		$response = $this->request( '/products' );

		if ( null === $response ) {
			return null;
		}

		$products = array();
		foreach ( $response as $slug => $product ) {
			if ( ! is_array( $product ) || self::PRODUCT_TYPE !== ( $product['product_type'] ?? '' ) ) {
				continue;
			}

			// A product the store has withdrawn cannot be bought, so it is not offered.
			if ( false === ( $product['available'] ?? true ) ) {
				continue;
			}

			$products[ (string) $slug ] = array(
				'term'         => (string) ( $product['product_term'] ?? '' ),
				'billing_slug' => (string) ( $product['billing_product_slug'] ?? '' ),
			);
		}

		return $products;
	}

	/**
	 * Asks WordPress.com as whoever is reading, which is who checkout would charge.
	 *
	 * @param string $path Store API path.
	 * @return array|null Decoded body, or null when the request failed.
	 */
	private function request( string $path ): ?array {
		// wpcom_json_api_request_as_user does not support internal requests.
		$as = defined( 'IS_WPCOM' ) && IS_WPCOM
			? 'wpcom_json_api_request_as_blog'
			: 'wpcom_json_api_request_as_user';

		if ( ! method_exists( Client::class, $as ) ) {
			return null;
		}

		$response = Client::$as( $path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return is_array( $body ) ? $body : null;
	}
}
