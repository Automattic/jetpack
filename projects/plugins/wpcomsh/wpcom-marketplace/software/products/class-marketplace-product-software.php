<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Abstract class that allows to install a marketplace product.
 *
 * @since 5.2.0
 * @package WPCOM_Marketplace
 */
abstract class Marketplace_Product_Software {

	/**
	 * Product software slug. Used to install the product.
	 *
	 * @var string
	 */
	protected string $software_slug;

	/**
	 * Download URL of the product. Used to install the product if it's not managed.
	 *
	 * @var string
	 */
	protected string $download_url;

	/**
	 * List of plugin the product depends on.
	 *
	 * @var array<string>
	 */
	protected array $plugin_dependencies;

	/**
	 * List of themes the product depends on.
	 *
	 * @var array<string>
	 */
	protected array $theme_dependencies;

	/**
	 * Whether the product is managed or not.
	 *
	 * @var bool
	 */
	protected bool $is_managed;

	/**
	 * Marketplace_Product_Software constructor.
	 *
	 * @param string        $software_slug          The product slug used to install the product.
	 * @param bool          $is_managed             Whether the product is managed or not.
	 * @param string        $download_url           The download URL of the product.
	 * @param array<string> $plugin_dependencies    List of plugins the product depends on.
	 * @param array<string> $theme_dependencies     List of themes the product depends on.
	 */
	public function __construct( string $software_slug, bool $is_managed, string $download_url, array $plugin_dependencies = array(), array $theme_dependencies = array() ) {
		$this->software_slug       = $software_slug;
		$this->download_url        = $download_url;
		$this->plugin_dependencies = $plugin_dependencies;
		$this->theme_dependencies  = $theme_dependencies;
		$this->is_managed          = $is_managed;
	}

	/**
	 * Get the product software slug.
	 *
	 * @return string
	 */
	public function get_software_slug() {
		return $this->software_slug;
	}

	/**
	 * Get the product download URL.
	 *
	 * @return string
	 */
	public function get_download_url() {
		return $this->download_url;
	}

	/**
	 * Get the product plugin dependencies.
	 *
	 * @return array<string>
	 */
	public function get_plugin_dependencies() {
		return $this->plugin_dependencies;
	}

	/**
	 * Get the product theme dependencies.
	 *
	 * @return array<string>
	 */
	public function get_theme_dependencies() {
		return $this->theme_dependencies;
	}

	/**
	 * Check if the product is managed.
	 *
	 * @return bool
	 */
	public function is_managed() {
		return $this->is_managed;
	}
}
