<?php

class Page_Optimize_Utils {
	public static function cache_bust_mtime( $path, $siteurl ) {
		static $dependency_path_mapping;

		$url = $siteurl . $path;

		if ( strpos( $url, '?m=' ) ) {
			return $url;
		}

		$parts = parse_url( $url );
		if ( ! isset( $parts['path'] ) || empty( $parts['path'] ) ) {
			return $url;
		}

		if ( empty( $dependency_path_mapping ) ) {
			$dependency_path_mapping = new Page_Optimize_Dependency_Path_Mapping();
		}

		$file = $dependency_path_mapping->dependency_src_to_fs_path( $url );

		$mtime = false;
		if ( file_exists( $file ) ) {
			$mtime = filemtime( $file );
		}

		if ( ! $mtime ) {
			return $url;
		}

		if ( false === strpos( $url, '?' ) ) {
			$q = '';
		} else {
			list( $url, $q ) = explode( '?', $url, 2 );
			if ( strlen( $q ) ) {
				$q = '&amp;' . $q;
			}
		}

		return "$url?m={$mtime}{$q}";
	}
}
