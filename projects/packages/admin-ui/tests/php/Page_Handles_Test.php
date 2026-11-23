<?php
/**
 * Page_Handles tests.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Page_Handles tests.
 *
 * @covers \Automattic\Jetpack\Admin_UI\Page_Handles
 */
#[CoversClass( Page_Handles::class )]
class Page_Handles_Test extends TestCase {

	/**
	 * Remove what the tests set.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'jetpack_admin_shell_members' );
		unset( $_GET['page'] );
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;
		parent::tearDown();
	}

	/**
	 * Data provider for test_print_handles_lists_what_member_pages_printed.
	 *
	 * @return array[] Page, the list it prints or null for none.
	 */
	public static function provide_pages() {
		return array(
			'member page'    => array( 'jetpack-forms', '{"scripts":["jquery-core"],"styles":["buttons"]}' ),
			'any other page' => array( 'other-plugin', null ),
		);
	}

	/**
	 * Member pages list every handle they printed, concatenated or not.
	 *
	 * @dataProvider provide_pages
	 *
	 * @param string      $page     The `page` query argument.
	 * @param string|null $expected The list, or null for no output.
	 * @return void
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_print_handles_lists_what_member_pages_printed( $page, $expected ) {
		add_filter(
			'jetpack_admin_shell_members',
			static function () {
				return array(
					'jetpack-forms' => array(
						'build_prefix' => 'jetpack_forms',
						'build_page'   => 'jetpack-forms-admin',
						'title'        => 'Forms',
						'load'         => '__return_null',
					),
				);
			}
		);
		$_GET['page']      = $page;
		wp_scripts()->done = array( 'jquery-core' );
		wp_styles()->done  = array( 'buttons' );

		ob_start();
		Page_Handles::print_handles();
		$output = (string) ob_get_clean();

		if ( null === $expected ) {
			$this->assertSame( '', $output );
			return;
		}
		$this->assertStringContainsString( 'id="jetpack-page-handles"', $output );
		$this->assertStringContainsString( $expected, $output );
	}
}
