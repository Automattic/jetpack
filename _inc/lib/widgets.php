<?php
/**
 * Widgets and Sidebars Library
 *
 * Helper functions for manipulating widgets on a per-blog basis.
 * Only helpful on `wp_loaded` or later (currently requires widgets to be registered and the theme context to already be loaded).
 *
 * Used by the REST API
 *
 * @autounit api widgets
 */

class Jetpack_Widgets {

	/**
	 * Returns the `sidebars_widgets` option with the `array_version` element removed.
	 *
	 * @return array The current value of sidebars_widgets
	 */
	public static function get_sidebars_widgets() {
		$sidebars = get_option( 'sidebars_widgets', array() );
		if ( isset( $sidebars['array_version'] ) ) {
			unset( $sidebars['array_version'] );
		}
		return $sidebars;
	}

	/**
	 * Format widget data for output and for use by other widget functions.
	 *
	 * The output looks like:
	 *
	 * array(
	 *	'id' => 'text-3',
	 *	'sidebar' => 'sidebar-1',
	 *	'position' => '0',
	 *	'settings' => array(
	 *		'title' => 'hello world'
	 *	)
	 * )
	 *
	 *
	 * @param string|integer $position The position of the widget in its sidebar.
	 * @param string $widget_id The widget's id (eg: 'text-3').
	 * @param string $sidebar The widget's sidebar id (eg: 'sidebar-1').
	 * @param array (Optional) $settings The settings for the widget.
	 *
	 * @return array A normalized array representing this widget.
	 */
	public static function format_widget( $position, $widget_id, $sidebar, $settings = null ) {
		if ( ! $settings ) {
			$all_settings = get_option( self::get_widget_option_name( $widget_id ) );
			$instance = self::get_widget_instance_key( $widget_id );
			$settings = $all_settings[$instance];
		}
		$widget = array();

		$widget['id']       = $widget_id;
		$widget['id_base']  = self::get_widget_id_base( $widget_id );
		$widget['settings'] = $settings;
		$widget['sidebar']  = $sidebar;
		$widget['position'] = $position;

		return $widget;
	}

	/**
	 * Return a widget's id_base from its id.
	 *
	 * @param string $widget_id The id of a widget. (eg: 'text-3')
	 *
	 * @return string The id_base of a widget (eg: 'text').
	 */
	public static function get_widget_id_base( $widget_id ) {
		// Grab what's before the hyphen.
		return substr( $widget_id, 0, strrpos( $widget_id, '-' ) );
	}

	/**
	 * Determine a widget's option name (the WP option where the widget's settings
	 * are stored - generally `widget_` + the widget's id_base).
	 *
	 * @param string $widget_id The id of a widget. (eg: 'text-3')
	 *
	 * @return string The option name of the widget's settings. (eg: 'widget_text')
	 */
	public static function get_widget_option_name( $widget_id ) {
		return 'widget_' . self::get_widget_id_base( $widget_id );
	}

	/**
	 * Determine a widget instance key from its ID. (eg: 'text-3' becomes '3').
	 * Used to access the widget's settings.
	 *
	 * @param string $widget_id The id of a widget.
	 *
	 * @return integer The instance key of that widget.
	 */
	public static function get_widget_instance_key( $widget_id ) {
		// Grab all numbers from the end of the id.
		preg_match('/(\d+)$/', $widget_id, $matches );

		return intval( $matches[0] );
	}

	/**
	 * Return a widget by ID (formatted for output) or null if nothing is found.
	 *
	 * @param string $widget_id The id of a widget to look for.
	 *
	 * @return array|null The matching formatted widget (see format_widget).
	 */
	public static function get_widget_by_id( $widget_id ) {
		$found = null;
		foreach ( self::get_all_widgets() as $widget ) {
			if ( $widget['id'] === $widget_id ) {
				$found = $widget;
			}
		}
		return $found;
	}

