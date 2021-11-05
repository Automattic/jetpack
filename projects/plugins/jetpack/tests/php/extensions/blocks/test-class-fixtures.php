<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test block fixtures in PHP.
 *
 * @package automattic/jetpack
 */
class Block_Fixture_Test extends \WP_UnitTestCase {

	/**
	 * Tests that running the serialised block content through KSES doesn't cause the
	 * HTML to change.
	 *
	 * @param string $block    The serialised block content.
	 * @param string $filename The serialised block filename.
	 *
	 * @dataProvider data_block_fixtures
	 */
	public function test_kses_doesnt_change_fixtures( $block, $filename ) {

		// KSES doesn't allow data: URLs, so we need to replace any of them in fixtures.

		// $block = preg_replace( "/src=['\"]data:[^'\"]+['\"]/", 'src="https://wordpress.org/foo.jpg"', $block );
		// $block = preg_replace( "/href=['\"]data:[^'\"]+['\"]/", 'href="https://wordpress.org/foo.jpg"', $block );
		// $block = preg_replace( '/url\(data:[^)]+\)/', 'url(https://wordpress.org/foo.jpg)', $block );

		$kses_block = wp_kses_post( $block );

		// KSES adds a space at the end of self-closing tags, add it to the original to match.
		$block = preg_replace( '|([^ ])/>|', '$1 />', $block );

		// KSES removes the last semi-colon from style attributes, remove it from the original to match.
		$block = preg_replace( '/style="([^"]*);"/', 'style="$1"', $block );

		$this->assertSame( $block, $kses_block, "Failed to match $filename" );
	}

	/**
	 * Data provider for test_kses_doesnt_change_fixtures.
	 */
	public function data_block_fixtures() {
		$fixtures_path = 'extensions/blocks/*/test/fixtures/';
		$file_pattern  = '*.serialized.html';
		$files         = glob( JETPACK__PLUGIN_DIR . $fixtures_path . $file_pattern );

		$data = array();

		foreach ( $files as $file ) {
			$filename = basename( $file );
			$block    = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$data[]   = array( $block, $filename );
		}

		return $data;
	}
}
