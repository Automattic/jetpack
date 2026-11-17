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
	 * @param bool     $prefer_wporg             Whether a theme WordPress.org also lists is left to it.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result_search( stdClass $wporg_theme_api_response, string $search, bool $prefer_wporg = false ): stdClass {
		$wpcom_search_themes = $this->api->search_themes( $search );

		if ( $prefer_wporg ) {
			$wpcom_search_themes = $this->without_wporg_themes( $wpcom_search_themes );
		}

		$wpcom_search_themes = $this->map_and_filter_wpcom_themes( $wpcom_search_themes );

		return $this->merger->merge_by_wpcom_first( $wporg_theme_api_response, $wpcom_search_themes );
	}

	/**
	 * Leaves out the themes WordPress.org also lists, so its copy shows wherever it ranks them.
	 *
	 * @param array $wpcom_themes WPCom themes.
	 *
	 * @return array The rest, or all of them when WordPress.org could not be asked, as before.
	 */
	protected function without_wporg_themes( array $wpcom_themes ): array {
		// The lookup ships in jetpack-mu-wpcom, which an older copy may be loaded from.
		$wporg = method_exists( $this->api, 'fetch_wporg_slugs' )
			? $this->api->fetch_wporg_slugs( array_column( $wpcom_themes, 'id' ) )
			: null;

		if ( null === $wporg ) {
			return $wpcom_themes;
		}

		$wporg = array_flip( $wporg );

		return array_values(
			array_filter(
				$wpcom_themes,
				fn( $theme ) => ! isset( $wporg[ $theme->id ?? '' ] )
			)
		);
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
	 * Whether core's Add Themes tabs should offer a WPCom theme on this site.
	 *
	 * Partner themes need their own subscription rather than a plan, so these tabs leave them to
	 * the Marketplace tab, which lists them in order to sell them.
	 *
	 * @param stdClass $theme The theme to check.
	 *
	 * @return bool True if the theme has a valid tier, false otherwise.
	 */
	protected function has_valid_theme_tier( stdClass $theme ): bool {
		$tier = WPCom_Themes_Tiers::tier_of( $theme );

		return 'partner' !== $tier && WPCom_Themes_Tiers::site_can_use( $tier );
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