	/**
	 * Return an array of all widgets (active and inactive) formatted for output.
	 *
	 * @return array An array of all widgets (see format_widget).
	 */
	public static function get_all_widgets() {
		$all_widgets = array();
		$sidebars_widgets = self::get_all_sidebars();

		foreach ( $sidebars_widgets as $sidebar => $widgets ) {
			if ( ! is_array( $widgets ) ) {
				continue;
			}
			foreach ( $widgets as $key => $widget_id ) {
				array_push( $all_widgets, self::format_widget( $key, $widget_id, $sidebar ) );
			}
		}

		return $all_widgets;
	}

	/**
	 * Return an array of all active widgets formatted for output.
	 *
	 * @return array An array of all active widgets (see format_widget).
	 */
	public static function get_active_widgets() {
		$active_widgets = array();
		$all_widgets = self::get_all_widgets();
		foreach( $all_widgets as $widget ) {
			if ( 'wp_inactive_widgets' === $widget['sidebar'] ) {
				continue;
			}
			array_push( $active_widgets, $widget );
		}
		return $active_widgets;
	}

	/**
	 * Return an array of all widget IDs (active and inactive)
	 *
	 * @return array An array of all widget IDs.
	 */
	public static function get_all_widget_ids() {
		$all_widgets = array();
		$sidebars_widgets = self::get_all_sidebars();
		foreach ( array_values( $sidebars_widgets ) as $widgets ) {
			if ( ! is_array( $widgets ) ) {
				continue;
			}
			foreach ( array_values( $widgets ) as $widget_id ) {
				array_push( $all_widgets, $widget_id );
			}
		}
		return $all_widgets;
	}

	/**
	 * Return an array of widgets with a specific id_base (eg: `text`).
	 *
	 * @param string $id_base The id_base of a widget type.
	 *
	 * @return array All the formatted widgets matching that widget type (see format_widget).
	 */
	public static function get_widgets_with_id_base( $id_base ) {
		$matching_widgets = array();
		foreach ( self::get_all_widgets() as $widget ) {
			if ( self::get_widget_id_base( $widget['id'] ) === $id_base ) {
				array_push( $matching_widgets, $widget );
			}
		}
		return $matching_widgets;
	}

	/**
	 * Return the array of widget IDs in a sidebar or null if that sidebar does
	 * not exist. Will return an empty array for an existing empty sidebar.
	 *
	 * @param string $sidebar The id of a sidebar.
	 *
	 * @return array|null The array of widget IDs in the sidebar.
	 */
	public static function get_widgets_in_sidebar( $sidebar ) {
		$sidebars = self::get_all_sidebars();


		if ( ! $sidebars || ! is_array( $sidebars ) ) {
			return null;
		}
		if ( ! $sidebars[ $sidebar ] && array_key_exists( $sidebar, $sidebars ) ) {
			return array();
		}
		return $sidebars[ $sidebar ];
	}

	/**
	 * Return an associative array of all registered sidebars for this theme,
	 * active and inactive, including the hidden disabled widgets sidebar (keyed
	 * by `wp_inactive_widgets`). Each sidebar is keyed by the ID of the sidebar
	 * and its value is an array of widget IDs for that sidebar.
	 *
	 * @return array An associative array of all sidebars and their widget IDs.
	 */
	public static function get_all_sidebars() {
		$sidebars_widgets = self::get_sidebars_widgets();

		if ( ! is_array( $sidebars_widgets ) ) {
			return array();
		}
		return $sidebars_widgets;
	}

	/**
	 * Return an associative array of all active sidebars for this theme, Each
	 * sidebar is keyed by the ID of the sidebar and its value is an array of
	 * widget IDs for that sidebar.
	 *
	 * @return array An associative array of all active sidebars and their widget IDs.
	 */
	public static function get_active_sidebars() {
		$sidebars = array();
		foreach ( self::get_all_sidebars() as $sidebar => $widgets ) {
			if ( 'wp_inactive_widgets' === $sidebar || ! isset( $widgets ) || ! is_array( $widgets ) ) {
				continue;
			}
			$sidebars[ $sidebar ] = $widgets;
		}
		return $sidebars;
	}

