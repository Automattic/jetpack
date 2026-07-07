<?php
/**
 * Controller REST filtering tests.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use WP_REST_Request;

/**
 * Covers Consent_Log_Controller::get_consent_logs() filtering, guarding the
 * customer_id -> user_id parameter rename.
 */
class Consent_Log_Controller_Rest_Test extends TestCase {

	/**
	 * The user_id request param filters rows to the matching user only.
	 */
	public function test_get_consent_logs_filters_by_user_id() {
		$this->insert_consent_row(
			array(
				'user_id'    => 11,
				'event_type' => 'accept_all',
			)
		);
		$this->insert_consent_row(
			array(
				'user_id'    => 11,
				'event_type' => 'reject_all',
			)
		);
		$this->insert_consent_row( array( 'user_id' => 22 ) );

		$request = new WP_REST_Request();
		$request->set_param( 'user_id', 11 );
		$request->set_param( 'per_page', 100 );

		$response = Consent_Log_Controller::init()->get_consent_logs( $request );
		$rows     = $response->get_data();

		$this->assertCount( 2, $rows );
		foreach ( $rows as $row ) {
			$this->assertSame( 11, (int) $row['user_id'] );
		}
	}

	/**
	 * The old customer_id param no longer filters anything (rename is complete).
	 */
	public function test_get_consent_logs_ignores_legacy_customer_id_param() {
		$this->insert_consent_row( array( 'user_id' => 11 ) );
		$this->insert_consent_row( array( 'user_id' => 22 ) );

		$request = new WP_REST_Request();
		$request->set_param( 'customer_id', 11 );
		$request->set_param( 'per_page', 100 );

		$response = Consent_Log_Controller::init()->get_consent_logs( $request );
		$rows     = $response->get_data();

		// customer_id is no longer a recognised filter, so all rows come back.
		$this->assertCount( 2, $rows );
	}
}
