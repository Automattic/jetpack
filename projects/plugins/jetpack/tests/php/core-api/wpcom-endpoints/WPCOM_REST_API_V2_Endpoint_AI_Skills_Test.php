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
		add_filter( 'jetpack_feature_flag_enabled_ai-hub-discover', '__return_true' );
		set_transient(
			Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT,
			array(
				'categories' => array(),
				'skills'     => array( array( 'slug' => 'site-seo-audit' ), array( 'slug' => 'check_site' ) ),
			)
		);
		set_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'site-seo-audit', '## Steps' );
		set_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'check_site', '## Check' );
	}

	/**
	 * Clear the seeded cache.
	 */
	public function tear_down() {
		delete_transient( Jetpack_AI_Skills_Catalog::INDEX_TRANSIENT );
		delete_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'site-seo-audit' );
		delete_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . 'check_site' );
		remove_filter( 'jetpack_feature_flag_enabled_ai-hub-discover', '__return_true' );
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
			'subscriber is refused'                 => array( 'subscriber', 'site-seo-audit', 403, true ),
			'admin gets a known skill'              => array( 'administrator', 'site-seo-audit', 200, true ),
			'admin gets a skill with an underscore' => array( 'administrator', 'check_site', 200, true ),
			'admin gets 404 for an unknown'         => array( 'administrator', 'not-a-skill', 404, true ),
			'admin gets 404 with Skills off'        => array( 'administrator', 'site-seo-audit', 404, false ),
		);
	}

	/**
	 * Only admins read skills, only skills in the index, and only with the Skills tab on.
	 *
	 * @dataProvider provide_requests
	 *
	 * @param string $role    The requesting user's role.
	 * @param string $slug    The requested skill.
	 * @param int    $status  The expected status.
	 * @param bool   $enabled Whether the Skills tab's flag is on.
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_get_skill( $role, $slug, $status, $enabled ) {
		if ( ! $enabled ) {
			remove_filter( 'jetpack_feature_flag_enabled_ai-hub-discover', '__return_true' );
		}
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/wpcom/v2/jetpack-ai/skills/' . $slug ) );

		$this->assertSame( $status, $response->get_status() );
		if ( 200 === $status ) {
			$this->assertSame( $slug, $response->get_data()['slug'] );
			$this->assertSame( get_transient( Jetpack_AI_Skills_Catalog::BODY_TRANSIENT_PREFIX . $slug ), $response->get_data()['body'] );
		}
	}
}
