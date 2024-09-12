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
	 * Theme merge strategy collection.
	 *
	 * @var WPCom_Themes_Merger
	 */
	private WPCom_Themes_Merger $merger;

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
	 * @param WPCom_Themes_Merger $merger The theme merge strategy collection.
	 */
	public function __construct(
		WPCom_Themes_Api $api,
		WPCom_Themes_Mapper $mapper,
		WPCom_Themes_Merger $merger
	) {
		$this->api    = $api;
		$this->mapper = $mapper;
		$this->merger = $merger;
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

		return $this->merger->merge_by_wpcom_first( $wporg_theme_api_response, $wpcom_recommended_themes );
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

		return $this->merger->merge_by_wpcom_first( $wporg_theme_api_response, $wpcom_search_themes );
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
		$wpcom_theme = $this->api->fetch_theme( $slug );

		if ( ! $wpcom_theme ) {
			return null;
		}

		return $this->mapper->map_wpcom_to_wporg( $wpcom_theme );
	}

	/**
	 * Returns a list of themes that include WPCom themes sorted by release date.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_latest( stdClass $wporg_theme_api_response ): stdClass {
		$wpcom_themes = $this->api->fetch_all_non_delisted_themes();
		$wpcom_themes = $this->map_and_filter_wpcom_themes( $wpcom_themes );

		return $this->merger->merge_by_release_date( $wporg_theme_api_response, $wpcom_themes );
	}

	/**
	 * Returns a list of themes that include WPCom block themes sorted by release date.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_block_themes( stdClass $wporg_theme_api_response ): stdClass {
		$wpcom_themes = $this->api->fetch_all_non_delisted_themes();
		$wpcom_themes = array_filter(
			$wpcom_themes,
			fn( $theme ) => $theme->block_theme
		);
		$wpcom_themes = $this->map_and_filter_wpcom_themes( $wpcom_themes );

		return $this->merger->merge_by_release_date( $wporg_theme_api_response, $wpcom_themes );
	}

	/**
	 * Returns a list of themes that include WPCom themes filtered by tags.
	 *
	 * @param stdClass $wporg_theme_api_response The WP.org themes API result.
	 * @param array    $tags                     The tags to filter by.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_feature_filter( stdClass $wporg_theme_api_response, array $tags ): stdClass {
		$wpcom_themes = $this->api->fetch_all_non_delisted_themes();
		$wpcom_themes = $this->map_and_filter_wpcom_themes( $wpcom_themes );

		$wpcom_themes = array_filter(
			$wpcom_themes,
			fn( $theme ) => (bool) array_intersect( $tags, $theme->tags )
		);

		return $this->merger->merge_by_wpcom_first( $wporg_theme_api_response, $wpcom_themes );
	}
}
