<?php
/**
 * Class file for the factory that generates test plugin data.
 *
 * @package automattic/jetpack-autoloader
 */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
// phpcs:disable WordPress.WP.AlternativeFunctions.json_encode_json_encode
// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec

/**
 * Class Test_Plugin_Factory
 */
class Test_Plugin_Factory {

	/**
	 * The root namespace all of the test class files will live in.
	 */
	const TESTING_NAMESPACE = 'Automattic\\Jetpack\\AutoloaderTesting\\';

	/**
	 * The string representation of the current autoloader.
	 */
	const CURRENT = 'current';

	/**
	 * A constant for the autoloader version of a current plugin.
	 */
	const VERSION_CURRENT = '1000.0.0.0';

	/**
	 * Indicates whether or not the plugin is an mu-plugin.
	 *
	 * @var bool
	 */
	private $is_mu_plugin;

	/**
	 * The slug of the plugin we're creating.
	 *
	 * @var string
	 */
	private $slug;

	/**
	 * The composer autoloads that we're going to write to the configuration.
	 *
	 * @var array
	 */
	private $autoloads;

	/**
	 * The files that will be created as part of the plugin.
	 *
	 * @var array
	 */
	private $files;

	/**
	 * The version of the autoloader we want to utilize.
	 *
	 * @var string
	 */
	private $autoloader_version;

	/**
	 * The custom options we would like to pass to composer.
	 *
	 * @var string[]
	 */
	private $composer_options;

	/**
	 * Constructor.
	 *
	 * @param bool     $is_mu_plugin Indicates whether or not the plugin is an mu-plugin.
	 * @param string   $slug         The slug of the plugin.
	 * @param string[] $autoloads    The composer autoloads for the plugin.
	 */
	private function __construct( $is_mu_plugin, $slug, $autoloads ) {
		$this->is_mu_plugin = $is_mu_plugin;
		$this->slug         = $slug;
		$this->autoloads    = $autoloads;
	}

	/**
	 * Creates a new factory for the plugin and returns it.
	 *
	 * @param bool     $is_mu_plugin Indicates whether or not the plugin is an mu-plugin.
	 * @param string   $slug         The slug of the plugin we're building.
	 * @param string[] $autoloads    The composer autoloads for the plugin we're building.
	 * @return Test_Plugin_Factory
	 * @throws \InvalidArgumentException When the slug is invalid.
	 */
	public static function create( $is_mu_plugin, $slug, $autoloads ) {
		if ( false !== strpos( $slug, ' ' ) ) {
			throw new \InvalidArgumentException( 'Plugin slugs may not have spaces.' );
		}

		$slug = strtolower( preg_replace( '/[^A-Za-z0-9\-_]/', '', $slug ) );

		return new Test_Plugin_Factory( $is_mu_plugin, $slug, $autoloads );
	}

	/**
	 * Creates a new factory configured for a generic test plugin and returns it.
	 *
	 * @param bool   $is_mu_plugin Indicates whether or not the plugin is an mu-plugin.
	 * @param string $version      The version of the autoloader we want the plugin to use.
	 * @return Test_Plugin_Factory
	 */
	public static function create_test_plugin( $is_mu_plugin, $version ) {
		// We will use a global to detect when a file has been loaded by the autoloader.
		global $jetpack_autoloader_testing_loaded_files;
		if ( ! isset( $jetpack_autoloader_testing_loaded_files ) ) {
			$jetpack_autoloader_testing_loaded_files = array();
		}

		$file_version = $version;
		if ( self::CURRENT === $version ) {
			$file_version      = self::VERSION_CURRENT;
			$namespace_version = 'Current';
		} else {
			$namespace_version = 'v' . str_replace( '.', '_', $version );
		}

		// Avoid namespace collisions between plugins & mu-plugins.
		if ( $is_mu_plugin ) {
			$namespace_version .= 'mu';
		}

		// We need to define all of the autoloads that the files contained within will utilize.
		$autoloads = array(
			'classmap' => array( 'includes' ),
			'psr-4'    => array(
				self::TESTING_NAMESPACE => 'src',
			),
			'files'    => array( 'functions.php' ),
		);

		return self::create( $is_mu_plugin, str_replace( '.', '_', $version ), $autoloads )
			->with_class( 'classmap', 'Classmap_Test_Class', "\tconst VERSION = '$file_version';" )
			->with_class( 'psr-4', self::TESTING_NAMESPACE . 'SharedTestClass', "\tconst VERSION = '$file_version';" )
			->with_class( 'psr-4', self::TESTING_NAMESPACE . "$namespace_version\\UniqueTestClass", '' )
			->with_file( 'functions.php', "<?php\n\nglobal \$jetpack_autoloader_testing_loaded_files;\n\$jetpack_autoloader_testing_loaded_files[] = '$file_version';" )
			->with_autoloader_version( $version )
			->with_composer_config( array( 'config' => array( 'autoloader-suffix' => $namespace_version ) ) );
	}

