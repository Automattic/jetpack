<?php

class Jetpack_Search_Helpers {
	const FILTER_WIDGET_BASE = 'jetpack-search-filters';

	static function get_search_url() {
		$query_args = $_GET;

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

	static function add_query_arg( $key, $value = false, $url = false ) {
		$url = empty( $url ) ? self::get_search_url() : $url;
		if ( is_array( $key ) ) {
			return add_query_arg( $key, $url );
		}

		return add_query_arg( $key, $value, $url );
	}

	static function remove_query_arg( $key, $url = false ) {
		$url = empty( $url ) ? self::get_search_url() : $url;
		return remove_query_arg( $key, $url );
	}

	static function get_widget_option_name() {
		return sprintf( 'widget_%s', self::FILTER_WIDGET_BASE );
	}

	static function get_widgets_from_option() {
		$widget_options = get_option( self::get_widget_option_name(), array() );

		// We don't need this
		if ( ! empty( $widget_options ) && isset( $widget_options['_multiwidget'] ) ) {
			unset( $widget_options['_multiwidget'] );
		}

		return $widget_options;
	}

	static function build_widget_id( $number ) {
		return sprintf( '%s-%d', self::FILTER_WIDGET_BASE, $number );
	}

	static function is_active_widget( $widget_id ) {
		return (bool) is_active_widget( false, $widget_id, self::FILTER_WIDGET_BASE );
	}

	static function get_filters_from_widgets() {
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

			foreach ( (array) $settings['filters'] as $widget_filter ) {
				$widget_filter['widget_id'] = $widget_id;
				$key = sprintf( '%s_%d', $widget_filter['type'], count( $filters ) );

				if ( empty( $widget_filter['name'] ) ) {
					$widget_filter['name'] = self::generate_widget_filter_name( $widget_filter );
				}

				$filters[ $key ] = $widget_filter;
			}
		}

		return $filters;
	}

