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
 *   - suppress_issue_types: (array) Issues to suppress for the entire project.
 *   - unsuppress_issue_types: (array) Default-suppressed issues to unsuppress for the project.
 * @return array Phan config.
 */
function make_phan_config( $dir, $options = array() ) {
	$options += array(
		'directory_list'         => array( '.' ),
		'file_list'              => array(),
		'is_wordpress'           => true,
		'exclude_file_regex'     => array(),
		'exclude_file_list'      => array(),
		'suppress_issue_types'   => array(),
		'unsuppress_issue_types' => array(),
	);

	$root = dirname( __DIR__ );

	$config = array(
		// Apparently this is only useful when upgrading from php 5, not for 7-to-8.
		'backward_compatibility_checks'   => false,

		// If we start depending on class_alias, we might need this true. For now we don't.
		'enable_class_alias_support'      => false,

		// Seems worthwhile to have these flagged for attention.
		// Probably either the type inference is wrong or the code could be simplified.
		'redundant_condition_detection'   => true,

		// Plugins to enable.
		'plugins'                         => array(
			'AddNeverReturnTypePlugin',
			'DuplicateArrayKeyPlugin',
			'DuplicateExpressionPlugin',
			'LoopVariableReusePlugin',
			'PHPUnitNotDeadCodePlugin',
			'PregRegexCheckerPlugin',
			'RedundantAssignmentPlugin',
			'SimplifyExpressionPlugin',
			'UnreachableCodePlugin',
			'UnusedSuppressionPlugin',
			'UseReturnValuePlugin',
			// Others to consider:
			// https://github.com/wikimedia/mediawiki-tools-phan/blob/master/src/Plugin/RedundantExistenceChecksPlugin.php
			// https://packagist.org/packages/mediawiki/phan-taint-check-plugin
		),

		// Issues to disable globally.
		'suppress_issue_types'            => array_merge(
			array_diff(
				array(
					// WordPress coding standards do not allow the `?:` operator.
					'PhanPluginDuplicateConditionalTernaryDuplication',
				),
				$options['unsuppress_issue_types']
			),
			$options['suppress_issue_types']
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
					// Ignore any `test`, `tests`, `Test`, and `Tests` inside `vendor` and `jetpack_vendor`.
					// Phan includes this by default, probably because various random packages don't exclude their test dirs.
					'(?:jetpack_)?vendor/.*/[tT]ests?/',
					// Ignore any `wordpress`, `jetpack_vendor`, `vendor`, and `node_modules` inside `vendor` and `jetpack_vendor`.
					// Most of these are probably from our intra-monorepo symlinks.
					'(?:jetpack_)?vendor/.*/(?:wordpress|(?:jetpack_)?vendor|node_modules)/',
					// Other stuff to ignore.
					'node_modules/',
					'tests/e2e/node_modules/',
					'wordpress/',
					'\.cache/',
				),
				$options['exclude_file_regex']
			)
		) . ')@',

		// Specific files to exclude from parsing.
		'exclude_file_list'               => $options['exclude_file_list'],

		// List directories that will be excluded from analysis (but will still be parsed).
		// Note anything here needs to be listed in `directory_list` or `file_list` to be parsed in the first place.
		'exclude_analysis_directory_list' => array(
			'jetpack_vendor/',
			'vendor/',
			"$root/vendor/",
			"$root/.phan/",
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
