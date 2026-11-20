<?php
/**
 * Tests for the wp-build script translations helper.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/wp-build-script-translations.php';

/**
 * Tests for the wp-build script translations helper.
 *
 * @covers ::wpcom_wp_build_script_translations
 */
#[CoversFunction( 'wpcom_wp_build_script_translations' )]
class WP_Build_Script_Translations_Test extends \WorDBless\BaseTestCase {

	/**
	 * The bundle path the language packs key the Site Setup catalog on.
	 */
	const CONTENT_BUNDLE = 'jetpack_vendor/automattic/jetpack-mu-wpcom/build/routes/site-setup/content.js';

	/**
	 * Temporary files created by a test.
	 *
	 * @var string[]
	 */
	private $temp_files = array();

	/**
	 * Catalog paths core asked for, in order.
	 *
	 * @var string[]
	 */
	private $requested_files = array();

	/**
	 * Test teardown.
	 */
	public function tear_down() {
		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}
		$this->temp_files = array();
		remove_all_filters( 'pre_determine_locale' );
		remove_all_filters( 'load_script_translation_file' );
		parent::tear_down();
	}

	/**
	 * Write a temporary file and register it for cleanup.
	 *
	 * @param string $content The file content.
	 * @param string $suffix  The file suffix.
	 * @return string The file path.
	 */
	private function temp_file( $content, $suffix = '.json' ) {
		$file = tempnam( sys_get_temp_dir(), 'wp-build-i18n' ) . $suffix;
		file_put_contents( $file, $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->temp_files[] = $file;
		return $file;
	}

	/**
	 * A JED catalog, as the language packs ship it.
	 *
	 * @param array $messages The `locale_data.messages` entries.
	 * @return string The JSON.
	 */
	private function jed( $messages ) {
		return wp_json_encode(
			array(
				'domain'      => 'messages',
				'locale_data' => array(
					'messages' => array_merge(
						array(
							'' => array(
								'domain'       => 'messages',
								'lang'         => 'it',
								'plural-forms' => 'nplurals=2; plural=n != 1;',
							),
						),
						$messages
					),
				),
			),
			JSON_UNESCAPED_SLASHES
		);
	}

	/**
	 * A manifest listing the given bundles.
	 *
	 * @param string[] $bundles The bundle paths.
	 * @return string The manifest file path.
	 */
	private function manifest( $bundles ) {
		return $this->temp_file( wp_json_encode( array( 'bundles' => $bundles ), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Serve a catalog file for whatever core asks for, recording the path it computed.
	 *
	 * @param string|null $catalog The catalog file to serve, or null to serve nothing.
	 */
	private function serve_catalog( $catalog ) {
		add_filter(
			'load_script_translation_file',
			function ( $file ) use ( $catalog ) {
				$this->requested_files[] = $file;
				return $catalog ?? '/nonexistent/' . basename( $file );
			}
		);
	}

	/**
	 * The build URL of the package as wpcomsh serves it on Atomic.
	 *
	 * @return string
	 */
	private function atomic_build_url() {
		return content_url( 'mu-plugins/wpcomsh/jetpack_vendor/automattic/jetpack-mu-wpcom/build/' );
	}

	/**
	 * The user language, as determine_locale() reports it for the request.
	 *
	 * @param string $locale The locale.
	 */
	private function set_user_locale( $locale ) {
		add_filter( 'pre_determine_locale', fn() => $locale );
	}

	public function test_script_translations_installs_the_catalog_core_locates_for_the_bundle() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog(
			$this->temp_file(
				$this->jed(
					array(
						'Skip' => array( 'Salta' ),
						"wizard navigation\u{0004}Continue" => array( 'Continua' ),
					)
				)
			)
		);

		$script = wpcom_wp_build_script_translations(
			$this->manifest( array( 'build/routes/site-setup/content.js' ) ),
			$this->atomic_build_url(),
			'site-setup'
		);

		// Core hashes the package-relative path the packs are keyed on; the platform picks the directory.
		$this->assertSame(
			array( 'jetpack-mu-wpcom-it_IT-' . md5( self::CONTENT_BUNDLE ) . '.json' ),
			array_map( 'basename', $this->requested_files )
		);
		$this->assertStringStartsWith( WP_LANG_DIR . '/', $this->requested_files[0] );
		$this->assertStringStartsWith( 'wp.i18n.setLocaleData( ', $script );
		$this->assertStringEndsWith( ', "jetpack-mu-wpcom" );', $script );
		$this->assertStringContainsString( '"Skip":["Salta"]', $script );
		$this->assertStringContainsString( wp_json_encode( "wizard navigation\u{0004}Continue", JSON_UNESCAPED_SLASHES ) . ':["Continua"]', $script );
	}

	public function test_script_translations_covers_every_route_and_module_but_no_widget() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( $this->temp_file( $this->jed( array( 'Skip' => array( 'Salta' ) ) ) ) );

		$script = wpcom_wp_build_script_translations(
			$this->manifest(
				array(
					'build/modules/boot/index.js',
					'build/routes/site-setup/content.js',
					'build/widgets/hello/render.js',
					'not-a-path',
				)
			),
			$this->atomic_build_url(),
			'site-setup'
		);

		$this->assertSame(
			array(
				'jetpack-mu-wpcom-it_IT-' . md5( 'jetpack_vendor/automattic/jetpack-mu-wpcom/build/modules/boot/index.js' ) . '.json',
				'jetpack-mu-wpcom-it_IT-' . md5( self::CONTENT_BUNDLE ) . '.json',
			),
			array_map( 'basename', $this->requested_files )
		);
		$this->assertSame( 2, substr_count( $script, 'wp.i18n.setLocaleData(' ) );
		$this->assertFalse( wp_script_is( 'wpcom-wp-build-i18n-0', 'registered' ) );
		$this->assertFalse( wp_script_is( 'wpcom-wp-build-i18n-1', 'registered' ) );
	}

	public function test_script_translations_covers_each_listed_route_and_no_other() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( $this->temp_file( $this->jed( array( 'Skip' => array( 'Salta' ) ) ) ) );

		$script = wpcom_wp_build_script_translations(
			$this->manifest(
				array(
					'build/routes/wpcom-earn/content.js',
					'build/routes/wpcom-earn-payments/content.js',
					'build/routes/wpcom-earn-unlisted/content.js',
					'build/routes/site-setup/content.js',
				)
			),
			$this->atomic_build_url(),
			array( 'wpcom-earn', 'wpcom-earn-payments' )
		);

		$this->assertSame( 2, substr_count( $script, 'wp.i18n.setLocaleData(' ) );
	}

	/**
	 * No script is built without a manifest, or from a missing, malformed or empty catalog.
	 *
	 * @dataProvider provide_unusable_inputs
	 *
	 * @param bool        $manifest Whether a manifest exists.
	 * @param string|null $catalog  The catalog file contents to serve, or null to serve none.
	 */
	#[DataProvider( 'provide_unusable_inputs' )]
	public function test_script_translations_is_null_for_unusable_inputs( $manifest, $catalog ) {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( null === $catalog ? null : $this->temp_file( $catalog ) );

		$this->assertNull(
			wpcom_wp_build_script_translations(
				$manifest ? $this->manifest( array( 'build/routes/site-setup/content.js' ) ) : '/nonexistent/i18n-manifest.json',
				$this->atomic_build_url(),
				'site-setup'
			)
		);
	}

	/**
	 * Data provider for test_script_translations_is_null_for_unusable_inputs.
	 *
	 * @return array
	 */
	public static function provide_unusable_inputs() {
		return array(
			'no manifest'         => array( false, null ),
			'no catalog'          => array( true, null ),
			'a malformed catalog' => array( true, 'not json' ),
			'an empty catalog'    => array( true, '{"locale_data":{"messages":[]}}' ),
		);
	}

	public function test_script_translations_keeps_a_translation_from_closing_the_script_tag() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( $this->temp_file( $this->jed( array( 'Skip' => array( '</script><b>x' ) ) ) ) );

		$script = wpcom_wp_build_script_translations(
			$this->manifest( array( 'build/routes/site-setup/content.js' ) ),
			$this->atomic_build_url(),
			'site-setup'
		);

		$this->assertStringNotContainsString( '</script>', $script );
		$this->assertStringContainsString( substr( wp_json_encode( '</script>', JSON_HEX_TAG ), 1, -1 ), $script );
	}
}
