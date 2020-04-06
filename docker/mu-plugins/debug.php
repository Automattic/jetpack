<?php

/*
Plugin Name: Automattic Debug Helpers
Description: <code>l( 'Code is Poetry' )</code>
Version: 1.0
Author: Automattic
Author URI: http://automattic.com/
*/


/**
 * debug.php
 *
 * This file contains helpful debugging functions
 */

/**
 * l() -- sweet error logging
 *
 * l($something_to_log); // error_log(print_r($something_to_log, true));
 * l(compact('v1','v2'); // log several variables with labels
 * l($thing5, $thing10); // log two things
 * l();                  // log the file:line
 * l(null, $stuff, $ba); // log the file:line, then log two things.
 *
 * The first call of l() will print an extra line containing a random ID & PID
 * and the script name or URL. The ID prefixes every l() log entry thereafter.
 * The extra line and ID will help you to indentify and correlate log entries.
 *
 * Example:
 * 	wpsh> l('yo')
 * 	wpsh> l('dude')
 * /tmp/php-errors:
 * 	[21-Jun-2012 14:45:13] 1566-32201 => /home/wpcom/public_html/bin/wpshell/wpshell.php
 * 	[21-Jun-2012 14:45:13] 1566-32201 yo
 * 	[21-Jun-2012 14:50:23] 1566-32201 dude
 *
 * l() returns its input so you can safely wrap most kinds of expressions to log them.
 * l($arg1, $arg2) will call l($arg1) and l($arg2) and then return $arg1.
 *
 * A null argument will log the file and line number of the l() call.
 */
function l( $stuff = null ) {
	// Do nothing when debugging is off
	if ( !defined( 'WP_DEBUG' ) || WP_DEBUG === false ) {
		return $stuff;
	}
	static $pageload;
	// Call l() on each argument
	if ( func_num_args() > 1 ) {
		foreach ( func_get_args() as $arg )
			l($arg);
		return $stuff;
	}
	if ( !isset( $pageload ) ) {
		$pageload = substr( md5( mt_rand() ), 0, 4 );
		if ( !empty( $_SERVER['argv'] ) )
			$hint = implode( ' ', $_SERVER['argv'] );
		elseif ( isset( $_SERVER['HTTP_HOST'] ) && isset( $_SERVER['REQUEST_URI'] ) )
			$hint = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
		else
			$hint = php_sapi_name();
		error_log( sprintf( "[%s-%s => %s]", $pageload, getmypid(), $hint ) );
	}
	$pid = $pageload . '-' . getmypid();
	if ( is_null( $stuff ) ) {
		// Log the file and line number
		$backtrace = debug_backtrace(false);
		while ( isset( $backtrace[1]['function'] ) && $backtrace[1]['function'] == __FUNCTION__ )
			array_shift( $backtrace );
		$log = sprintf( '%s line %d', $backtrace[0]['file'], $backtrace[0]['line'] );
	} elseif ( is_bool( $stuff ) ) {
		$log = $stuff ? 'TRUE' : 'FALSE';
	} elseif ( is_scalar( $stuff ) ) {
		// Strings and numbers can be logged exactly
		$log = $stuff;
	} else {
		// Are we in an output buffer handler?
		// If so, print_r($stuff, true) is fatal so we must avoid that.
		// This is not as slow as it looks: <1ms when !$in_ob_handler.
		// Using json_encode_pretty() all the time is much slower.
		do {
			$in_ob_handler = false;
			$ob_status = ob_get_status(true);
			if ( ! $ob_status )
				break;
			foreach ( $ob_status as $ob )
				$obs[] = $ob['name'];
			// This is not perfect: anonymous handlers appear as default.
			if ( $obs == array( 'default output handler' ) )
				break;
			$backtrace = debug_backtrace(false);
			foreach ( $backtrace as $level ) {
				$caller = '';
				if ( isset( $level['class'] ) )
					$caller = $level['class'] . '::';
				$caller .= $level['function'];
				$bts[] = $caller;
			}
			if ( array_intersect( $obs, $bts ) )
				$in_ob_handler = true;
		} while ( false );
		if ( $in_ob_handler )
			$log = l_json_encode_pretty( $stuff );
		else
			$log = print_r( $stuff, true );
	}
	error_log( sprintf( "[%s] %s", $pid, $log ) );
	return $stuff;
}