	/**
	 * Activates a widget in a sidebar. Does not validate that the sidebar exists,
	 * so please do that first. Also does not save the widget's settings. Please
	 * do that with `set_widget_settings`.
	 *
	 * If position is not set, it will be set to the next available position.
	 *
	 * @param string         $widget_id The newly-formed id of the widget to be added.
	 * @param string         $sidebar   The id of the sidebar where the widget will be added.
	 * @param string|integer $position  (Optional) The position within the sidebar where the widget will be added.
	 *
	 * @return bool
	 */
	public static function add_widget_to_sidebar( $widget_id, $sidebar, $position ) {
		return self::move_widget_to_sidebar( array( 'id' => $widget_id ), $sidebar, $position );
	}

	/**
	 * Removes a widget from a sidebar. Does not validate that the sidebar exists
	 * or remove any settings from the widget, so please do that separately.
	 *
	 * @param array $widget The widget to be removed.
	 */
	public static function remove_widget_from_sidebar( $widget ) {
		$sidebars_widgets = self::get_sidebars_widgets();
		// Remove the widget from its old location and reflow the positions of the remaining widgets.
		array_splice( $sidebars_widgets[ $widget['sidebar'] ], $widget['position'], 1 );

		update_option( 'sidebars_widgets', $sidebars_widgets );
	}

	/**
	 * Moves a widget to a sidebar. Does not validate that the sidebar exists,
	 * so please do that first. Also does not save the widget's settings. Please
	 * do that with `set_widget_settings`. The first argument should be a
	 * widget as returned by `format_widget` including `id`, `sidebar`, and
	 * `position`.
	 *
	 * If $position is not set, it will be set to the next available position.
	 *
	 * Can be used to add a new widget to a sidebar if
	 * $widget['sidebar'] === NULL
	 *
	 * Can be used to move a widget within a sidebar as well if
	 * $widget['sidebar'] === $sidebar.
	 *
	 * @param array          $widget   The widget to be moved (see format_widget).
	 * @param string         $sidebar  The sidebar where this widget will be moved.
	 * @param string|integer $position (Optional) The position where this widget will be moved in the sidebar.
	 *
	 * @return bool
	 */
	public static function move_widget_to_sidebar( $widget, $sidebar, $position ) {
		$sidebars_widgets = self::get_sidebars_widgets();

		// If a position is passed and the sidebar isn't empty,
		// splice the widget into the sidebar, update the sidebar option, and return the result
		if ( isset( $widget['sidebar'] ) && isset( $widget['position'] ) ) {
			array_splice( $sidebars_widgets[ $widget['sidebar'] ], $widget['position'], 1 );
		}

		// Sometimes an existing empty sidebar is NULL, so initialize it.
		if ( array_key_exists( $sidebar, $sidebars_widgets ) && ! is_array( $sidebars_widgets[ $sidebar ] ) ) {
			$sidebars_widgets[ $sidebar ] = array();
		}

		// If no position is passed, set one from items in sidebar
		if ( ! isset( $position ) ) {
			$position = 0;
			$last_position = self::get_last_position_in_sidebar( $sidebar );
			if ( isset( $last_position ) && is_numeric( $last_position ) ) {
				$position = $last_position + 1;
			}
		}

		// Add the widget to the sidebar and reflow the positions of the other widgets.
		if ( empty( $sidebars_widgets[ $sidebar ] ) ) {
			$sidebars_widgets[ $sidebar ][] = $widget['id'];
		} else {
			array_splice( $sidebars_widgets[ $sidebar ], (int)$position, 0, $widget['id'] );
		}

		set_theme_mod( 'sidebars_widgets', array( 'time' => time(), 'data' => $sidebars_widgets ) );
		return update_option( 'sidebars_widgets', $sidebars_widgets );
	}

