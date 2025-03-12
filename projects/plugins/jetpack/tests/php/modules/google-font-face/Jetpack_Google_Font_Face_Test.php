<?php
require_once JETPACK__PLUGIN_DIR . 'modules/google-fonts/current/class-jetpack-google-font-face.php.php';

class Jetpack_Google_Font_Face_Test extends WP_UnitTestCase {
	private $google_font_face;

	public function set_up() {
		parent::set_up();

		$this->google_font_face = new Jetpack_Google_Font_Face();
	}

	public function data_blocks_to_collect() {
		return array(
			'invalid font family' => array(
				'<!-- wp:super-happy/awesome-block {"fontFamily":["comic-sans", "comic-sans-neu"]} /-->',
			),
			'valid font family'   => array(
				'<!-- wp:super-happy/awesome-block {"fontFamily":"ComiC-SanS"} /-->',
			),
		);
	}

	/**
	 * @dataProvider data_blocks_to_collect
	 */
	public function test_collect_blocks_with_valid_font_family( $block_content ) {
		$parsed_block = parse_blocks( $block_content );

		// Collecting fonts should not throw an exception
		$this->google_font_face->collect_block_fonts( $block_content, $parsed_block );
		$this->expectNotToPerformAssertions();
	}
}
