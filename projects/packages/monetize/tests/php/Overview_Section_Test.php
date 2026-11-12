<?php
/**
 * Tests for the Overview section.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Sections\Overview
 */
#[CoversClass( Overview::class )]
class Overview_Section_Test extends BaseTestCase {

	public function test_upgrade_url_defaults_to_jetpack_creator() {
		$this->assertStringContainsString( 'source=jetpack-creator-cta', Overview::get_upgrade_url() );
	}

	public function test_upgrade_url_follows_a_host_that_sells_its_own_plans() {
		add_filter(
			'jetpack_feature_upgrade',
			function ( $upgrade, $slug ) {
				return Overview::UPGRADE_SLUG === $slug ? array( 'url' => 'https://example.com/plans' ) : $upgrade;
			},
			10,
			2
		);

		$this->assertSame( 'https://example.com/plans', Overview::get_upgrade_url() );
	}
}
