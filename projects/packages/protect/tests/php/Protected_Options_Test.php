<?php
/**
 * Tests for the options the Protect dashboard never deletes.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Protected_Options
 */
#[CoversClass( Protected_Options::class )]
class Protected_Options_Test extends BaseTestCase {

	/**
	 * Option names, and whether they are protected.
	 *
	 * @return array[]
	 */
	public static function provider_is_protected() {
		return array(
			'a core default'                    => array( 'siteurl', true ),
			'a core option in another case'     => array( 'SiteURL', true ),
			'a core option added after install' => array( 'initial_db_version', true ),
			'another site\'s user roles'        => array( 'wp_2_user_roles', true ),
			'a widget\'s settings'              => array( 'widget_text', true ),
			'a Jetpack_Options option'          => array( 'jetpack_private_options', true ),
			'an unprefixed Jetpack option'      => array( 'verification_services_codes', true ),
			'a Jetpack option family'           => array( 'jp_sync_lock_full_sync', true ),
			'an option malware left'            => array( '_wpc_ak', false ),
		);
	}

	/**
	 * Test is_protected().
	 *
	 * @dataProvider provider_is_protected
	 * @param string $name     The option name.
	 * @param bool   $expected Whether it is protected.
	 */
	#[DataProvider( 'provider_is_protected' )]
	public function test_is_protected( $name, $expected ) {
		$this->assertSame( $expected, Protected_Options::is_protected( $name ) );
	}
}
