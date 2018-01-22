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

	static function add_query_arg( $key, $value = false ) {
		if ( is_array( $key ) ) {
			return add_query_arg( $key, self::get_search_url() );
		}

		return add_query_arg( $key, $value, self::get_search_url() );
	}

	static function remove_query_arg( $key ) {
		return remove_query_arg( $key, self::get_search_url() );
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

			if ( empty( $settings['use_filters'] ) ) {
				continue;
			}

			foreach ( (array) $settings['filters'] as $widget_filter ) {
				$widget_filter['widget_id'] = $widget_id;
				$key = sprintf( '%s_%d', $widget_filter['type'], count( $filters ) );
				$filters[ $key ] = $widget_filter;
			}
		}

		return $filters;
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
}
