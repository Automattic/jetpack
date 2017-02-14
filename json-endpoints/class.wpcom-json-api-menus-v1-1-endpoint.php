<?php
abstract class WPCOM_JSON_API_Menus_Abstract_Endpoint extends WPCOM_JSON_API_Endpoint {

	protected function switch_to_blog_and_validate_user( $site ) {
		$site_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error( 'unauthorised', 'User cannot edit theme options on this site.', 403 );
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		return $site_id;
	}


	protected function get_locations() {
		$locations = array();
		$menus = get_registered_nav_menus();
		if ( !empty( $menus ) ) {
			foreach( $menus as $name => $description ) {
				$locations[] = array( 'name' => $name, 'description' => $description );
			}
		}

		$locations = array_merge( $locations, WPCOM_JSON_API_Menus_Widgets::get() );

		// Primary (first) location should have defaultState -> default,
		// all other locations (including widgets) should have defaultState -> empty.
		for ( $i = 0; $i < count( $locations ); $i++ ) {
			$locations[ $i ]['defaultState'] = $i ? 'empty' : 'default';
		}
		return $locations;
	}

	protected function simplify( $data ) {
		$simplifier = new WPCOM_JSON_API_Menus_Simplifier( $data );
		return $simplifier->translate();
	}

	protected function complexify( $data ) {
		$complexifier = new WPCOM_JSON_API_Menus_Complexify( $data );
		return $complexifier->translate();
	}
}

abstract class WPCOM_JSON_API_Menus_Translator {
	protected $filter = '';

	protected $filters = array();

	public function __construct( $menus ) {
		$this->is_single_menu = ! is_array( $menus );
		$this->menus = is_array( $menus ) ? $menus : array( $menus );
	}

	public function translate() {
		$result = $this->menus;
		foreach ( $this->filters as $f ) {
			$result = call_user_func( array( $this, $f ), $result );
			if ( is_wp_error($result ) ) {
				return $result;
			}
		}
		return $this->maybe_extract( $result );
	}

	protected function maybe_extract( $menus ) {
		return $this->is_single_menu ? $menus[0] : $menus;
	}

	public function whitelist_and_rename_with( $object, $dict ) {
		$keys = array_keys( $dict );
		$return = array();
		foreach ( (array) $object as $k => $v ) {
			if ( in_array( $k, $keys ) ) {
				if ( is_array( $dict[ $k ] ) ) {
					settype( $v, $dict[ $k ]['type'] );
					$return[ $dict[ $k ]['name'] ] = $v;
				} else {
					$new_k = $dict[ $k ];
					$return[ $new_k ] = $v;
				}
			}
		}
		return $return;
	}
}

class WPCOM_JSON_API_Menus_Simplifier extends WPCOM_JSON_API_Menus_Translator {
	protected $filter = 'wpcom_menu_api_translator_simplify';

	protected $filters = array(
		'whitelist_and_rename_keys',
		'add_locations',
		'treeify',
		'add_widget_locations',
	);

	protected $menu_whitelist = array(
		'term_id'       => array( 'name' => 'id', 'type' => 'int' ),
		'name'          => array( 'name' => 'name', 'type' => 'string' ),
		'description'   => array( 'name' => 'description', 'type' => 'string' ),
		'items'         => array( 'name' => 'items', 'type' => 'array' ),
	);

	protected $menu_item_whitelist = array(
		'db_id'             => array( 'name' => 'id', 'type' => 'int' ),
		'object_id'         => array( 'name' => 'content_id', 'type' => 'int' ),
		'object'            => array( 'name' => 'type', 'type' => 'string' ),
		'type'              => array( 'name' => 'type_family', 'type' => 'string' ),
		'type_label'        => array( 'name' => 'type_label', 'type' => 'string' ),
		'title'             => array( 'name' => 'name', 'type' => 'string' ),
		'menu_order'        => array( 'name' => 'order', 'type' => 'int' ),
		'menu_item_parent'  => array( 'name' => 'parent', 'type' => 'int' ),
		'url'               => array( 'name' => 'url', 'type' => 'string' ),
		'target'            => array( 'name' => 'link_target', 'type' => 'string' ),
		'attr_title'        => array( 'name' => 'link_title', 'type' => 'string' ),
		'description'       => array( 'name' => 'description', 'type' => 'string' ),
		'classes'           => array( 'name' => 'classes', 'type' => 'array' ),
		'xfn'               => array( 'name' => 'xfn', 'type' => 'string' ),
	);

