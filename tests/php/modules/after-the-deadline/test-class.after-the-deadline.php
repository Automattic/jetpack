<?php

require_jetpack_file( 'modules/after-the-deadline.php' );

class WP_Test_Jetpack_Modules_After_The_Deadline extends WP_UnitTestCase {

 	public function setUp() {
		parent::setUp();

  		$author_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $author_id );
	}

	/**
	 * @author scotchfield
	 * @covers ::AtD_change_mce_settings
	 * @since 3.2
	 */
	public function test_change_mce_settings_array() {
		$init_array = array();

		$result = AtD_change_mce_settings( $init_array );

		$this->assertInternalType( 'array', $result );
	}

	/**
	 * @author scotchfield
	 * @covers ::AtD_change_mce_settings
	 * @since 3.2
	 */
	public function test_change_mce_settings_invalid_string() {
		$input = 'test string';

		$result = AtD_change_mce_settings( $input );

		$this->assertInternalType( 'array', $result );
	}

}
