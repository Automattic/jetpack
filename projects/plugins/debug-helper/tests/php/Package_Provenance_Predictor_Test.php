<?php
/**
 * Tests for Package_Provenance_Predictor.
 *
 * @package automattic/jetpack-debug-helper
 */

use PHPUnit\Framework\TestCase;

/**
 * Tests for Package_Provenance_Predictor.
 */
class Package_Provenance_Predictor_Test extends TestCase {

	/**
	 * Registration modes of a site where the polyfill forces private-apis and rich-text (WP 7.0.x, no Gutenberg).
	 *
	 * @var array<string, string>
	 */
	const MODES_FORCED = array(
		'wp-notices'                   => 'fallback',
		'wp-private-apis'              => 'force',
		'wp-rich-text'                 => 'force',
		'wp-theme'                     => 'fallback',
		'wp-views'                     => 'fallback',
		'@wordpress/boot'              => 'fallback',
		'@wordpress/route'             => 'fallback',
		'@wordpress/a11y'              => 'fallback',
		'@wordpress/widget-primitives' => 'fallback',
	);

	/**
	 * Registration modes where nothing is forced (WP 7.1, or Gutenberg new enough).
	 *
	 * @var array<string, string>
	 */
	const MODES_FALLBACK = array(
		'wp-notices'                   => 'fallback',
		'wp-private-apis'              => 'fallback',
		'wp-rich-text'                 => 'fallback',
		'wp-theme'                     => 'fallback',
		'wp-views'                     => 'fallback',
		'@wordpress/boot'              => 'fallback',
		'@wordpress/route'             => 'fallback',
		'@wordpress/a11y'              => 'fallback',
		'@wordpress/widget-primitives' => 'fallback',
	);

	/**
	 * Core inventory: no views, no widget-primitives.
	 *
	 * @param string[] $allowlist Allowlist.
	 * @return array
	 */
	private function core( array $allowlist ) {
		return array(
			'scripts'   => array( 'wp-notices', 'wp-private-apis', 'wp-rich-text', 'wp-theme' ),
			'modules'   => array( '@wordpress/a11y', '@wordpress/boot', '@wordpress/route' ),
			'allowlist' => $allowlist,
		);
	}

	/**
	 * Gutenberg inventory: everything but views.
	 *
	 * @param string[] $allowlist Allowlist.
	 * @return array
	 */
	private function gutenberg( array $allowlist ) {
		return array(
			'scripts'   => array( 'wp-compose', 'wp-notices', 'wp-private-apis', 'wp-rich-text', 'wp-theme' ),
			'modules'   => array( '@wordpress/a11y', '@wordpress/boot', '@wordpress/route', '@wordpress/widget-primitives' ),
			'allowlist' => $allowlist,
		);
	}

	/**
	 * Polyfill inventory: everything, allowlist with the dashboard packages.
	 *
	 * @return array
	 */
	private function polyfill() {
		return array(
			'scripts'   => array( 'wp-notices', 'wp-private-apis', 'wp-rich-text', 'wp-theme', 'wp-views' ),
			'modules'   => array( '@wordpress/a11y', '@wordpress/boot', '@wordpress/route', '@wordpress/widget-primitives' ),
			'allowlist' => array( '@wordpress/compose', '@wordpress/dataviews', '@wordpress/fields', '@wordpress/rich-text', '@wordpress/theme', '@wordpress/views' ),
			'optins'    => array(
				'wp-rich-text'    => array( '@wordpress/compose', '@wordpress/rich-text' ),
				'wp-theme'        => array( '@wordpress/theme' ),
				'wp-views'        => array( '@wordpress/views' ),
				'@wordpress/boot' => array( '@wordpress/boot' ),
			),
		);
	}

	/**
	 * Provider per package from a prediction.
	 *
	 * @param array $prediction Prediction.
	 * @return array<string, string>
	 */
	private function providers( array $prediction ) {
		$providers = array();
		foreach ( $prediction['rows'] as $row ) {
			$providers[ $row['package'] ] = $row['provider'];
		}
		return $providers;
	}