	/**************************
	 * Filters methods
	 **************************/

	public function treeify( $menus ) {
		return array_map( array( $this, 'treeify_menu' ), $menus );
	}

	// turn the flat item list into a tree of items
	protected function treeify_menu( $menu ) {
		$indexed_nodes = array();
		$tree = array();

		foreach( $menu['items'] as &$item ) {
			$indexed_nodes[ $item['id'] ] = &$item;
		}

		foreach( $menu['items'] as &$item ) {
			if ( $item['parent'] && isset( $indexed_nodes[ $item['parent'] ] ) ) {
				$parent_node = &$indexed_nodes[ $item['parent'] ];
				if ( !isset( $parent_node['items'] ) ) {
					$parent_node['items'] = array();
				}
				$parent_node['items'][ $item['order'] ] = &$item;
			} else {
				$tree[ $item['order'] ] = &$item;
			}
			unset( $item['order'] );
			unset( $item['parent'] );
		}

		$menu['items'] = $tree;
		$this->remove_item_keys( $menu );
		return $menu;
	}

	// recursively ensure item lists are contiguous
	protected function remove_item_keys( &$item ) {
		if ( ! isset( $item['items'] ) || ! is_array( $item['items'] ) ) {
			return;
		}


		foreach( $item['items'] as &$it ) {
			$this->remove_item_keys( $it );
		}

		$item['items'] = array_values( $item['items'] );
	}

	protected function whitelist_and_rename_keys( $menus ) {
		$transformed_menus = array();

		foreach ( $menus as $menu ) {
			$menu = $this->whitelist_and_rename_with( $menu, $this->menu_whitelist );

			if ( isset( $menu['items'] ) ) {
				foreach ( $menu['items'] as &$item ) {
					$item = $this->whitelist_and_rename_with( $item, $this->menu_item_whitelist );
				}
			}

			$transformed_menus[] = $menu;
		}

		return $transformed_menus;
	}

	protected function add_locations( $menus ) {
		$menus_with_locations = array();

		foreach( $menus as $menu ) {
			$menu['locations'] = array_keys( get_nav_menu_locations(), $menu['id'] );
			$menus_with_locations[] = $menu;
		}

		return $menus_with_locations;
	}

	protected function add_widget_locations( $menus ) {
		$nav_menu_widgets = WPCOM_JSON_API_Menus_Widgets::get();

		if ( ! is_array( $nav_menu_widgets ) ) {
			return $menus;
		}

		foreach ( $menus as &$menu ) {
			$widget_locations = array();

			foreach ( $nav_menu_widgets as $key => $widget ) {
				if ( is_array( $widget ) && isset( $widget['nav_menu'] ) &&
				    $widget['nav_menu'] === $menu['id'] ) {
					$widget_locations[] = 'nav_menu_widget-' . $key;
				}
			}
			$menu['locations'] = array_merge( $menu['locations'], $widget_locations );
		}

		return $menus;
	}
}

class WPCOM_JSON_API_Menus_Complexify extends WPCOM_JSON_API_Menus_Translator {
	protected $filter = 'wpcom_menu_api_translator_complexify';

	protected $filters = array(
		'untreeify',
		'set_locations',
		'whitelist_and_rename_keys',
	);

	protected $menu_whitelist = array(
		'id' => 'term_id',
		'name' => 'menu-name',
		'description' => 'description',
		'items' => 'items',
	);

	protected $menu_item_whitelist = array(
		'id' => 'menu-item-db-id',
		'content_id' => 'menu-item-object-id',
		'type' => 'menu-item-object',
		'type_family' => 'menu-item-type',
		'type_label' => 'menu-item-type-label',
		'name' => 'menu-item-title',
		'order' => 'menu-item-position',
		'parent' => 'menu-item-parent-id',
		'url' => 'menu-item-url',
		'link_target' => 'menu-item-target',
		'link_title' => 'menu-item-attr-title',
		'status' => 'menu-item-status',
		'tmp_id' => 'tmp_id',
		'tmp_parent' => 'tmp_parent',
		'description' => 'menu-item-description',
		'classes' => 'menu-item-classes',
		'xfn' => 'menu-item-xfn',
	);

	/**************************
	 * Filters methods
	 **************************/

	public function untreeify( $menus ) {
		return array_map( array( $this, 'untreeify_menu' ), $menus );
	}

