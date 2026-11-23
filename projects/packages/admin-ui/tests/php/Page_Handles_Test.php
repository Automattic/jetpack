<?php
/**
 * Page_Handles tests.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\Attributes\CoversClass;
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
	 * Member pages list every handle they printed, concatenated or not.
	 *
	 * @return void
	 */
	public function test_print_handles_lists_what_a_member_page_printed() {
		$this->assertStringContainsString( '{"scripts":["jquery-core"],"styles":["buttons"]}', $this->print_handles_on( 'jetpack-forms' ) );
	}

	/**
	 * Other admin pages print nothing.
	 *
	 * @return void
	 */
	public function test_print_handles_prints_nothing_elsewhere() {
		$this->assertSame( '', $this->print_handles_on( 'other-plugin' ) );
	}

	/**
	 * Print the list on an admin page, with one member registered.
	 *
	 * @param string $page The `page` query argument.
	 * @return string
	 */
	private function print_handles_on( $page ) {
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
		return (string) ob_get_clean();
	}
}
