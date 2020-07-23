<?php
/**
 * Jetpack Search: Jetpack_Search_Helpers class
 *
 * @package    Jetpack
 * @subpackage Jetpack Search
 * @since      5.8.0
 */

use Automattic\Jetpack\Constants;

require_once dirname( __FILE__ ) . '/class-jetpack-search-options.php';

/**
 * Various helper functions for reuse throughout the Jetpack Search code.
 *
 * @since 5.8.0
 */
class Jetpack_Search_Helpers {

	/**
	 * The search widget's base ID.
	 *
	 * @since 5.8.0
	 * @var string
	 */
	const FILTER_WIDGET_BASE = 'jetpack-search-filters';

	/**
	 * Create a URL for the current search that doesn't include the "paged" parameter.
	 *
	 * @since 5.8.0
	 *
	 * @return string The search URL.
	 */
	static function get_search_url() {
		$query_args = stripslashes_deep( $_GET );

		// Handle the case where a permastruct is being used, such as /search/{$query}
		if ( ! isset( $query_args['s'] ) ) {
			$query_args['s'] = get_search_query();
		}

		if ( isset( $query_args['paged'] ) ) {
			unset( $query_args['paged'] );
		}

		$query = http_build_query( $query_args );

		return home_url( "?{$query}" );
	}

	/**
	 * Wraps add_query_arg() with the URL defaulting to the current search URL.
	 *
	 * @see   add_query_arg()
	 *
	 * @since 5.8.0
	 *
	 * @param string|array $key   Either a query variable key, or an associative array of query variables.
	 * @param string       $value Optional. A query variable value.
	 * @param bool|string  $url   Optional. A URL to act upon. Defaults to the current search URL.
	 *
	 * @return string New URL query string (unescaped).
	 */
	static function add_query_arg( $key, $value = false, $url = false ) {
		$url = empty( $url ) ? self::get_search_url() : $url;
		if ( is_array( $key ) ) {
			return add_query_arg( $key, $url );
		}

		return add_query_arg( $key, $value, $url );
	}

	/**
	 * Wraps remove_query_arg() with the URL defaulting to the current search URL.
	 *
	 * @see   remove_query_arg()
	 *
	 * @since 5.8.0
	 *
	 * @param string|array $key   Query key or keys to remove.
	 * @param bool|string  $query Optional. A URL to act upon.  Defaults to the current search URL.
	 *
	 * @return string New URL query string (unescaped).
	 */
	static function remove_query_arg( $key, $url = false ) {
		$url = empty( $url ) ? self::get_search_url() : $url;

		return remove_query_arg( $key, $url );
	}

	/**
	 * Returns the name of the search widget's option.
	 *
	 * @since 5.8.0
	 *
	 * @return string The search widget option name.
	 */
	static function get_widget_option_name() {
		return sprintf( 'widget_%s', self::FILTER_WIDGET_BASE );
	}

	/**
	 * Returns the search widget instances from the widget's option.
	 *
	 * @since 5.8.0
	 *
	 * @return array The widget options.
	 */
	static function get_widgets_from_option() {
		$widget_options = get_option( self::get_widget_option_name(), array() );

		// We don't need this
		if ( ! empty( $widget_options ) && isset( $widget_options['_multiwidget'] ) ) {
			unset( $widget_options['_multiwidget'] );
		}

		return $widget_options;
	}

	/**
	 * Returns the widget ID (widget base plus the numeric ID).
	 *
	 * @param int $number The widget's numeric ID.
	 *
	 * @return string The widget's numeric ID prefixed with the search widget base.
	 */
	static function build_widget_id( $number ) {
		return sprintf( '%s-%d', self::FILTER_WIDGET_BASE, $number );
	}

	/**
	 * Wrapper for is_active_widget() with the other parameters automatically supplied.
	 *
	 * @see   is_active_widget()
	 *
	 * @since 5.8.0
	 *
	 * @param int $widget_id Widget ID.
	 *
	 * @return bool Whether the widget is active or not.
	 */
	static function is_active_widget( $widget_id ) {
		return (bool) is_active_widget( false, $widget_id, self::FILTER_WIDGET_BASE, true );
	}