	/**
	 * Return an integer containing the largest position number in a sidebar or
	 * null if there are no widgets in that sidebar.
	 *
	 * @param string $sidebar The id of a sidebar.
	 *
	 * @return integer|null The last index position of a widget in that sidebar.
	 */
	public static function get_last_position_in_sidebar( $sidebar ) {
		$widgets = self::get_widgets_in_sidebar( $sidebar );
		if ( ! $widgets ) {
			return null;
		}
		$last_position = 0;
		foreach ( $widgets as $widget_id ) {
			$widget = self::get_widget_by_id( $widget_id );
			if ( intval( $widget['position'] ) > intval( $last_position ) ) {
				$last_position = intval( $widget['position'] );
			}
		}
		return $last_position;
	}

	/**
	 * Saves settings for a widget. Does not add that widget to a sidebar. Please
	 * do that with `move_widget_to_sidebar` first. Will merge the settings of
	 * any existing widget with the same `$widget_id`.
	 *
	 * @param string $widget_id The id of a widget.
	 * @param array $settings An associative array of settings to merge with any existing settings on this widget.
	 *
	 * @return boolean|WP_Error True if update was successful.
	 */
	public static function set_widget_settings( $widget_id, $settings ) {
		$widget_option_name = self::get_widget_option_name( $widget_id );
		$widget_settings = get_option( $widget_option_name );
		$instance_key = self::get_widget_instance_key( $widget_id );
		$old_settings = $widget_settings[ $instance_key ];

		if ( ! $settings = self::sanitize_widget_settings( $widget_id, $settings, $old_settings ) ) {
			return new WP_Error( 'invalid_data', 'Update failed.', 500 );
		}
		if ( is_array( $old_settings ) ) {
			// array_filter prevents empty arguments from replacing existing ones
			$settings = wp_parse_args( array_filter( $settings ), $old_settings );
		}

		$widget_settings[ $instance_key ] = $settings;

		return update_option( $widget_option_name, $widget_settings );
	}

	/**
	 * Sanitize an associative array for saving.
	 *
	 * @param string $widget_id The id of a widget.
	 * @param array $settings A widget settings array.
	 * @param array $old_settings The existing widget settings array.
	 *
	 * @return array|false The settings array sanitized by `WP_Widget::update` or false if sanitization failed.
	 */
	private static function sanitize_widget_settings( $widget_id, $settings, $old_settings ) {
		if ( ! $widget = self::get_registered_widget_object( self::get_widget_id_base( $widget_id ) ) ) {
			return false;
		}
		$new_settings = $widget->update( $settings, $old_settings );
		if ( ! is_array( $new_settings ) ) {
			return false;
		}
		return $new_settings;
	}

	/**
	 * Deletes settings for a widget. Does not remove that widget to a sidebar. Please
	 * do that with `remove_widget_from_sidebar` first.
	 *
	 * @param array $widget The widget which will have its settings removed (see format_widget).
	 */
	public static function remove_widget_settings( $widget ) {
		$widget_option_name = self::get_widget_option_name( $widget['id'] );
		$widget_settings = get_option( $widget_option_name );
		unset( $widget_settings[ self::get_widget_instance_key( $widget['id'] ) ] );
		update_option( $widget_option_name, $widget_settings );
	}

	/**
	 * Update a widget's settings, sidebar, and position. Returns the (updated)
	 * formatted widget if successful or a WP_Error if it fails.
	 *
	 * @param string $widget_id The id of a widget to update.
	 * @param string $sidebar (Optional) A sidebar to which this widget will be moved.
	 * @param string|integer (Optional) A new position to which this widget will be moved within its new or existing sidebar.
	 * @param array|object|string $settings Settings to merge with the existing settings of the widget (will be passed through `decode_settings`).
	 *
	 * @return array|WP_Error The newly added widget as an associative array with all the above properties.
	 */
	public static function update_widget( $widget_id, $sidebar, $position, $settings ) {
		$settings = self::decode_settings( $settings );
		if ( isset( $settings ) && ! is_array( $settings ) ) {
			return new WP_Error( 'invalid_data', 'Invalid settings', 400 );
		}
		// Default to an empty array if nothing is specified.
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		$widget = self::get_widget_by_id( $widget_id );
		if ( ! $widget ) {
			return new WP_Error( 'not_found', 'No widget found.', 400 );
		}
		if ( ! $sidebar ) {
			$sidebar = $widget['sidebar'];
		}
		if ( ! isset( $position ) ) {
			$position = $widget['position'];
		}
		if ( ! is_numeric( $position ) ) {
			return new WP_Error( 'invalid_data', 'Invalid position', 400 );
		}
		$widgets_in_sidebar = self::get_widgets_in_sidebar( $sidebar );
		if ( ! isset( $widgets_in_sidebar ) ) {
			return new WP_Error( 'invalid_data', 'No such sidebar exists', 400 );
		}
		self::move_widget_to_sidebar( $widget, $sidebar, $position );
		$widget_save_status = self::set_widget_settings( $widget_id, $settings );
		if ( is_wp_error( $widget_save_status ) ) {
			return $widget_save_status;
		}
		return self::get_widget_by_id( $widget_id );
	}

