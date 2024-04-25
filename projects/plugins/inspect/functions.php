<?php

use Automattic\Jetpack\Connection\Client;

function jetpack_inspect_default_args( $args = array() ) {
	$defaults = array(
		'method'  => 'GET',
		'body'    => null,
		'headers' => array(),
	);

	return wp_parse_args( $args, $defaults );
}

function jetpack_inspect_connection_request( $url, $args = array() ) {

	$args = jetpack_inspect_default_args( $args );

	// Building signed request interface differs from wp_remote_request.
	// Body is passed as an argument.
	$body = $args['body'];
	unset( $args['body'] );

	// Request signing process expects the URL to be provided in arguments.
	$args['url'] = $url;

	// Workaround the Jetpack Connection empty body feature/bug:
	// @TODO: Maybe show this as a warning/error in the UI?
	// This might lead to situations "Works in Jetpack Inspector but not IRL"
	if ( empty( $body ) ) {
		$body = null;
	}

	$signature = Client::build_signed_request( $args, $body );

	if ( is_wp_error( $signature ) ) {
		return $signature;
	}

	return array(
		'signature' => $signature,
		'result'    => Client::_wp_remote_request( $signature['url'], $signature['request'] ),
	);
}

function silent_json_decode( $string ) {
	try {
		$json = json_decode( $string, false, 512, JSON_THROW_ON_ERROR );
		if ( is_object( $json ) ) {
			return $json;
		}
	} catch ( Exception $e ) {
		return $string;
	}
}

function jetpack_inspect_wp_request() {
}

function jetpack_inspect_request( $url, $args ) {

	$args = jetpack_inspect_default_args( $args );
	// I've been using this for a while now, can't remember why anymore. Nice.
	// Commented out for now.
	// if ( ! isset( $headers['Content-Type'] ) ) {
	// $headers['Content-Type'] = 'application/json; charset=utf-8;';
	// }

	$request = jetpack_inspect_connection_request( $url, $args );

	if ( is_wp_error( $request ) ) {
		return $request;
	}

	$signature = $request['signature'];
	$result    = $request['result'];

	$body = wp_remote_retrieve_body( $result );

	return array(
		'body'      => silent_json_decode( $body ),
		'headers'   => wp_remote_retrieve_headers( $result ),
		'cookies'   => wp_remote_retrieve_cookies( $result ),
		'signature' => $signature,
		'args'      => $args,
		'response'  => $result,
	);
}
