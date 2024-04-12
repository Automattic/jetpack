<?php
/**
 * Class WPCom_Themes_Api.
 * Retrieves themes from the WordPress.com themes API.
 *
 * @package wpcom-themes
 */

/**
 * Fetches themes from the WordPress.com themes API.
 */
class WPCom_Themes_Api {

	/**
	 * The URL of the WordPress.com themes API.
	 */
	const WP_COM_THEMES_API_URL = 'https://public-api.wordpress.com/rest/v1.2/themes?http_envelope=1&page=1&number=1000';

	/**
	 * Cache handler.
	 *
	 * @var WPCom_Themes_Cache $cache
	 */
	private WPCom_Themes_Cache $cache;

	/**
	 * Class constructor.
	 *
	 * @param WPCom_Themes_Cache $cache Cache handler
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
				$response = wp_remote_get( esc_url_raw( $url ) );
				if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
					$body_json = json_decode( wp_remote_retrieve_body( $response ) );

					if ( isset( $body_json->body->themes ) ) {
						return $body_json->body->themes;
					}
				}

				return array();
			}
		);
	}

	/**
	 * Returns all the WP.com themes.
	 *
	 * @return array<stdClass> An array with all the WPCom themes.
	 */
	public function fetch_all_themes(): array {
		return $this->fetch_themes( 'wpcom-themes-all' );
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
