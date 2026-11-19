<?php
/**
 * Tests for the /wpcom/v2/jetpack-ai/skills/<slug> endpoint.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Skills_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI_Skills
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI_Skills::class )]
class WPCOM_REST_API_V2_Endpoint_AI_Skills_Test extends Jetpack_REST_TestCase {

	/**
	 * Seed the index so no test reaches the network.
	 */
	public function set_up() {
		parent::set_up();
		set_transient(
			Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT,
			array(
				'categories' => array(),
				'skills'     => array( array( 'slug' => 'site-seo-audit' ) ),
			)
		);
		set_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'site-seo-audit', '## Steps' );
	}

	/**
	 * Clear the seeded cache.
	 */
	public function tear_down() {
		delete_transient( Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT );
		delete_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'site-seo-audit' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Who gets which status for which skill.
	 *
	 * @return array[]
	 */
	public static function provide_requests() {
		return array(
			'subscriber is refused'         => array( 'subscriber', 'site-seo-audit', 403 ),
			'admin gets a known skill'      => array( 'administrator', 'site-seo-audit', 200 ),
			'admin gets 404 for an unknown' => array( 'administrator', 'not-a-skill', 404 ),
		);
	}

	/**
	 * Only admins read skills, and only skills in the index.
	 *
	 * @dataProvider provide_requests
	 *
	 * @param string $role   The requesting user's role.
	 * @param string $slug   The requested skill.
	 * @param int    $status The expected status.
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_get_skill( $role, $slug, $status ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/wpcom/v2/jetpack-ai/skills/' . $slug ) );

		$this->assertSame( $status, $response->get_status() );
		if ( 200 === $status ) {
			$this->assertSame(
				array(
					'slug' => 'site-seo-audit',
					'body' => '## Steps',
				),
				$response->get_data()
			);
		}
	}
}
