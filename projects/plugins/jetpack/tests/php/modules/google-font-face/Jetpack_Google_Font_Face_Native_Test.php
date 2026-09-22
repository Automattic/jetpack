<?php
/**
 * Tests native font ownership and legacy catalogue rendering.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

class Jetpack_Google_Font_Face_Native_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var Jetpack_Google_Font_Face */
	private $printer;

	public function set_up() {
		parent::set_up();
		require_once JETPACK__PLUGIN_DIR . 'modules/google-fonts/current/load-google-fonts.php';
		add_filter( 'wp_theme_json_data_default', 'jetpack_register_google_fonts_to_theme_json' );
		add_filter( 'wp_theme_json_data_theme', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
		add_filter( 'wp_theme_json_data_user', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		switch_theme( 'block-theme' );
		$this->printer = new Jetpack_Google_Font_Face();
		add_filter( 'pre_jetpack_get_google_fonts_data', array( $this, 'catalogue' ) );
		WP_Theme_JSON_Resolver::clean_cached_data();
		if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
	}

	public function tear_down() {
		WP_Theme_JSON_Resolver::clean_cached_data();
		if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		parent::tear_down();
	}

	/**
	 * A catalogue with a used family and an unused family.
	 *
	 * @return array
	 */
	public function catalogue() {
		return array(
			'fontFamilies' => array(
				self::font_definition( 'Catalogue Font', 'catalogue-font', 'https://example.org/catalogue.woff2' ),
				self::font_definition( 'Unused Catalogue', 'unused-catalogue', 'https://example.org/unused-catalogue.woff2' ),
			),
		);
	}

	/**
	 * Creates a font family definition.
	 *
	 * @param string $name Family name.
	 * @param string $slug Preset slug.
	 * @param string $src Font source.
	 * @return array
	 */
	private static function font_definition( $name, $slug, $src ) {
		return array(
			'name'       => $name,
			'slug'       => $slug,
			'fontFamily' => '"' . $name . '", sans-serif',
			'fontFace'   => array(
				array(
					'fontFamily' => $name,
					'fontWeight' => '100 900',
					'fontStyle'  => 'normal',
					'src'        => $src,
				),
			),
		);
	}

	/**
	 * Installs native fonts and optional style usage into a theme-JSON origin.
	 *
	 * @param array  $families Native definitions.
	 * @param string $usage Font-family usage.
	 * @param string $origin Theme or user origin.
	 */
	private function native_fonts( $families, $usage = '', $origin = 'theme' ) {
		add_filter(
			'wp_theme_json_data_' . $origin,
			static function ( $theme_json ) use ( $families, $usage, $origin ) {
				$data = $theme_json->get_data();
				$data['settings']['typography']['fontFamilies'] = $families;
				$data['styles']                                 = array( 'typography' => array( 'fontFamily' => $usage ) );
				$class = get_class( $theme_json );
				return new $class( $data, 'user' === $origin ? 'custom' : 'theme' );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
		if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
	}

	/**
	 * Captures both native and legacy font printers.
	 *
	 * @return string
	 */
	private function get_font_output() {
		ob_start();
		try {
			if ( function_exists( 'gutenberg_print_font_faces' ) ) {
				gutenberg_print_font_faces();
			} else {
				wp_print_font_faces();
			}
			$this->printer->print_font_faces();
			return ob_get_contents();
		} finally {
			ob_end_clean();
		}
	}

	public function test_frontend_registers_presets_without_catalogue_faces() {
		$data = jetpack_register_google_fonts_to_theme_json( new WP_Theme_JSON_Data( array( 'version' => 3 ), 'default' ) )->get_data();
		$font = $data['settings']['typography']['fontFamilies']['default'][0];
		$this->assertSame( 'catalogue-font', $font['slug'] );
		$this->assertSame( '"Catalogue Font", sans-serif', $font['fontFamily'] );
		$this->assertArrayNotHasKey( 'fontFace', $font );
		$catalogue = jetpack_get_google_fonts_data() ?? array();
		$this->assertArrayHasKey( 'fontFace', $catalogue['fontFamilies'][0] );
	}

	public function test_editor_keeps_full_catalogue() {
		set_current_screen( 'post.php' );
		$data = jetpack_register_google_fonts_to_theme_json( new WP_Theme_JSON_Data( array( 'version' => 3 ), 'default' ) )->get_data();
		$this->assertArrayHasKey( 'fontFace', $data['settings']['typography']['fontFamilies']['default'][0] );
		set_current_screen( 'front' );
	}

	public function test_json_request_keeps_full_catalogue() {
		$accept                 = $_SERVER['HTTP_ACCEPT'] ?? null;
		$_SERVER['HTTP_ACCEPT'] = 'application/json';
		try {
			$data = jetpack_register_google_fonts_to_theme_json( new WP_Theme_JSON_Data( array( 'version' => 3 ), 'default' ) )->get_data();
			$this->assertArrayHasKey( 'fontFace', $data['settings']['typography']['fontFamilies']['default'][0] );
		} finally {
			if ( null === $accept ) {
				unset( $_SERVER['HTTP_ACCEPT'] );
			} else {
				$_SERVER['HTTP_ACCEPT'] = $accept;
			}
		}
	}

	public function test_native_hooks_are_preserved() {
		add_action( 'wp_head', 'wp_print_font_faces', 50 );
		add_action( 'wp_head', 'gutenberg_print_font_faces', 50 );
		$this->printer->wp_loaded();
		$this->assertSame( 50, has_action( 'wp_head', 'wp_print_font_faces' ) );
		$this->assertSame( 50, has_action( 'wp_head', 'gutenberg_print_font_faces' ) );
	}

	/** @return array */
	public static function collisions() {
		return array(
			'same slug'      => array( 'theme', 'catalogue-font', 'Catalogue Font' ),
			'aliased family' => array( 'theme', 'body', 'Catalogue Font' ),
			'replaced slug'  => array( 'theme', 'catalogue-font', 'Replacement Font' ),
			'user family'    => array( 'user', 'body', 'Catalogue Font' ),
		);
	}

	/**
	 * @dataProvider collisions
	 * @param string $origin Definition origin.
	 * @param string $slug Native slug.
	 * @param string $name Native family.
	 */
	#[DataProvider( 'collisions' )]
	public function test_native_definition_wins_over_catalogue( $origin, $slug, $name ) {
		$this->native_fonts(
			array( self::font_definition( $name, $slug, 'file:./assets/native.woff2' ) ),
			'var(--wp--preset--font-family--catalogue-font), sans-serif',
			$origin
		);
		$output = $this->get_font_output();
		$this->assertStringContainsString( get_theme_file_uri( 'assets/native.woff2' ), $output );
		$this->assertSame( 1, substr_count( $output, get_theme_file_uri( 'assets/native.woff2' ) ) );
		$this->assertStringNotContainsString( 'example.org/catalogue.woff2', $output );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}

	public function test_native_fonts_do_not_depend_on_usage_detection() {
		$this->native_fonts( array( self::font_definition( 'Native Font', 'native', 'file:./assets/native.woff2' ) ) );
		$output = $this->get_font_output();
		$this->assertStringContainsString( get_theme_file_uri( 'assets/native.woff2' ), $output );
		$this->assertStringNotContainsString( 'example.org/catalogue.woff2', $output );
	}

	public function test_block_only_catalogue_font_prints_once() {
		$this->native_fonts( array() );
		$block = array( 'attrs' => array( 'fontFamily' => 'catalogue-font' ) );
		foreach ( array( $block, $block ) as $parsed_block ) {
			$this->printer->collect_block_fonts( null, $parsed_block );
		}
		$output = $this->get_font_output();
		$this->assertSame( 1, substr_count( $output, 'https://example.org/catalogue.woff2' ) );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}

	public function test_global_catalogue_font_prints_once() {
		$this->native_fonts( array(), 'var(--wp--preset--font-family--catalogue-font), sans-serif' );
		$output = $this->get_font_output();
		$this->assertSame( 1, substr_count( $output, 'https://example.org/catalogue.woff2' ) );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}
	public function test_system_font_replacement_does_not_download_catalogue_font() {
		$this->native_fonts(
			array(
				array(
					'name'       => 'System',
					'slug'       => 'catalogue-font',
					'fontFamily' => 'system-ui',
				),
			),
			'var(--wp--preset--font-family--catalogue-font)'
		);
		$this->assertSame( '', $this->get_font_output() );
	}

	public function test_filtered_out_catalogue_font_is_not_printed() {
		add_filter( 'jetpack_google_fonts_list', '__return_empty_array' );
		$this->native_fonts( array(), '"Catalogue Font", sans-serif' );
		$this->assertSame( '', $this->get_font_output() );
	}

	public function test_missing_catalogue_preserves_native_fonts() {
		add_filter( 'pre_jetpack_get_google_fonts_data', '__return_empty_array', 100 );
		$this->native_fonts( array( self::font_definition( 'Native Font', 'native', 'file:./assets/native.woff2' ) ) );
		$this->assertStringContainsString( get_theme_file_uri( 'assets/native.woff2' ), $this->get_font_output() );
	}

	public function test_classic_theme_keeps_native_and_block_only_catalogue_fonts() {
		switch_theme( 'default' );
		$this->printer = new Jetpack_Google_Font_Face();
		$this->assertFalse( wp_is_block_theme() );
		$this->assertSame( 50, has_action( 'wp_footer', array( $this->printer, 'print_font_faces' ) ) );
		$this->native_fonts( array( self::font_definition( 'Native Font', 'native', 'file:./assets/native.woff2' ) ) );
		$this->printer->collect_block_fonts( null, array( 'attrs' => array( 'fontFamily' => 'catalogue-font' ) ) );
		$output = $this->get_font_output();
		$this->assertStringContainsString( get_theme_file_uri( 'assets/native.woff2' ), $output );
		$this->assertSame( 1, substr_count( $output, 'https://example.org/catalogue.woff2' ) );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}
	public function test_gutenberg_classic_theme_user_font_wins_over_catalogue() {
		if ( ! function_exists( 'gutenberg_print_font_faces' ) ) {
			$this->markTestSkipped( 'Requires Gutenberg classic-theme font support.' );
		}
		switch_theme( 'default' );
		$this->printer = new Jetpack_Google_Font_Face();
		$this->native_fonts(
			array( self::font_definition( 'Catalogue Font', 'body', 'https://example.org/uploaded.woff2' ) ),
			'var(--wp--preset--font-family--body)',
			'user'
		);
		$this->printer->collect_block_fonts( null, array( 'attrs' => array( 'fontFamily' => 'catalogue-font' ) ) );
		$output = $this->get_font_output();
		$this->assertSame( 1, substr_count( $output, 'https://example.org/uploaded.woff2' ) );
		$this->assertStringNotContainsString( 'example.org/catalogue.woff2', $output );
	}
	/** @return array */
	public static function legacy_presets() {
		return array(
			'same slug' => array( 'catalogue-font' ),
			'alias'     => array( 'body' ),
		);
	}

	/**
	 * @dataProvider legacy_presets
	 * @param string $slug Preset slug.
	 */
	#[DataProvider( 'legacy_presets' )]
	public function test_preset_without_faces_can_use_catalogue( $slug ) {
		$this->native_fonts(
			array(
				array(
					'name'       => 'Catalogue Font',
					'slug'       => $slug,
					'fontFamily' => '"Catalogue Font", sans-serif',
				),
			),
			'var(--wp--preset--font-family--' . $slug . ')'
		);
		$output = $this->get_font_output();
		$this->assertSame( 1, substr_count( $output, 'https://example.org/catalogue.woff2' ) );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}

	/** @return array */
	public static function theme_types() {
		return array(
			'block'   => array( 'block-theme' ),
			'classic' => array( 'default' ),
		);
	}

	/**
	 * @dataProvider theme_types
	 * @param string $theme Theme to test.
	 */
	#[DataProvider( 'theme_types' )]
	public function test_font_hooks_render_native_and_block_only_catalogue_fonts_once( $theme ) {
		switch_theme( $theme );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );
		remove_all_filters( 'pre_render_block' );
		add_action( 'wp_head', function_exists( 'gutenberg_print_font_faces' ) ? 'gutenberg_print_font_faces' : 'wp_print_font_faces', 50 );
		$this->printer = new Jetpack_Google_Font_Face();
		$this->printer->wp_loaded();
		$this->native_fonts( array( self::font_definition( 'Native Font', 'native', 'https://example.org/native.woff2' ) ) );
		$block = '<!-- wp:paragraph {"fontFamily":"catalogue-font"} --><p>Example</p><!-- /wp:paragraph -->';

		$output = '';
		ob_start();
		try {
			if ( wp_is_block_theme() ) {
				do_blocks( $block );
			}
			do_action( 'wp_head' );
			if ( ! wp_is_block_theme() ) {
				do_blocks( $block );
			}
			do_action( 'wp_footer' );
			$output = (string) ob_get_contents();
		} finally {
			ob_end_clean();
		}
		$this->assertSame( 1, substr_count( $output, 'https://example.org/native.woff2' ) );
		$this->assertSame( 1, substr_count( $output, 'https://example.org/catalogue.woff2' ) );
		$this->assertStringNotContainsString( 'unused-catalogue.woff2', $output );
	}
}
