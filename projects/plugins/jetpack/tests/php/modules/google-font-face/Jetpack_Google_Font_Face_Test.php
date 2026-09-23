<?php
/**
 * Tests for Google Fonts usage detection and frontend output.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for Jetpack_Google_Font_Face.
 */
class Jetpack_Google_Font_Face_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Font renderer under test.
	 *
	 * @var Jetpack_Google_Font_Face
	 */
	private $google_font_face;

	/**
	 * Sets up each test.
	 */
	public function set_up() {
		parent::set_up();
		require_once JETPACK__PLUGIN_DIR . 'modules/google-fonts/current/load-google-fonts.php';
		add_filter( 'wp_theme_json_data_default', 'jetpack_register_google_fonts_to_theme_json' );
		add_filter( 'wp_theme_json_data_theme', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
		add_filter( 'wp_theme_json_data_user', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
		add_filter(
			'pre_jetpack_get_google_fonts_data',
			static function () {
				return array( 'fontFamilies' => array() );
			}
		);
		$this->google_font_face = new Jetpack_Google_Font_Face();
		self::clean_theme_json_caches();
	}

	/**
	 * Clears theme data between tests.
	 */
	public function tear_down() {
		self::clean_theme_json_caches();
		parent::tear_down();
	}

	/**
	 * Clears the core and Gutenberg theme JSON resolver caches.
	 */
	private static function clean_theme_json_caches() {
		WP_Theme_JSON_Resolver::clean_cached_data();
		if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
	}

	/**
	 * Font-family settings and their primary font identifiers.
	 *
	 * @return array
	 */
	public static function data_font_settings() {
		return array(
			'bare preset'           => array( 'var(--wp--preset--font-family--inter)', 'inter' ),
			'preset with stack'     => array( 'var(--wp--preset--font-family--inter), system-ui, sans-serif', 'inter' ),
			'preset fallback'       => array( 'var(--wp--preset--font-family--inter, sans-serif)', 'inter' ),
			'nested fallback'       => array( 'var(--wp--preset--font-family--inter, var(--body-font)), sans-serif', 'inter' ),
			'multiple presets'      => array( 'var(--wp--preset--font-family--inter), var(--wp--preset--font-family--roboto)', 'inter' ),
			'whitespace'            => array( ' var( --wp--preset--font-family--inter ) , sans-serif', 'inter' ),
			'legacy preset'         => array( 'var:preset|font-family|inter', 'inter' ),
			'legacy preset stack'   => array( 'var:preset|font-family|inter, sans-serif', 'inter' ),
			'literal family'        => array( 'Inter', 'Inter' ),
			'quoted family stack'   => array( '"Open Sans", sans-serif', 'Open Sans' ),
			'single quoted family'  => array( "'Open Sans', sans-serif", 'Open Sans' ),
			'unquoted family stack' => array( 'Open Sans, sans-serif', 'Open Sans' ),
			'missing family'        => array( null, null ),
			'reference'             => array( array( 'ref' => 'styles.typography.fontFamily' ), null ),
			'invalid family'        => array( array( 'Inter', 'Roboto' ), null ),
		);
	}

	/**
	 * Detects the primary family without consuming the fallback stack.
	 *
	 * @dataProvider data_font_settings
	 * @param mixed       $font_family Font-family setting.
	 * @param string|null $expected    Expected identifier.
	 */
	#[DataProvider( 'data_font_settings' )]
	public function test_get_font_slug_from_setting( $font_family, $expected ) {
		$this->assertSame(
			$expected,
			$this->google_font_face->get_font_slug_from_setting( array( 'typography' => array( 'fontFamily' => $font_family ) ) )
		);
	}

	/**
	 * Locations and syntaxes for a font selected through global styles.
	 *
	 * @return array
	 */
	public static function data_global_font_usage() {
		$cases = array(
			'root bare preset'     => array( 'root', 'var(--wp--preset--font-family--body)' ),
			'root fallback stack'  => array( 'root', 'var(--wp--preset--font-family--body), system-ui, sans-serif' ),
			'block fallback stack' => array( 'block', 'var(--wp--preset--font-family--body), sans-serif' ),
			'element fallback'     => array( 'element', 'var(--wp--preset--font-family--body, sans-serif)' ),
			'literal fallback'     => array( 'root', '"Detection Test Font", sans-serif' ),
		);
		$tests = array();
		foreach ( array( 'default', 'block-theme' ) as $theme ) {
			foreach ( $cases as $name => $case ) {
				$tests[ $theme . ' ' . $name ] = array_merge( array( $theme ), $case );
			}
		}
		return $tests;
	}

	/**
	 * Prints the selected catalogue font, including when its slug differs from its family name.
	 *
	 * @dataProvider data_global_font_usage
	 * @param string $theme       Theme to test.
	 * @param string $location    Style location.
	 * @param string $font_family Font-family setting.
	 */
	#[DataProvider( 'data_global_font_usage' )]
	public function test_prints_font_referenced_by_global_styles( $theme, $location, $font_family ) {
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		switch_theme( $theme );
		$this->assertSame( 'block-theme' === $theme, wp_is_block_theme() );
		$style  = array( 'typography' => array( 'fontFamily' => $font_family ) );
		$styles = $style;
		if ( 'block' === $location ) {
			$styles = array( 'blocks' => array( 'core/paragraph' => $style ) );
		} elseif ( 'element' === $location ) {
			$styles = array( 'elements' => array( 'h1' => $style ) );
		}
		$this->register_test_fonts( $styles );

		$this->assert_selected_font_output();
	}

	/**
	 * Block attributes must be inspected on a block, not the array of parsed blocks.
	 */
	public function test_prints_font_selected_only_on_a_block() {
		$this->register_test_fonts();
		$blocks  = parse_blocks( '<!-- wp:paragraph {"fontFamily":"body"} --><p>Example</p><!-- /wp:paragraph -->' );
		$content = $this->google_font_face->collect_block_fonts( null, $blocks[0] );
		$this->assertNull( $content );

		$this->assert_selected_font_output();
	}

	/**
	 * Malformed block attributes must not select fonts or trigger warnings.
	 */
	public function test_ignores_invalid_block_font_family() {
		$this->register_test_fonts();
		$blocks = parse_blocks( '<!-- wp:paragraph {"fontFamily":["body"]} /-->' );
		$this->google_font_face->collect_block_fonts( null, $blocks[0] );

		$this->assertSame( '', $this->get_font_output() );
	}

	/**
	 * Supplies a used font with an alias and an unused font.
	 *
	 * @param array $styles Global styles.
	 */
	private function register_test_fonts( $styles = array() ) {
		add_filter(
			'wp_theme_json_data_theme',
			static function ( $theme_json ) use ( $styles ) {
				$data           = $theme_json->get_data();
				$data['styles'] = $styles;
				$data['settings']['typography']['fontFamilies'] = array();
				$class = get_class( $theme_json );
				return new $class( $data, 'theme' );
			},
			100
		);
		add_filter(
			'pre_jetpack_get_google_fonts_data',
			static function () {
				return array(
					'fontFamilies' => array(
						array(
							'name'       => 'Detection Test Font',
							'slug'       => 'body',
							'fontFamily' => '"Detection Test Font", sans-serif',
							'fontFace'   => array(
								array(
									'fontFamily' => 'Detection Test Font',
									'fontStyle'  => 'normal',
									'fontWeight' => '100 900',
									'src'        => 'file:./assets/fonts/detection-test.woff2',
								),
							),
						),
						array(
							'name'       => 'Unused Test Font',
							'slug'       => 'unused',
							'fontFamily' => 'Unused Test Font',
							'fontFace'   => array(
								array(
									'fontFamily' => 'Unused Test Font',
									'src'        => 'https://example.org/unused-test.woff2',
								),
							),
						),
					),
				);
			},
			100
		);
		self::clean_theme_json_caches();
	}

	/**
	 * Captures frontend font-face output.
	 *
	 * @return string
	 */
	private function get_font_output() {
		ob_start();
		try {
			$this->google_font_face->print_font_faces();
			return ob_get_contents();
		} finally {
			ob_end_clean();
		}
	}

	/**
	 * Asserts that only the selected catalogue font is emitted.
	 */
	private function assert_selected_font_output() {
		$output = $this->get_font_output();
		$this->assertStringContainsString( '@font-face', $output );
		$this->assertStringContainsString( get_theme_file_uri( 'assets/fonts/detection-test.woff2' ), $output );
		$this->assertStringNotContainsString( 'unused-test.woff2', $output );
	}
}
