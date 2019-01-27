<?php
/**
 * Testing WP_Test_Jetpack_Sync_Defaults class
 */
class WP_Test_Jetpack_Sync_Defaults extends WP_Test_Jetpack_Sync_Base {
	private $jp_option = 'example_jp_option_name_here';

	private $jp_sync_option = 'example_jp_sync_option_name_here';

	public function setUp() {
		parent::setUp();

		add_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_to_sync_options_whitelist' ) );
	}

	public function tearDown() {
		parent::tearDown();

		remove_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );
		remove_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_to_sync_options_whitelist' ) );
	}

	function test_is_whitelisted_option() {
		// A default option.
		$this->assertTrue( Jetpack_Sync_Defaults::is_whitelisted_option( 'blogname' ) );

		// A custom JP option, registered with the `jetpack_options_whitelist` filter.
		$this->assertTrue( Jetpack_Sync_Defaults::is_whitelisted_option( $this->jp_option ) );

		// A custom JP sync option, registered with the `jetpack_sync_options_whitelist` filter.
		$this->assertTrue( Jetpack_Sync_Defaults::is_whitelisted_option( $this->jp_sync_option ) );

		// An unknown option.
		$this->assertFalse( Jetpack_Sync_Defaults::is_whitelisted_option( 'some_unknown_option' ) );
	}

	public function add_to_options_whitelist( $whitelist ) {
		$whitelist[] = $this->jp_option;
		return $whitelist;
	}

	public function add_to_sync_options_whitelist( $whitelist ) {
		$whitelist[] = $this->jp_sync_option;
		return $whitelist;
	}
}