	/**
	 * Deletes a widget entirely including all its settings. Returns a WP_Error if
	 * the widget could not be found. Otherwise returns an empty array.
	 *
	 * @param string $widget_id The id of a widget to delete. (eg: 'text-2')
	 *
	 * @return array|WP_Error An empty array if successful.
	 */
	public static function delete_widget( $widget_id ) {
		$widget = self::get_widget_by_id( $widget_id );
		if ( ! $widget ) {
			return new WP_Error( 'not_found', 'No widget found.', 400 );
		}
		self::remove_widget_from_sidebar( $widget );
		self::remove_widget_settings( $widget );
		return array();
	}

	/**
	 * Return an array of settings. The input can be either an object, a JSON
	 * string, or an array.
	 *
	 * @param array|string|object $settings The settings of a widget as passed into the API.
	 *
	 * @return array Decoded associative array of settings.
	 */
	public static function decode_settings( $settings ) {
		// Treat as string in case JSON was passed
		if ( is_object( $settings ) && property_exists( $settings, 'scalar' ) ) {
			$settings = $settings->scalar;
		}
		if ( is_object( $settings ) ) {
			$settings = (array) $settings;
		}
		// Attempt to decode JSON string
		if ( is_string( $settings ) ) {
			$settings = (array) json_decode( $settings );
		}
		return $settings;
	}

	/**
	 * Activate a new widget.
	 *
	 * @param string $id_base The id_base of the new widget (eg: 'text')
	 * @param string $sidebar The id of the sidebar where this widget will go. Dependent on theme. (eg: 'sidebar-1')
	 * @param string|integer $position (Optional) The position of the widget in the sidebar. Defaults to the last position.
	 * @param array|object|string $settings (Optional) An associative array of settings for this widget (will be passed through `decode_settings`). Varies by widget.
	 *
	 * @return array|WP_Error The newly added widget as an associative array with all the above properties except 'id_base' replaced with the generated 'id'.
	 */
	public static function activate_widget( $id_base, $sidebar, $position, $settings ) {
		if ( ! isset( $id_base ) || ! self::validate_id_base( $id_base ) ) {
			return new WP_Error( 'invalid_data', 'Invalid ID base', 400 );
		}

		if ( ! isset( $sidebar ) ) {
			return new WP_Error( 'invalid_data', 'No sidebar provided', 400 );
		}

		if ( isset( $position ) && ! is_numeric( $position ) ) {
			return new WP_Error( 'invalid_data', 'Invalid position', 400 );
		}

		$settings = self::decode_settings( $settings );
		if ( isset( $settings ) && ! is_array( $settings ) ) {
			return new WP_Error( 'invalid_data', 'Invalid settings', 400 );
		}

		// Default to an empty array if nothing is specified.
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$widget_counter = 1 + self::get_last_widget_instance_key_with_id_base( $id_base );
		$widget_id = $id_base . '-' . $widget_counter;
		if ( 0 >= $widget_counter ) {
			return new WP_Error( 'invalid_data', 'Error creating widget ID' . $widget_id, 500 );
		}
		if ( self::get_widget_by_id( $widget_id ) ) {
			return new WP_Error( 'invalid_data', 'Widget ID already exists', 500 );
		}

		self::add_widget_to_sidebar( $widget_id, $sidebar, $position );
		$widget_save_status = self::set_widget_settings( $widget_id, $settings );
		if ( is_wp_error( $widget_save_status ) ) {
			return $widget_save_status;
		}

		// Add a Tracks event for non-Headstart activity.
		if ( ! defined( 'HEADSTART' ) ) {
			$tracking = new Automattic\Jetpack\Tracking();
			$tracking->jetpack_tracks_record_event( wp_get_current_user(), 'wpcom_widgets_activate_widget', array(
				'widget' => $id_base,
				'settings' => json_encode( $settings ),
			) );
		}

		return self::get_widget_by_id( $widget_id );
	}

