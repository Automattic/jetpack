<?php
/**
 * File doc comment
 *
 * @package whatever
 */

// phpcs:disable
// TODO: remove above line before merging

/**
 * In load-jetpack.php
require_once JETPACK__PLUGIN_DIR . 'tools/error-monitoring.php';

set_error_handler( 'jp_error_handler' );
register_shutdown_function( 'jp_error_shutdown' );

$q = SCRIPT_DEBUG_qwe;
 */

function jp_error_shutdown() {
	$last = error_get_last();

	if ( is_null( $last ) ) {
		return;
	}

	switch ( $last['type'] ) {
		case E_CORE_ERROR: // we may not be able to capture this one.
		case E_COMPILE_ERROR: // or this one.
		case E_PARSE: // we can't actually capture this one.
		case E_ERROR:
		case E_USER_ERROR:
		case E_RECOVERABLE_ERROR:
			error_log( print_r( 'jp_error_shutdown START', 1 ) );
			jp_custom_error_handler( false, $last['type'], $last['message'], $last['file'], $last['line'] );
			error_log( print_r( 'jp_error_shutdown END', 1 ) );

	}
}

function jp_error_handler( $type, $message, $file, $line ) {
	error_log( print_r( 'jp_error_handler START', 1 ) );
	jp_custom_error_handler( true, $type, $message, $file, $line );
	error_log( print_r( 'jp_error_handler END', 1 ) );

	// Returning false here to make sure the default error_handler is being fired.
	return false;
}

/**
 * Shared Error Handler run as a Custom Error Handler and at Shutdown as an error handler of last resort.
 * When we run at shutdown we must not die as then the pretty printing of the Error doesn't happen which is lame sauce.
 */
function jp_custom_error_handler( $whether_i_may_die, $type, $message, $file, $line ) {
	if ( ! ( $type & ini_get( 'error_reporting' ) ) ) {
		return true;
	}

	$die = false;
	switch ( $type ) {
		case E_CORE_ERROR: // we may not be able to capture this one.
			$string = 'Core error';
			$die    = true;
			break;
		case E_COMPILE_ERROR: // or this one.
			$string = 'Compile error';
			$die    = true;
			break;
		case E_PARSE: // we can't actually capture this one.
			$string = 'Parse error';
			$die    = true;
			break;
		case E_ERROR:
		case E_USER_ERROR:
			$string = 'Fatal error';
			$die    = true;
			break;
		case E_WARNING:
		case E_USER_WARNING:
			$string = 'Warning';
			break;
		case E_NOTICE:
		case E_USER_NOTICE:
			$string = 'Notice';
			break;
		case E_STRICT:
			$string = 'Strict Standards';
			break;
		case E_RECOVERABLE_ERROR:
			$string = 'Catchable fatal error';
			$die    = true;
			break;
		case E_DEPRECATED:
		case E_USER_DEPRECATED:
			$string = 'Deprecated';
			break;
		case 0:
			return true;
	}

	$log_json = array();

	// @ error suppression
	if ( 0 === error_reporting() ) {
		$string = '[Suppressed] ' . $string;
	}

	$backtrace = jp_get_error_backtrace( $file, $type );

	if ( ! empty( $_SERVER['HTTP_HOST'] ) && isset( $_SERVER['REQUEST_URI'] ) ) {
		$source = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
	} else {
		// What's happening here?
		$source = '$ ' . @join( ' ', $GLOBALS['argv'] );
	}

	// Maybe not needed, since it should be handled by default error_handler, and it might not be needed for shutdown handler.
	// $display_errors = ini_get( 'display_errors' );
	// if ( $display_errors ) {
	// 	if ( ini_get( 'html_errors' ) ) {
	// 		$display_errors_format = "<br />\n<b>%s</b>: %s in <b>%s</b> on line <b>%d</b><br />\n[%s]<br />\n[%s]<br /><br />\n";
	// 	} else {
	// 		$display_errors_format = "\n%s: %s in %s on line %d [%s] [%s]\n";
	// 	}

	// 	if ( 'stderr' === $display_errors && defined( 'STDERR' ) && is_resource( STDERR ) ) {
	// 		fwrite( STDERR, sprintf( $display_errors_format, $string, $message, $file, $line, htmlspecialchars( $source ), htmlspecialchars( $backtrace ) ) );
	// 	} else {
	// 		printf( $display_errors_format, $string, $message, $file, $line, htmlspecialchars( $source ), htmlspecialchars( $backtrace ) );
	// 	}
	// }

	if ( ini_get( 'log_errors' ) ) {
		error_log(
			sprintf(
				'XXXXX ::: %s: %s in %s on line %d [%s] [%s]%s',
				$string,
				$message,
				$file,
				$line,
				$source,
				$backtrace,
				empty( $log_json ) ? '' : ' log-json:' . json_encode( $log_json )
			)
		);
	}

	do_stuff();

		// When we run at shutdown we must not die as then the pretty printing of the Error doesn't happen which is lame sauce.
	if ( $die && $whether_i_may_die ) {
		die( 1 );
	}
	return true;
}


function jp_get_error_backtrace( $last_error_file, $last_error_type, $for_irc = false ) {
	if ( in_array( $last_error_type, array( E_ERROR, E_USER_ERROR ), true ) ) {
		return ''; // The standard debug backtrace is useless for Fatal Errors.
	} else {
		$backtrace = debug_backtrace( 0 );
	}

	$call_path = array();
	foreach ( $backtrace as $bt_key => $call ) {
		if ( ! isset( $call['args'] ) ) {
			$call['args'] = array( '' );
		}

		if ( in_array( $call['function'], array( __FUNCTION__, 'jp_custom_error_handler', 'jp_error_handler', 'jp_error_shutdown' ), true ) ) {
			continue;
		}

		$path  = isset( $call['file'] ) ? str_replace( array( WP_CONTENT_DIR, ABSPATH ), '', $call['file'] ) : '';
		$path .= isset( $call['line'] ) ? ':' . $call['line'] : '';

		if ( in_array( $call['function'], array( 'do_action', 'apply_filters' ), true ) ) {
			if ( is_object( $call['args'][0] ) && ! method_exists( $call['args'][0], '__toString' ) ) {
				$path .= " {$call['function']}(Object)";
			} elseif ( is_array( $call['args'][0] ) ) {
				$path .= " {$call['function']}(Array)";
			} else {
				$path .= " {$call['function']}('{$call['args'][0]}')";
			}
		} elseif ( in_array( $call['function'], array( 'include', 'include_once', 'require', 'require_once' ), true ) ) {
			$file  = 0 === $bt_key ? $last_error_file : $call['args'][0];
			$path .= " {$call['function']}('" . str_replace( array( WP_CONTENT_DIR, ABSPATH ), '', $file ) . "')";
		} else {
			$path .= " {$call['function']}()";
		}

		$call_path[] = trim( $path );
	}

	return implode( "\n", $call_path );
}

function do_stuff() {
	$jp_options = get_option( 'jetpack_options', array() );
	$site_id = null;

	if ( in_array( 'id', $jp_options, true ) ) {
		$site_id = $jp_options['id'];
	}

	error_log( print_r( "~~~~~", 1) );
	error_log( print_r( $site_id, 1) );
}
