<?php
/**
 * Class WPCom_Themes_Service.
 * Component that interacts with the WordPress.com themes API and has the business logic to filter the partner themes.
 *
 * @package wpcom-themes
 */

/**
 * WordPress.com themes service.
 */
class WPCom_Themes_Service {
	/**
	 * Mapper to map WPCom themes to WPORG themes.
	 *
	 * @var WPCom_Themes_Mapper
	 */
	private WPCom_Themes_Mapper $mapper;

	/**
	 * WordPress.com themes API.
	 *
	 * @var WPCom_Themes_Api
	 */
	private WPCom_Themes_Api $api;

	/**
	 * Valid theme tiers for Atomic sites.
	 */
	private const VALID_THEME_TIERS = array(
		'free',
		'premium',
		'personal',
		'woocommerce',
	);

	/**
	 * Class constructor.
	 *
	 * @param WPCom_Themes_Api    $api    The WordPress.com themes API.
	 * @param WPCom_Themes_Mapper $mapper The mapper to map WPCom themes to WPORG themes.
	 */
	public function __construct(
		WPCom_Themes_Api $api,
		WPCom_Themes_Mapper $mapper
	) {
		$this->api    = $api;
		$this->mapper = $mapper;
	}

	/**
	 * Filter the WP.org themes API result to include the given WordPress.com themes.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 * @param array    $wpcom_themes             The WP.com themes to include.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	protected function merge_wpcom_and_wporg_themes( stdClass $wporg_theme_api_response, array $wpcom_themes ): stdClass {
		if ( 1 === $wporg_theme_api_response->info['page'] ) {
			$wporg_theme_api_response->themes = array_merge( $wpcom_themes, $wporg_theme_api_response->themes );
		}

		$wporg_theme_api_response->info['results'] += count( $wpcom_themes );

		return $wporg_theme_api_response;
	}

	/**
	 * Filter the themes API result to include recommended WordPress.com themes.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_recommended( stdClass $wporg_theme_api_response ): stdClass {
		$wpcom_recommended_themes = $this->api->fetch_recommended_themes();
		$wpcom_recommended_themes = $this->map_and_filter_wpcom_themes( $wpcom_recommended_themes );
		return $this->merge_wpcom_and_wporg_themes( $wporg_theme_api_response, $wpcom_recommended_themes );
	}

	/**
	 * Filter the themes API result to include WordPress.com themes matching a search term.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 * @param string   $search                   Search term.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_search( stdClass $wporg_theme_api_response, string $search ): stdClass {
		$wpcom_search_themes = $this->api->search_themes( $search );
		$wpcom_search_themes = $this->map_and_filter_wpcom_themes( $wpcom_search_themes );
		return $this->merge_wpcom_and_wporg_themes( $wporg_theme_api_response, $wpcom_search_themes );
	}

	/**
	 * Get the WordPress.com themes that can be installed on Atomic sites without a subscription.
	 *
	 * @param array $wpcom_themes WPCom themes.
	 *
	 * @return array Filtered WPCom themes.
	 */
	protected function map_and_filter_wpcom_themes( array $wpcom_themes ): array {
		$themes = array();
		foreach ( $wpcom_themes as $theme ) {
			if ( $this->has_valid_theme_tier( $theme ) ) {
				$themes[] = $this->mapper->map_wpcom_to_wporg( $theme );
			}
		}

		return $themes;
	}

	/**
	 * Checks if a WPCom theme has a valid tier from Atomic sites.
	 *
	 * @param stdClass $theme The theme to check.
	 *
	 * @return bool True if the theme has a valid tier, false otherwise.
	 */
	protected function has_valid_theme_tier( stdClass $theme ): bool {
		$tier = $theme->theme_tier->slug ?? false;

		return in_array( $tier, self::VALID_THEME_TIERS, true );
	}

	/**
	 * Retrieves a WPCom theme by its slug.
	 *
	 * @param string $slug The theme slug.
	 *
	 * @return stdClass|null The theme object if found, null otherwise.
	 */
	public function get_theme( string $slug ): ?stdClass {
		$wpcom_themes = $this->api->fetch_all_themes();
		$wpcom_themes = $this->map_and_filter_wpcom_themes( $wpcom_themes );
		foreach ( $wpcom_themes as $wpcom_theme ) {
			if ( $wpcom_theme->slug === $slug ) {
				return $wpcom_theme;
			}
		}
		return null;
	}

	/**
	 * Search for a theme by its download url.
	 *
	 * @param string $url The download URL of the theme.
	 *
	 * @return stdClass|null The wporg theme object if found, null otherwise.
	 */
	public function get_theme_by_download_url( string $url ): ?stdClass {
		$wpcom_themes = $this->api->fetch_all_themes();
		foreach ( $wpcom_themes as $wpcom_theme ) {
			if ( $wpcom_theme->download_uri === $url ) {
				return $this->mapper->map_wpcom_to_wporg( $wpcom_theme );
			}
		}

		return null;
	}
}
