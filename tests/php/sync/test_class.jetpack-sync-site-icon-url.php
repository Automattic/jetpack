<?php

/**
 * Testing Crud Site icon
 */
class WP_Test_Jetpack_Sync_Site_Icon_Url extends WP_Test_Jetpack_Sync_Base {
	protected $post;

	public function setUp() {
		global $wp_version;
		parent::setUp();

		if ( version_compare( $wp_version, '4.4', '>=' ) ) {
			add_filter( 'get_site_icon_url', array( $this, '_get_site_icon' ), 99, 3 );
			update_option( 'site_icon', '5' );
		} else {
			// wp 4.3 or less
			Jetpack_Options::update_option( 'site_icon_url', 'http://foo.com/icon.gif' );
		}
		$this->sender->do_sync();
	}


	public function test_site_icon_is_synced_using_jetpack_function() {
		$this->assertEquals( 'http://foo.com/icon.gif', $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
		$this->assertEquals( Jetpack_Options::get_option( 'site_icon_url' ), $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
	}

	public function test_site_icon_delete_is_synced_using_jetpack_function() {
		global $wp_version;

		// verify that we started with an icon.
		$this->assertEquals( 'http://foo.com/icon.gif', $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );

		if ( version_compare( $wp_version, '4.4', '>=' ) ) {
			remove_filter( 'get_site_icon_url', array( $this, '_get_site_icon' ), 99, 3 );
			delete_option( 'site_icon' );
		} else {
			// wp 4.3 or less
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
		$this->sender->do_sync();
		$this->assertEmpty( $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
		$this->assertEquals( Jetpack_Options::get_option( 'site_icon_url' ), $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
	}

	public function test_site_icon_update_to_null_is_synced_using_jetpack_function() {
		global $wp_version;

		// verify that we started with an icon.
		$this->assertEquals( 'http://foo.com/icon.gif', $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );

		if ( version_compare( $wp_version, '4.4', '>=' ) ) {
			remove_filter( 'get_site_icon_url', array( $this, '_get_site_icon' ), 99, 3 );
			update_option( 'site_icon', 0 );
		} else {
			// wp 4.3 or less
			Jetpack_Options::delete_option( 'site_icon_url' );
		}
		$this->sender->do_sync();
		$this->assertEmpty( $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
		$this->assertEquals( Jetpack_Options::get_option( 'site_icon_url' ), $this->server_replica_storage->get_option( 'jetpack_site_icon_url' ) );
	}

	function _get_site_icon( $url, $size, $blog_id ) {
		return 'http://foo.com/icon.gif';
	}
}
