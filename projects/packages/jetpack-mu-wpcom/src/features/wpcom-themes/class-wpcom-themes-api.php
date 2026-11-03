<?php
/**
 * Class WPCom_Themes_Api.
 * Retrieves themes from the WordPress.com themes API.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Fetches themes from the WordPress.com themes API.
 */
class WPCom_Themes_Api {

	/**
	 * The URL of the WordPress.com themes API.
	 */
	const WP_COM_THEMES_API_URL = 'https://public-api.wordpress.com/wpcom/v2/themes?_envelope=1&page=1&number=1000';

	/**
	 * The URL of the WordPress.com theme API.
	 */
	const WP_COM_THEME_API_URL = 'https://public-api.wordpress.com/rest/v1.2/themes/%s?http_envelope=1';

	/**
	 * The URL listing the partner tier, which is the one tier that is sold per theme.
	 */
	const WP_COM_PARTNER_THEMES_API_URL = 'https://public-api.wordpress.com/rest/v1.2/themes?http_envelope=1&tier=partner&number=500';

	/**
	 * WordPress.org's themes API, which can look several themes up in one request.
	 */
	const WP_ORG_THEMES_API_URL = 'https://api.wordpress.org/themes/info/1.2/';

	/**
	 * The most themes WordPress.org looks up in one request.
	 */
	const WP_ORG_BATCH_SIZE = 100;

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
	 * Returns an array of themes fetched from the WordPress.com themes API.
	 * Caching is used to avoid fetching the themes on every request.
	 *
	 * @param string $cache_key Key of the cache where the API response will be cached.
	 * @param array  $params    Query params to pass to the API URL.
	 *
	 * @return array<stdClass> An array with all the WPCom themes.
	 */
	protected function fetch_themes( string $cache_key, array $params = array() ): array {
		$url = add_query_arg( $params, self::WP_COM_THEMES_API_URL );

		return $this->cache->run_cached(
			$cache_key,
			function () use ( $url ) {
				$body = $this->handle_request( $url );

				// Null, not an empty array: run_cached() stores anything else.
				return isset( $body->themes ) && is_array( $body->themes ) ? $body->themes : null;
			}
		) ?? array();
	}

	/**
	 * Fetches the response from the given URL.
	 *
	 * @param string $url URL to fetch.
	 *
	 * @return ?stdClass Response body.
	 */
	protected function handle_request( string $url ): ?stdClass {
		$response = wp_remote_get( esc_url_raw( $url ) );
		if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body_json = json_decode( wp_remote_retrieve_body( $response ) );

			if ( isset( $body_json->body ) ) {
				return $body_json->body;
			}
		}

