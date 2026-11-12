<?php
/**
 * Plugin Name: Jetpack Backup E2E Helper
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Turns on the Backup modernization filter and answers the dashboard's WordPress.com requests
 * locally. `<Gates>` reads the plan from `/rewind/capabilities`, which `e2e-plan-helper.php`
 * cannot fake, and under interception a restore never leaves the site.
 *
 * @package automattic/jetpack
 */

/**
 * Comma-separated rewind capabilities to answer with, e.g. `backup,scan`. Absent or empty
 * is a legitimate WPCOM answer and the one that drives the no-plan gate, so interception
 * is unconditional.
 */
const E2E_BACKUP_CAPABILITIES_OPTION = 'e2e_backup_capabilities';

/**
 * HTTP status to answer the capabilities request with. Anything but 200 drives the error gate.
 */
const E2E_BACKUP_CAPABILITIES_STATUS_OPTION = 'e2e_backup_capabilities_status';

/**
 * Every request this helper answered, keyed by route: a count and the last JSON body.
 * Read by the specs, because the e2e site's real plan also lacks Backup and a dead mock would still pass.
 */
const E2E_BACKUP_REQUESTS_OPTION = 'e2e_backup_requests';

/**
 * The one backup the fake activity log lists. `rewind_id` keeps its decimal, as real ones do.
 */
const E2E_BACKUP_PERIOD    = 1760000000;
const E2E_BACKUP_REWIND_ID = '1760000000.25';

/**
 * Where the fake signed URLs point. Resolvable on purpose: `wp_http_validate_url()` looks the host up.
 */
const E2E_BACKUP_FILE_URL     = 'https://example.com/jetpack-backup-e2e/notes.txt';
const E2E_BACKUP_DOWNLOAD_URL = 'https://example.com/jetpack-backup-e2e/backup.zip';
const E2E_BACKUP_FILE_CONTENT = 'Hello from the Jetpack Backup e2e fake.';

add_filter( 'rsm_jetpack_ui_modernization_backup', '__return_true' );
add_filter( 'pre_http_request', 'e2e_jetpack_backup_intercept', 3, 3 );

/**
 * Answer the WordPress.com requests this helper fakes, and the file download its signed URL names.
 *
 * @param false|array|WP_Error $return      result.
 * @param array                $parsed_args request arguments.
 * @param string               $url         request URL.
 * @return false|array|WP_Error The canned response, or $return when the URL isn't ours.
 */
function e2e_jetpack_backup_intercept( $return, $parsed_args, $url ) {
	if ( E2E_BACKUP_FILE_URL === $url ) {
		return e2e_jetpack_backup_response( E2E_BACKUP_FILE_CONTENT );
	}

	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	if ( 1 !== preg_match( sprintf( '#/v(\d+)/+sites/%d/([^?]+)#', $site_id ), $url, $matches ) ) {
		return $return;
	}

	$method = strtoupper( $parsed_args['method'] ?? 'GET' );
	$route  = e2e_jetpack_backup_route( $method, $matches[1], $matches[2] );

	if ( null === $route ) {
		return $return;
	}

	$body = isset( $parsed_args['body'] ) && is_string( $parsed_args['body'] )
		? json_decode( $parsed_args['body'], true )
		: null;

	return e2e_jetpack_backup_answer( $route, e2e_jetpack_backup_record( $route, $body ), $body );
}

/**
 * Name the faked route a request is for.
 *
 * @param string $method  HTTP method.
 * @param string $version API version, without the `v`.
 * @param string $path    Path after `/sites/{id}/`, without the query string.
 * @return string|null The route, e.g. `GET rewind/restores/%d`, or null when it isn't faked.
 */
function e2e_jetpack_backup_route( $method, $version, $path ) {
	$routes = array(
		'GET rewind/capabilities'          => '#^rewind/capabilities$#',
		'GET rewind/restores'              => '#^rewind/restores$#',
		'POST rewind/restores'             => '#^rewind/restores$#',
		'GET rewind/restores/%d'           => '#^rewind/restores/\d+$#',
		'POST rewind/downloads'            => '#^rewind/downloads$#',
		'GET rewind/downloads/%d'          => '#^rewind/downloads/\d+$#',
		'GET activity/rewindable'          => '#^activity/rewindable$#',
		'POST rewind/backup/ls'            => '#^rewind/backup/ls$#',
		'POST rewind/backup/path-info'     => '#^rewind/backup/path-info$#',
		'GET rewind/backup/%d/file/%s/url' => '#^rewind/backup/\d+/file/[^/]+/url$#',
	);

	// v2 only: the v3 backups route is the per-backup size list, which the specs leave alone.
	if ( '2' === $version ) {
		$routes['GET rewind/backups'] = '#^rewind/backups$#';
	}

	foreach ( $routes as $route => $pattern ) {
		if ( 0 === strpos( $route, $method . ' ' ) && 1 === preg_match( $pattern, $path ) ) {
			return $route;
		}
	}

	return null;
}

/**
 * Count a request to a route and keep its body.
 *
 * @param string     $route The faked route.
 * @param array|null $body  The decoded request body.
 * @return int How many requests the route has had, this one included.
 */
function e2e_jetpack_backup_record( $route, $body ) {
	$requests = get_option( E2E_BACKUP_REQUESTS_OPTION, array() );

	if ( ! is_array( $requests ) ) {
		$requests = array();
	}

	$count              = ( $requests[ $route ]['count'] ?? 0 ) + 1;
	$requests[ $route ] = array(
		'count' => $count,
		'body'  => $body,
	);

	update_option( E2E_BACKUP_REQUESTS_OPTION, $requests, false );

	return $count;
}

