<?php
/**
 * The Textdomain_Customizer class.
 *
 * @package jetpack-config
 */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents

namespace Automattic\Jetpack\Config;

use Composer\Script\Event;

/**
 * This class is used to customize the textdomain of the strings in the packages.
 */
class Textdomain_Customizer {

	/**
	 * The Composer object.
	 *
	 * @var Composer
	 */
	private $composer;

	/**
	 * The textdomain.
	 *
	 * @var string
	 */
	private $textdomain;

	/**
	 * The vendor directory.
	 *
	 * @var string
	 */
	private $vendor_dir;

	/**
	 * The constructor.
	 *
	 * @param Composer $composer a Composer object.
	 */
	public function __construct( $composer ) {
		$this->composer = $composer;
	}

	/**
	 * This method is called when composer fires the post_autoload_dump event.
	 *
	 * @param Event $event The composer event.
	 */
	public static function post_autoload_dump( Event $event ) {
		$composer = $event->getComposer();

		$instance = ( new self( $composer ) );

		/*
		 * Check the version of the Config package and bail if it's a dev version.
		 * We don't want to change files during development.
		 */
		$package = $instance->find_package( 'automattic/jetpack-config' );
		if ( $package->isDev() ) {
			return;
		}

		$instance->customize_textdomain_in_packages();
	}

	/**
	 * Find a package in the local composer repo with the input package name. No
	 * verison constraints are used to find the package.
	 *
	 * @param string $package_name The package name.
	 *
	 * @return Composer\Package|null The package object.
	 */
	private function find_package( $package_name ) {
		$local_repo = $this->composer->getRepositoryManager()->getLocalRepository();
		return $local_repo->findPackage( $package_name, '*' );
	}

	/**
	 * Traverses the project's packages. Sets the textdomain in the Jetpack
	 * packages that declare translatable files in their composer.json files.
	 */
	public function customize_textdomain_in_packages() {
		$packages = $this->get_packages();

		if ( ! is_array( $packages ) ) {
			return;
		}

		$this->set_vendor_dir();
		$this->set_textdomain();

		foreach ( $packages as $package ) {
			$jetpack_package_prefix = 'automattic/jetpack-';
			$current_package_prefix = substr( $package->getName(), 0, strlen( $jetpack_package_prefix ) );

			if ( $jetpack_package_prefix !== $current_package_prefix ) {
				// Not a Jetpack package, so skip.
				continue;
			}

			if ( $package->getExtra() && isset( $package->getExtra()['translatable'] ) ) {
				$files = (array) $package->getExtra()['translatable'];
				$this->customize_textdomain_in_files( $files );
			}
		}
	}

	/**
	 * Gets the packages in the local composer repository.
	 *
	 * @return array of Composer\Package\PackagesInterface objects.
	 */
	protected function get_packages() {
		$local_repo = $this->composer->getRepositoryManager()->getLocalRepository();
		return $local_repo->getPackages();
	}

	/**
	 * Sets the $vendor_dir instance variable using the vendor directory from
	 * the composer config.
	 */
	protected function set_vendor_dir() {
		$vendor_dir       = $this->composer->getConfig()->get( 'vendor-dir' );
		$this->vendor_dir = rtrim( $vendor_dir, '/' ) . '/';
	}

	/**
	 * Sets the textdomain instance variable using the textdomain provided by
	 * the plugin. If the plugin did not provide a textdomain, uses 'default'.
	 */
	private function set_textdomain() {
		$root_extra = $this->get_root_extra();

		if ( isset( $root_extra['textdomain'] ) &&
			is_string( $root_extra['textdomain'] ) ) {

				$this->textdomain = $root_extra['textdomain'];
				return;
		}

		$this->textdomain = 'default';
	}

	/**
	 * Returns the value of the extra section in the root packages's
	 * composer.json file.
	 *
	 * @return array mixed The root package's extra array.
	 */
	protected function get_root_extra() {
		return $this->composer->getPackage()->getExtra();
	}

	/**
	 * Sets the textdomain in the input files and directories.
	 *
	 * @param array $files The array of translatable files.
	 */
	private function customize_textdomain_in_files( $files ) {
		if ( ! is_array( $files ) ) {
			return;
		}

		foreach ( $files as $file ) {
			$file_path = realpath( $this->vendor_dir . $file );

			if ( ! $file_path ) {
				return;
			}

			if ( is_dir( $file_path ) ) {
				$this->customize_textdomain_in_dir( $file_path );
			} else {
				$this->customize_textdomain_in_file( $file_path );
			}
		}
	}

	/**
	 * Recursively traverses the input directory and sets the textdomain in
	 * all of the files.
	 *
	 * @param string $dir The path to the directory.
	 */
	private function customize_textdomain_in_dir( $dir ) {
		$file_path = realpath( $dir );

		if ( $file_path ) {
			return;
		}

		$iterator = new \RecursiveDirectoryIterator(
			$file_path,
			\RecursiveDirectoryIterator::SKIP_DOTS
		);

		foreach ( new \RecursiveIteratorIterator( $iterator ) as $file_info ) {
				$this->customize_textdomain_in_file( $file_info->getRealPath() );
		}
	}

	/**
	 * Replaces all occurrences of the placeholder textdomain JETPACK_CUSTOMIZE_TEXTDOMAIN
	 * in the input file with the plugin's textdomain.
	 *
	 * @param string $file_path The file path.
	 */
	private function customize_textdomain_in_file( $file_path ) {
		$file_path = realpath( $file_path );
		if ( ! $file_path ) {
			return;
		}

		$file_contents = file_get_contents( $file_path );

		$file_contents = str_replace(
			'JETPACK_CUSTOMIZE_TEXTDOMAIN',
			'\'' . $this->textdomain . '\'',
			$file_contents
		);

		file_put_contents( $file_path, $file_contents );
	}
}
