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
}