	/**
	 * Returns an array of the filters from all active search widgets.
	 *
	 * @since 5.8.0
	 *
	 * @param array|null $allowed_widget_ids array of allowed widget IDs.
	 *
	 * @return array Active filters.
	 */
	public static function get_filters_from_widgets( $allowed_widget_ids = null ) {
		$filters = array();

		$widget_options = self::get_widgets_from_option();
		if ( empty( $widget_options ) ) {
			return $filters;
		}

		foreach ( (array) $widget_options as $number => $settings ) {
			$widget_id = self::build_widget_id( $number );
			if ( ! self::is_active_widget( $widget_id ) || empty( $settings['filters'] ) ) {
				continue;
			}
			if ( isset( $allowed_widget_ids ) && ! in_array( $widget_id, $allowed_widget_ids, true ) ) {
				continue;
			}

			foreach ( (array) $settings['filters'] as $widget_filter ) {
				$widget_filter['widget_id'] = $widget_id;

				if ( empty( $widget_filter['name'] ) ) {
					$widget_filter['name'] = self::generate_widget_filter_name( $widget_filter );
				}

				$key = sprintf( '%s_%d', $widget_filter['type'], count( $filters ) );

				$filters[ $key ] = $widget_filter;
			}
		}

		return $filters;
	}

	/**
	 * Get the localized default label for a date filter.
	 *
	 * @since 5.8.0
	 *
	 * @param string $type       Date type, either year or month.
	 * @param bool   $is_updated Whether the filter was updated or not (adds "Updated" to the end).
	 *
	 * @return string The filter label.
	 */
	static function get_date_filter_type_name( $type, $is_updated = false ) {
		switch ( $type ) {
			case 'year':
				$string = ( $is_updated )
					? esc_html_x( 'Year Updated', 'label for filtering posts', 'jetpack' )
					: esc_html_x( 'Year', 'label for filtering posts', 'jetpack' );
				break;
			case 'month':
			default:
				$string = ( $is_updated )
					? esc_html_x( 'Month Updated', 'label for filtering posts', 'jetpack' )
					: esc_html_x( 'Month', 'label for filtering posts', 'jetpack' );
				break;
		}

		return $string;
	}

	/**
	 * Creates a default name for a filter. Used when the filter label is blank.
	 *
	 * @since 5.8.0
	 *
	 * @param array $widget_filter The filter to generate the title for.
	 *
	 * @return string The suggested filter name.
	 */
	static function generate_widget_filter_name( $widget_filter ) {
		$name = '';

		switch ( $widget_filter['type'] ) {
			case 'post_type':
				$name = _x( 'Post Types', 'label for filtering posts', 'jetpack' );
				break;

			case 'date_histogram':
				$modified_fields = array(
					'post_modified',
					'post_modified_gmt',
				);
				switch ( $widget_filter['interval'] ) {
					case 'year':
						$name = self::get_date_filter_type_name(
							'year',
							in_array( $widget_filter['field'], $modified_fields )
						);
						break;
					case 'month':
					default:
						$name = self::get_date_filter_type_name(
							'month',
							in_array( $widget_filter['field'], $modified_fields )
						);
						break;
				}
				break;

			case 'taxonomy':
				$tax = get_taxonomy( $widget_filter['taxonomy'] );
				if ( ! $tax ) {
					break;
				}

				if ( isset( $tax->label ) ) {
					$name = $tax->label;
				} elseif ( isset( $tax->labels ) && isset( $tax->labels->name ) ) {
					$name = $tax->labels->name;
				}
				break;
		}

		return $name;
	}

