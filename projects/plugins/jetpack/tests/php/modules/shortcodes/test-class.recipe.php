<?php

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Test class for Jetpack_Recipes
 *
 * @covers Jetpack_Recipes
 */
class WP_Test_Jetpack_Shortcodes_Recipe extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * The tested instance.
	 *
	 * @var Jetpack_Recipes
	 */
	public $instance;

	/**
	 * Set up each test.
	 *
	 * @inheritDoc
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new Jetpack_Recipes();
		$this->instance->action_init();
	}

	/**
	 * Tear down after each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		wp_dequeue_script( 'jetpack-recipes-js' );
		wp_dequeue_script( 'jetpack-recipes-printthis' );
		parent::tear_down();
	}

	/**
	 * Test add_scripts.
	 *
	 * @since 8.5.0
	 */
	public function test_add_scripts() {
		global $posts;

		$post               = new stdClass();
		$post->post_content = '[recipe]';
		$posts              = array( $post );
		$this->instance->add_scripts();

		$this->assertTrue( wp_style_is( 'jetpack-recipes-style' ) );
		$this->assertTrue( wp_script_is( 'jetpack-recipes-printthis' ) );
		$this->assertTrue( wp_script_is( 'jetpack-recipes-js' ) );
	}

	/**
	 * Test add_scripts on an AMP endpoint.
	 *
	 * @since 8.5.0
	 */
	public function test_add_scripts_amp() {
		global $posts;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com is in the process of removing AMP plugin.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$post               = new stdClass();
		$post->post_content = '[recipe]';
		$posts              = array( $post );
		$this->instance->add_scripts();

		$this->assertTrue( wp_style_is( 'jetpack-recipes-style' ) );
		$this->assertFalse( wp_script_is( 'jetpack-recipes-printthis' ) );
		$this->assertFalse( wp_script_is( 'jetpack-recipes-js' ) );
	}

	/**
	 * Verify that the shortcodes exist.
	 *
	 * @since 8.0.0
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
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_preptime() {
		$content = '[recipe preptime="30 min"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<time itemprop="prepTime" datetime="P0DT0H30M0S"><strong>Prep Time:</strong> <span class="preptime">30 min</span></time>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs cook time in HTML.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_cooktime() {
		$content = '[recipe cooktime="2 hours 30 min"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<time itemprop="cookTime" datetime="P0DT2H30M0S"><strong>Cook Time:</strong> <span class="cooktime">2 hours 30 min</span></time>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs rating in HTML.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_rating() {
		$content = '[recipe rating="2 stars"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( '<span itemprop="contentRating">2 stars</span>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image with an empty source.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_empty_src() {
		$content = '[recipe image=""]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image with an invalid source string.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_invalid_src() {
		$content = '[recipe image="test"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode does not output an image with an invalid attachment ID.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_invalid_attachment() {
		$content = '[recipe image="-100"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode outputs an image with a valid attachment ID.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_valid_attachment() {
		// Create a mock attachment.
		$attachment_id = self::factory()->attachment->create_upload_object( __DIR__ . '/../../files/jetpack.jpg' );
		$url           = wp_get_attachment_url( $attachment_id );

		// Get shortcode with new attachment.
		$content = '[recipe image="' . $attachment_id . '"]';

		$shortcode_content = do_shortcode( $content );

		// We expect a different image markup in WP 5.5 when Lazy Load is enabled.
		if (
			function_exists( 'wp_lazy_loading_enabled' )
			&& wp_lazy_loading_enabled( 'img', 'wp_get_attachment_image' )
		) {
			$this->assertStringContainsString(
				'src="' . $url . '" class="jetpack-recipe-image u-photo photo" alt="" loading="lazy" itemprop="image" />',
				$shortcode_content
			);
		} else {
			$this->assertStringContainsString(
				'src="' . $url . '" class="jetpack-recipe-image u-photo photo" alt="" itemprop="image" />',
				$shortcode_content
			);
		}
	}

	/**
	 * Verify that the recipe shortcode outputs an image with a src string.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_src() {
		$content = '[recipe image="https://example.com"]';

		$shortcode_content = do_shortcode( $content );

		// We expect a different image markup in WP 5.5 when Lazy Load is enabled.
		if (
			function_exists( 'wp_lazy_loading_enabled' )
			&& wp_lazy_loading_enabled( 'img', 'wp_get_attachment_image' )
		) {
			$this->assertStringContainsString(
				'<img class="jetpack-recipe-image u-photo photo" itemprop="image" loading="lazy" src="https://example.com" />',
				$shortcode_content
			);
		} else {
			$this->assertStringContainsString(
				'<img class="jetpack-recipe-image u-photo photo" itemprop="image" src="https://example.com" />',
				$shortcode_content
			);
		}
	}

	/**
	 * Verify that the recipe shortcode does not output an image if an empty recipe-image shortcode exists.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_location_move() {
		$content = '[recipe image="https://example.com"][recipe-image][/recipe]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with no parameters.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_empty() {
		$content = '[recipe-image]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an empty image attribute.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_empty_attr() {
		$content = '[recipe-image image=""]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a string parameter.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_src() {

		$content = '[recipe-image https://example.com]';

		$shortcode_content = do_shortcode( $content );

		// We expect a different image markup in WP 5.5 when Lazy Load is enabled.
		if (
			function_exists( 'wp_lazy_loading_enabled' )
			&& wp_lazy_loading_enabled( 'img', 'wp_get_attachment_image' )
		) {
			$this->assertStringContainsString( '<img class="jetpack-recipe-image u-photo photo" itemprop="image" loading="lazy" src="https://example.com" />', $shortcode_content );
		} else {
			$this->assertStringContainsString( '<img class="jetpack-recipe-image u-photo photo" itemprop="image" src="https://example.com" />', $shortcode_content );
		}
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a string parameter.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_src_attr() {

		$content = '[recipe-image image="https://example.com"]';

		$shortcode_content = do_shortcode( $content );

		// We expect a different image markup in WP 5.5 when Lazy Load is enabled.
		if (
			function_exists( 'wp_lazy_loading_enabled' )
			&& wp_lazy_loading_enabled( 'img', 'wp_get_attachment_image' )
		) {
			$this->assertStringContainsString( '<img class="jetpack-recipe-image u-photo photo" itemprop="image" loading="lazy" src="https://example.com" />', $shortcode_content );
		} else {
			$this->assertStringContainsString( '<img class="jetpack-recipe-image u-photo photo" itemprop="image" src="https://example.com" />', $shortcode_content );
		}
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an invalid attachment.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_invalid_attachment() {
		$content = '[recipe-image -100]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode does not output an image with an invalid attachment attribute.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_invalid_attachment_attr() {
		$content = '[recipe-image image="-100"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringNotContainsString( '<img', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a valid attachment ID.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_attachment() {
		// Create a mock attachment.
		$attachment_id = self::factory()->attachment->create_upload_object( __DIR__ . '/../../files/jetpack.jpg' );
		$url           = wp_get_attachment_url( $attachment_id );

		// Get shortcode with new attachment.
		$content = '[recipe-image ' . $attachment_id . ']';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( 'src="' . $url . '" class="jetpack-recipe-image u-photo photo"', $shortcode_content );
	}

	/**
	 * Verify that the recipe-image shortcode outputs an image with a valid attachment ID attribute.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_image_shortcode_attachment_attr() {
		// Create a mock attachment.
		$attachment_id = self::factory()->attachment->create_upload_object( __DIR__ . '/../../files/jetpack.jpg' );
		$url           = wp_get_attachment_url( $attachment_id );

		// Get shortcode with new attachment.
		$content = '[recipe-image image="' . $attachment_id . '"]';

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( 'src="' . $url . '" class="jetpack-recipe-image u-photo photo"', $shortcode_content );
	}

	/**
	 * Verify that the recipe-nutrition shortcode formats a list of nutrition info.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_nutrition() {
		$content = <<<EOT
[recipe-nutrition]
- food 100%
- taste 500mg
[/recipe-nutrition]
EOT;

		$shortcode_content = do_shortcode( $content );
		$this->assertStringContainsString( 'itemprop="nutrition"', $shortcode_content );
		$this->assertStringContainsString( '<li class="jetpack-recipe-nutrition">food 100%</li>', $shortcode_content );
		$this->assertStringContainsString( '<li class="jetpack-recipe-nutrition">taste 500mg</li>', $shortcode_content );
	}

	/**
	 * Verify that the recipe shortcode allows needed content via KSES.
	 *
	 * @since 8.0.0
	 */
	public function test_shortcodes_recipe_kses_content() {
		$tags = <<<EOT
<ol itemprop="" datetime=""></ol>
<ul itemprop="" datetime="">
	<li itemprop="" datetime=""></li>
</ul>
<img itemprop="" datetime="" />
<p itemprop="" datetime=""></p>
<h3 itemprop="" datetime=""></h3>
<time itemprop="" datetime=""></time>
<span itemprop="" datetime=""></span>
<div itemscope="" itemtype=""></div>
EOT;

		$shortcode_content = do_shortcode( "[recipe]\n$tags\n[/recipe]" );
		$this->assertStringContainsString( $tags, $shortcode_content );
	}

	/**
	 * Gets the test data for test_shortcodes_recipe_amp().
	 *
	 * @return array The test data.
	 */
	public function get_data_recipe_amp() {
		return array(
			'only_recipe_shortcode'       => array(
				'[recipe title="Mediterranean Panini" servings="5-8" preptime="50 mins" cooktime="25 mins" difficulty="hard" rating="★★★★"]',
				'<div class="hrecipe h-recipe jetpack-recipe" itemscope itemtype="https://schema.org/Recipe"><h3 class="p-name jetpack-recipe-title fn" itemprop="name">Mediterranean Panini</h3>
					<ul class="jetpack-recipe-meta">
						<li class="jetpack-recipe-servings p-yield yield" itemprop="recipeYield"><strong>Servings: </strong>5-8</li>
						<li class="jetpack-recipe-preptime"><time itemprop="prepTime" datetime="P0DT0H50M0S"><strong>Prep Time:</strong> <span class="preptime">50 mins</span></time></li>
						<li class="jetpack-recipe-cooktime"><time itemprop="cookTime" datetime="P0DT0H25M0S"><strong>Cook Time:</strong> <span class="cooktime">25 mins</span></time></li>
						<li class="jetpack-recipe-difficulty"><strong>Difficulty: </strong>hard</li><li class="jetpack-recipe-rating"><strong>Rating: </strong><span itemprop="contentRating">★★★★</span></li>
						<li class="jetpack-recipe-print"><a href="#" on="tap:AMP.print">Print page</a></li>
					</ul>
				<div class="jetpack-recipe-content"></div></div>',
			),
			'with_recipe_notes_shortcode' => array(
				'[recipe title="Mediterranean Panini" servings="5-8" preptime="50 mins" cooktime="25 mins" difficulty="hard" rating="★★★★"][recipe-notes]Credit: allrecipes.com[/recipe-notes][/recipe]',
				'<div class="hrecipe h-recipe jetpack-recipe" itemscope itemtype="https://schema.org/Recipe"><h3 class="p-name jetpack-recipe-title fn" itemprop="name">Mediterranean Panini</h3>
					<ul class="jetpack-recipe-meta">
						<li class="jetpack-recipe-servings p-yield yield" itemprop="recipeYield"><strong>Servings: </strong>5-8</li>
						<li class="jetpack-recipe-preptime"><time itemprop="prepTime" datetime="P0DT0H50M0S"><strong>Prep Time:</strong><span class="preptime">50 mins</span></time></li>
						<li class="jetpack-recipe-cooktime"><time itemprop="cookTime" datetime="P0DT0H25M0S"><strong>Cook Time:</strong><span class="cooktime">25 mins</span></time></li>
						<li class="jetpack-recipe-difficulty"><strong>Difficulty: </strong>hard</li><li class="jetpack-recipe-rating"><strong>Rating: </strong><span itemprop="contentRating">★★★★</span></li>
						<li class="jetpack-recipe-print"><a href="#" on="tap:AMP.print">Print page</a></li>
					</ul>
				<div class="jetpack-recipe-content"><div class="jetpack-recipe-notes">Credit: allrecipes.com</div></div></div>',
			),
		);
	}

	/**
	 * Test the [recipe] shortcode on an AMP endpoint.
	 *
	 * @dataProvider get_data_recipe_amp
	 * @since 8.5.0
	 */
	public function test_shortcodes_recipe_amp( $shortcode, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com is in the process of removing AMP plugin.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$expected = preg_replace( '/\s+/', ' ', $expected );
		$expected = preg_replace( '/(?<=>)\s+(?=<)/', '', trim( $expected ) );

		$actual = do_shortcode( $shortcode );
		$actual = preg_replace( '/\s+/', ' ', $actual );
		$actual = preg_replace( '/(?<=>)\s+(?=<)/', '', trim( $actual ) );

		$this->assertEquals( $expected, $actual );
	}
}
