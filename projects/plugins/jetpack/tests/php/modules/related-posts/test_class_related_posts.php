<?php

require __DIR__ . '/../../../../modules/related-posts.php';

class WP_Test_Jetpack_RelatedPosts extends WP_UnitTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_RelatedPosts_Module::instance()->action_on_load();
		add_filter( 'jetpack_relatedposts_filter_options', '__return_null' );
	}

	/**
	 * Verify that 'enabled' remains the same if it's true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_ok() {
		$options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);
		$options             = $options_after_parse;

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that if 'enabled' is somehow not passed to saving request, it's set to true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_true_if_not_set() {
		$options_after_parse = array(
			// The option 'enabled' isn't passed if it's saved in Customizer
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);
		$options             = $options_after_parse;

		// Must be true after saving in Customizer
		$options_after_parse['enabled'] = true;

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that 'enabled' is set to true if one of the keys saved by Customizer are passed.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_has_customizer_key() {
		$options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => false,
			'show_thumbnails' => false,
			'show_date'       => true,
			'show_context'    => false,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);

		$this->assertEquals(
			$options_after_parse,
			Jetpack_RelatedPosts::init()->parse_options(
				array(
					'enabled'   => false,
					'show_date' => true,
				)
			)
		);

		$options_after_parse['show_date'] = false;
		$this->assertEquals(
			$options_after_parse,
			Jetpack_RelatedPosts::init()->parse_options(
				array(
					'show_date' => false,
				)
			)
		);
	}

	/**
	 * Verify that 'enabled' can be saved as false if it's explicitly set to false.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_not_customizer_key() {
		$options = array(
			'enabled'         => false, // set to false
			'show_headline'   => true,
			'show_thumbnails' => true,
			'size'            => null,
		);

		// When enabled is false, the other options are cleared.
		$empty_options = array(
			'enabled' => false,
			'size'    => null,
		);

		$this->assertEquals( $empty_options, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}
}
