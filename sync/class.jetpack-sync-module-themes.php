<?php

class Jetpack_Sync_Module_Themes extends Jetpack_Sync_Module {
	function name() {
		return 'themes';
	}

	public function init_listeners( $callable ) {
		add_action( 'switch_theme', array( $this, 'sync_theme_support' ) );
		add_action( 'jetpack_sync_current_theme_support', $callable );
		add_action( 'upgrader_process_complete', array( $this, 'check_upgrader'), 10, 2 );
		add_action( 'jetpack_installed_theme', $callable, 10, 2 );
		add_action( 'jetpack_updated_themes', $callable, 10, 2 );
		add_action( 'delete_site_transient_update_themes', array( $this, 'detect_theme_deletion') );
		add_action( 'jetpack_deleted_theme', $callable, 10, 2 );
		add_filter( 'wp_redirect', array( $this, 'detect_theme_edit' ) );
		add_action( 'jetpack_edited_theme', $callable, 10, 2 );
		add_action( 'wp_ajax_edit-theme-plugin-file', array( $this, 'theme_edit_ajax' ), 0 );
		add_action( 'update_site_option_allowedthemes', array( $this, 'sync_network_allowed_themes_change' ), 10, 4 );
		add_action( 'jetpack_network_disabled_themes', $callable, 10, 2 );
		add_action( 'jetpack_network_enabled_themes', $callable, 10, 2 );

		// Sidebar updates.
		add_action( 'update_option_sidebars_widgets', array( $this, 'sync_sidebar_widgets_actions' ), 10, 2 );

		add_action( 'jetpack_widget_added', $callable, 10, 4 );
		add_action( 'jetpack_widget_removed', $callable, 10, 4 );
		add_action( 'jetpack_widget_moved_to_inactive', $callable, 10, 2 );
		add_action( 'jetpack_cleared_inactive_widgets', $callable );
		add_action( 'jetpack_widget_reordered', $callable, 10, 2 );
		add_filter( 'widget_update_callback', array( $this, 'sync_widget_edit' ), 10, 4 );
		add_action( 'jetpack_widget_edited', $callable );
	}

	public function sync_widget_edit( $instance, $new_instance, $old_instance, $widget_object ) {
		if ( empty( $old_instance ) ) {
			return $instance;
		}

		// Don't trigger sync action if this is an ajax request, because Customizer makes them during preview before saving changes
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX && isset( $_POST['customized'] ) ) {
			return $instance;
		}

		$widget = array(
			'name' => $widget_object->name,
			'id' => $widget_object->id,
			'title' => isset( $new_instance['title'] ) ? $new_instance['title'] : '',
		);
		/**
		 * Trigger action to alert $callable sync listener that a widget was edited
		 *
		 * @since 5.0.0
		 *
		 * @param string $widget_name , Name of edited widget
		 */
		do_action( 'jetpack_widget_edited', $widget );

