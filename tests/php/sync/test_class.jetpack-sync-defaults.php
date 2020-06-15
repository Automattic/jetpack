<?php

use Automattic\Jetpack\Sync\Defaults;

/**
 * Testing WP_Test_Defaults class
 */
class WP_Test_Jetpack_Sync_Defaults extends WP_Test_Jetpack_Sync_Base {
	private $jp_option = 'example_jp_option_name_here';

	private $jp_sync_option = 'example_jp_sync_option_name_here';

	public function setUp() {
		parent::setUp();

		add_filter( 'jetpack_options_allowlist', array( $this, 'add_to_options_allowlist' ) );
		add_filter( 'jetpack_sync_options_allowlist', array( $this, 'add_to_sync_options_allowlist' ) );
	}

	public function tearDown() {
		parent::tearDown();

		remove_filter( 'jetpack_options_allowlist', array( $this, 'add_to_options_allowlist' ) );
		remove_filter( 'jetpack_sync_options_allowlist', array( $this, 'add_to_sync_options_allowlist' ) );
	}

	/**
	 * Test if allowed options sync.
	 */
	public function test_is_allowlisted_option() {
		// A default option.
		$this->assertTrue( Defaults::is_allowed_option( 'blogname' ) );

		// A custom JP option, registered with the `jetpack_options_allowlist` filter.
		$this->assertTrue( Defaults::is_allowed_option( $this->jp_option ) );

		// A custom JP sync option, registered with the `jetpack_sync_options_allowlist` filter.
		$this->assertTrue( Defaults::is_allowed_option( $this->jp_sync_option ) );

		// An unknown option.
		$this->assertFalse( Defaults::is_allowed_option( 'some_unknown_option' ) );
	}

	/**
	 * Add option to the allow list.
	 *
	 * @param array $allowlist Allow list.
	 *
	 * @return mixed
	 */
	public function add_to_options_allowlist( $allowlist ) {
		$allowlist[] = $this->jp_option;
		return $allowlist;
	}

	/**
	 * Add sync option to the allow list.
	 *
	 * @param array $allowlist Allow list.
	 *
	 * @return mixed
	 */
	public function add_to_sync_options_allowlist( $allowlist ) {
		$allowlist[] = $this->jp_sync_option;
		return $allowlist;
	}
}

