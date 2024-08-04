<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Class that allows to install a marketplace theme.
 *
 * @since 5.1.3
 * @package WPCOM_Marketplace
 */

/**
 * Marketplace_Theme_Software class.
 *
 * Class that allows to install a marketplace theme by generating and running the installation commands.
 */
class Marketplace_Theme_Software extends Marketplace_Product_Software implements Marketplace_Product_Installable {

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
	 * Install the theme.
	 *
	 * @return WP_Error|bool
	 */
	public function install(): WP_Error|bool {
		$commands = $this->generate_install_commands( null, $this->plugin_dependencies, $this->theme_dependencies, $this->theme_slug, $this->is_managed );
		$command  = \implode( ' && ', $commands );

		$result = WP_CLI::runcommand(
			$command,
			array(
				'launch'     => false,
				'exit_error' => false,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $this->verify_installation( $this->plugin_dependencies, array(), $this->theme_slug );
	}
}
