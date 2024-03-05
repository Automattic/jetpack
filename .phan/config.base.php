<?php // @phpcs:disable WordPress.Files.FileName
/**
 * Base configuration for Phan. Project configs should require this and
 * make any necessary changes.
 *
 * @package automattic/jetpack
 */

// @phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- This is not WordPress

/**
 * Create a Phan configuration.
 *
 * @param string $dir Project directory.
 * @param array  $options Additional options.
 *   - directory_list: (array) Directories to scan, rather than scanning the whole project.
 *   - file_list: (array) Additional individual files to scan.
 *   - is_wordpress: (bool) Set false to not include WordPress stubs and other WordPress-specific configuration.
 *   - exclude_file_regex: (array) Additional regexes to exclude. Will be anchored at the start.
 *   - exclude_file_list: (array) Individual files to exclude.
 * @return array Phan config.
 */
function make_phan_config( $dir, $options = array() ) {
	$options += array(
		'directory_list'     => array( '.' ),
		'file_list'          => array(),
		'is_wordpress'       => true,
		'exclude_file_regex' => array(),
		'exclude_file_list'  => array(),
	);

	$root = dirname( __DIR__ );

	$config = array(
		// Apparently this is only useful when upgrading from php 5, not for 7-to-8.
		'backward_compatibility_checks'   => false,

		// Plugins to enable.
		'plugins'                         => array(
			'PHPUnitNotDeadCodePlugin',
		),

		// Directories and individual files to parse (and, by default, analyze).
		// Values are relative to the project base, and must begin with `./` for the exclude_file_regex to work right.
		// Default to scanning the whole project, and including the various WordPress stubs packages.
		'directory_list'                  => $options['directory_list'],
		'file_list'                       => array_merge(
			array(
				// Otherwise it complains about the config files trying to call this function. 😀
				__FILE__,
			),
			$options['is_wordpress'] ? array(
				"$root/vendor/php-stubs/wordpress-stubs/wordpress-stubs.php",
				"$root/vendor/php-stubs/wordpress-tests-stubs/wordpress-tests-stubs.php",
				"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php",
				"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-commands-stubs.php",
				"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-i18n-stubs.php",
			) : array(),
			$options['file_list']
		),

		// Regex to exclude files from parsing.
		'exclude_file_regex'              => '@^(?:\./)?(?:' . implode(
			'|',
			array_merge(
				array(
					// Ignore any `test`, `tests`, `Test`, `Tests`, `wordpress`, `jetpack_vendor`, `vendor`, and `node_modules` inside `vendor` and `jetpack_vendor`.
					// Most of these are probably from our intra-monorepo symlinks.
					'(?:jetpack_)?vendor/.*/(tests?|Tests?|wordpress|(?:jetpack_)?vendor|node_modules)/',
					// Other stuff to ignore.
					'node_modules/',
					'tests/e2e/node_modules/',
					'wordpress/',
					'\.cache/',
				),
				$options['exclude_file_regex'] ?? array()
			)
		) . ')@',

		// Specific files to exclude from parsing.
		'exclude_file_list'               => $options['exclude_file_list'] ?? array(),

		// List directories that will be excluded from analysis (but will still be parsed).
		// Note anything here needs to be listed in `directory_list` or `file_list` to be parsed in the first place.
		'exclude_analysis_directory_list' => array(
			'jetpack_vendor',
			'vendor',
			"$root/vendor",
		),
	);

	// Read default PHP versions to check against.
	$versions = file_get_contents( "$root/.github/versions.sh" );
	if ( preg_match( '/^MIN_PHP_VERSION=(\d+\.\d+)$/m', $versions, $m ) ) {
		$config['minimum_target_php_version'] = $m[1];
	}
	if ( preg_match( '/^MAX_PHP_VERSION=(\d+\.\d+)$/m', $versions, $m ) ) {
		$config['target_php_version'] = $m[1];
	}

	// Read minimum version from composer.json, if any is set.
	$composer = json_decode( file_get_contents( "$dir/composer.json" ), true );
	if ( isset( $composer['require']['php'] ) && preg_match( '/^>=\s*(\d+\.\d+)(?:\.\d+)?\s*$/', $composer['require']['php'], $m ) ) {
		$config['minimum_target_php_version'] = $m[1];
	}

	return $config;
}
