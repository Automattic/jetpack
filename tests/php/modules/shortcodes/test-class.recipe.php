<?php

class WP_Test_Jetpack_Shortcodes_Recipe extends WP_UnitTestCase {

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function setUp() {
		// Run hook to load shortcode.
		do_action( 'init' );

		// Reset data.
		wp_reset_postdata();
		parent::tearDown();
	}

	/**
	 * Verify that the shortcodes exist.
	 *
	 * @covers ::recipe_shortcode
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

	/**
	 * Verify that the recipe shortcode outputs prep time in HTML.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_preptime() {
		$content = '[recipe preptime="30 min"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<time itemprop="prepTime" datetime="P0DT0H30M0S"><strong>Prep Time: </strong>30 min</time>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs cook time in HTML.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_cooktime() {
		$content = '[recipe cooktime="2 hours 30 min"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<time itemprop="cookTime" datetime="P0DT2H30M0S"><strong>Cook Time: </strong>2 hours 30 min</time>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs rating in HTML.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_rating() {
		$content = '[recipe rating="2 stars"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<span itemprop="contentRating">2 stars</span>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image with an empty source.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_empty_src() {
		$content = '[recipe image=""]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image with an invalid attachment ID.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_invalid_attachment() {
		$content = '[recipe image="-100"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs an image with a valid attachment ID.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_valid_attachment() {
		// Create a mock attachment.
		$attachment_id = $this->_make_attachment(
			array(
				'file'  => 'example.jpg',
				'url'   => 'http://example.com/wp-content/uploads/example.jpg',
				'type'  => 'image/jpeg',
				'error' => false,
			)
		);

		// Get shortcode with new attachment.
		$content = '[recipe image="' . $attachment_id . '"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img src="http://example.org/wp-content/uploads/example.jpg" class="jetpack-recipe-image u-photo" alt="" itemprop="image" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs an image with a src string.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_src() {
		$content = '[recipe image="https://example.com"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img class="jetpack-recipe-image u-photo" itemprop="image" src="https://example.com" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image if an empty recipe-image shortcode exists.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_location_move() {
		$content = '[recipe image="https://example.com"][recipe-image][/recipe]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with no parameters.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_empty() {
		$content = '[recipe-image]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an empty image attribute.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_empty_attr() {
		$content = '[recipe-image image=""]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a string parameter.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_src() {

		$content = '[recipe-image https://example.com]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img class="jetpack-recipe-image u-photo" itemprop="image" src="https://example.com" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a string parameter.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_src_attr() {

		$content = '[recipe-image image="https://example.com"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img class="jetpack-recipe-image u-photo" itemprop="image" src="https://example.com" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an invalid attachment.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_invalid_attachment() {
		$content = '[recipe-image -100]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an invalid attachment attribute.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_invalid_attachment_attr() {
		$content = '[recipe-image image="-100"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertNotContains( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a valid attachment ID.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_attachment() {
		// Create a mock attachment.
		$attachment_id = $this->_make_attachment(
			array(
				'file'  => 'example.jpg',
				'url'   => 'http://example.com/wp-content/uploads/example.jpg',
				'type'  => 'image/jpeg',
				'error' => false,
			)
		);

		// Get shortcode with new attachment.
		$content = '[recipe-image ' . $attachment_id . ']';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img src="http://example.org/wp-content/uploads/example.jpg" class="jetpack-recipe-image u-photo" alt="" itemprop="image" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a valid attachment ID attribute.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_image_shortcode_attachment_attr() {
		// Create a mock attachment.
		$attachment_id = $this->_make_attachment(
			array(
				'file'  => 'example.jpg',
				'url'   => 'http://example.com/wp-content/uploads/example.jpg',
				'type'  => 'image/jpeg',
				'error' => false,
			)
		);

		// Get shortcode with new attachment.
		$content = '[recipe-image image="' . $attachment_id . '"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( '<img src="http://example.org/wp-content/uploads/example.jpg" class="jetpack-recipe-image u-photo" alt="" itemprop="image" />', $shortcode_content );
	}

	/**
	 * Verify that the recipe-nutrition shortcode formats a list of nutrition info.
	 *
	 * @covers ::recipe_shortcode
	 *
	 * @since 7.9.0
	 */
	public function test_shortcodes_recipe_nutrition() {
		$content = <<<EOT
[recipe-nutrition]
- food 100%
- taste 500mg
[/recipe-nutrition]
EOT;

		$shortcode_content = do_shortcode( $content );
		$this->assertContains( 'itemprop="nutrition"', $shortcode_content );
		$this->assertContains( '<li class="jetpack-recipe-nutrition">food 100%</li>', $shortcode_content );
		$this->assertContains( '<li class="jetpack-recipe-nutrition">taste 500mg</li>', $shortcode_content );
	}
}