	/**
	 * Calls `error_clear_last()` or emulates it.
	 */
	public static function error_clear_last() {
		if ( is_callable( 'error_clear_last' ) ) {
			// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.error_clear_lastFound
			error_clear_last();
		} else {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
			@trigger_error( '', E_USER_NOTICE );
		}
	}

	/**
	 * Adds a file to the plugin being built.
	 *
	 * @param string $path    The path for the file in the plugin directory.
	 * @param string $content The content for the file.
	 * @return $this
	 */
	public function with_file( $path, $content ) {
		$this->files[ $path ] = $content;
		return $this;
	}

	/**
	 * Adds a class file to the plugin being built.
	 *
	 * @param string $autoload_type The type of autoloading to name the file for. 'classmap', 'psr-4', 'psr-0' are options.
	 * @param string $fqn           The fully qualified name for the class.
	 * @param string $content       The content of the class.
	 * @return $this
	 * @throws \InvalidArgumentException When the input arguments are invalid.
	 */
	public function with_class( $autoload_type, $fqn, $content ) {
		if ( ! isset( $this->autoloads[ $autoload_type ] ) ) {
			throw new \InvalidArgumentException( 'The autoload type for this class is not registered with the factory.' );
		}

		// The path to the file depends on the type of autoloading it utilizes.
		$fqn = ltrim( $fqn, '\\' );
		if ( false !== strpos( $fqn, '\\' ) ) {
			$class_name = substr( $fqn, strripos( $fqn, '\\' ) + 1 );
			$namespace  = substr( $fqn, 0, -strlen( $class_name ) - 1 );
		} else {
			$class_name = $fqn;
			$namespace  = null;
		}

		$path = null;
		switch ( $autoload_type ) {
			case 'classmap':
				$path = 'includes' . DIRECTORY_SEPARATOR . 'class-' . strtolower( str_replace( '_', '-', $class_name ) ) . '.php';
				break;

			case 'psr-0':
			case 'psr-4':
				// Find the associated autoload entry so we can create the correct path.
				$autoload_namespaces = $this->autoloads[ $autoload_type ];
				foreach ( $autoload_namespaces as $autoload_namespace => $dir ) {
					if ( is_array( $dir ) ) {
						throw new \InvalidArgumentException( 'The factory only supports single mapping for PSR-0/PSR-4 namespaces.' );
					}

					$check = substr( $namespace . '\\', 0, strlen( $autoload_namespace ) );
					if ( $autoload_namespace !== $check ) {
						continue;
					}

					// Build a path using the rest of the namespace.
					$path      = $dir . DIRECTORY_SEPARATOR;
					$structure = explode( '\\', substr( $namespace, strlen( $check ) ) );
					foreach ( $structure as $s ) {
						$path .= $s . DIRECTORY_SEPARATOR;
					}
					break;
				}

				if ( ! isset( $path ) ) {
					throw new \InvalidArgumentException( 'The namespace for this class is not in the factory\'s autoloads.' );
				}

				// PSR-0 treats underscores in the class name as directory separators.
				$path .= str_replace( '_', 'psr-0' === $autoload_type ? DIRECTORY_SEPARATOR : '', $class_name ) . '.php';
				break;

			default:
				throw new \InvalidArgumentException( 'The given autoload type is invalid.' );
		}

		$file_content = "<?php\n\n";
		if ( isset( $namespace ) ) {
			$file_content .= "namespace $namespace;\n\n";
		}
		$file_content .= "class $class_name {\n$content\n}";

		return $this->with_file( $path, $file_content );
	}

