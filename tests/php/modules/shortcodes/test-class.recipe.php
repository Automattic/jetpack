<?php

class WP_Test_Jetpack_Shortcodes_Recipe extends WP_UnitTestCase {
	/**
	 * Verify that the shortcodes exist.
	 *
	 * @covers ::github_gist_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_exists() {
		$this->assertEquals( shortcode_exists( 'recipe' ), true );
		$this->assertEquals( shortcode_exists( 'recipe-notes' ), true );
		$this->assertEquals( shortcode_exists( 'recipe-ingredients' ), true );
		$this->assertEquals( shortcode_exists( 'recipe-directions' ), true );
		$this->assertEquals( shortcode_exists( 'recipe-nutrition' ), true );
		$this->assertEquals( shortcode_exists( 'recipe-image' ), true );
	}
}
