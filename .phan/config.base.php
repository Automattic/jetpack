<?php // @phpcs:disable WordPress.Files.FileName
/**
 * Base configuration for Phan. Project configs should require this and
 * make any necessary changes.
 *
 * @package automattic/jetpack
 */

// @phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- This is not WordPress
// @phpcs:disable WordPress.WP.CapitalPDangit.MisspelledInComment -- It's filename constants.
// @phpcs:disable WordPress.WP.CapitalPDangit.MisspelledInText -- It's filename constants.

/**
 * Create a Phan configuration.
 *
 * @param string $dir Project directory.
 * @param array  $options Additional options.
 *   - directory_list: (array) Directories to scan, rather than scanning the whole project.
 *   - exclude_analysis_directory_list: (array) Directories to exclude from analysis.
 *   - exclude_file_list: (array) Individual files to exclude.
 *   - exclude_file_regex: (array) Additional regexes to exclude. Will be anchored at the start.
 *   - file_list: (array) Additional individual files to scan.
 *   - globals_type_map: (array) Map of global name (no `$`) to Phan type. Class names should be prefixed with `\`.
 *   - parse_file_list: (array) Files to parse but not analyze. Equivalent to listing in both 'file_list' and 'exclude_analysis_directory_list'.
 *   - php_extensions_needed: (array) Stubs provided by Phan to use with various PHP extensions like xdebug, zip, etc. See https://github.com/phan/phan/wiki/How-To-Use-Stubs#internal-stubs.
 *   - stubs: (array) Predefined stubs to load. Default is `array( 'wordpress', 'wp-cli' )`.
 *      - akismet: Stubs from .phan/stubs/akismet-stubs.php.
 *      - amp: Stubs from .phan/stubs/amp-stubs.php.
 *      - full-site-editing: Stubs from .phan/stubs/full-site-editing-stubs.php.
 *      - photon-opencv: Stubs from .phan/stubs/photon-opencv-stubs.php.
 *      - woocommerce: Stubs from php-stubs/woocommerce.
 *      - woocommerce-internal: Stubs from .phan/stubs/woocommerce-internal-stubs.php.
 *      - woocommerce-packages: Stubs from php-stubs/woocommerce.
 *      - woopayments: Stubs from .phan/stubs/woocommerce-payments-stubs.php.
 *      - wordpress: Stubs from php-stubs/wordpress-stubs, php-stubs/wordpress-tests-stubs, php-stubs/wp-cli-stubs, .phan/stubs/wordpress-constants.php, and .phan/stubs/wordpress-globals.jsonc.
 *      - wp-cli: Stubs from php-stubs/wp-cli-stubs.
 *      - wpcom: Stubs from .phan/stubs/wpcom-stubs.php, plus some stuff from wpcomsh.
 *   - +stubs: (array) Like 'stubs', but setting this does not clear the defaults.
 *   - suppress_issue_types: (array) Issues to suppress for the entire project.
 *   - unsuppress_issue_types: (array) Default-suppressed issues to unsuppress for the project.
 * @return array Phan config.
 * @throws InvalidArgumentException If something is detected as invalid.
 */