	/**
	 * Declares the version of the autoloader that the plugin should use. When "current" is passed the package
	 * will use a symlink to the local package instead of an external dependency.
	 *
	 * @param string $version The version of autoloader to use. Pass "current" to use the local package.
	 * @return $this
	 */
	public function with_autoloader_version( $version ) {
		$this->autoloader_version = $version;
		return $this;
	}

	/**
	 * Adds options that will be passed to the plugin's composer.json file.
	 *
	 * @param string[] $options The options that we want to set in the composer config.
	 * @return $this
	 */
	public function with_composer_config( $options ) {
		$this->composer_options = $options;
		return $this;
	}

	/**
	 * Brings the plugin to life and returns the absolute path to the plugin directory.
	 *
	 * @return string
	 * @throws \RuntimeException When the factory fails to initialize composer.
	 */
	public function make() {
		if ( $this->is_mu_plugin ) {
			$plugin_dir = WPMU_PLUGIN_DIR . DIRECTORY_SEPARATOR . $this->slug;
		} else {
			$plugin_dir = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $this->slug;
		}

		$plugin_file     = "<?php\n/**\n * Plugin Name: {$this->slug}\n */\n";
		$composer_config = $this->build_composer_config();

		// Don't write the plugin if it hasn't changed.
		if ( ! $this->has_plugin_changed( $plugin_dir, $plugin_file, $composer_config ) ) {
			return $plugin_dir;
		}

		// We want a clean directory to ensure files get removed.
		$this->remove_directory( $plugin_dir );

		// Start by writing the main plugin file.
		mkdir( $plugin_dir, 0777, true );
		file_put_contents( $plugin_dir . DIRECTORY_SEPARATOR . $this->slug . '.php', $plugin_file );

		// Write all of the files into the plugin directory.
		foreach ( $this->files as $path => $content ) {
			$dir = dirname( $plugin_dir . DIRECTORY_SEPARATOR . $path );
			if ( ! is_dir( $dir ) ) {
				mkdir( $dir, 0777, true );
			}

			file_put_contents( $plugin_dir . DIRECTORY_SEPARATOR . $path, $content );
		}

		// We also need to write the composer configuration for the plugin.
		file_put_contents(
			$plugin_dir . DIRECTORY_SEPARATOR . 'composer.json',
			json_encode( $composer_config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES )
		);

		// Now that our plugin folder is ready let's install it.
		$this->execute_composer( $plugin_dir );

		return $plugin_dir;
	}

	/**
	 * Indicates whether or not we are linking to the local package.
	 *
	 * @return bool
	 */
	private function is_using_local_package() {
		return self::CURRENT === $this->autoloader_version;
	}

	/**
	 * Creates and returns the configuration for the composer.json file.
	 *
	 * @return array
	 */
	private function build_composer_config() {
		$composer_config = array(
			'name'     => 'testing/' . $this->slug,
			'autoload' => $this->autoloads,
		);
		if ( $this->is_using_local_package() ) {
			$composer_config['require']      = array( 'automattic/jetpack-autoloader' => 'dev-trunk' );
			$composer_config['repositories'] = array(
				array(
					'type'    => 'path',
					'url'     => TEST_PACKAGE_DIR,
					'options' => array(
						'symlink' => true,
					),
				),
			);
		} elseif ( isset( $this->autoloader_version ) ) {
			$composer_config['require'] = array( 'automattic/jetpack-autoloader' => $this->autoloader_version );
		}

		if ( isset( $this->composer_options ) ) {
			$composer_config = array_merge( $composer_config, $this->composer_options );
		}

		return $composer_config;
	}

