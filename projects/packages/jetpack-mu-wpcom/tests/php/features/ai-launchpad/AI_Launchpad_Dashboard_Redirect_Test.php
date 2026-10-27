<?php
/**
 * Tests for sending an AI-built site's first Dashboard visit to Site Setup.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::should_redirect_dashboard_to_site_setup
 */
#[CoversMethod( AI_Launchpad::class, 'should_redirect_dashboard_to_site_setup' )]
class AI_Launchpad_Dashboard_Redirect_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/ai-launchpad.php';
	}

	/**
	 * Only an admin's Dashboard visit on an AI-built site where Site Setup never opened goes to Site Setup.
	 *
	 * @dataProvider provide_redirect_inputs
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param string $role     The current user's role.
	 * @param bool   $ai_built Whether the site has the AI builder's spec.
	 * @param ?bool  $opened   Whether Site Setup recorded the wizard answers; null for a list without them.
	 * @param bool   $expected Whether the visit should go to Site Setup.
	 */
	#[DataProvider( 'provide_redirect_inputs' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_redirect_dashboard_to_site_setup( $role, $ai_built, $opened, $expected ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'dashboard-redirect-user',
					'user_pass'  => 'pass',
					'role'       => $role,
				)
			)
		);
		update_option( 'wpcom_ai_launchpad_enabled', '1' );
		if ( $ai_built ) {
			update_option( 'big_sky_site_metadata', wp_json_encode( array( 'siteType' => 'business' ), JSON_UNESCAPED_SLASHES ) );
		}
		if ( $opened ) {
			update_option( \AI_Launchpad_REST::OPTION_WIZARD, array( 'source' => 'ai_builder' ) );
		} elseif ( null === $opened ) {
			update_option( \AI_Launchpad_REST::OPTION_AI_OUTPUT, array( 'payload' => array( 'tasks' => array() ) ) );
		}

		$this->assertSame( $expected, AI_Launchpad::should_redirect_dashboard_to_site_setup() );
	}

	/**
	 * Data provider for test_should_redirect_dashboard_to_site_setup.
	 *
	 * @return array
	 */
	public static function provide_redirect_inputs() {
		return array(
			'first visit on an AI-built site' => array( 'administrator', true, false, true ),
			'a site not built with AI'        => array( 'administrator', false, false, false ),
			'Site Setup already opened'       => array( 'administrator', true, true, false ),
			'a list but no wizard answers'    => array( 'administrator', true, null, false ),
			'an editor'                       => array( 'editor', true, false, false ),
		);
	}
}