	/**
	 * Whether we should rerun a search in the customizer preview or not.
	 *
	 * @since 5.8.0
	 *
	 * @return bool
	 */
	static function should_rerun_search_in_customizer_preview() {
		// Only update when in a customizer preview and data is being posted.
		// Check for $_POST removes an extra update when the customizer loads.
		//
		// Note: We use $GLOBALS['wp_customize'] here instead of is_customize_preview() to support unit tests.
		if ( ! isset( $GLOBALS['wp_customize'] ) || ! $GLOBALS['wp_customize']->is_preview() || empty( $_POST ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Since PHP's built-in array_diff() works by comparing the values that are in array 1 to the other arrays,
	 * if there are less values in array 1, it's possible to get an empty diff where one might be expected.
	 *
	 * @since 5.8.0
	 *
	 * @param array $array_1
	 * @param array $array_2
	 *
	 * @return array
	 */
	static function array_diff( $array_1, $array_2 ) {
		// If the array counts are the same, then the order doesn't matter. If the count of
		// $array_1 is higher than $array_2, that's also fine. If the count of $array_2 is higher,
		// we need to swap the array order though.
		if ( count( $array_1 ) !== count( $array_2 ) && count( $array_2 ) > count( $array_1 ) ) {
			$temp    = $array_1;
			$array_1 = $array_2;
			$array_2 = $temp;
		}

		// Disregard keys
		return array_values( array_diff( $array_1, $array_2 ) );
	}

	/**
	 * Given the widget instance, will return true when selected post types differ from searchable post types.
	 *
	 * @since 5.8.0
	 *
	 * @param array $post_types An array of post types.
	 *
	 * @return bool
	 */
	static function post_types_differ_searchable( $post_types ) {
		if ( empty( $post_types ) ) {
			return false;
		}

		$searchable_post_types = get_post_types( array( 'exclude_from_search' => false ) );
		$diff_of_searchable    = self::array_diff( $searchable_post_types, (array) $post_types );

		return ! empty( $diff_of_searchable );
	}

	/**
	 * Given the array of post types, will return true when these differ from the current search query.
	 *
	 * @since 5.8.0
	 *
	 * @param array $post_types An array of post types.
	 *
	 * @return bool
	 */
	static function post_types_differ_query( $post_types ) {
		if ( empty( $post_types ) ) {
			return false;
		}

		if ( empty( $_GET['post_type'] ) ) {
			$post_types_from_query = array();
		} elseif ( is_array( $_GET['post_type'] ) ) {
			$post_types_from_query = $_GET['post_type'];
		} else {
			$post_types_from_query = (array) explode( ',', $_GET['post_type'] );
		}

		$post_types_from_query = array_map( 'trim', $post_types_from_query );

		$diff_query = self::array_diff( (array) $post_types, $post_types_from_query );

		return ! empty( $diff_query );
	}

	/**
	 * Determine what Tracks value should be used when updating a widget.
	 *
	 * @since 5.8.0
	 *
	 * @param mixed $old_value The old option value.
	 * @param mixed $new_value The new option value.
	 *
	 * @return array|false False if the widget wasn't updated, otherwise an array of the Tracks action and widget properties.
	 */
	static function get_widget_tracks_value( $old_value, $new_value ) {
		$old_value = (array) $old_value;
		if ( isset( $old_value['_multiwidget'] ) ) {
			unset( $old_value['_multiwidget'] );
		}

		$new_value = (array) $new_value;
		if ( isset( $new_value['_multiwidget'] ) ) {
			unset( $new_value['_multiwidget'] );
		}

		$old_keys = array_keys( $old_value );
		$new_keys = array_keys( $new_value );

		if ( count( $new_keys ) > count( $old_keys ) ) { // This is the case for a widget being added
			$diff   = self::array_diff( $new_keys, $old_keys );
			$action = 'widget_added';
			$widget = empty( $diff ) || ! isset( $new_value[ $diff[0] ] )
				? false
				: $new_value[ $diff[0] ];
		} elseif ( count( $old_keys ) > count( $new_keys ) ) { // This is the case for a widget being deleted
			$diff   = self::array_diff( $old_keys, $new_keys );
			$action = 'widget_deleted';
			$widget = empty( $diff ) || ! isset( $old_value[ $diff[0] ] )
				? false
				: $old_value[ $diff[0] ];
		} else {
			$action = 'widget_updated';
			$widget = false;

			// This is a bit crazy. Since there can be multiple widgets stored in a single option,
			// we need to diff the old and new values to figure out which widget was updated.
			foreach ( $new_value as $key => $new_instance ) {
				if ( ! isset( $old_value[ $key ] ) ) {
					continue;
				}
				$old_instance = $old_value[ $key ];

				// First, let's test the keys of each instance
				$diff = self::array_diff( array_keys( $new_instance ), array_keys( $old_instance ) );
				if ( ! empty( $diff ) ) {
					$widget = $new_instance;
					break;
				}

				// Next, lets's loop over each value and compare it
				foreach ( $new_instance as $k => $v ) {
					if ( is_scalar( $v ) && (string) $v !== (string) $old_instance[ $k ] ) {
						$widget = $new_instance;
						break;
					}

					if ( 'filters' == $k ) {
						if ( count( $new_instance['filters'] ) != count( $old_instance['filters'] ) ) {
							$widget = $new_instance;
							break;
						}

						foreach ( $v as $filter_key => $new_filter_value ) {
							$diff = self::array_diff( $new_filter_value, $old_instance['filters'][ $filter_key ] );
							if ( ! empty( $diff ) ) {
								$widget = $new_instance;
								break;
							}
						}
					}
				}
			}
		}

		if ( empty( $action ) || empty( $widget ) ) {
			return false;
		}

		return array(
			'action' => $action,
			'widget' => self::get_widget_properties_for_tracks( $widget ),
		);
	}

	/**
	 * Creates the widget properties for sending to Tracks.
	 *
	 * @since 5.8.0
	 *
	 * @param array $widget The widget instance.
	 *
	 * @return array The widget properties.
	 */
	static function get_widget_properties_for_tracks( $widget ) {
		$sanitized = array();

		foreach ( (array) $widget as $key => $value ) {
			if ( '_multiwidget' == $key ) {
				continue;
			}

			if ( is_scalar( $value ) ) {
				$key               = str_replace( '-', '_', sanitize_key( $key ) );
				$key               = "widget_{$key}";
				$sanitized[ $key ] = $value;
			}
		}

		$filters_properties = ! empty( $widget['filters'] )
			? self::get_filter_properties_for_tracks( $widget['filters'] )
			: array();

		return array_merge( $sanitized, $filters_properties );
	}

	/**
	 * Creates the filter properties for sending to Tracks.
	 *
	 * @since 5.8.0
	 *
	 * @param array $filters An array of filters.
	 *
	 * @return array The filter properties.
	 */
	static function get_filter_properties_for_tracks( $filters ) {
		if ( empty( $filters ) ) {
			return $filters;
		}

		$filters_properties = array(
			'widget_filter_count' => count( $filters ),
		);

		foreach ( $filters as $filter ) {
			if ( empty( $filter['type'] ) ) {
				continue;
			}

			$key = sprintf( 'widget_filter_type_%s', $filter['type'] );
			if ( isset( $filters_properties[ $key ] ) ) {
				$filters_properties[ $key ] ++;
			} else {
				$filters_properties[ $key ] = 1;
			}
		}

		return $filters_properties;
	}

	/**
	 * Gets the active post types given a set of filters.
	 *
	 * @since 5.8.0
	 *
	 * @param array $filters The active filters for the current query.
	 *
	 * @return array The active post types.
	 */
	public static function get_active_post_types( $filters ) {
		$active_post_types = array();

		foreach ( $filters as $item ) {
			if ( ( 'post_type' == $item['type'] ) && isset( $item['query_vars']['post_type'] ) ) {
				$active_post_types[] = $item['query_vars']['post_type'];
			}
		}

		return $active_post_types;
	}

	/**
	 * Sets active to false on all post type buckets.
	 *
	 * @since 5.8.0
	 *
	 * @param array $filters The available filters for the current query.
	 *
	 * @return array The filters for the current query with modified active field.
	 */
	public static function remove_active_from_post_type_buckets( $filters ) {
		$modified = $filters;
		foreach ( $filters as $key => $filter ) {
			if ( 'post_type' === $filter['type'] && ! empty( $filter['buckets'] ) ) {
				foreach ( $filter['buckets'] as $k => $bucket ) {
					$bucket['active']                  = false;
					$modified[ $key ]['buckets'][ $k ] = $bucket;
				}
			}
		}

		return $modified;
	}

	/**
	 * Given a url and an array of post types, will ensure that the post types are properly applied to the URL as args.
	 *
	 * @since 5.8.0
	 *
	 * @param string $url        The URL to add post types to.
	 * @param array  $post_types An array of post types that should be added to the URL.
	 *
	 * @return string The URL with added post types.
	 */
	public static function add_post_types_to_url( $url, $post_types ) {
		$url = Jetpack_Search_Helpers::remove_query_arg( 'post_type', $url );
		if ( empty( $post_types ) ) {
			return $url;
		}

		$url = Jetpack_Search_Helpers::add_query_arg(
			'post_type',
			implode( ',', $post_types ),
			$url
		);

		return $url;
	}

	/**
	 * Since we provide support for the widget restricting post types by adding the selected post types as
	 * active filters, if removing a post type filter would result in there no longer be post_type args in the URL,
	 * we need to be sure to add them back.
	 *
	 * @since 5.8.0
	 *
	 * @param array $filters    An array of possible filters for the current query.
	 * @param array $post_types The post types to ensure are on the link.
	 *
	 * @return array The updated array of filters with post typed added to the remove URLs.
	 */
	public static function ensure_post_types_on_remove_url( $filters, $post_types ) {
		$modified = $filters;

		foreach ( (array) $filters as $filter_key => $filter ) {
			if ( 'post_type' !== $filter['type'] || empty( $filter['buckets'] ) ) {
				$modified[ $filter_key ] = $filter;
				continue;
			}

			foreach ( (array) $filter['buckets'] as $bucket_key => $bucket ) {
				if ( empty( $bucket['remove_url'] ) ) {
					continue;
				}

				$parsed = wp_parse_url( $bucket['remove_url'] );
				if ( ! $parsed ) {
					continue;
				}

				$query = array();
				if ( ! empty( $parsed['query'] ) ) {
					wp_parse_str( $parsed['query'], $query );
				}

				if ( empty( $query['post_type'] ) ) {
					$modified[ $filter_key ]['buckets'][ $bucket_key ]['remove_url'] = self::add_post_types_to_url(
						$bucket['remove_url'],
						$post_types
					);
				}
			}
		}

		return $modified;
	}

	/**
	 * Wraps a WordPress filter called "jetpack_search_disable_widget_filters" that allows
	 * developers to disable filters supplied by the search widget. Useful if filters are
	 * being defined at the code level.
	 *
	 * @since 5.8.0
	 *
	 * @return bool
	 */
	public static function are_filters_by_widget_disabled() {
		/**
		 * Allows developers to disable filters being set by widget, in favor of manually
		 * setting filters via `Jetpack_Search::set_filters()`.
		 *
		 * @module search
		 *
		 * @since  5.7.0
		 *
		 * @param bool false
		 */
		return apply_filters( 'jetpack_search_disable_widget_filters', false );
	}

	/**
	 * Returns the maximum posts per page for a search query.
	 *
	 * @since 5.8.0
	 *
	 * @return int
	 */
	public static function get_max_posts_per_page() {
		return Jetpack_Search_Options::site_has_vip_index() ? 1000 : 100;
	}

	/**
	 * Returns the maximum offset for a search query.
	 *
	 * @since 5.8.0
	 *
	 * @return int
	 */
	public static function get_max_offset() {
		return Jetpack_Search_Options::site_has_vip_index() ? 9000 : 1000;
	}

	/**
	 * Returns the maximum offset for a search query.
	 *
	 * @since 8.4.0
	 * @param string $locale    A potentially valid locale string.
	 *
	 * @return bool
	 */
	public static function is_valid_locale( $locale ) {
		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			} else {
				// Assume locale to be valid if we can't check with GlotPress.
				return true;
			}
		}
		return false !== GP_Locales::by_field( 'wp_locale', $locale );
	}

	/**
	 * Get the version number to use when loading the file. Allows us to bypass cache when developing.
	 *
	 * @since 8.6.0
	 * @param string $file Path of the file we are looking for.
	 * @return string $script_version Version number.
	 */
	public static function get_asset_version( $file ) {
		return Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $file )
			? filemtime( JETPACK__PLUGIN_DIR . $file )
			: JETPACK__VERSION;
	}


	/**
	 * Generates a customizer settings ID for a given post type.
	 *
	 * @since 8.8.0
	 * @param object $post_type Post type object returned from get_post_types.
	 * @return string $customizer_id Customizer setting ID.
	 */
	public static function generate_post_type_customizer_id( $post_type ) {
		return Jetpack_Search_Options::OPTION_PREFIX . 'disable_post_type_' . $post_type->name;
	}

	/**
	 * Generates an array of post types associated with their customizer IDs.
	 *
	 * @since 8.8.0
	 * @return array $ids Post type => post type customizer ID object.
	 */
	public static function generate_post_type_customizer_ids() {
		return array_map(
			array( 'self', 'generate_post_type_customizer_id' ),
			get_post_types( array( 'exclude_from_search' => false ), 'objects' )
		);
	}
}
