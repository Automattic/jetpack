<?php

class Jetpack_Sync_Module_Menus extends Jetpack_Sync_Module {
	private $nav_items_just_added = array();

	function name() {
		return 'menus';
	}

	public function init_listeners( $callable ) {
		add_action( 'wp_create_nav_menu', $callable, 10, 2 );
		add_action( 'wp_update_nav_menu', array( $this, 'update_nav_menu' ), 10, 2 );
		add_action( 'wp_add_nav_menu_item', array( $this, 'update_nav_menu_add_item' ), 10, 3 );
		add_action( 'wp_update_nav_menu_item', array( $this, 'update_nav_menu_update_item' ), 10, 3 );
		add_action( 'post_updated', array( $this, 'remove_just_added_menu_item' ), 10, 2 );

		add_action( 'jetpack_sync_updated_nav_menu', $callable, 10, 2 );
		add_action( 'jetpack_sync_updated_nav_menu_add_item', $callable, 10, 4 );
		add_action( 'jetpack_sync_updated_nav_menu_update_item', $callable, 10, 4 );
		add_action( 'delete_nav_menu', $callable, 10, 3 );
	}
	
	public function update_nav_menu( $menu_id, $menu_data = array() ) {
		if ( empty( $menu_data ) ) {
			return;
		}
		/**
		 * Helps sync log that a nav menu was updated.
		 * 
		 * @since 5.0.0
		 * 
		 * @param int $menu_id, the id of the menu
		 * @param object $menu_data
		 */
		do_action( 'jetpack_sync_updated_nav_menu', $menu_id, $menu_data );
	}

	public function update_nav_menu_add_item( $menu_id, $nav_item_id, $nav_item_args ) {
		$menu_data = wp_get_nav_menu_object( $menu_id );
		$this->nav_items_just_added[] = $nav_item_id;
		/**
		 * Helps sync log that a new menu item was added.
		 *
		 * @since 5.0.0
		 *
		 * @param int $menu_id, the id of the menu
		 * @param object $menu_data
		 * @param int $nav_item_id
		 * @param int $nav_item_args
		 */
		do_action( 'jetpack_sync_updated_nav_menu_add_item', $menu_id, $menu_data, $nav_item_id, $nav_item_args );
	}

	public function update_nav_menu_update_item( $menu_id, $nav_item_id, $nav_item_args ) {
		if ( in_array( $nav_item_id, $this->nav_items_just_added ) ) {
			return;
		}
		$menu_data = wp_get_nav_menu_object( $menu_id );
		/**
		 * Helps sync log that an update to the menu item happened.
		 *
		 * @since 5.0.0
		 *
		 * @param int $menu_id, the id of the menu
		 * @param object $menu_data
		 * @param int $nav_item_id
		 * @param int $nav_item_args
		 */
		do_action( 'jetpack_sync_updated_nav_menu_update_item', $menu_id, $menu_data, $nav_item_id, $nav_item_args );
	}

	public function remove_just_added_menu_item( $nav_item_id, $post_after  ) {
		if ( 'nav_menu_item' !== $post_after->post_type ) {
			return;
		}
		$this->nav_items_just_added = array_diff( $this->nav_items_just_added, array( $nav_item_id ) );
	}
}
