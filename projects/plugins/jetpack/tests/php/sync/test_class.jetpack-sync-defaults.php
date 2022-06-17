<?php

use Automattic\Jetpack\Sync\Defaults;

/**
 * Testing WP_Test_Defaults class
 */
class WP_Test_Jetpack_Sync_Defaults extends WP_Test_Jetpack_Sync_Base {
	private $jp_option = 'example_jp_option_name_here';

	private $jp_sync_option = 'example_jp_sync_option_name_here';

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_to_sync_options_whitelist' ) );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		remove_filter( 'jetpack_options_whitelist', array( $this, 'add_to_options_whitelist' ) );
		remove_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_to_sync_options_whitelist' ) );
	}

	public function test_is_whitelisted_option() {
		// A default option.
		$this->assertTrue( Defaults::is_whitelisted_option( 'blogname' ) );

		// A custom JP option, registered with the `jetpack_options_whitelist` filter.
		$this->assertTrue( Defaults::is_whitelisted_option( $this->jp_option ) );

		// A custom JP sync option, registered with the `jetpack_sync_options_whitelist` filter.
		$this->assertTrue( Defaults::is_whitelisted_option( $this->jp_sync_option ) );

		// An unknown option.
		$this->assertFalse( Defaults::is_whitelisted_option( 'some_unknown_option' ) );
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

