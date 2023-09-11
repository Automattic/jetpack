<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_Sync_Menus extends WP_Test_Jetpack_Sync_Base {

	public function test_sync_creating_a_menu() {
		$menu_id = wp_create_nav_menu( 'FUN' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_create_nav_menu' );
		$this->assertTrue( (bool) $event );
		$this->assertEquals( $event->args[0], $menu_id );
		$this->assertEquals( 'FUN', $event->args[1]['menu-name'] );
	}

	public function test_sync_updating_a_menu() {
		$menu_id = wp_create_nav_menu( 'FUN' );
		wp_update_nav_menu_object( $menu_id, array( 'menu-name' => 'UPDATE' ) );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_updated_nav_menu' );

		$this->assertEquals( $event->args[0], $menu_id );
		$this->assertEquals( 'UPDATE', $event->args[1]['menu-name'] );
	}

	public function test_sync_updating_a_menu_add_an_item() {
		$menu_id = wp_create_nav_menu( 'FUN' );

		// Add item to the menu
		$link_item = wp_update_nav_menu_item(
			$menu_id,
			null,
			array(
				'menu-item-title' => 'LINK TO LINKS',
				'menu-item-url'   => 'http://example.com',
			)
		);

		$this->server_event_storage->reset();
		$this->sender->do_sync();

		// Update item in the menu
		$link_item = wp_update_nav_menu_item(
			$menu_id,
			$link_item,
			array(
				'menu-item-title' => 'make it https MORE LINKS',
				'menu-item-url'   => 'https://example.com',
			)
		);

		// Make sure that this event is not there...
		$update_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_updated_nav_menu_update_item' );
		$this->assertFalse( $update_event );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_updated_nav_menu_add_item' );

		$this->assertEquals( $event->args[0], $menu_id );
		$this->assertEquals( 'FUN', $event->args[1]->name );
		$this->assertEquals( $event->args[2], $link_item );
		$this->assertEquals( 'LINK TO LINKS', $event->args[3]['menu-item-title'] );
		$this->assertEquals( 'http://example.com', $event->args[3]['menu-item-url'] );
	}

	public function test_sync_updating_a_menu_update_an_item() {
		$menu_id = wp_create_nav_menu( 'FUN' );

		// Add item to the menu
		$link_item = wp_update_nav_menu_item(
			$menu_id,
			null,
			array(
				'menu-item-title' => 'LINK TO LINKS',
				'menu-item-url'   => 'http://example.com',
			)
		);

		$this->server_event_storage->reset();
		$this->sender->do_sync();

		// Update item in the menu
		$link_item = wp_update_nav_menu_item(
			$menu_id,
			$link_item,
			array(
				'menu-item-title' => 'make it https MORE LINKS',
				'menu-item-url'   => 'https://example.com',
			)
		);

		$this->server_event_storage->reset();
		$this->sender->do_sync();

		$add_event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_updated_nav_menu_add_item' );
		$this->assertFalse( $add_event );

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_updated_nav_menu_update_item' );
		$this->assertEquals( $event->args[0], $menu_id );
		$this->assertEquals( 'FUN', $event->args[1]->name );
		$this->assertEquals( $event->args[2], $link_item );
		$this->assertEquals( 'make it https MORE LINKS', $event->args[3]['menu-item-title'] );
		$this->assertEquals( 'https://example.com', $event->args[3]['menu-item-url'] );
	}

	public function test_sync_deleteing_a_menu() {
		$menu_id = wp_create_nav_menu( 'DELETEME' );
		wp_delete_nav_menu( $menu_id );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'delete_nav_menu' );

		$this->assertEquals( $event->args[0], $menu_id );
		$this->assertEquals( 'DELETEME', $event->args[2]->name );
	}

}
