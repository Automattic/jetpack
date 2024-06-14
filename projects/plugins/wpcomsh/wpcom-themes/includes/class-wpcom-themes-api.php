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
	 * The URL of the WordPress.com theme API.
	 */
	const WP_COM_THEME_API_URL = 'https://public-api.wordpress.com/rest/v1.2/themes/%s?http_envelope=1';

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
			fn() => $this->handle_request( $url )->themes ?? array()
		);
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
