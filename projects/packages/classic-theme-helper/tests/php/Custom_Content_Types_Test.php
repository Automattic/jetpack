<?php
/**
 * Tests for the Custom Content Types settings state.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/custom-content-types.php';

/**
 * @covers ::jetpack_custom_post_types_loaded
 */
#[CoversFunction( 'jetpack_custom_post_types_loaded' )]
class Custom_Content_Types_Test extends TestCase {

	/**
	 * Reset the request and script queue.
	 */
	protected function tearDown(): void {
		unset( $_GET['page'] );
		$GLOBALS['wp_scripts'] = null;
		parent::tearDown();
	}

	/**
	 * Test that the state prints only on the Settings pages.
	 *
	 * @dataProvider provide_pages
	 *
	 * @param string $page     The `page` query arg.
	 * @param bool   $expected Whether the state script is enqueued.
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_state_prints_only_on_the_settings_pages( $page, $expected ) {
		$_GET['page'] = $page;

		jetpack_custom_post_types_loaded();

		$this->assertSame( $expected, wp_script_is( 'custom-content-types-data', 'enqueued' ) );
	}

	/**
	 * Data provider for test_state_prints_only_on_the_settings_pages.
	 *
	 * @return array
	 */
	public static function provide_pages() {
		return array(
			'legacy dashboard'  => array( 'jetpack', true ),
			'new Settings page' => array( 'jetpack-settings', true ),
			'other admin page'  => array( 'jetpack_modules', false ),
		);
	}
}
