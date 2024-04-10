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
	const WP_COM_THEMES_API_URL = 'https://public-api.wordpress.com/rest/v1.2/themes?http_envelope=1&page=1&number=1000&collection=recommended';

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
	 * @return array<stdClass> An array with all the WPCom themes.
	 */
	public function fetch_themes() {
		return $this->cache->run_cached(
			function () {
				$response = wp_remote_get( esc_url_raw( self::WP_COM_THEMES_API_URL ) );
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
}
