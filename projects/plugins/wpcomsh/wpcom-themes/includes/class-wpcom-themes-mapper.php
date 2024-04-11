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
		// @TODO Find where the -wpcom suffix is added and remove it if possible.
		$wpcom_stylesheet = $wpcom_theme->id . '-wpcom';
		$wp_theme         = wp_get_theme( $wpcom_stylesheet );
		$current_theme    = wp_get_theme();

		$theme                       = new stdClass();
		$theme->name                 = $wpcom_theme->name;
		$theme->slug                 = $wpcom_stylesheet;
		$theme->preview_url          = $wpcom_theme->demo_uri . '?demo=true&iframe=true&theme_preview=true';
		$theme->author               = array( 'display_name' => $wpcom_theme->author );
		$theme->screenshot_url       = $wpcom_theme->screenshot;
		$theme->homepage             = "https://wordpress.com/theme/$wpcom_theme->id";
		$theme->description          = $wpcom_theme->description;
		$theme->download_link        = $wpcom_theme->download_uri;
		$theme->is_commercial        = false;
		$theme->external_support_url = false;
		$theme->is_community         = false;

		// @TODO Include block theme in API response instead of reading from installed theme.
		$theme->block_theme    = $wp_theme->is_block_theme();
		$theme->compatible_wp  = true;
		$theme->compatible_php = true;
		$theme->num_ratings    = 0;
		$theme->rating         = 0;
		$theme->requires       = '5.8';
		$theme->requires_php   = '7.4';

		// @TODO Include version in API response.
		$theme->version   = '1.0';
		$theme->active    = $wpcom_stylesheet === $current_theme->get_stylesheet();
		$theme->installed = $wp_theme->exists();

		return $theme;
	}
}
