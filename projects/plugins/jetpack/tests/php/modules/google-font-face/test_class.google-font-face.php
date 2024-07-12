<?php
require __DIR__ . '/../../../../modules//google-fonts/current/class-jetpack-google-font-face.php.php';

class WP_Test_Jetpack_Google_Font_Face extends WP_UnitTestCase {
	private $google_font_face;

	public function set_up() {
		parent::set_up();

		$this->google_font_face = new Jetpack_Google_Font_Face();
	}

	public function data_blocks_to_collect() {
		return array(
			'invalid font family' => array(
				'<!-- wp:super-happy/awesome-block {"fontFamily":["comic-sans", "comic-sans-neu"]} /-->',
				array(),
			),
			'valid font family'   => array(
				'<!-- wp:super-happy/awesome-block {"fontFamily":"ComiC-SanS"} /-->',
				array( 'comic-sans' ),
			),
		);
	}

	/**
	 * @dataProvider data_blocks_to_collect
	 */
	public function test_collect_blocks_with_valid_font_family( $block_content, $expected_fonts ) {
		$parsed_block = parse_blocks( $block_content );

		$this->google_font_face->collect_block_fonts( $parsed_block );

		$this->assertEquals( $expected_fonts, $this->google_font_face->fonts_in_use );
	}
}
