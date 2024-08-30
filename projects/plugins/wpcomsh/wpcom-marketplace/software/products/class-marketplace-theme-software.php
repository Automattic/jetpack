<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that contains all the data required to install a theme.
 *
 * @since 5.5.0
 * @package WPCOM_Marketplace
 */

/**
 * Marketplace theme software.
 *
 * Class that represents the software of a marketplace theme.
 */
class Marketplace_Theme_Software extends Marketplace_Product_Software {

	/**
	 * Theme slug.
	 *
	 * @var string
	 */
	protected string $theme_slug;

	/**
	 * Marketplace_Theme_Software constructor.
	 *
	 * @param string        $software_slug      The theme slug used to install the theme.
	 * @param bool          $is_managed         Whether the theme is managed or not.
	 * @param string        $download_url       The download URL of the theme.
	 * @param array<string> $dependency_plugins List of plugins the theme depends on.
	 */
	public function __construct( string $software_slug, bool $is_managed, string $download_url, array $dependency_plugins = array() ) {
		parent::__construct( $software_slug, $is_managed, $download_url, $dependency_plugins );
		$this->theme_slug = $software_slug;
	}

	/**
	 * Get the theme slug.
	 *
	 * @return string
	 */
	public function get_theme_slug(): string {
		return $this->theme_slug;
	}
}
