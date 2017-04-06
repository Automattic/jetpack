<?php

class Jetpack_Sync_Module_Themes extends Jetpack_Sync_Module {
	function name() {
		return 'themes';
	}

	public function init_listeners( $callable ) {
		add_action( 'switch_theme', array( $this, 'sync_theme_support' ) );
		add_action( 'jetpack_sync_current_theme_support', $callable );

		// Sidebar updates.
		add_action( 'update_option_sidebars_widgets', array( $this, 'sync_sidebar_widgets_actions' ), 10, 2 );
		add_action( 'jetpack_widget_added', $callable, 10, 2 );
		add_action( 'jetpack_widget_removed', $callable, 10, 2 );
		add_action( 'jetpack_widget_moved_to_inactive', $callable );
		add_action( 'jetpack_cleared_inactive_widgets', $callable );
		add_action( 'jetpack_widget_reordered', $callable );
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

	function sync_add_widgets_to_sidebar( $new_widgets, $old_widgets, $sidebar ) {
		$added_widgets = array_diff( $new_widgets, $old_widgets );
		if ( empty( $added_widgets ) ) {
			return array();
		}
		$moved_to_sidebar = array();
		foreach ( $added_widgets as $added_widget ) {
			$moved_to_sidebar[] = $added_widget;
			/**
			 * Helps Sync log that a widget got added
			 *
			 * @since 4.9.0
			 *
			 * @param string $sidebar, Sidebar id got changed
			 * @param string $added_widget, Widget id got added
			 */
			do_action( 'jetpack_widget_added', $sidebar, $added_widget );
		}
		return $moved_to_sidebar;
	}

	function sync_remove_widgets_from_sidebar( $new_widgets, $old_widgets, $sidebar, $inactive_widgets  ) {
		$removed_widgets = array_diff( $old_widgets, $new_widgets );

		if ( empty( $removed_widgets ) ) {
			return array();
		}

		$moved_to_inactive = array();

		foreach( $removed_widgets as $removed_widget ) {
			// Lets check if we didn't move the widget to in_active_widgets
			if ( isset( $inactive_widgets ) && ! in_array( $removed_widget, $inactive_widgets ) ) {
				/**
				 * Helps Sync log that a widgte got removed
				 *
				 * @since 4.9.0
				 *
				 * @param string $sidebar, Sidebar id got changed
				 * @param string $removed_widget, Widget id got removed
				 */
				do_action( 'jetpack_widget_removed', $sidebar, $removed_widget );
			} else {
				$moved_to_inactive[] = $removed_widget;
			}
		}
		return $moved_to_inactive;

	}

	function sync_widgets_reordered( $new_widgets, $old_widgets, $sidebar ) {
		if ( ! empty( array_diff( $old_widgets, $new_widgets ) ) ) {
			return;
		}

		if ( ! empty( array_diff( $new_widgets, $old_widgets ) ) ) {
			return;
		}

		if ( serialize( $old_widgets ) !== serialize( $new_widgets ) ) {
			/**
			 * Helps Sync log that a sidebar id got reordered
			 *
			 * @since 4.9.0
			 *
			 * @param string $sidebar, Sidebar id got changed
			 */
			do_action( 'jetpack_widget_reordered', $sidebar );
		}

	}

	function sync_sidebar_widgets_actions( $old_value, $new_value ) {

		// Don't really know how to deal with different array_values yet.
		if ( $old_value['array_version'] !== 3 || $new_value['array_version'] !== 3 ) {
			return;
		}

		$moved_to_inactive = array();
		$moved_to_sidebar = array();

		foreach ( $new_value as $sidebar => $new_widgets ) {
			if ( in_array( $sidebar, array( 'array_version', 'wp_inactive_widgets' ) ) ) {
				continue;
			}
			$old_widgets = $old_value[ $sidebar ];

			$moved_to_inactive_recently = $this->sync_remove_widgets_from_sidebar( $new_widgets, $old_widgets, $sidebar, $new_value['wp_inactive_widgets'] );
			$moved_to_inactive = array_merge( $moved_to_inactive, $moved_to_inactive_recently );


			$moved_to_sidebar_recently = $this->sync_add_widgets_to_sidebar( $new_widgets, $old_widgets, $sidebar );
			$moved_to_sidebar = array_merge( $moved_to_sidebar, $moved_to_sidebar_recently );

			$this->sync_widgets_reordered( $new_widgets, $old_widgets, $sidebar );

		}

		// Treat inactive sidebar a bit differently
		if ( ! empty( $moved_to_inactive ) ) {
			/**
			 * Helps Sync log that a widgets IDs got moved to in active
			 *
			 * @since 4.9.0
			 *
			 * @param array $sidebar, Sidebar id got changed
			 */
			do_action( 'jetpack_widget_moved_to_inactive', $moved_to_inactive );
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

		return $theme_support;
	}
}