	/**
	 * The allowlist is the largest @wordpress/* array in the file.
	 */
	public function test_parse_allowlist_picks_largest_array() {
		$js = 'var a=["@wordpress/a11y"];const CORE=["@wordpress/block-editor", "@wordpress/dataviews",' . "\n" . '"@wordpress/data"];x(["@wordpress/hooks","@wordpress/i18n"]);';

		$this->assertSame(
			array( '@wordpress/block-editor', '@wordpress/data', '@wordpress/dataviews' ),
			Package_Provenance_Predictor::parse_allowlist( $js )
		);
	}

	/**
	 * Single quotes and trailing commas parse too.
	 */
	public function test_parse_allowlist_accepts_single_quotes() {
		$js = "const CORE_MODULES_USING_PRIVATE_APIS = [\n\t'@wordpress/views',\n\t'@wordpress/theme',\n];";

		$this->assertSame( array( '@wordpress/theme', '@wordpress/views' ), Package_Provenance_Predictor::parse_allowlist( $js ) );
	}

	/**
	 * No array means an empty allowlist.
	 */
	public function test_parse_allowlist_returns_empty_without_array() {
		$this->assertSame( array(), Package_Provenance_Predictor::parse_allowlist( 'console.log("@wordpress/dataviews")' ) );
	}

	/**
	 * Opt-ins are found in the plain, the minified, and the hoisted-consent forms.
	 */
	public function test_parse_optins_matches_every_call_form() {
		$js = "__dangerousOptInToUnstableAPIsOnlyForCoreModules( 'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.', '@wordpress/fields' );"
			. '(0,e.__dangerousOptInToUnstableAPIsOnlyForCoreModules)("I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.","@wordpress/dataviews");'
			. '(0,t.__dangerousOptInToUnstableAPIsOnlyForCoreModules)(o,"@wordpress/views");'
			. '(0,t.__dangerousOptInToUnstableAPIsOnlyForCoreModules)(o,"@wordpress/views");';

		$this->assertSame(
			array( '@wordpress/dataviews', '@wordpress/fields', '@wordpress/views' ),
			Package_Provenance_Predictor::parse_optins( $js )
		);
	}

	/**
	 * Development builds wrap modules in eval( "…" ), escaping every quote.
	 */
	public function test_parse_optins_reads_escaped_quotes() {
		$js = 'eval("var{lock,unlock}=__dangerousOptInToUnstableAPIsOnlyForCoreModules(\\"I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.\\",\\"@wordpress/dataviews\\");")';

		$this->assertSame( array( '@wordpress/dataviews' ), Package_Provenance_Predictor::parse_optins( $js ) );
	}

	/**
	 * A file without the call yields nothing.
	 */
	public function test_parse_optins_returns_empty_without_call() {
		$this->assertSame( array(), Package_Provenance_Predictor::parse_optins( 'unlock(privateApis)' ) );
	}

	/**
	 * WP 7.0.x without Gutenberg: the polyfill forces private-apis and rich-text and fills the gaps.
	 */
	public function test_predict_polyfill_wins_forced_and_missing_packages() {
		$prediction = Package_Provenance_Predictor::predict(
			array(
				'wp'                  => '7.0.4',
				'gutenberg'           => null,
				'modes'               => self::MODES_FORCED,
				'core'                => $this->core( array( '@wordpress/rich-text', '@wordpress/theme' ) ),
				'gutenberg_inventory' => null,
				'polyfill'            => $this->polyfill(),
				'optins'              => array( '@wordpress/dataviews' => array( 'jetpack/_inc/build/forms.js' ) ),
			)
		);

		$this->assertSame(
			array(
				'wp-notices'                   => 'core',
				'wp-private-apis'              => 'polyfill',
				'wp-rich-text'                 => 'polyfill',
				'wp-theme'                     => 'core',
				'wp-views'                     => 'polyfill',
				'@wordpress/boot'              => 'core',
				'@wordpress/route'             => 'core',
				'@wordpress/a11y'              => 'core',
				'@wordpress/widget-primitives' => 'polyfill',
			),
			$this->providers( $prediction )
		);
		$this->assertSame( 'polyfill', $prediction['private_apis']['provider'] );
		$this->assertSame( 6, $prediction['private_apis']['allowlist_size'] );
		$this->assertSame( array(), $prediction['private_apis']['rejected'] );
	}

