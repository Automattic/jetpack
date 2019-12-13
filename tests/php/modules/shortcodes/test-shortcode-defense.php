<?php

// Testing all shortcodes against unexpected output.
class WP_Test_Jetpack_Modules_Shortcode_Defense extends WP_UnitTestCase {

 	public function setUp() {
		parent::setUp();

  		$author_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $author_id );

		require_once dirname( __FILE__ ) . '/../../../../modules/shortcodes.php';
	}

	/**
	 * @author kraftbj
	 * @since 4.3.0
	 * @see https://github.com/Automattic/jetpack/issues/4795
	 */
	public function test_handle_poor_content_variable() {
		$content = '';

		$content = wp_kses_post( $content );

		// No assertion needed. PHP will throw an error if we have not coded defensively already.
	}
}
