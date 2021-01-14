<?php
/* HEADER */ // phpcs:ignore

/**
 * This class selects the package version for the autoloader.
 */
class Autoloader_Handler {

	/**
	 * The PHP_Autoloader instance.
	 *
	 * @var PHP_Autoloader
	 */
	private $php_autoloader;

	/**
	 * The Hook_Manager instance.
	 *
	 * @var Hook_Manager
	 */
	private $hook_manager;

	/**
	 * The Manifest_Reader instance.
	 *
	 * @var Manifest_Reader
	 */
	private $manifest_reader;

	/**
	 * The Version_Selector instance.
	 *
	 * @var Version_Selector
	 */
	private $version_selector;

	/**
	 * The constructor.
	 *
	 * @param PHP_Autoloader   $php_autoloader The PHP_Autoloader instance.
	 * @param Hook_Manager     $hook_manager The Hook_Manager instance.
	 * @param Manifest_Reader  $manifest_reader The Manifest_Reader instance.
	 * @param Version_Selector $version_selector The Version_Selector instance.
	 */
	public function __construct( $php_autoloader, $hook_manager, $manifest_reader, $version_selector ) {
		$this->php_autoloader   = $php_autoloader;
		$this->hook_manager     = $hook_manager;
		$this->manifest_reader  = $manifest_reader;
		$this->version_selector = $version_selector;
	}

	/**
	 * Activates an autoloader using the given plugins and activates it.
	 *
	 * @param string[] $plugins The plugins to initialize the autoloader for.
	 */
	public function activate_autoloader( $plugins ) {
		global $jetpack_packages_psr4;
		$jetpack_packages_psr4 = array();
		$this->manifest_reader->read_manifests( $plugins, 'vendor/composer/jetpack_autoload_psr4.php', $jetpack_packages_psr4 );

		global $jetpack_packages_classmap;
		$jetpack_packages_classmap = array();
		$this->manifest_reader->read_manifests( $plugins, 'vendor/composer/jetpack_autoload_classmap.php', $jetpack_packages_classmap );

		global $jetpack_packages_filemap;
		$jetpack_packages_filemap = array();
		$this->manifest_reader->read_manifests( $plugins, 'vendor/composer/jetpack_autoload_filemap.php', $jetpack_packages_filemap );

		$loader = new Version_Loader(
			$this->version_selector,
			$jetpack_packages_classmap,
			$jetpack_packages_psr4,
			$jetpack_packages_filemap
		);

		$this->php_autoloader->register_autoloader( $loader );

		// Now that the autoloader is active we can load the filemap.
		$loader->load_filemap();
	}

	/**
	 * Resets the active autoloader and all related global state.
	 */
	public function reset_autoloader() {
		$this->php_autoloader->unregister_autoloader();
		$this->hook_manager->reset();

		// Clear all of the autoloader globals so that older autoloaders don't do anything strange.
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = null;

		global $jetpack_packages_classmap;
		$jetpack_packages_classmap = null;

		global $jetpack_packages_psr4;
		$jetpack_packages_psr4 = null;

		global $jetpack_packages_filemap;
		$jetpack_packages_filemap = null;
	}
}