	// convert the tree of menu items to a flat list suitable for
	// the nav_menu APIs
	protected function untreeify_menu( $menu ) {
		if ( empty( $menu['items'] ) ) {
			return $menu;
		}

		$items_list = array();
		$counter = 1;
		foreach ( $menu['items'] as &$item ) {
			$item[ 'parent' ] = 0;
		}
		$this->untreeify_items( $menu['items'], $items_list, $counter );
		$menu['items'] = $items_list;

		return $menu;
	}

	/**
	 * Recurse the items tree adding each item to a flat list and restoring
	 * `order` and `parent` fields.
	 *
	 * @param array $items item tree
	 * @param array &$items_list output flat list of items
	 * @param int &$counter for creating temporary IDs
	 */
	protected function untreeify_items( $items, &$items_list, &$counter ) {
		foreach( $items as $index => $item ) {
			$item['order'] = $index + 1;

			if( ! isset( $item['id'] ) ) {
				$this->set_tmp_id( $item, $counter++ );
			}

			if ( isset( $item['items'] ) && is_array( $item['items'] ) ) {
				foreach ( $item['items'] as &$i ) {
					$i['parent'] = $item['id'];
				}
				$this->untreeify_items( $item[ 'items' ], $items_list, $counter );
				unset( $item['items'] );
			}

			$items_list[] = $item;
		}
	}

	/**
	 * Populate `tmp_id` field for a new item, and `tmp_parent` field
	 * for all its children, to maintain the hierarchy.
	 * These fields will be used when creating
	 * new items with wp_update_nav_menu_item().
	 */
	private function set_tmp_id( &$item, $tmp_id ) {
		$item['tmp_id'] = $tmp_id;
		if ( ! isset( $item['items'] ) || ! is_array( $item['items'] ) ) {
			return;
		}
		foreach ( $item['items'] as &$child ) {
			$child['tmp_parent'] = $tmp_id;
		}
	}

	protected function whitelist_and_rename_keys( $menus ) {
		$transformed_menus = array();
		foreach ( $menus as $menu ) {
			$menu = $this->whitelist_and_rename_with( $menu, $this->menu_whitelist );
			if ( isset( $menu['items'] ) ) {
				$menu['items'] = array_map( array( $this, 'whitelist_and_rename_item_keys' ), $menu['items'] );
			}
			$transformed_menus[] = $menu;
		}

		return $transformed_menus;
	}

	protected function whitelist_and_rename_item_keys( $item ) {
		$item = $this->implode_array_fields( $item );
		$item = $this->whitelist_and_rename_with( $item, $this->menu_item_whitelist );
		return $item;
	}

	// all item fields are set as strings
	protected function implode_array_fields( $menu_item ) {
		return array_map( array( $this, 'implode_array_field' ), $menu_item );
	}

	protected function implode_array_field( $field ) {
		if ( is_array( $field ) ) {
			return implode( ' ', $field );
		}
		return $field;
	}

	protected function set_locations( $menus ) {
		foreach ( $menus as $menu ) {
			if ( isset( $menu['locations'] ) ) {
				if ( true !== $this->locations_are_valid( $menu['locations'] ) ) {
					return $this->locations_are_valid( $menu['locations'] );
				}
			}
		}

		return array_map( array( $this, 'set_location' ), $menus );
	}

	protected function set_location( $menu ) {
		$this->set_menu_at_locations( $menu['locations'], $menu['id'] );
		return $menu;
	}

	protected function set_menu_at_locations( $locations, $menu_id ) {
		$location_map =  get_nav_menu_locations();
		$this->remove_menu_from_all_locations( $menu_id, $location_map );

		if ( is_array( $locations ) ) {
			foreach ( $locations as $location ) {
				$location_map[ $location ] = $menu_id;
			}
		}

		set_theme_mod( 'nav_menu_locations', $location_map );

		$this->set_widget_menu_at_locations( $locations, $menu_id );
	}

	protected function remove_menu_from_all_locations( $menu_id, &$location_map ) {
		foreach ( get_nav_menu_locations() as $existing_location => $existing_menu_id) {
			if ( $existing_menu_id == $menu_id ) {
				unset( $location_map[$existing_location] );
			}
		}
	}

