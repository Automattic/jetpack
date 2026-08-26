<?php
/**
 * Package Provenance predictor.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Computes which runtime serves each polyfilled package on a WordPress and
 * Gutenberg pair, and whether the winning private-apis copy accepts the module
 * names the site's bundles opt in with.
 *
 * Pure PHP: inventories come in as arrays so the logic runs without WordPress.
 * An inventory is `array{scripts: string[], modules: string[], allowlist: string[]}`
 * listing `wp-*` script handles, `@wordpress/*` module IDs and the private-apis
 * allowlist of that provider. The polyfill inventory also carries `optins`: the
 * module names each of its own builds opts in with, keyed by handle or module ID.
 */
class Package_Provenance_Predictor {

	const PROVIDER_CORE      = 'core';
	const PROVIDER_GUTENBERG = 'gutenberg';
	const PROVIDER_POLYFILL  = 'polyfill';
	const PROVIDER_MISSING   = 'missing';

	/**
	 * Extracts the private-apis allowlist from a built `@wordpress/private-apis` file.
	 *
	 * The allowlist is the largest array literal made only of `@wordpress/*` strings.
	 *
	 * @param string $js File contents.
	 * @return string[] Sorted module names; empty when no such array exists.
	 */
	public static function parse_allowlist( $js ) {
		if ( ! preg_match_all( '/\[\s*(?:["\']@wordpress\/[a-z0-9-]+["\']\s*,?\s*)+\]/', $js, $arrays ) ) {
			return array();
		}

		$best = array();
		foreach ( $arrays[0] as $literal ) {
			preg_match_all( '/@wordpress\/[a-z0-9-]+/', $literal, $names );
			if ( count( $names[0] ) > count( $best ) ) {
				$best = $names[0];
			}
		}

		$best = array_values( array_unique( $best ) );
		sort( $best );
		return $best;
	}

	/**
	 * Extracts the module names a built file opts in with.
	 *
	 * Matches `__dangerousOptInToUnstableAPIsOnlyForCoreModules( <consent>, '@wordpress/x' )`
	 * in the plain form and in the minified `(0,e.__dangerous…)( … )` form; the consent
	 * argument may be a string literal or a variable, and quotes may be escaped.
	 *
	 * @param string $js File contents.
	 * @return string[] Sorted unique module names.
	 */
	public static function parse_optins( $js ) {
		if ( false === strpos( $js, 'OptInToUnstableAPIsOnlyForCoreModules' ) ) {
			return array();
		}

		// Quotes may be backslash-escaped: development builds wrap modules in eval( "…" ).
		preg_match_all(
			'/OptInToUnstableAPIsOnlyForCoreModules\)?\s*\(\s*(?:\\\\?["\'][^"\'\\\\]*\\\\?["\']|[A-Za-z_$][\w$.]*)\s*,\s*\\\\?["\'](@wordpress\/[a-z0-9-]+)\\\\?["\']/',
			$js,
			$matches
		);

		$names = array_values( array_unique( $matches[1] ) );
		sort( $names );
		return $names;
	}

	/**
	 * Predicts the provider of every polyfilled package for one cell.
	 *
	 * `$cell` keys: `wp` and `gutenberg` (versions, Gutenberg null when inactive),
	 * `modes` (handle or module ID => 'force' | 'fallback', from
	 * WP_Build_Polyfills::predict_registration()), `core`, `gutenberg_inventory`
	 * (null when inactive) and `polyfill` (inventories), and `optins` (module name
	 * => files that opt in with it).
	 *
	 * The result carries `wp`, `gutenberg`, `rows` (package, type, provider, reason)
	 * and `private_apis` (provider, allowlist_size, rejected as module name => files).
	 *
	 * @param array $cell Cell to evaluate.
	 * @return array Prediction.
	 */
	public static function predict( array $cell ) {
		$core      = $cell['core'];
		$gutenberg = $cell['gutenberg_inventory'];
		$polyfill  = $cell['polyfill'];

		$rows      = array();
		$providers = array();
		foreach ( $cell['modes'] as $name => $mode ) {
			$is_module = 0 === strpos( $name, '@wordpress/' );
			$key       = $is_module ? 'modules' : 'scripts';

			if ( 'force' === $mode && in_array( $name, $polyfill[ $key ], true ) ) {
				$provider = self::PROVIDER_POLYFILL;
				$reason   = 'forced: WP too old and no Gutenberg new enough';
			} elseif ( null !== $gutenberg && in_array( $name, $gutenberg[ $key ], true ) ) {
				$provider = self::PROVIDER_GUTENBERG;
				$reason   = 'Gutenberg registers it';
			} elseif ( in_array( $name, $core[ $key ], true ) ) {
				$provider = self::PROVIDER_CORE;
				$reason   = 'core registers it';
			} elseif ( in_array( $name, $polyfill[ $key ], true ) ) {
				$provider = self::PROVIDER_POLYFILL;
				$reason   = 'nobody else ships it';
			} else {
				$provider = self::PROVIDER_MISSING;
				$reason   = 'nobody ships it';
			}

			$providers[ $name ] = $provider;
			$rows[]             = array(
				'package'  => $name,
				'type'     => $is_module ? 'module' : 'classic',
				'provider' => $provider,
				'reason'   => $reason,
			);
		}

		$inventories = array(
			self::PROVIDER_CORE      => $core,
			self::PROVIDER_GUTENBERG => $gutenberg,
			self::PROVIDER_POLYFILL  => $polyfill,
		);
		$winner      = $providers['wp-private-apis'] ?? self::PROVIDER_MISSING;
		$winning     = $inventories[ $winner ] ?? null;
		$allowlist   = is_array( $winning ) ? $winning['allowlist'] : array();

		// Polyfill copies that win a slot opt in too (rich-text inlines compose, for example).
		$optins = $cell['optins'];
		foreach ( $polyfill['optins'] ?? array() as $handle => $modules ) {
			if ( self::PROVIDER_POLYFILL !== ( $providers[ $handle ] ?? '' ) ) {
				continue;
			}
			foreach ( $modules as $module ) {
				$optins[ $module ] = array_merge( $optins[ $module ] ?? array(), array( 'wp-build-polyfills:' . $handle ) );
			}
		}
		ksort( $optins );

		$rejected = array();
		foreach ( $optins as $module => $files ) {
			if ( ! in_array( $module, $allowlist, true ) ) {
				$rejected[ $module ] = $files;
			}
		}

		return array(
			'wp'           => $cell['wp'],
			'gutenberg'    => $cell['gutenberg'],
			'rows'         => $rows,
			'private_apis' => array(
				'provider'       => $winner,
				'allowlist_size' => count( $allowlist ),
				'rejected'       => $rejected,
			),
		);
	}
}
