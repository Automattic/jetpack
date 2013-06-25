<?php

class VP_FileScan {
	var $path;
	var $last_dir = null;
	var $offset = 0;
	var $ignore_symlinks = false;

	function VP_FileScan( $path, $ignore_symlinks = false ) {
		if ( is_dir( $path ) )
			$this->last_dir = $this->path = @realpath( $path );
		else
			$this->last_dir = $this->path = dirname( @realpath( $path ) );
		$this->ignore_symlinks = $ignore_symlinks;
	}

	function get_files( $limit = 100 ) {
		$files = array();
		if ( is_dir( $this->last_dir ) ) {
			$return = $this->_scan_files( $this->path, $files, $this->offset, $limit, $this->last_dir );
			$this->offset = $return[0];
			$this->last_dir = $return[1];
			if ( count( $files ) < $limit )
				$this->last_dir = false;
		}
		return $files;
	}

	function _scan_files( $path, &$files, $offset, $limit, &$last_dir ) {
		$_offset = 0;
		if ( is_readable( $path ) && $handle = opendir( $path ) ) {
			while( false !== ( $entry = readdir( $handle ) ) ) {
				if ( '.' == $entry || '..' == $entry )
					continue;

				$_offset++;
				$full_entry = $path . DIRECTORY_SEPARATOR . $entry;
				$next_item = ltrim( str_replace( $path, '', $last_dir ), DIRECTORY_SEPARATOR );
				$next = preg_split( '#(?<!\\\\)' . preg_quote( DIRECTORY_SEPARATOR, '#' ) . '#', $next_item, 2 );

				// Skip if the next item is not found.
				if ( !empty( $next[0] ) && $next[0] != $entry )
					continue;
				if ( rtrim( $last_dir, DIRECTORY_SEPARATOR ) == rtrim( $path, DIRECTORY_SEPARATOR ) && $_offset < $offset )
					continue;
				if ( $this->ignore_symlinks && is_link( $full_entry ) )
					continue;

				if ( rtrim( $last_dir, DIRECTORY_SEPARATOR ) == rtrim( $path, DIRECTORY_SEPARATOR ) ) {
					// Reset last_dir and offset when we reached the previous last_dir value.
					$last_dir = '';
					$offset = 0;
				}

				if ( is_file( $full_entry ) ) {
					if ( !vp_is_interesting_file( $full_entry ) )
						continue;
					$_return_offset = $_offset;
					$_return_dir = dirname( $full_entry );
					$files[] = $full_entry;
				} elseif ( is_dir( $full_entry ) ) {
					list( $_return_offset, $_return_dir ) = $this->_scan_files( $full_entry, $files, $offset, $limit, $last_dir );
				}
				if ( count( $files ) >= $limit ) {
					closedir( $handle );
					return array( $_return_offset, $_return_dir );
				}
			}
			closedir( $handle );
		}
		return array( $_offset, $path );
	}
}

function vp_get_real_file_path( $file_path, $tmp_file = false ) {
	global $site, $site_id;
	$site_id = !empty( $site->id ) ? $site->id : $site_id;
	if ( !$tmp_file && !empty( $site_id ) && function_exists( 'determine_file_type_path' ) ) {
		$path = determine_file_type_path( $file_path );
		$file = file_by_path( $site_id, $path );
		if ( !$file )
			return false;
		return $file->get_unencrypted();
	}
	return !empty( $tmp_file ) ? $tmp_file : $file_path;
}

function vp_is_interesting_file($file) {
	$scan_only_regex = apply_filters( 'scan_only_extension_regex', '#\.(ph(p3|p4|p5|p|tml)|html|js|htaccess)$#i' );
	return preg_match( $scan_only_regex, $file );
}

/**
 * Scans a file with the registered signatures. To report a security notice for a specified signature, all its regular
 * expressions should result in a match.
 * @param $file the filename to be scanned.
 * @param null $tmp_file used if the file to be scanned doesn't exist or if the filename doesn't match vp_is_interesting_file().
 * @return array|bool false if no matched signature is found. A list of matched signatures otherwise.
 */
function vp_scan_file($file, $tmp_file = null) {
	$real_file = vp_get_real_file_path( $file, $tmp_file );
	$file_size = file_exists( $real_file ) ? @filesize( $real_file ) : 0;
	if ( !is_readable( $real_file ) || !$file_size || $file_size > apply_filters( 'scan_max_file_size', 3 * 1024 * 1024 ) ) // don't scan empty or files larger than 3MB.
		return false;

	$file_content = null;
	$skip_file = apply_filters_ref_array( 'pre_scan_file', array ( false, $file, $real_file, &$file_content ) );
	if ( false !== $skip_file ) // maybe detect malware without regular expressions.
		return $skip_file;

	if ( !vp_is_interesting_file( $file ) ) // only scan relevant files.
		return false;

	if ( !isset( $GLOBALS['vp_signatures'] ) )
		$GLOBALS['vp_signatures'] = array();

	$found = array ();
	foreach ( $GLOBALS['vp_signatures'] as $signature ) {
		if ( !is_object( $signature ) || !isset( $signature->patterns ) )
			continue;
		// if there is no filename_regex, we assume it's the same of vp_is_interesting_file().
		if ( empty( $signature->filename_regex ) || preg_match( '#' . addcslashes( $signature->filename_regex, '#' ) . '#i', $file ) ) {
			if ( null === $file_content || !is_array( $file_content ) )
				$file_content = file( $real_file );

			$is_vulnerable = true;
			$matches = array ();
			if ( is_array( $file_content ) && ( $signature->patterns ) && is_array( $signature->patterns ) ) {
				reset( $signature->patterns );
				while ( $is_vulnerable && list( , $pattern ) = each( $signature->patterns ) ) {
					if ( ! $match = preg_grep( '#' . addcslashes( $pattern, '#' ) . '#im', $file_content ) ) {
						$is_vulnerable = false;
						break;
					}
					$matches += $match;
				}
			} else {
				$is_vulnerable = false;
			}
			$debug_data = array( 'matches' => $matches );
			// Additional checking needed?
			if ( method_exists( $signature, 'get_detailed_scanner' ) && $scanner = $signature->get_detailed_scanner() )
				$is_vulnerable = $scanner->scan( $is_vulnerable, $file, $real_file, $file_content, $debug_data );
			if ( $is_vulnerable ) {
				$found[$signature->id] = $debug_data;
				if ( isset( $signature->severity ) && $signature->severity > 8 ) // don't continue scanning
					break;
			}
		}
	}

	return apply_filters_ref_array( 'post_scan_file', array ( $found, $file, $real_file, &$file_content ) );
}