	protected function set_widget_menu_at_locations( $locations, $menu_id ) {
		$nav_menu_widgets = get_option( 'widget_nav_menu' );

		if ( ! is_array( $nav_menu_widgets ) ) {
			return;
		}

		// Remove menus from all custom menu widget locations
		foreach ( $nav_menu_widgets as &$widget ) {
			if ( is_array( $widget ) && isset( $widget['nav_menu'] ) &&  $widget['nav_menu'] == $menu_id ) {
				$widget['nav_menu'] = 0;
			}
		}

		if ( is_array( $locations ) ) {
			foreach ( $locations as $location ) {
				if ( preg_match( '/^nav_menu_widget-(\d+)/', $location, $matches ) ) {
					if ( isset( $matches[1] ) ) {
						$nav_menu_widgets[$matches[1]]['nav_menu'] = $menu_id;
					}
				}
			}
		}

		update_option( 'widget_nav_menu', $nav_menu_widgets );
	}

	protected function locations_are_valid( $locations ) {
		if ( is_int( $locations ) ) {
			if ( $locations != 0) {
				return new WP_Error( 'locations-int', 'Locations int must be 0.', 400 );
			} else {
				return true;
			}
		} elseif ( is_array( $locations ) ) {
			foreach ( $locations as $location_name ) {
				if ( ! $this->location_name_exists( $location_name ) ) {
					return new WP_Error( 'locations-array',
						sprintf( "Location '%s' does not exist.", $location_name ), 404 );
				}
			}
			return true;
		}
		return new WP_Error( 'locations', 'Locations must be array or integer.', 400 );
	}

	protected function location_name_exists( $location_name ) {
		$widget_location_names = wp_list_pluck( WPCOM_JSON_API_Menus_Widgets::get(), 'name' );

		$existing_locations = get_nav_menu_locations();

		if ( ! is_array( get_registered_nav_menus() ) ) {
			return false;
		}

		return array_key_exists( $location_name, get_registered_nav_menus() ) ||
			array_key_exists( $location_name, $existing_locations ) ||
			in_array( $location_name, $widget_location_names );
	}

}

class WPCOM_JSON_API_Menus_New_Menu_Endpoint extends WPCOM_JSON_API_Menus_Abstract_Endpoint {
	function callback( $path = '', $site = 0 ) {
		$site_id = $this->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );

		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$data = $this->input();

		$id = wp_create_nav_menu( $data['name'] );

		if ( is_wp_error( $id ) ) {
			return $id;
		}

		return array( 'id' => $id );
	}
}

class WPCOM_JSON_API_Menus_Update_Menu_Endpoint extends WPCOM_JSON_API_Menus_Abstract_Endpoint {
	function callback( $path = '', $site = 0, $menu_id = 0 ) {
		$site_id = $this->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );

		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( $menu_id <= 0 ) {
			return new WP_Error( 'menu-id', 'Menu ID must be greater than 0.', 400 );
		}

		$data = $this->input( true, false );
		$data['id'] = $menu_id;
		$data = $this->complexify( array( $data ) );
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$data = $data[0];

		// Avoid special-case handling of an unset 'items' field in empty menus
		$data['items'] = isset( $data['items'] ) ? $data['items'] : array();

		$data = $this->create_new_items( $data, $menu_id );

