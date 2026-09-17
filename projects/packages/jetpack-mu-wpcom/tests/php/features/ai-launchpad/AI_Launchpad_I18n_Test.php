<?php
/**
 * Tests for the AI Launchpad i18n helpers.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for the AI Launchpad i18n helpers.
 *
 * @covers ::wpcom_ai_launchpad_in_site_language
 * @covers ::wpcom_ai_launchpad_script_translations
 * @covers ::wpcom_ai_launchpad_site_copy
 */
#[CoversFunction( 'wpcom_ai_launchpad_script_translations' )]
#[CoversFunction( 'wpcom_ai_launchpad_in_site_language' )]
#[CoversFunction( 'wpcom_ai_launchpad_site_copy' )]
class AI_Launchpad_I18n_Test extends \WorDBless\BaseTestCase {

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
		remove_all_filters( 'locale' );
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
		$file = tempnam( sys_get_temp_dir(), 'ai-launchpad-i18n' ) . $suffix;
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
				'translation-revision-date' => '2026-09-17 10:00+0000',
				'generator'                 => 'GlotPress/4.0',
				'domain'                    => 'messages',
				'locale_data'               => array(
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

		$script = wpcom_ai_launchpad_script_translations(
			$this->manifest( array( 'build/routes/site-setup/content.js' ) ),
			$this->atomic_build_url()
		);

		// Core hashed the package-relative path the packs are keyed on. The directory is the platform's
		// call: wpcomsh and wpcom both redirect it to languages/mu-plugins/ through the same filter.
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

		$script = wpcom_ai_launchpad_script_translations(
			$this->manifest(
				array(
					'build/modules/boot/index.js',
					'build/routes/site-setup/content.js',
					'build/widgets/hello/render.js',
					'not-a-path',
				)
			),
			$this->atomic_build_url()
		);

		$this->assertSame(
			array(
				'jetpack-mu-wpcom-it_IT-' . md5( 'jetpack_vendor/automattic/jetpack-mu-wpcom/build/modules/boot/index.js' ) . '.json',
				'jetpack-mu-wpcom-it_IT-' . md5( self::CONTENT_BUNDLE ) . '.json',
			),
			array_map( 'basename', $this->requested_files )
		);
		$this->assertSame( 2, substr_count( $script, 'wp.i18n.setLocaleData(' ) );
		// The throwaway handles do not outlive the lookup.
		$this->assertFalse( wp_script_is( 'wpcom-ai-launchpad-i18n-0', 'registered' ) );
		$this->assertFalse( wp_script_is( 'wpcom-ai-launchpad-i18n-1', 'registered' ) );
	}

	public function test_script_translations_is_null_without_a_manifest_or_a_catalog() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( null );

		$this->assertNull( wpcom_ai_launchpad_script_translations( '/nonexistent/i18n-manifest.json', $this->atomic_build_url() ) );
		$this->assertNull(
			wpcom_ai_launchpad_script_translations(
				$this->manifest( array( 'build/routes/site-setup/content.js' ) ),
				$this->atomic_build_url()
			)
		);
	}

	public function test_script_translations_skips_a_malformed_or_empty_catalog() {
		$this->set_user_locale( 'it_IT' );
		$manifest = $this->manifest( array( 'build/routes/site-setup/content.js' ) );

		$this->serve_catalog( $this->temp_file( 'not json' ) );
		$this->assertNull( wpcom_ai_launchpad_script_translations( $manifest, $this->atomic_build_url() ) );

		remove_all_filters( 'load_script_translation_file' );
		$this->serve_catalog( $this->temp_file( wp_json_encode( array( 'locale_data' => array( 'messages' => array() ) ), JSON_UNESCAPED_SLASHES ) ) );
		$this->assertNull( wpcom_ai_launchpad_script_translations( $manifest, $this->atomic_build_url() ) );
	}

	public function test_script_translations_keeps_a_translation_from_closing_the_script_tag() {
		$this->set_user_locale( 'it_IT' );
		$this->serve_catalog( $this->temp_file( $this->jed( array( 'Skip' => array( '</script><b>x' ) ) ) ) );

		$script = wpcom_ai_launchpad_script_translations(
			$this->manifest( array( 'build/routes/site-setup/content.js' ) ),
			$this->atomic_build_url()
		);

		$this->assertStringNotContainsString( '</script>', $script );
		$this->assertStringContainsString( substr( wp_json_encode( '</script>', JSON_HEX_TAG ), 1, -1 ), $script );
	}
}