	static function generate_widget_filter_name( $widget_filter ) {
		$name = '';

		switch ( $widget_filter['type'] ) {
			case 'post_type':
				$name = _x( 'Post Types', 'label for filtering posts', 'jetpack' );
				break;
			case 'date_histogram':
				switch ( $widget_filter['field'] ) {
					case 'post_date':
					case 'post_date_gmt':
						switch ( $widget_filter['interval'] ) {
							case 'month':
								$name = _x( 'Month', 'label for filtering posts', 'jetpack' );
								break;
							case 'year':
								$name = _x( 'Year', 'label for filtering posts', 'jetpack' );
								break;
						}
						break;
					case 'post_modified':
					case 'post_modified_gmt':
						switch ( $widget_filter['interval'] ) {
							case 'month':
								$name = _x( 'Month Updated', 'label for filtering posts', 'jetpack' );
								break;
							case 'year':
								$name = _x( 'Year Updated', 'label for filtering posts', 'jetpack' );
								break;
						}
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
				} else if ( isset( $tax->labels ) && isset( $tax->labels->name ) ) {
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
		if ( count( $array_1 ) != count( $array_2 ) && count( $array_2 ) > count( $array_1 ) ) {
			$temp = $array_1;
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
	 * @param array $instance
	 * @return bool
	 */
	static function post_types_differ_searchable( $instance ) {
		if ( empty( $instance['post_types'] ) ) {
			return false;
		}

		$searchable_post_types = get_post_types( array( 'exclude_from_search' => false ) );
		$diff_of_searchable = self::array_diff( $searchable_post_types, (array) $instance['post_types'] );

		return ! empty( $diff_of_searchable );
	}

	/**
	 * Given the widget instance, will return true when selected post types differ from the post type filters
	 * applied to the search.
	 *
	 * @since 5.8.0
	 *
	 * @param array $instance
	 * @return bool
	 */
	static function post_types_differ_query( $instance ) {
		if ( empty( $instance['post_types'] ) ) {
			return false;
		}

		if ( empty( $_GET['post_type'] ) ) {
			$post_types_from_query = array();
		} else if ( is_array( $_GET['post_type'] ) ) {
			$post_types_from_query = $_GET['post_type'];
		} else {
			$post_types_from_query = (array) explode( ',',  $_GET['post_type'] );
		}

		$post_types_from_query = array_map( 'trim', $post_types_from_query );

		$diff_query = self::array_diff( (array) $instance['post_types'], $post_types_from_query );
		return ! empty( $diff_query );
	}

	static function get_widget_tracks_value( $old_value, $new_value ) {
		$old_value = (array) $old_value;
		if ( isset( $old_value['_multiwidget'] ) ) {
			unset( $old_value['_multiwidget'] );
		}

		$new_value = (array) $new_value;
		if ( isset( $new_value['_multiwidget'] ) ) {
			unset( $new_value['_multiwidget'] );
		}

		$action = '';
		$old_keys = array_keys( $old_value );
		$new_keys = array_keys( $new_value );

		if ( count( $new_keys ) > count( $old_keys ) ) { // This is the case for a widget being added
			$diff = self::array_diff( $new_keys, $old_keys );
			$action = 'widget_added';
			$widget = empty( $diff ) || ! isset( $new_value[ $diff[0] ] )
				? false
				: $new_value[ $diff[0] ];
		} else if ( count( $old_keys ) > count( $new_keys ) ) { // This is the case for a widget being deleted
			$diff = self::array_diff( $old_keys, $new_keys );
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
							$diff = self::array_diff( $new_filter_value, $old_instance[ 'filters' ][ $filter_key ] );
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

	static function get_widget_properties_for_tracks( $widget ) {
		$sanitized = array();

		foreach ( (array) $widget as $key => $value ) {
			if ( '_multiwidget' == $key ) {
				continue;
			}
			if ( is_scalar( $value ) ) {
				$key = str_replace( '-', '_', sanitize_key( $key ) );
				$key = "widget_{$key}";
				$sanitized[ $key ] = $value;
			}
		}

		$filters_properties = ! empty( $widget['filters'] )
			? self::get_filter_properties_for_tracks( $widget['filters'] )
			: array();

		return array_merge( $sanitized, $filters_properties );
	}

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
				$filters_properties[ $key ]++;
			} else {
				$filters_properties[ $key ] = 1;
			}
		}

		return $filters_properties;
	}

	/**
	 * Gets the active post types given a set of filters.
	 *
	 * @param array $filters The active filters for the current query.
	 * @param array $default_post_types The default post types.
	 *
	 * @return array
	 */
	public static function get_active_post_types( $filters, $default_post_types ) {
		$active_post_types = array();
		foreach( $filters as $item ) {
			if ( ( 'post_type' == $item['type'] ) && isset( $item['query_vars']['post_type'] ) ) {
				$active_post_types[] = $item['query_vars']['post_type'];
			}
		}
		return $active_post_types;
	}

	/**
	 * Sets active to false on all post type buckets.
	 *
	 * @param array $filters The available filters for the current query.
	 *
	 * @return array $modified The filters for the current query with modified active field.
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
	 * @param string $url        The URL to add post types to.
	 * @param array  $post_types An array of post types that should be added to the URL.
	 *
	 * @return string $url The URL with added post types.
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
	 * @param array $filters    An array of possible filters for the current query.
	 * @param array $post_types The post types to ensure are on the link.
	 *
	 * @return array $modified The updated array of filters with post typed added to the remove URLs.
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
	 * Given an array of filters or active buckets, will filter out any that are post types.
	 *
	 * @param array $filters The array of filters or active buckets.
	 * @return array
	 */
	public static function filter_post_types( $filters ) {
		$no_post_types = array();

		foreach ( (array) $filters as $key => $filter ) {
			if ( empty( $filter['type'] ) || 'post_type' !== $filter['type'] ) {
				if ( is_int( $key ) ) {
					$no_post_types[] = $filter;
				} else {
					$no_post_types[ $key ] = $filter;
				}
			}
		}

		return $no_post_types;
	}

	/**
	 * Returns a boolen for whether the current site has a VIP index.
	 *
	 * @return bool
	 */
	public static function site_has_vip_index() {
		$has_vip_index = (
			Jetpack_Constants::is_defined( 'JETPACK_SEARCH_VIP_INDEX' ) &&
			Jetpack_Constants::get_constant( 'JETPACK_SEARCH_VIP_INDEX' )
		);

		/**
		 * Allows developers to filter whether the current site has a VIP index.
		 *
		 * @module search
		 *
		 * @since 5.8.0
		 *
		 * @param bool $has_vip_index Whether the current site has a VIP index.
		 */
		return apply_filters( 'jetpack_search_has_vip_index', $has_vip_index );
	}

	/**
	 * Returns the maximum posts per page for a search query
	 *
	 * @return int
	 */
	public static function get_max_posts_per_page() {
		return self::site_has_vip_index() ? 1000 : 100;
	}

	/**
	 * Returns the maximum offset for a search query
	 *
	 * @return int
	 */
	public static function get_max_offset() {
		return self::site_has_vip_index() ? 9000 : 1000;
	}
}