		return null;
	}

	/**
	 * Returns all the WP.com themes.
	 *
	 * @return array<stdClass> An array with all the WPCom themes.
	 */
	public function fetch_all_non_delisted_themes(): array {
		return $this->fetch_themes( 'wpcom-themes-all' );
	}

	/**
	 * Returns the WP.com theme with the given slug.
	 *
	 * @param string $slug Theme slug.
	 *
	 * @return stdClass|null A WPCom theme object or null if not found.
	 */
	public function fetch_theme( string $slug ): ?stdClass {
		$url = sprintf( self::WP_COM_THEME_API_URL, $slug );

		$theme = $this->cache->run_cached(
			'wpcom-themes-' . $slug,
			fn() => $this->handle_request( $url )
		);

		if ( ! $theme || isset( $theme->error ) ) {
			return null;
		}

		return $theme;
	}

	/**
	 * Returns the store products each partner theme is sold as, by theme slug.
	 *
	 * The catalog endpoint does not carry `product_details`, so the one tier that is sold per
	 * theme is read again from the endpoint that does. DOTCOM-18927.
	 *
	 * @return array<string, array<stdClass>> Product details, keyed by theme slug.
	 */
	public function fetch_partner_products(): array {
		return $this->cache->run_cached(
			'wpcom-themes-partner-products',
			function () {
				$body = $this->handle_request( self::WP_COM_PARTNER_THEMES_API_URL );

				if ( ! isset( $body->themes ) || ! is_array( $body->themes ) ) {
					return null;
				}

				$products = array();
				foreach ( $body->themes as $theme ) {
					if ( isset( $theme->id ) && is_string( $theme->id ) && ! empty( $theme->product_details ) ) {
						$products[ $theme->id ] = (array) $theme->product_details;
					}
				}

				return $products;
			}
		) ?? array();
	}

	/**
	 * Returns which of these WordPress.com themes WordPress.org also lists.
	 *
	 * Themes in the catalog share one daily lookup. Search also returns themes outside it, such as
	 * older default themes, which are looked up together and cached as a set.
	 *
	 * @param string[] $slugs Theme slugs.
	 * @return string[]|null The ones WordPress.org lists, or null when it could not be asked.
	 */
	public function fetch_wporg_slugs( array $slugs ): ?array {
		$catalog = array();
		foreach ( $this->fetch_all_non_delisted_themes() as $theme ) {
			if ( isset( $theme->id ) && is_string( $theme->id ) ) {
				$catalog[] = $theme->id;
			}
		}

		if ( array() === $catalog ) {
			return null;
		}

		$listed = $this->cache->run_cached(
			'wpcom-themes-wporg-slugs',
			fn() => $this->fetch_wporg_listed( $catalog )
		);

		$outside = array_values( array_diff( array_filter( $slugs, 'is_string' ), $catalog ) );
		if ( null !== $listed && array() !== $outside ) {
			sort( $outside );
			$also   = $this->cache->run_cached(
				'wpcom-themes-wporg-slugs-' . md5( implode( ',', $outside ) ),
				fn() => $this->fetch_wporg_listed( $outside )
			);
			$listed = null === $also ? null : array_merge( $listed, $also );
		}

		return null === $listed ? null : array_values( array_intersect( $slugs, $listed ) );
	}

	/**
	 * Asks WordPress.org which of these themes it lists, in batches it accepts.
	 *
	 * @param string[] $slugs Theme slugs.
	 * @return string[]|null The slugs it lists, or null when a batch could not be asked.
	 */
	protected function fetch_wporg_listed( array $slugs ): ?array {
		$listed = array();
		foreach ( array_chunk( $slugs, self::WP_ORG_BATCH_SIZE ) as $batch ) {
			$found = $this->fetch_wporg_batch( $batch );

			// A partial answer would read as "not on WordPress.org" for the rest.
			if ( null === $found ) {
				return null;
			}

			$listed = array_merge( $listed, $found );
		}

		return $listed;
	}

	/**
	 * Asks WordPress.org which of these themes it lists.
	 *
	 * @param string[] $slugs At most WP_ORG_BATCH_SIZE theme slugs.
	 * @return string[]|null The slugs it lists, or null when it could not be asked.
	 */
	protected function fetch_wporg_batch( array $slugs ): ?array {
		$url = add_query_arg(
			array(
				'action'  => 'theme_information',
				'request' => array(
					'slugs'  => implode( ',', $slugs ),
					'fields' => array(
						'sections'    => 0,
						'description' => 0,
						'tags'        => 0,
						'ratings'     => 0,
					),
				),
			),
			self::WP_ORG_THEMES_API_URL
		);

		$response = wp_remote_get( $url );
		$body     = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) || ! is_array( $body ) || isset( $body['error'] ) ) {
			return null;
		}

		$listed = array();
		foreach ( $body as $slug => $theme ) {
			// A theme it does not list comes back as `{ "error": "Theme not found" }`.
			if ( is_array( $theme ) && ! isset( $theme['error'] ) ) {
				$listed[] = (string) $slug;
			}
		}

		return $listed;
	}

	/**
	 * Returns the collection of the recommended WP.com themes.
	 *
	 * @return array<stdClass> An array with all the recommended WPCom themes.
	 */
	public function fetch_recommended_themes(): array {
		return $this->fetch_themes(
			'wpcom-themes-recommended',
			array( 'collection' => 'recommended' )
		);
	}

	/**
	 * Returns the WP.com themes that match the given search term.
	 *
	 * @param string $search Search term.
	 *
	 * @return array<stdClass> An array with all the matching WPCom themes.
	 */
	public function search_themes( string $search ): array {
		return $this->fetch_themes(
			'wpcom-themes-search-' . md5( $search ),
			array(
				'search' => $search,
				'sort'   => 'date',
			)
		);
	}
}
