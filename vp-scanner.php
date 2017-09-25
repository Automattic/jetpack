<?php
// don't call the file directly
defined( 'ABSPATH' ) or die();

class VP_FileScan {
	var $path;
	var $last_dir = null;
	var $offset = 0;
	var $ignore_symlinks = false;

	function __construct( $path, $ignore_symlinks = false ) {
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
 * Uses the PHP tokenizer to split a file into 3 arrays: PHP code with no comments,
 * PHP code with comments, and HTML/JS code. Helper wrapper around split_to_php_html()
 *
 * @param string $file The file path to read and parse
 * @return array An array with 3 arrays of lines
 */
function split_file_to_php_html( $file ) {
	$source = file_get_contents( $file );
	return split_to_php_html( $source );
}

/**
 * Uses the PHP tokenizer to split a string into 3 arrays: PHP code with no comments,
 * PHP code with comments, and HTML/JS code.
 *
 * @param string $file The file path to read and parse
 * @return array An array with 3 arrays of lines
 */
function split_to_php_html( $source ) {
	$tokens = @token_get_all( $source );

	$ret = array( 'php' => array(), 'php-with-comments' => array(), 'html' => array() );
	$current_line = 0;
	$mode = 'html'; // need to see an open tag to switch to PHP mode

	foreach ( $tokens as $token ) {
		if ( ! is_array( $token ) ) {
			// single character, can't switch our mode; just add it and continue
			// if it's PHP, should go into both versions; mode 'php' will do that
			add_text_to_parsed( $ret, $mode, $current_line, $token );
			$current_line += substr_count( $token, "\n" );
		} else {
			// more complex tokens is the interesting case
			list( $id, $text, $line ) = $token;
			
			if ( 'php' === $mode ) {
				// we're in PHP code

				// might be a comment
				if ( T_COMMENT === $id || T_DOC_COMMENT === $id ) {
					// add it to the PHP with comments array only
					add_text_to_parsed( $ret, 'php-with-comments', $current_line, $text );

					// special case for lines like: "     // comment\n":
					// if we're adding a comment with a newline, and the 'php' array current line
					// has no trailing newline, add one
					if ( substr_count( $text, "\n" ) >= 1 && isset( $ret['php'][ $current_line ] ) && 0 === substr_count( $ret['php'][ $current_line ], "\n" ) ) {
						$ret['php'][ $current_line ] .= "\n";
					}

					// make sure to count newlines in comments 
					$current_line += substr_count( $text, "\n" );
					continue;
				}

				// otherwise add it to both the PHP array and the with comments array
				add_text_to_parsed( $ret, $mode, $current_line, $text );

				// then see if we're breaking out
				if ( T_CLOSE_TAG === $id ) {
					$mode = 'html';
				}
			} else if ( 'html' === $mode ) {
				// we're in HTML code

				// if we see an open tag, switch to PHP
				if ( T_OPEN_TAG === $id || T_OPEN_TAG_WITH_ECHO === $id ) {
					$mode = 'php';
				}

				// add to the HTML array (or PHP if it was an open tag)
				// if it is PHP, this will add it to both arrays, which is what we want
				add_text_to_parsed( $ret, $mode, $current_line, $text );
			}
			$current_line += substr_count( $text, "\n" );
		}
	}

	return $ret;
}

/**
 * Helper function for split_file_to_php_html; adds a chunk of text to the arrays we'll return.
 * @param array $parsed The array containing all the languages we'll return
 * @param string $prefix The prefix for the languages we want to add this text to
 * @param int $line_number The line number that this text goes on
 * @param string $text The text to add
 */
function add_text_to_parsed( &$parsed, $prefix, $start_line_number, $all_text ) {
	$line_number = $start_line_number;

	// whitespace tokens may span multiple lines; we need to split them up so that the indentation goes on the next line
	$fragments = explode( "\n", $all_text );
	foreach ( $fragments as $i => $fragment ) {
		// each line needs to end with a newline to match the behavior of file()
		if ( $i < count( $fragments ) - 1 ) {
			$text = $fragment . "\n";
		} else {
			$text = $fragment;
		}

		if ( '' === $text ) {
			// check for the empty string explicitly, rather than using empty()
			// otherwise things like a '0' token will get skipped, because PHP is stupid
			continue;
		}

		if ( ! isset( $parsed[ $prefix ][ $line_number ] ) ) {
			$parsed[ $prefix ][ $line_number ] = '';
		}
		$parsed[ $prefix ][ $line_number ] .= $text;
		if ( 'php' == $prefix ) {
			if ( ! isset( $parsed[ 'php-with-comments' ][ $line_number ] ) ) {
				$parsed[ 'php-with-comments' ][ $line_number ] = '';
			}
			$parsed[ 'php-with-comments' ][ $line_number ] .= $text;
		}

		// the caller will also update their line number based on the number of \n characters in the text
		$line_number++;
	}
}
/**
 * Scans a file with the registered signatures. To report a security notice for a specified signature, all its regular
 * expressions should result in a match.
 * @param $file the filename to be scanned.
 * @param null $tmp_file used if the file to be scanned doesn't exist or if the filename doesn't match vp_is_interesting_file().
 * @return array|bool false if no matched signature is found. A list of matched signatures otherwise.
 */
function vp_scan_file( $file, $tmp_file = null, $use_parser = false ) {
	$real_file = vp_get_real_file_path( $file, $tmp_file );
	$file_size = file_exists( $real_file ) ? @filesize( $real_file ) : 0;
	if ( !is_readable( $real_file ) || !$file_size || $file_size > apply_filters( 'scan_max_file_size', 3 * 1024 * 1024 ) ) { // don't scan empty or files larger than 3MB.
		return false;
	}

	$file_content = null;
	$file_parsed = null;
	$skip_file = apply_filters_ref_array( 'pre_scan_file', array ( false, $file, $real_file, &$file_content ) );
	if ( false !== $skip_file ) { // maybe detect malware without regular expressions.
		return $skip_file;
	}

	if ( !vp_is_interesting_file( $file ) ) { // only scan relevant files.
		return false;
	}

	if ( !isset( $GLOBALS['vp_signatures'] ) ) {
		$GLOBALS['vp_signatures'] = array();
	}

	$found = array ();
	foreach ( $GLOBALS['vp_signatures'] as $signature ) {
		if ( !is_object( $signature ) || !isset( $signature->patterns ) ) {
			continue;
		}
		// if there is no filename_regex, we assume it's the same of vp_is_interesting_file().
		if ( empty( $signature->filename_regex ) || preg_match( '#' . addcslashes( $signature->filename_regex, '#' ) . '#i', $file ) ) {
			if ( null === $file_content || !is_array( $file_content ) ) {
				$file_content = file( $real_file );

				if ( $use_parser ) {
					$file_parsed = split_file_to_php_html( $real_file );
				}
			}

			$is_vulnerable = true;
			$matches = array ();
			if ( is_array( $file_content ) && ( $signature->patterns ) && is_array( $signature->patterns ) ) {
				if ( ! $use_parser ) {
					reset( $signature->patterns );
					while ( $is_vulnerable && list( , $pattern ) = each( $signature->patterns ) ) {
						if ( ! $match = preg_grep( '#' . addcslashes( $pattern, '#' ) . '#im', $file_content ) ) {
							$is_vulnerable = false;
							break;
						}
						$matches += $match;
					}
				} else {
					// use the language specified in the signature if it has one
					if ( ! empty( $signature->target_language ) && array_key_exists( $signature->target_language, $file_parsed ) ) {
						$code = $file_parsed[ $signature->target_language ];
					} else {
						$code = $file_content;
					}
					// same code as the '! $use_parser' branch above
					reset( $signature->patterns );
					while ( $is_vulnerable && list( , $pattern ) = each( $signature->patterns ) ) {
						if ( ! $match = preg_grep( '#' . addcslashes( $pattern, '#' ) . '#im', $code ) ) {
							$is_vulnerable = false;
							break;
						}
						$matches += $match;
					}
				}
			} else {
				$is_vulnerable = false;
			}

			// convert the matched line to an array of details showing context around the lines
			$lines = array();
			if ( $use_parser ) {
				$lines_parsed = array();
				$line_indices_parsed = array_keys( $code );
			}
			foreach ( $matches as $line => $text ) {
				$lines = array_merge( $lines, range( $line - 1, $line + 1 ) );
				if ( $use_parser ) {
					$idx = array_search( $line, $line_indices_parsed );

					// we might be looking at the first or last line; for the non-parsed case, array_intersect_key
					// handles this transparently below; for the parsed case, since we have another layer of
					// indirection, we have to handle that case here
					$idx_around = array();
					if ( isset( $line_indices_parsed[ $idx - 1 ] ) ) {
						$idx_around[] = $line_indices_parsed[ $idx - 1 ];
					}
					$idx_around[] = $line_indices_parsed[ $idx ];
					if ( isset( $line_indices_parsed[ $idx + 1 ] ) ) {
						$idx_around[] = $line_indices_parsed[ $idx + 1 ];
					}
					$lines_parsed = array_merge( $lines_parsed, $idx_around );
				}
			}
			$details = array_intersect_key( $file_content, array_flip( $lines ) );
			if ( $use_parser ) {
				$details_parsed = array_intersect_key( $code, array_flip( $lines_parsed ) );
			}

			// provide both 'matches' and 'details', as some places want 'matches'
			// this matches the old behavior, which would add 'details' to some items, without replacing 'matches'
			$debug_data = array( 'matches' => $matches, 'details' => $details  );
			if ( $use_parser ) {
				$debug_data['details_parsed'] = $details_parsed;
			}

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