		return $instance;
	}

	public function sync_network_allowed_themes_change( $option, $value, $old_value, $network_id ) {
		$all_enabled_theme_slugs = array_keys( $value );

		if ( count( $old_value ) > count( $value ) )  {

			//Suppress jetpack_network_disabled_themes sync action when theme is deleted
			$delete_theme_call = $this->get_delete_theme_call();
			if ( ! empty( $delete_theme_call ) ) {
				return;
			}

			$newly_disabled_theme_names = array_keys( array_diff_key( $old_value, $value ) );
			$newly_disabled_themes = $this->get_theme_details_for_slugs( $newly_disabled_theme_names );
			/**
			 * Trigger action to alert $callable sync listener that network themes were disabled
			 *
			 * @since 5.0.0
			 *
			 * @param mixed $newly_disabled_themes, Array of info about network disabled themes
			 * @param mixed $all_enabled_theme_slugs, Array of slugs of all enabled themes
			 */
			do_action( 'jetpack_network_disabled_themes', $newly_disabled_themes, $all_enabled_theme_slugs );
			return;
		}

		$newly_enabled_theme_names = array_keys( array_diff_key( $value, $old_value ) );
		$newly_enabled_themes = $this->get_theme_details_for_slugs( $newly_enabled_theme_names );
		/**
		 * Trigger action to alert $callable sync listener that network themes were enabled
		 *
		 * @since 5.0.0
		 *
		 * @param mixed $newly_enabled_themes , Array of info about network enabled themes
		 * @param mixed $all_enabled_theme_slugs, Array of slugs of all enabled themes
		 */
		do_action( 'jetpack_network_enabled_themes', $newly_enabled_themes, $all_enabled_theme_slugs );
	}

	private function get_theme_details_for_slugs( $theme_slugs ) {
		$theme_data = array();
		foreach ( $theme_slugs as $slug ) {
			$theme = wp_get_theme( $slug );
			$theme_data[ $slug ] = array(
				'name' => $theme->get( 'Name' ),
				'version' => $theme->get( 'Version' ),
				'uri' => $theme->get( 'ThemeURI' ),
				'slug' => $slug,
			);
		}
		return $theme_data;
	}

	public function detect_theme_edit( $redirect_url ) {
		$url = wp_parse_url( admin_url( $redirect_url ) );
		$theme_editor_url = wp_parse_url( admin_url( 'theme-editor.php' ) );

		if ( $theme_editor_url['path'] !== $url['path'] ) {
			return $redirect_url;
		}

		$query_params = array();
		wp_parse_str( $url['query'], $query_params );
		if (
			! isset( $_POST['newcontent'] ) ||
			! isset( $query_params['file'] ) ||
			! isset( $query_params['theme'] ) ||
			! isset( $query_params['updated'] )
		) {
			return $redirect_url;
		}
		$theme = wp_get_theme( $query_params['theme'] );
		$theme_data = array(
			'name' => $theme->get('Name'),
			'version' => $theme->get('Version'),
			'uri' => $theme->get( 'ThemeURI' ),
		);

		/**
		 * Trigger action to alert $callable sync listener that a theme was edited
		 *
		 * @since 5.0.0
		 *
		 * @param string $query_params['theme'], Slug of edited theme
		 * @param string $theme_data, Information about edited them
		 */
		do_action( 'jetpack_edited_theme', $query_params['theme'], $theme_data );

		return $redirect_url;
	}

	public function theme_edit_ajax() {
		$args = wp_unslash( $_POST );

		if ( empty( $args['theme'] ) ) {
			return;
		}

		if ( empty( $args['file'] ) ) {
			return;
		}
		$file = $args['file'];
		if ( 0 !== validate_file( $file ) ) {
			return;
		}

		if ( ! isset( $args['newcontent'] ) ) {
			return;
		}

		if ( ! isset( $args['nonce'] ) ) {
			return;
		}

		$stylesheet = $args['theme'];
		if ( 0 !== validate_file( $stylesheet ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_themes' ) ) {
			return;
		}

		$theme = wp_get_theme( $stylesheet );
		if ( ! $theme->exists() ) {
			return;
		}

		$real_file = $theme->get_stylesheet_directory() . '/' . $file;
		if ( ! wp_verify_nonce( $args['nonce'], 'edit-theme_' . $real_file . $stylesheet ) ) {
			return;
		}

		if ( $theme->errors() && 'theme_no_stylesheet' === $theme->errors()->get_error_code() ) {
			return;
		}

		$editable_extensions = wp_get_theme_file_editable_extensions( $theme );

		$allowed_files = array();
		foreach ( $editable_extensions as $type ) {
			switch ( $type ) {
				case 'php':
					$allowed_files = array_merge( $allowed_files, $theme->get_files( 'php', -1 ) );
					break;
				case 'css':
					$style_files = $theme->get_files( 'css', -1 );
					$allowed_files['style.css'] = $style_files['style.css'];
					$allowed_files = array_merge( $allowed_files, $style_files );
					break;
				default:
					$allowed_files = array_merge( $allowed_files, $theme->get_files( $type, -1 ) );
					break;
			}
		}

		if ( 0 !== validate_file( $real_file, $allowed_files ) ) {
			return;
		}

		// Ensure file is real.
		if ( ! is_file( $real_file ) ) {
			return;
		}

		// Ensure file extension is allowed.
		$extension = null;
		if ( preg_match( '/\.([^.]+)$/', $real_file, $matches ) ) {
			$extension = strtolower( $matches[1] );
			if ( ! in_array( $extension, $editable_extensions, true ) ) {
				return;
			}
		}

		if ( ! is_writeable( $real_file ) ) {
			return;
		}

		$file_pointer = fopen( $real_file, 'w+' );
		if ( false === $file_pointer ) {
			return;
		}
		fclose( $file_pointer );

		$theme_data = array(
			'name' => $theme->get('Name'),
			'version' => $theme->get('Version'),
			'uri' => $theme->get( 'ThemeURI' ),
		);

		/**
		 * This action is documented already in this file
		 */
		do_action( 'jetpack_edited_theme', $stylesheet, $theme_data );

	}

	public function detect_theme_deletion() {
		$delete_theme_call = $this->get_delete_theme_call();
		if ( empty( $delete_theme_call ) ) {
			return;
		}

		$slug = $delete_theme_call['args'][0];
		$theme = wp_get_theme( $slug );
		$theme_data = array(
			'name' => $theme->get('Name'),
			'version' => $theme->get('Version'),
			'uri' => $theme->get( 'ThemeURI' ),
			'slug' => $slug,
		);

		/**
		 * Signals to the sync listener that a theme was deleted and a sync action
		 * reflecting the deletion and theme slug should be sent
		 *
		 * @since 5.0.0
		 *
		 * @param string $slug Theme slug
		 * @param array $theme_data Theme info Since 5.3
		 */
		do_action( 'jetpack_deleted_theme', $slug, $theme_data );
	}

	public function check_upgrader( $upgrader, $details ) {
		if ( ! isset( $details['type'] ) ||
		     'theme' !== $details['type'] ||
		     is_wp_error( $upgrader->skin->result ) ||
		     ! method_exists( $upgrader, 'theme_info' )
		) {
			return;
		}

		if ( 'install' === $details['action'] ) {
			$theme = $upgrader->theme_info();
			if ( ! $theme instanceof WP_Theme ) {
				return;
			}
			$theme_info = array(
				'name' => $theme->get( 'Name' ),
				'version' => $theme->get( 'Version' ),
				'uri' => $theme->get( 'ThemeURI' ),
			);

			/**
			 * Signals to the sync listener that a theme was installed and a sync action
			 * reflecting the installation and the theme info should be sent
			 *
			 * @since 4.9.0
			 *
			 * @param string $theme->theme_root Text domain of the theme
			 * @param mixed $theme_info Array of abbreviated theme info
			 */
			do_action( 'jetpack_installed_theme', $theme->stylesheet, $theme_info );
		}

		if ( 'update' === $details['action'] ) {
			$themes = array();

			if ( empty( $details['themes'] ) && isset ( $details['theme'] ) ) {
				$details['themes'] = array( $details['theme'] );
			}

			foreach ( $details['themes'] as $theme_slug ) {
				$theme = wp_get_theme( $theme_slug );

				if ( ! $theme instanceof WP_Theme ) {
					continue;
				}

				$themes[ $theme_slug ] = array(
					'name' => $theme->get( 'Name' ),
					'version' => $theme->get( 'Version' ),
					'uri' => $theme->get( 'ThemeURI' ),
					'stylesheet' => $theme->stylesheet,
				);
			}

			if ( empty( $themes ) ) {
				return;
			}

			/**
			 * Signals to the sync listener that one or more themes was updated and a sync action
			 * reflecting the update and the theme info should be sent
			 *
			 * @since 6.2.0
			 *
			 * @param mixed $themes Array of abbreviated theme info
			 */
			do_action( 'jetpack_updated_themes', $themes );
		}

	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_theme_data', $callable );
	}

	public function sync_theme_support() {
		/**
		 * Fires when the client needs to sync theme support info
		 * Only sends theme support attributes whitelisted in Jetpack_Sync_Defaults::$default_theme_support_whitelist
		 *
		 * @since 4.2.0
		 *
		 * @param object the theme support hash
		 */
		do_action( 'jetpack_sync_current_theme_support' , $this->get_theme_support_info() );
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		/**
		 * Tells the client to sync all theme data to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand theme data (should always be true)
		 */
		do_action( 'jetpack_full_sync_theme_data', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	public function estimate_full_sync_actions( $config ) {
		return 1;
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_theme_data', array( $this, 'expand_theme_data' ) );
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_theme_data' );
	}

	function expand_theme_data() {
		return array( $this->get_theme_support_info() );
	}

	function get_widget_name( $widget_id ) {
		global $wp_registered_widgets;
		return ( isset( $wp_registered_widgets[ $widget_id ] ) ? $wp_registered_widgets[ $widget_id ]['name'] : null );
	}

	function get_sidebar_name( $sidebar_id ) {
		global $wp_registered_sidebars;
		return ( isset( $wp_registered_sidebars[ $sidebar_id ] ) ? $wp_registered_sidebars[ $sidebar_id ]['name'] : null );
	}

	function sync_add_widgets_to_sidebar( $new_widgets, $old_widgets, $sidebar ) {
		$added_widgets = array_diff( $new_widgets, $old_widgets );
		if ( empty( $added_widgets ) ) {
			return array();
		}
		$moved_to_sidebar = array();
		$sidebar_name = $this->get_sidebar_name( $sidebar );

		//Don't sync jetpack_widget_added if theme was switched
		if ( $this->is_theme_switch() ) {
			return array();
		}

		foreach ( $added_widgets as $added_widget ) {
			$moved_to_sidebar[] = $added_widget;
			$added_widget_name = $this->get_widget_name( $added_widget );
			/**
			 * Helps Sync log that a widget got added
			 *
			 * @since 4.9.0
			 *
			 * @param string $sidebar, Sidebar id got changed
			 * @param string $added_widget, Widget id got added
			 * @param string $sidebar_name, Sidebar id got changed Since 5.0.0
			 * @param string $added_widget_name, Widget id got added Since 5.0.0
			 *
			 */
			do_action( 'jetpack_widget_added', $sidebar, $added_widget,  $sidebar_name, $added_widget_name );
		}
		return $moved_to_sidebar;
	}

	function sync_remove_widgets_from_sidebar( $new_widgets, $old_widgets, $sidebar, $inactive_widgets  ) {
		$removed_widgets = array_diff( $old_widgets, $new_widgets );

		if ( empty( $removed_widgets ) ) {
			return array();
		}

		$moved_to_inactive = array();
		$sidebar_name = $this->get_sidebar_name( $sidebar );

		foreach( $removed_widgets as $removed_widget ) {
			// Lets check if we didn't move the widget to in_active_widgets
			if ( isset( $inactive_widgets ) && ! in_array( $removed_widget, $inactive_widgets ) ) {
				$removed_widget_name = $this->get_widget_name( $removed_widget );
				/**
				 * Helps Sync log that a widgte got removed
				 *
				 * @since 4.9.0
				 *
				 * @param string $sidebar, Sidebar id got changed
				 * @param string $removed_widget, Widget id got removed
				 * @param string $sidebar_name, Name of the sidebar that changed  Since 5.0.0
				 * @param string $removed_widget_name, Name of the widget that got removed Since 5.0.0
				 */
				do_action( 'jetpack_widget_removed', $sidebar, $removed_widget, $sidebar_name, $removed_widget_name );
			} else {
				$moved_to_inactive[] = $removed_widget;
			}
		}
		return $moved_to_inactive;

	}

	function sync_widgets_reordered( $new_widgets, $old_widgets, $sidebar ) {
		$added_widgets = array_diff( $new_widgets, $old_widgets );
		if ( ! empty( $added_widgets ) ) {
			return;
		}
		$removed_widgets = array_diff( $old_widgets, $new_widgets );
		if ( ! empty( $removed_widgets ) ) {
			return;
		}

		if ( serialize( $old_widgets ) !== serialize( $new_widgets ) ) {
			$sidebar_name = $this->get_sidebar_name( $sidebar );
			/**
			 * Helps Sync log that a sidebar id got reordered
			 *
			 * @since 4.9.0
			 *
			 * @param string $sidebar, Sidebar id got changed
			 * @param string $sidebar_name, Name of the sidebar that changed  Since 5.0.0
			 */
			do_action( 'jetpack_widget_reordered', $sidebar, $sidebar_name );
		}

	}

	function sync_sidebar_widgets_actions( $old_value, $new_value ) {
		// Don't really know how to deal with different array_values yet.
		if (
			( isset( $old_value['array_version'] ) && $old_value['array_version'] !== 3 ) ||
			( isset( $new_value['array_version'] ) && $new_value['array_version'] !== 3 )
		) {
			return;
		}

		$moved_to_inactive_ids = array();
		$moved_to_sidebar = array();

		foreach ( $new_value as $sidebar => $new_widgets ) {
			if ( in_array( $sidebar, array( 'array_version', 'wp_inactive_widgets' ) ) ) {
				continue;
			}
			$old_widgets = isset( $old_value[ $sidebar ] )
				? $old_value[ $sidebar ]
				: array();

			if ( ! is_array( $new_widgets ) ) {
				$new_widgets = array();
			}

			$moved_to_inactive_recently = $this->sync_remove_widgets_from_sidebar( $new_widgets, $old_widgets, $sidebar, $new_value['wp_inactive_widgets'] );
			$moved_to_inactive_ids = array_merge( $moved_to_inactive_ids, $moved_to_inactive_recently );

			$moved_to_sidebar_recently = $this->sync_add_widgets_to_sidebar( $new_widgets, $old_widgets, $sidebar );
			$moved_to_sidebar = array_merge( $moved_to_sidebar, $moved_to_sidebar_recently );

			$this->sync_widgets_reordered( $new_widgets, $old_widgets, $sidebar );

		}

		//Don't sync either jetpack_widget_moved_to_inactive or jetpack_cleared_inactive_widgets if theme was switched
		if ( $this->is_theme_switch() ) {
			return;
		}

		// Treat inactive sidebar a bit differently
		if ( ! empty( $moved_to_inactive_ids ) ) {
			$moved_to_inactive_name = array_map( array( $this, 'get_widget_name' ), $moved_to_inactive_ids );
			/**
			 * Helps Sync log that a widgets IDs got moved to in active
			 *
			 * @since 4.9.0
			 *
			 * @param array $moved_to_inactive_ids, Array of widgets id that moved to inactive id got changed
			 * @param array $moved_to_inactive_names, Array of widgets names that moved to inactive id got changed Since 5.0.0
			 */
			do_action( 'jetpack_widget_moved_to_inactive', $moved_to_inactive_ids, $moved_to_inactive_name );
		} elseif ( empty( $moved_to_sidebar ) &&
		           empty( $new_value['wp_inactive_widgets']) &&
		           ! empty( $old_value['wp_inactive_widgets'] ) ) {
			/**
			 * Helps Sync log that a got cleared from inactive.
			 *
			 * @since 4.9.0
			 */
			do_action( 'jetpack_cleared_inactive_widgets' );
		}
	}

	private function get_theme_support_info() {
		global $_wp_theme_features;

		$theme_support = array();

		foreach ( Jetpack_Sync_Defaults::$default_theme_support_whitelist as $theme_feature ) {
			$has_support = current_theme_supports( $theme_feature );
			if ( $has_support ) {
				$theme_support[ $theme_feature ] = $_wp_theme_features[ $theme_feature ];
			}
		}

		$theme = wp_get_theme();
		$theme_support['name'] = $theme->get('Name');
		$theme_support['version'] =  $theme->get('Version');
		$theme_support['slug'] = $theme->get_stylesheet();
		$theme_support['uri'] = $theme->get('ThemeURI');


		return $theme_support;
	}

	private function get_delete_theme_call() {
		$backtrace = debug_backtrace();
		$delete_theme_call = null;
		foreach ( $backtrace as $call ) {
			if ( isset( $call['function'] ) && 'delete_theme' === $call['function'] ) {
				$delete_theme_call = $call;
				break;
			}
		}
		return $delete_theme_call;
	}

	private function is_theme_switch() {
		return did_action( 'after_switch_theme' );
	}
}