	/**
	 * Activate an array of new widgets. Like calling `activate_widget` multiple times.
	 *
	 * @param array $widgets An array of widget arrays. Each sub-array must be of the format required by `activate_widget`.
	 *
	 * @return array|WP_Error The newly added widgets in the form returned by `get_all_widgets`.
	 */
	public static function activate_widgets( $widgets ) {
		if ( ! is_array( $widgets ) ) {
			return new WP_Error( 'invalid_data', 'Invalid widgets', 400 );
		}

		$added_widgets = array();

		foreach( $widgets as $widget ) {
			$added_widgets[] = self::activate_widget( $widget['id_base'], $widget['sidebar'], $widget['position'], $widget['settings'] );
		}

		return $added_widgets;
	}

	/**
	 * Return the last instance key (integer) of an existing widget matching
	 * `$id_base`. So if you pass in `text`, and there is a widget with the id
	 * `text-2`, this function will return `2`.
	 *
	 * @param string $id_base The id_base of a type of widget. (eg: 'rss')
	 *
	 * @return integer The last instance key of that type of widget.
	 */
	public static function get_last_widget_instance_key_with_id_base( $id_base ) {
		$similar_widgets = self::get_widgets_with_id_base( $id_base );

		if ( ! empty( $similar_widgets ) ) {
			// If the last widget with the same name is `text-3`, we want `text-4`
			usort( $similar_widgets, __CLASS__ . '::sort_widgets' );

			$last_widget = array_pop( $similar_widgets );
			$last_val = intval( self::get_widget_instance_key( $last_widget['id'] ) );

			return $last_val;
		}

		return 0;
	}

	/**
	 * Method used to sort widgets
	 *
	 * @since 5.4
	 *
	 * @param array $a
	 * @param array $b
	 *
	 * @return int
	 */
	public static function sort_widgets( $a, $b ) {
		$a_val = intval( self::get_widget_instance_key( $a['id'] ) );
		$b_val = intval( self::get_widget_instance_key( $b['id'] ) );
		if ( $a_val > $b_val ) {
			return 1;
		}
		if ( $a_val < $b_val ) {
			return -1;
		}
		return 0;
	}

	/**
	 * Retrieve a given widget object instance by ID base (eg. 'text' or 'archives').
	 *
	 * @param string $id_base The id_base of a type of widget.
	 *
	 * @return WP_Widget|false The found widget object or false if the id_base was not found.
	 */
	public static function get_registered_widget_object( $id_base ) {
		if ( ! $id_base ) {
			return false;
		}

		// Get all of the registered widgets.
		global $wp_widget_factory;
		if ( ! isset( $wp_widget_factory ) ) {
			return false;
		}

		$registered_widgets = $wp_widget_factory->widgets;
		if ( empty( $registered_widgets ) ) {
			return false;
		}

		foreach ( array_values( $registered_widgets ) as $registered_widget_object ) {
			if ( $registered_widget_object->id_base === $id_base ) {
				return $registered_widget_object;
			}
		}
		return false;
	}

	/**
	 * Validate a given widget ID base (eg. 'text' or 'archives').
	 *
	 * @param string $id_base The id_base of a type of widget.
	 *
	 * @return boolean True if the widget is of a known type.
	 */
	public static function validate_id_base( $id_base ) {
		return ( false !== self::get_registered_widget_object( $id_base ) );
	}