// Log only once (suppresses logging on subsequent calls from the same file+line)
function lo( $stuff ) {
	static $callers = array();
	$backtrace = debug_backtrace(false);
	$caller = md5( $backtrace[0]['file'] . $backtrace[0]['line'] );
	if ( isset( $callers[$caller] ) )
		return $stuff;
	$callers[$caller] = true;
	$args = func_get_args();
	return call_user_func_array( 'l', $args );
}

// Pretty print for JSON (stolen from public.api)
function l_json_encode_pretty( $data ) {
	if ( defined( 'JSON_PRETTY_PRINT' ) ) {
		// Added in PHP 5.4.0
		return json_encode( $data, JSON_PRETTY_PRINT );
	}

	// Adapted from http://us3.php.net/manual/en/function.json-encode.php#80339
	$json = json_encode( $data );
	$len = strlen( $json );

	$tab = "\t";
	$new_json = "";
	$indent_level = 0;
	$in_string = false;

	$slashed = false;
	for ( $c = 0; $c < $len; $c++ ) {
		$char = $json[$c];
		if ( $in_string ) {
			if ( '"' === $char && $c > 0 && !$slashed ) {
				$in_string = false;
			}
			$new_json .= $char;
		} else {
			switch( $char ) {
			case '{':
			case '[':
				$new_json .= $char . "\n" . str_repeat( $tab, ++$indent_level );
				break;
			case '}':
			case ']':
				$new_json .= "\n" . str_repeat( $tab, --$indent_level ) . $char;
				break;
			case ',':
				$new_json .= ",\n" . str_repeat( $tab, $indent_level );
				break;
			case ':':
				$new_json .= ": ";
				break;
			case '"':
				if ( $c > 0 && !$slashed ) {
					$in_string = true;
				}
				// no break
			default:
				$new_json .= $char;
				break;
			}
		}
		if ( '\\' == $char ) {
			$slashed = !$slashed;
		} else {
			$slashed = false;
		}
	}

	return $new_json;
}

/**
 * A timer. Call once to start, call again to stop. Returns a float.
 * Calling e($name) with different names permits simultaneous timers.
 *
 * e('stuff');
 * do_stuff();
 * $elapsed = e('stuff');
 */
function e($name = '') {
	static $times = array();
	if ( !array_key_exists($name, $times ) ) {
		$times[$name] = microtime( true );
		return;
	}
	$elapsed = microtime( true ) - $times[$name];
	unset( $times[$name] );
	return $elapsed;
}

/**
 * A wrapper for e() which also logs the result with l().
 * Each log entry begins with a tag common to that pageload.
 * You can save a keystroke by calling e() then el().
 *
 * e($name);
 * do_stuff();
 * el($name);
 */
function el($name = '') {
	$elapsed = e( $name );
	if ( $elapsed !== null )
		l( sprintf( "%9.6f e('%s')", $elapsed, $name ) );
	return $elapsed;
}

/**
 * A persistent timer. After the initial call, each call to t()
 * will log the file:line and time elapsed since the initial call.
 */
function t() {
	static $start;
	$now = microtime( true );
	if ( !isset( $start ) )
		$start = $now;

	$backtrace = debug_backtrace(false);
	while ( isset( $backtrace[1]['function'] ) && $backtrace[1]['function'] == __FUNCTION__ )
		array_shift( $backtrace );

	$file = $backtrace[0]['file'];
	$line = $backtrace[0]['line'];
	$format = 't() => %9.6f at %s line %d';
	$elapsed = $now - $start;
	l( sprintf( $format, $elapsed, $file, $line ) );
}