	/**
	 * An active Gutenberg that ships the package beats core and the polyfill.
	 */
	public function test_predict_gutenberg_overrides_core() {
		$prediction = Package_Provenance_Predictor::predict(
			array(
				'wp'                  => '7.0.4',
				'gutenberg'           => '23.8.0',
				'modes'               => self::MODES_FALLBACK,
				'core'                => $this->core( array( '@wordpress/rich-text', '@wordpress/theme' ) ),
				'gutenberg_inventory' => $this->gutenberg( array( '@wordpress/dataviews', '@wordpress/rich-text', '@wordpress/theme', '@wordpress/views' ) ),
				'polyfill'            => $this->polyfill(),
				'optins'              => array( '@wordpress/dataviews' => array( 'jetpack/_inc/build/forms.js' ) ),
			)
		);

		$providers = $this->providers( $prediction );
		$this->assertSame( 'gutenberg', $providers['wp-private-apis'] );
		$this->assertSame( 'gutenberg', $providers['wp-notices'] );
		$this->assertSame( 'gutenberg', $providers['@wordpress/widget-primitives'] );
		$this->assertSame( 'polyfill', $providers['wp-views'] );
		$this->assertSame( 'gutenberg', $prediction['private_apis']['provider'] );
		$this->assertSame( array(), $prediction['private_apis']['rejected'] );
	}

	/**
	 * A winning private-apis whose allowlist dropped a bundled package rejects that bundle's opt-in.
	 */
	public function test_predict_rejects_optins_missing_from_winning_allowlist() {
		$files      = array( 'jetpack/_inc/build/forms.js', 'jetpack/jetpack_vendor/automattic/jetpack-premium-analytics/build/index.js' );
		$prediction = Package_Provenance_Predictor::predict(
			array(
				'wp'                  => '7.1',
				'gutenberg'           => '23.9.0',
				'modes'               => self::MODES_FALLBACK,
				'core'                => $this->core( array( '@wordpress/dataviews', '@wordpress/rich-text', '@wordpress/theme', '@wordpress/views' ) ),
				'gutenberg_inventory' => $this->gutenberg( array( '@wordpress/rich-text', '@wordpress/theme', '@wordpress/views' ) ),
				'polyfill'            => $this->polyfill(),
				'optins'              => array(
					'@wordpress/dataviews' => $files,
					'@wordpress/fields'    => array( 'jetpack/_inc/build/forms.js' ),
				),
			)
		);

		$this->assertSame( 'gutenberg', $prediction['private_apis']['provider'] );
		$this->assertSame(
			array(
				'@wordpress/dataviews' => $files,
				'@wordpress/fields'    => array( 'jetpack/_inc/build/forms.js' ),
			),
			$prediction['private_apis']['rejected']
		);
	}

	/**
	 * A polyfilled script that opts in with its own name is checked against the winning allowlist too.
	 */
	public function test_predict_checks_polyfilled_self_optins() {
		$prediction = Package_Provenance_Predictor::predict(
			array(
				'wp'                  => '7.1',
				'gutenberg'           => null,
				'modes'               => self::MODES_FALLBACK,
				'core'                => $this->core( array( '@wordpress/dataviews', '@wordpress/rich-text', '@wordpress/theme' ) ),
				'gutenberg_inventory' => null,
				'polyfill'            => $this->polyfill(),
				'optins'              => array(),
			)
		);

		$this->assertSame( 'core', $prediction['private_apis']['provider'] );
		$this->assertSame( 'polyfill', $this->providers( $prediction )['wp-views'] );
		$this->assertSame( array( '@wordpress/views' => array( 'wp-build-polyfills:wp-views' ) ), $prediction['private_apis']['rejected'] );
	}

	/**
	 * A package nobody ships is reported as missing, not silently dropped.
	 */
	public function test_predict_reports_missing_packages() {
		$polyfill            = $this->polyfill();
		$polyfill['scripts'] = array( 'wp-private-apis' );
		$prediction          = Package_Provenance_Predictor::predict(
			array(
				'wp'                  => '7.1',
				'gutenberg'           => null,
				'modes'               => array( 'wp-views' => 'fallback' ),
				'core'                => $this->core( array() ),
				'gutenberg_inventory' => null,
				'polyfill'            => $polyfill,
				'optins'              => array(),
			)
		);

		$this->assertSame( array( 'wp-views' => 'missing' ), $this->providers( $prediction ) );
		$this->assertSame( 'missing', $prediction['private_apis']['provider'] );
		$this->assertSame( 0, $prediction['private_apis']['allowlist_size'] );
	}
}
