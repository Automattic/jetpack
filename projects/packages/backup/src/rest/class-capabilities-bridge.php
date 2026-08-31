<?php
/**
 * Capabilities REST bridge — proxies WPCOM's site rewind state.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Returns the site's backup capabilities (plan slug, hasBackupPlan,
 * hasScan). Backs the `<Gates>` decision tree.
 */
class Capabilities_Bridge {

	/**
	 * Register the GET /jetpack/v4/site/capabilities route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/site/capabilities',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_capabilities' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
			)
		);
	}

	/**
	 * Proxy `/sites/{id}/rewind/capabilities` (v2, as_user) and project
	 * the response into the shape the React layer expects.
	 *
	 * This is the same endpoint the legacy `/jetpack/v4/backup-capabilities`
	 * route hits — it returns a flat `{ capabilities: [...] }` envelope.
	 * The earlier `/rewind?force=wpcom` variant returns site *state*, not
	 * a capabilities list, and on some plan shapes (e.g. Jetpack Complete)
	 * the `capabilities` key is missing entirely, which produced a false
	 * "no plan" gate for plans that do include Backup.
	 *
	 * @return \WP_REST_Response|WP_Error The decoded capabilities, or WP_Error on failure.
	 */
	public static function get_capabilities() {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/capabilities', $blog_id ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'capabilities_fetch_failed' );
		}

		// Cast: `wp_remote_retrieve_response_code()` returns whatever the
		// transport put there, and a numeric string fails a strict
		// comparison against 200 — sending a perfectly good response down
		// the failure branch, and reporting it as a failure rather than as
		// the success it was.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'capabilities_fetch_failed',
				__( 'Could not fetch site capabilities.', 'jetpack-backup-pkg' )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		// A 200 we cannot read is refused rather than projected.
		//
		// Coercing it to an empty list is the same as answering "this site
		// has no Backup plan", and that answer is acted on: `<Gates>`
		// renders the upgrade screen. So a truncated response, an HTML
		// error page from something in front of WordPress.com, or a shape
		// change upstream would each show a paying customer an advert for
		// what they already own, with no error anywhere to explain it.
		// The docblock above records this exact mechanism firing once
		// already; that fix repointed the endpoint and left the tolerant
		// projection in place.
		//
		// An *empty* list is not this case. It is a legitimate answer —
		// the one every site without Backup gives — and refusing it would
		// put a permanent error in front of precisely the people the
		// upgrade screen is for.
		// `wp_is_numeric_array()` and not `is_array()`, because the two
		// differ on the shape most likely to arrive if upstream drifts: a
		// keyed map. `is_array()` accepts `{"capabilities":{"backup":true}}`,
		// and `in_array()` then compares against that map's *values* — so
		// the site reads as having no plan, which is the outcome this
		// whole guard exists to prevent. It returns true for an empty
		// array, so the carve-out below survives.
		if (
			! is_array( $body )
			|| ! isset( $body['capabilities'] )
			|| ! wp_is_numeric_array( $body['capabilities'] )
		) {
			return new WP_Error(
				'capabilities_unreadable',
				__( "Could not read this site's plan details.", 'jetpack-backup-pkg' ),
				// Deliberately not the 502 `Rest_Controller::transport_error()`
				// uses: the client reads 502 as "the answer went missing",
				// a meaning it shares with the destructive restore
				// mutation. Nothing was in flight here. WordPress.com
				// answered; we could not read what it said.
				array( 'status' => 500 )
			);
		}

		$capabilities = $body['capabilities'];

		return rest_ensure_response(
			array(
				'hasBackupPlan' => in_array( 'backup', $capabilities, true ),
				'hasScan'       => in_array( 'scan', $capabilities, true ),
			)
		);
	}
}
