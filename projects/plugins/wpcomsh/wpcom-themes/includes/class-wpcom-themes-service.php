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
	 * Filter the themes API result to include WordPress.com themes.
	 *
	 * @param stdClass $res The themes API result.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function filter_themes_api_result( stdClass $res ): stdClass {
		$wpcom_themes = $this->get_themes();

		if ( 1 === $res->info['page'] ) {
			$res->themes = array_merge( $wpcom_themes, $res->themes );
		}

		$res->info['results'] += count( $wpcom_themes );

		return $res;
	}

	/**
	 * Get the WordPress.com themes that can be installed on Atomic sites without a subscription.
	 *
	 * @return array WPCom themes.
	 */
	public function get_themes(): array {
		$wpcom_themes = $this->api->fetch_themes();

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
}
