<?php
/**
 * Tests for the Services class.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Tests for Services.
 */
class Services_Test extends BaseTestCase {

	/**
	 * Undo the transient a test seeds.
	 */
	public function tear_down() {
		Services::clear_cache();

		parent::tear_down();
	}

	public function test_get_all_returns_the_cached_services_untouched() {
		$cached = array(
			array(
				'id'          => 'facebook',
				'description' => 'Share to Facebook.',
				'label'       => 'Facebook',
				'status'      => 'ok',
				'supports'    => array(
					'additional_users'      => true,
					'additional_users_only' => false,
				),
				'url'         => null,
			),
		);
		set_transient( Services::SERVICES_TRANSIENT, $cached, DAY_IN_SECONDS );

		$this->assertSame( $cached, Services::get_all() );
	}
}