	/**
	 * Insert a new widget in a given sidebar.
	 *
	 * @param string $widget_id ID of the widget.
	 * @param array $widget_options Content of the widget.
 	 * @param string $sidebar ID of the sidebar to which the widget will be added.
 	 *
 	 * @return WP_Error|true True when data has been saved correctly, error otherwise.
	*/
	static function insert_widget_in_sidebar( $widget_id, $widget_options, $sidebar ) {
		// Retrieve sidebars, widgets and their instances
		$sidebars_widgets = get_option( 'sidebars_widgets', array() );
		$widget_instances = get_option( 'widget_' . $widget_id, array() );

		// Retrieve the key of the next widget instance
		$numeric_keys = array_filter( array_keys( $widget_instances ), 'is_int' );
		$next_key = $numeric_keys ? max( $numeric_keys ) + 1 : 2;

		// Add this widget to the sidebar
		if ( ! isset( $sidebars_widgets[ $sidebar ] ) ) {
			$sidebars_widgets[ $sidebar ] = array();
		}
		$sidebars_widgets[ $sidebar ][] = $widget_id . '-' . $next_key;

		// Add the new widget instance
		$widget_instances[ $next_key ] = $widget_options;

		// Store updated sidebars, widgets and their instances
		if (
			! ( update_option( 'sidebars_widgets', $sidebars_widgets ) )
			|| ( ! ( update_option( 'widget_' . $widget_id, $widget_instances ) ) )
		) {
			return new WP_Error( 'widget_update_failed', 'Failed to update widget or sidebar.', 400 );
		};

		return true;
	}

	/**
	 * Update the content of an existing widget in a given sidebar.
	 *
	 * @param string $widget_id ID of the widget.
	 * @param array $widget_options New content for the update.
 	 * @param string $sidebar ID of the sidebar to which the widget will be added.
 	 *
 	 * @return WP_Error|true True when data has been updated correctly, error otherwise.
	*/
	static function update_widget_in_sidebar( $widget_id, $widget_options, $sidebar ) {
		// Retrieve sidebars, widgets and their instances
		$sidebars_widgets = get_option( 'sidebars_widgets', array() );
		$widget_instances = get_option( 'widget_' . $widget_id, array() );

		// Retrieve index of first widget instance in that sidebar
		$widget_key = false;
		foreach ( $sidebars_widgets[ $sidebar ] as $widget ) {
			if ( strpos( $widget, $widget_id ) !== false ) {
				$widget_key = absint( str_replace( $widget_id . '-', '', $widget ) );
				break;
			}
		}

		// There is no widget instance
		if ( ! $widget_key ) {
			return new WP_Error( 'invalid_data', 'No such widget.', 400 );
		}

		// Update the widget instance and option if the data has changed
		if ( $widget_instances[ $widget_key ]['title'] !== $widget_options['title']
			|| $widget_instances[ $widget_key ]['address'] !== $widget_options['address']
		) {

			$widget_instances[ $widget_key ] = array_merge( $widget_instances[ $widget_key ], $widget_options );

			// Store updated widget instances and return Error when not successful
			if ( ! ( update_option( 'widget_' . $widget_id, $widget_instances ) ) ) {
				return new WP_Error( 'widget_update_failed', 'Failed to update widget.', 400 );
			};
		};
		return true;
	}

	/**
	 * Retrieve the first active sidebar.
	 *
	 * @return string|WP_Error First active sidebar, error if none exists.
	*/
	static function get_first_sidebar() {
		$active_sidebars = get_option( 'sidebars_widgets', array() );
		unset( $active_sidebars[ 'wp_inactive_widgets' ], $active_sidebars[ 'array_version' ] );

		if ( empty( $active_sidebars ) ) {
			return false;
		}
		$active_sidebars_keys = array_keys( $active_sidebars );
		return array_shift( $active_sidebars_keys );
	}
}