	/**
	 * Downloads the appropriate version of Composer and executes an install in the plugin directory.
	 *
	 * @param string $plugin_dir The plugin directory we want to execute Composer in.
	 * @throws \RuntimeException When Composer fails to execute.
	 */
	private function execute_composer( $plugin_dir ) {
		// Due to changes in the autoloader over time we cannot assume that whatever version of composer
		// the developer has installed is compatible. To address these differences we will download a
		// composer package that is compatible based on ranges of autoloader versions.
		$composer_versions = array(
			'2.0.9'   => array(
				'min'    => '2.6.0',
				'url'    => 'https://getcomposer.org/download/2.0.9/composer.phar',
				'sha256' => '8e91344a5ca2fc0fb583c50f195a1f36918908561c4ea3d6f01a4ef01c3b8560',
			),
			// Version 2.0.6 of Composer changed a base class we used to inherit in a way that throws fatals.
			'2.0.5'   => array(
				'min'    => '2.0.0',
				'url'    => 'https://getcomposer.org/download/2.0.5/composer.phar',
				'sha256' => 'e786d1d997efc1eb463d7447394b6ad17a144afcf8e505a3ce3cb0f60c3302f9',
			),
			// Version 2.x support was not added until the 2.x version of the autoloader.
			'1.10.20' => array(
				'min'    => '1.0.0',
				'url'    => 'https://getcomposer.org/download/1.10.20/composer.phar',
				'sha256' => 'e70b1024c194e07db02275dd26ed511ce620ede45c1e237b3ef51d5f8171348d',
			),
		);
		// Make sure that we're iterating from the oldest Composer version to the newest.
		uksort( $composer_versions, 'version_compare' );

		// When we're not installing the autoloader we can just use the latest version.
		if ( ! isset( $this->autoloader_version ) ) {
			$selected = '2.0.9';
		} else {
			// Find the latest version of Composer that is compatible with our autoloader.
			$version  = self::CURRENT === $this->autoloader_version ? self::VERSION_CURRENT : $this->autoloader_version;
			$selected = null;
			foreach ( $composer_versions as $composer_version => $data ) {
				if ( version_compare( $version, $data['min'], '<' ) ) {
					break;
				}

				$selected = $composer_version;
			}
		}

		// Download the selected version of Composer if we haven't already done so.
		$composer_bin = TEST_TEMP_BIN_DIR . DIRECTORY_SEPARATOR . 'composer_' . str_replace( '.', '_', $selected ) . '.phar';
		if ( ! file_exists( $composer_bin ) ) {
			$data = $composer_versions[ $selected ];
			self::error_clear_last();
			$content = file_get_contents( $data['url'] );
			if ( false === $content ) {
				$err = error_get_last();
				$err = $err ? $err['message'] : 'unknown error';
				throw new \RuntimeException( "Failed to download {$data['url']}: $err" );
			}
			if ( hash( 'sha256', $content ) !== $data['sha256'] ) {
				throw new \RuntimeException( 'The Composer file downloaded has a different SHA256 than expected.' );
			}
			file_put_contents( $composer_bin, $content );
		}

		// We can finally execute Composer now that we're ready.
		putenv( 'COMPOSER_HOME=' . TEST_TEMP_BIN_DIR ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv
		exec( 'php ' . escapeshellarg( $composer_bin ) . ' install -q -d ' . escapeshellarg( $plugin_dir ) );
		if ( ! is_file( $plugin_dir . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php' ) ) {
			throw new \RuntimeException( 'Unable to execute the `' . $composer_bin . '` archive for tests.' );
		}
		if ( isset( $this->autoloader_version ) && ! is_file( $plugin_dir . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload_packages.php' ) ) {
			throw new \RuntimeException( 'Failed to install the autoloader.' );
		}

		// Local autoloaders require using the branch but we may not want to treat it as a developer build.
		if ( $this->is_using_local_package() ) {
			$manifest_dir = $plugin_dir . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'composer' . DIRECTORY_SEPARATOR;
			$manifests    = array( 'jetpack_autoload_classmap.php', 'jetpack_autoload_psr4.php', 'jetpack_autoload_psr0.php', 'jetpack_autoload_filemap.php' );
			foreach ( $manifests as $manifest ) {
				$manifest = $manifest_dir . $manifest;
				if ( ! is_file( $manifest ) ) {
					continue;
				}

				$content = file_get_contents( $manifest );
				// Use a sufficiently large version so that the local package will always be the latest autoloader.
				$content = str_replace( 'dev-trunk', self::VERSION_CURRENT, $content );
				file_put_contents( $manifest, $content );
			}
		}
	}

	/**
	 * Recursively removes a directory and all of its files.
	 *
	 * @param string $dir The directory to remove.
	 */
	private function remove_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$empty_directories    = array();
		$directories_to_empty = array( $dir );
		// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
		while ( null !== ( $dir = array_shift( $directories_to_empty ) ) ) {
			$paths = scandir( $dir );
			foreach ( $paths as $path ) {
				if ( '.' === $path || '..' === $path ) {
					continue;
				}
				// Keep the path absolute.
				$path = $dir . DIRECTORY_SEPARATOR . $path;

				// Subdirectories need to be emptied before they can be deleted.
				// Take care not to follow symlinks as it will destroy everything.
				if ( is_dir( $path ) && ! is_link( $path ) ) {
					$directories_to_empty[] = $path;
					continue;
				}

				unlink( $path );
			}

			// Add to the front so that we delete children before parents.
			array_unshift( $empty_directories, $dir );
		}

		foreach ( $empty_directories as $dir ) {
			rmdir( $dir );
		}
	}

	/**
	 * Checks whether or not the plugin should be written to disk.
	 *
	 * @param string $plugin_dir      The directory we want to write the plugin to.
	 * @param string $plugin_file     The content for the plugin file.
	 * @param array  $composer_config The content for the composer.json file.
	 * @return bool
	 */
	private function has_plugin_changed( $plugin_dir, $plugin_file, &$composer_config ) {
		// Always write clean plugins.
		if ( ! is_file( $plugin_dir . DIRECTORY_SEPARATOR . 'composer.json' ) ) {
			return true;
		}

		// Prepare a checksum object for comparison and store it in the composer config so we can retrieve it later.
		$factory_checksum = array(
			'plugin'   => hash( 'crc32', $plugin_file ),
			'composer' => hash( 'crc32', json_encode( $composer_config ) ),
			'files'    => array(),
		);
		foreach ( $this->files as $path => $content ) {
			$factory_checksum['files'][ $path ] = hash( 'crc32', $content );
		}

		// When we're using the local package it is important that we also include the autoloader files in the checksum
		// since they would indicate a change in the package that warrants rebuilding the autoloader as well.
		if ( $this->is_using_local_package() ) {
			$factory_checksum['autoloader-files'] = array();

			$src_dir          = TEST_PACKAGE_DIR . DIRECTORY_SEPARATOR . 'src';
			$autoloader_files = scandir( $src_dir );
			foreach ( $autoloader_files as $file ) {
				if ( '.' === $file || '..' === $file ) {
					continue;
				}

				$factory_checksum['autoloader-files'][ $file ] = hash_file( 'crc32', $src_dir . DIRECTORY_SEPARATOR . $file );
			}
		}

		$composer_config['extra']['test-plugin-checksum'] = $factory_checksum;

		// Retrieve the checksum from the existing plugin so that we can detect whether or not the plugin has changed.
		$config = json_decode( file_get_contents( $plugin_dir . DIRECTORY_SEPARATOR . 'composer.json' ), true );
		if ( false === $config || ! isset( $config['extra']['test-plugin-checksum'] ) ) {
			return true;
		}

		// Only write the plugin to disk if it has changed.
		return $config['extra']['test-plugin-checksum'] !== $factory_checksum;
	}
}