function make_phan_config( $dir, $options = array() ) {
	$options += array(
		'directory_list'                  => array( '.' ),
		'exclude_analysis_directory_list' => array(),
		'exclude_file_list'               => array(),
		'exclude_file_regex'              => array(),
		'file_list'                       => array(),
		'globals_type_map'                => array(),
		'parse_file_list'                 => array(),
		'php_extensions_needed'           => array(),
		'stubs'                           => array( 'wordpress', 'wp-cli' ),
		'+stubs'                          => array(),
		'suppress_issue_types'            => array(),
		'unsuppress_issue_types'          => array(),
	);

	$root = dirname( __DIR__ );

	$stubs          = array();
	$extra_stubs    = array();
	$global_stubs   = array();
	$internal_stubs = array();
	foreach ( array_merge( $options['stubs'], $options['+stubs'] ) as $stub ) {
		switch ( $stub ) {
			case 'akismet':
				$stubs[] = "$root/.phan/stubs/akismet-stubs.php";
				break;
			case 'amp':
				$stubs[] = "$root/.phan/stubs/amp-stubs.php";
				break;
			case 'full-site-editing':
				$stubs[] = "$root/.phan/stubs/full-site-editing-stubs.php";
				break;
			case 'photon-opencv':
				$stubs[] = "$root/.phan/stubs/photon-opencv-stubs.php";
				break;
			case 'woocommerce':
				$stubs[] = "$root/vendor/php-stubs/woocommerce-stubs/woocommerce-stubs.php";
				break;
			case 'woocommerce-internal':
				$stubs[] = "$root/.phan/stubs/woocommerce-internal-stubs.php";
				break;
			case 'woocommerce-packages':
				$stubs[] = "$root/vendor/php-stubs/woocommerce-stubs/woocommerce-packages-stubs.php";
				break;
			case 'woopayments':
				$stubs[] = "$root/.phan/stubs/woocommerce-payments-stubs.php";
				break;
			case 'wordpress':
				$stubs[]        = "$root/vendor/php-stubs/wordpress-stubs/wordpress-stubs.php";
				$stubs[]        = "$root/vendor/php-stubs/wordpress-tests-stubs/wordpress-tests-stubs.php";
				$stubs[]        = "$root/.phan/stubs/wordpress-constants.php";
				$global_stubs[] = "$root/.phan/stubs/wordpress-globals.jsonc";
				break;
			case 'wp-cli':
				$stubs[] = "$root/vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php";
				$stubs[] = "$root/vendor/php-stubs/wp-cli-stubs/wp-cli-commands-stubs.php";
				$stubs[] = "$root/vendor/php-stubs/wp-cli-stubs/wp-cli-i18n-stubs.php";
				break;
			case 'wpcom':
				$stubs[] = "$root/.phan/stubs/wpcom-stubs.php";
				if ( $dir !== "$root/projects/plugins/wpcomsh" ) {
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/feature-plugins/nav-redesign.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/footer-credit/footer-credit/customizer.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/footer-credit/theme-optimizations.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/lib/require-lib.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/logo-tool/logo-tool.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/wpcom-features/class-wpcom-features.php";
					$extra_stubs[] = "$root/projects/plugins/wpcomsh/wpcom-features/functions-wpcom-features.php";
				}
				break;
			default:
				throw new InvalidArgumentException( "Unknown stub '$stub'" );
		}
	}

	$globals = array();
	foreach ( $global_stubs as $file ) {
		$contents = preg_replace( '#^\s*//.*$#m', '', file_get_contents( $file ) );
		$globals  = array_merge( $globals, json_decode( $contents, true ) );
	}

	'@phan-var non-empty-array $options["php_extensions_needed"]';
	foreach ( $options['php_extensions_needed'] as $stub ) {
		$stub_file_path = "$root/vendor/phan/phan/.phan/internal_stubs/$stub.phan_php";
		if ( ! file_exists( $stub_file_path ) ) {
			throw new InvalidArgumentException( "Can not load internal stubs for '$stub': file $stub_file_path does not exist." );
		}
		$internal_stubs[ $stub ] = $stub_file_path;
	}

	$config = array(
		// Apparently this is only useful when upgrading from php 5, not for 7-to-8.
		'backward_compatibility_checks'          => false,

		// If we start depending on class_alias, we might need this true. For now we don't.
		'enable_class_alias_support'             => false,

		// Seems worthwhile to have these flagged for attention.
		// Probably either the type inference is wrong or the code could be simplified.
		'redundant_condition_detection'          => true,

		// Plugins to enable.
		'plugins'                                => array(
			'AddNeverReturnTypePlugin',
			'DuplicateArrayKeyPlugin',
			'DuplicateExpressionPlugin',
			'LoopVariableReusePlugin',
			'PHPUnitNotDeadCodePlugin',
			'PregRegexCheckerPlugin',
			'RedundantAssignmentPlugin',
			'SimplifyExpressionPlugin',
			'UnreachableCodePlugin',
			'UseReturnValuePlugin',
			"$root/vendor/automattic/jetpack-phan-plugins/src/HtmlTemplatePlugin.php",
			// Others to consider:
			// https://github.com/wikimedia/mediawiki-tools-phan/blob/master/src/Plugin/RedundantExistenceChecksPlugin.php
			// https://packagist.org/packages/mediawiki/phan-taint-check-plugin
		),

		// Override to hardcode existence and types of (non-builtin) globals in the global scope.
		'globals_type_map'                       => array_merge(
			$globals,
			$options['globals_type_map']
		),

		// Issues to disable globally.
		'suppress_issue_types'                   => array_merge(
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
		'directory_list'                         => $options['directory_list'],
		'file_list'                              => array_merge(
			array(
				// Otherwise it complains about the config files trying to call this function. 😀
				__FILE__,
				// Assume everything uses PHPUnit.
				"$root/.phan/stubs/phpunit-stubs.php",
			),
			$stubs,
			$extra_stubs,
			$options['file_list'],
			$options['parse_file_list']
		),

		// Regex to exclude files from parsing.
		'exclude_file_regex'                     => '@^(?:\./)?(?:' . implode(
			'|',
			array_merge(
				array(
					// Ignore any `test`, `tests`, `Test`, and `Tests` inside `vendor` and `jetpack_vendor`.
					// Phan includes this by default, probably because various random packages don't exclude their test dirs.
					'(?:jetpack_)?vendor/.*/[tT]ests?/',
					// Ignore any `wordpress`, `jetpack_vendor`, `vendor`, and `node_modules` inside `vendor` and `jetpack_vendor`.
					// Most of these are probably from our intra-monorepo symlinks.
					'(?:jetpack_)?vendor/.*/(?:wordpress|(?:jetpack_)?vendor|node_modules)/',
					// Yoast/phpunit-polyfills triggers a lot of PhanRedefinedXXX errors.
					// Avoid that by excluding the versions of the files for PHPUnit < 9.6
					'vendor/yoast/phpunit-polyfills/src/Polyfills/(?!.*_Empty).*\.php',
					'vendor/yoast/phpunit-polyfills/src/TestCases/TestCasePHPUnitLte7\.php',
					// Other stuff to ignore.
					'node_modules/',
					'tests/e2e/node_modules/',
					'wordpress/',
					'\.cache/',
				),
				// PHPUnit 9.6 has some broken phpdocs and missing `@template` annotations. We provide corrected stubs.
				// This file holds the vendor paths we stubbed.
				explode( "\n", trim( (string) file_get_contents( "$root/.phan/stubs/phpunit-dirs.txt" ) ) ),
				$options['exclude_file_regex']
			)
		) . ')@',

		// Specific files to exclude from parsing.
		'exclude_file_list'                      => $options['exclude_file_list'],

		// List directories that will be excluded from analysis (but will still be parsed).
		// Note anything here needs to be listed in `directory_list` or `file_list` to be parsed in the first place.
		'exclude_analysis_directory_list'        => array_merge(
			array(
				'jetpack_vendor/',
				'vendor/',
				'.phan/stubs/',
				"$root/vendor/",
				"$root/.phan/",
			),
			$extra_stubs,
			$options['exclude_analysis_directory_list'],
			$options['parse_file_list']
		),

		// @see https://github.com/phan/phan/wiki/How-To-Use-Stubs#internal-stubs
		'autoload_internal_extension_signatures' => $internal_stubs,
	);

	// Only use UnusedSuppressionPlugin if we're not doing the CI run with old core stubs.
	if ( ! getenv( 'NO_PHAN_UNUSED_SUPPRESSION' ) ) {
		$config['plugins'][] = 'UnusedSuppressionPlugin';
	}

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