		$result = wp_update_nav_menu_object( $menu_id, array( 'menu-name' => $data['menu-name'] ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$delete_status = $this->delete_items_not_present( $menu_id, $data['items'] );
		if( is_wp_error( $delete_status ) ) {
			return $delete_status;
		}

		foreach ( $data['items'] as $item ) {
			$item_id = isset( $item['menu-item-db-id'] ) ? $item['menu-item-db-id'] : 0;
			$result = wp_update_nav_menu_item( $menu_id, $item_id, $item );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		$items = wp_get_nav_menu_items( $menu_id, array( 'update_post_term_cache' => false ) );

		if ( is_wp_error( $items ) ) {
			return $items;
		}

		$menu = wp_get_nav_menu_object( $menu_id );
		$menu->items = $items;

		return array( 'menu' => $this->simplify( $menu ) );
	}

	/**
	 * New items can have a 'tmp_id', allowing them to
	 * be used as parent items before they have been created.
	 *
	 * This function will create items that have a 'tmp_id' set, and
	 * update any items with a 'tmp_parent' to use the
	 * newly created item as a parent.
	 */
	function create_new_items( $data, $menu_id ) {
		$tmp_to_actual_ids = array();
		foreach ( $data['items'] as &$item ) {
			if ( isset( $item['tmp_id'] ) ) {
				$actual_id = wp_update_nav_menu_item( $menu_id, 0, $item );
				$tmp_to_actual_ids[ $item['tmp_id'] ] = $actual_id;
				unset( $item['tmp_id'] );
				$item['menu-item-db-id'] = $actual_id;
			}
		}

		foreach ( $data['items'] as &$item ) {
			if ( isset( $item['tmp_parent'] ) ) {
				$item['menu-item-parent-id'] = $tmp_to_actual_ids[ $item['tmp_parent'] ];
				unset( $item['tmp_parent'] );
			}
		}

		return $data;
	}

	/**
	 * remove any existing menu items not present in the supplied array.
	 * returns wp_error if an item cannot be deleted.
	 */
	function delete_items_not_present( $menu_id, $menu_items ) {

		$existing_items = wp_get_nav_menu_items( $menu_id, array( 'update_post_term_cache' => false ) );
		if ( ! is_array( $existing_items ) ) {
			return true;
		}

		$existing_ids = wp_list_pluck( $existing_items, 'db_id' );
		$ids_to_keep = wp_list_pluck( $menu_items, 'menu-item-db-id' );
		$ids_to_remove = array_diff( $existing_ids, $ids_to_keep );

		foreach ( $ids_to_remove as $id ) {
			if ( false === wp_delete_post( $id, true ) ) {
				return new WP_Error( 'menu-item',
					sprintf( 'Failed to delete menu item with id: %d.', $id ), 400 );
			}
		}

		return true;
	}
}

class WPCOM_JSON_API_Menus_List_Menus_Endpoint extends WPCOM_JSON_API_Menus_Abstract_Endpoint {
	function callback( $path = '', $site = 0 ) {
		$site_id = $this->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );

		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$menus = wp_get_nav_menus( array( 'orderby' => 'term_id' ) );

		if ( is_wp_error( $menus ) ) {
			return $menus;
		}

		foreach ( $menus as $m ) {
			$items = wp_get_nav_menu_items( $m->term_id, array( 'update_post_term_cache' => false ) );
			if ( is_wp_error( $items ) ) {
				return $items;
			}
			$m->items = $items;
		}

		$menus = $this->simplify( $menus );

		if ( is_wp_error( $this->get_locations() ) ) {
			return $this->get_locations();
		}

		return array( 'menus' => $menus, 'locations' => $this->get_locations() );
	}
}

class WPCOM_JSON_API_Menus_Get_Menu_Endpoint extends WPCOM_JSON_API_Menus_Abstract_Endpoint {
	function callback( $path = '', $site = 0, $menu_id = 0 ) {
		$site_id = $this->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );

		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( $menu_id <= 0 ) {
			return new WP_Error( 'menu-id', 'Menu ID must be greater than 0.', 400 );
		}

		$menu = get_term( $menu_id, 'nav_menu' );

		if ( is_wp_error( $menu ) ) {
			return $menu;
		}

		$items = wp_get_nav_menu_items( $menu_id, array( 'update_post_term_cache' => false ) );

		if ( is_wp_error( $items ) ) {
			return $items;
		}

		$menu->items = $items;

		return array( 'menu' => $this->simplify( $menu ) );
	}
}

class WPCOM_JSON_API_Menus_Delete_Menu_Endpoint extends WPCOM_JSON_API_Menus_Abstract_Endpoint {
	function callback( $path = '', $site = 0, $menu_id = 0 ) {
		$site_id = $this->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site ) );

		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( $menu_id <= 0 ) {
			return new WP_Error( 'menu-id', 'Menu ID must be greater than 0.', 400 );
		}

		$result = wp_delete_nav_menu( $menu_id );
		if ( ! is_wp_error( $result ) ) {
			$result = array( 'deleted' => $result );
		}

		return $result;
	}
}

class WPCOM_JSON_API_Menus_Widgets {
	static function get() {
		$locations = array();
		$nav_menu_widgets = get_option( 'widget_nav_menu' );

		if ( ! is_array( $nav_menu_widgets ) ) {
			return $locations;
		}

		foreach ( $nav_menu_widgets as $k => $v ) {
			if ( is_array( $v ) && isset( $v['title'] ) ) {
				$locations[$k] = array( 'name' => 'nav_menu_widget-' . $k, 'description' => $v['title'] );
			}
		}

		return $locations;
	}
}
