<?php
/**
 * Class WPCom_Themes_Mapper.
 * Responsible for mapping theme objects between WPCom and WPOrg formats.
 *
 * @package wpcom-themes
 */

/**
 * Maps theme objects between WPCom and WPOrg formats.
 */
class WPCom_Themes_Mapper {

	/**
	 * Maps a WPCom theme object to a WPOrg theme object.
	 *
	 * @param stdClass $wpcom_theme WPCom theme object.
	 *
	 * @return stdClass WPOrg theme object.
	 */
	public function map_wpcom_to_wporg( stdClass $wpcom_theme ): stdClass {
		$wp_theme      = wp_get_theme( $wpcom_theme->id );
		$current_theme = wp_get_theme();

		$theme                 = new stdClass();
		$theme->name           = $wpcom_theme->name;
		$theme->slug           = $wpcom_theme->id;
		$theme->preview_url    = $wpcom_theme->demo_uri . '?demo=true&iframe=true&theme_preview=true';
		$theme->author         = array( 'display_name' => $wpcom_theme->author );
		$theme->screenshot_url = $wpcom_theme->screenshot;
		$theme->homepage       = "https://wordpress.com/theme/$wpcom_theme->id";
		$theme->description    = $wpcom_theme->description;

		// Some themes returned by the API do not have a download URI, but they are installable since they're managed by WP.com.
		// In those cases we generate a fake download url so that we can find the theme by download url even though it's not a real download link.
		$theme->download_link        = $wpcom_theme->download_uri ?? $wpcom_theme->id;
		$theme->is_commercial        = false;
		$theme->external_support_url = false;
		$theme->is_community         = false;
		$theme->compatible_wp        = true;
		$theme->compatible_php       = true;
		$theme->num_ratings          = 0;
		$theme->rating               = 0;
		$theme->requires             = '5.8';
		$theme->requires_php         = '7.4';
		$theme->active               = $wpcom_theme->id === $current_theme->get_stylesheet();
		$theme->installed            = $wp_theme->exists();
		$theme->block_theme          = $wpcom_theme->block_theme;
		$theme->version              = $wpcom_theme->version;
		$theme->creation_time        = $wpcom_theme->date_added;
		$theme->is_wpcom_theme       = true;

		return $theme;
	}
}