/**
 * The canned answer for a route.
 *
 * Restore and download status step forward one state per request, so the screens have to
 * keep polling to reach the end.
 *
 * @param string     $route The faked route.
 * @param int        $count How many requests the route has had, this one included.
 * @param array|null $body  The decoded request body.
 * @return array The response.
 */
function e2e_jetpack_backup_answer( $route, $count, $body ) {
	switch ( $route ) {
		case 'GET rewind/capabilities':
			$status = (int) get_option( E2E_BACKUP_CAPABILITIES_STATUS_OPTION, 200 );

			return 200 === $status
				? e2e_jetpack_backup_response( array( 'capabilities' => e2e_jetpack_backup_capabilities() ) )
				: e2e_jetpack_backup_response( array( 'code' => 'e2e_fake_failure' ), $status );

		case 'GET rewind/restores':
			// Nothing running, so the restore screen offers the form instead of adopting one.
			return e2e_jetpack_backup_response( array() );

		case 'POST rewind/restores':
			return e2e_jetpack_backup_response(
				array(
					'ok'         => true,
					'restore_id' => 4242,
					'rewind_id'  => $body['rewindId'] ?? '',
				)
			);

		case 'GET rewind/restores/%d':
			$steps = array(
				1 => array( 'status' => 'queued' ),
				2 => array(
					'status'  => 'running',
					'percent' => 50,
				),
			);

			return e2e_jetpack_backup_response(
				array( 'restore_id' => 4242 ) + ( $steps[ $count ] ?? array(
					'status'  => 'finished',
					'percent' => 100,
				) )
			);

		case 'POST rewind/downloads':
			return e2e_jetpack_backup_response( array( 'downloadId' => 4343 ) );

		case 'GET rewind/downloads/%d':
			$ready = $count > 1
				? array(
					'progress'   => 100,
					'url'        => E2E_BACKUP_DOWNLOAD_URL,
					'validUntil' => '2030-01-01T00:00:00+00:00',
				)
				: array( 'progress' => 50 );

			return e2e_jetpack_backup_response( array( 'downloadId' => 4343 ) + $ready );

		case 'GET rewind/backups':
			return e2e_jetpack_backup_response(
				array(
					array(
						'id'           => 1,
						'started'      => gmdate( 'Y-m-d H:i:s', E2E_BACKUP_PERIOD - 300 ),
						'last_updated' => gmdate( 'Y-m-d H:i:s', E2E_BACKUP_PERIOD ),
						'status'       => 'finished',
						'period'       => E2E_BACKUP_PERIOD,
						'percent'      => 100,
						'is_backup'    => 1,
						'is_scan'      => 0,
						'stats'        => array( 'files' => 2 ),
					),
				)
			);

		case 'GET activity/rewindable':
			return e2e_jetpack_backup_response(
				array(
					'current'      => array(
						'orderedItems' => array(
							array(
								'activity_id'   => 'e2e-backup',
								'name'          => 'rewind__backup_complete_full',
								'gridicon'      => 'cloud',
								'rewind_id'     => E2E_BACKUP_REWIND_ID,
								'published'     => gmdate( 'c', E2E_BACKUP_PERIOD ),
								'summary'       => 'Backup and scan complete',
								'actor'         => array(
									'type' => 'Application',
									'name' => 'Jetpack',
								),
								'content'       => array( 'text' => '1 plugin, 1 theme' ),
								'object'        => array( 'backup_period' => E2E_BACKUP_PERIOD ),
								'is_rewindable' => true,
							),
						),
					),
					'totalItems'   => 1,
					'totalPages'   => 1,
					'itemsPerPage' => 20,
				)
			);

		case 'POST rewind/backup/ls':
			$listings = array(
				'/'           => array(
					'wp-content' => array(
						'type'         => 'dir',
						'has_children' => true,
					),
				),
				'/wp-content' => array(
					'notes.txt' => array(
						'type'          => 'file',
						'period'        => (string) E2E_BACKUP_PERIOD,
						'manifest_path' => '/wp-content/notes.txt',
					),
				),
			);

			return e2e_jetpack_backup_response(
				array(
					'ok'       => true,
					'contents' => $listings[ $body['path'] ?? '' ] ?? array(),
				)
			);

		case 'POST rewind/backup/path-info':
			return e2e_jetpack_backup_response(
				array(
					'size'  => strlen( E2E_BACKUP_FILE_CONTENT ),
					'hash'  => md5( E2E_BACKUP_FILE_CONTENT ),
					'mtime' => E2E_BACKUP_PERIOD,
				)
			);

		case 'GET rewind/backup/%d/file/%s/url':
			return e2e_jetpack_backup_response( array( 'url' => E2E_BACKUP_FILE_URL ) );
	}

	return e2e_jetpack_backup_response( array( 'code' => 'e2e_fake_unhandled' ), 500 );
}

/**
 * Build an HTTP response array.
 *
 * @param array|string $body   JSON-encoded unless already a string.
 * @param int          $status HTTP status.
 * @return array The response.
 */
function e2e_jetpack_backup_response( $body, $status = 200 ) {
	return array(
		'response' => array( 'code' => $status ),
		'body'     => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
	);
}

/**
 * The capability list to answer with, parsed out of the option.
 *
 * `array_values()` matters: `Capabilities_Bridge` refuses a `capabilities` key that is
 * not a numeric array.
 *
 * @return string[] Capability slugs, possibly empty.
 */
function e2e_jetpack_backup_capabilities() {
	$raw = get_option( E2E_BACKUP_CAPABILITIES_OPTION, '' );

	if ( ! is_string( $raw ) ) {
		return array();
	}

	return array_values( array_filter( array_map( 'trim', explode( ',', $raw ) ) ) );
}
