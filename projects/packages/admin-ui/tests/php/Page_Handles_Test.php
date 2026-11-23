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
	 * Remove what the test set.
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
		$_GET['page']      = 'jetpack-forms';
		wp_scripts()->done = array( 'jquery-core' );
		wp_styles()->done  = array( 'buttons' );

		ob_start();
		Page_Handles::print_handles();

		$this->assertStringContainsString( '{"scripts":["jquery-core"],"styles":["buttons"]}', (string) ob_get_clean() );
	}
}
