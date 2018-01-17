<?php

class Jetpack_Search_Helpers {
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
}
