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
		$theme                          = new stdClass();
		$theme->name                    = $wpcom_theme->name;
		$theme->slug                    = $wpcom_theme->id;
		$theme->preview_url             = $wpcom_theme->demo_uri . '?demo=true&iframe=true&theme_preview=true';
		$theme->author                  = array( 'display_name' => $wpcom_theme->author );
		$theme->screenshot_url          = $wpcom_theme->screenshot;
		$theme->homepage                = "https://wordpress.com/theme/$wpcom_theme->id";
		$theme->description             = $wpcom_theme->description;
		$theme->is_commercial           = true;
		$theme->external_support_url    = false;
		$theme->is_community            = false;
		$theme->external_repository_url = '';
		$theme->install_url             = '';
		$theme->activate_url            = '';
		$theme->block_theme             = true;
		$theme->customize_url           = '';
		$theme->compatible_wp           = true;
		$theme->compatible_php          = true;

		return $theme;
	}
}
