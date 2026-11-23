<?php
/**
 * Tests for the AI Launchpad "Bring your AI tool" experiment assignment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-bring-your-ai-tool.php';

/**
 * Test class for AI_Launchpad_Bring_Your_AI_Tool.
 *
 * Each test runs in its own process: Brain Monkey defines ExPlat\assign_current_user(), and other features
 * change behaviour once it exists.
 *
 * @covers \AI_Launchpad_Bring_Your_AI_Tool
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( AI_Launchpad_Bring_Your_AI_Tool::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class AI_Launchpad_Bring_Your_AI_Tool_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Stubs an administrator of a Free Simple site whom ExPlat assigns to the treatment, with the given parts replaced.
	 *
	 * @param array $overrides Any of: is_simple, purchases, variation, role.
	 */
	private function stub_site( array $overrides = array() ) {
		$state = array_merge(
			array(
				'is_simple' => true,
				'purchases' => array(),
				'variation' => 'bring_your_ai_tool',
				'role'      => 'administrator',
			),
			$overrides
		);

		Constants::set_constant( 'IS_WPCOM', $state['is_simple'] );
		$GLOBALS['wpcom_get_site_purchases_test_value'] = $state['purchases'];

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'bring_your_ai_tool_admin',
					'user_pass'  => 'dummy_pass',
					'role'       => $state['role'],
				)
			)
		);

		Functions\when( 'ExPlat\assign_current_user' )->alias(
			function ( $experiment ) use ( $state ) {
				return AI_Launchpad_Bring_Your_AI_Tool::EXPERIMENT === $experiment ? $state['variation'] : null;
			}
		);
	}

	/**
	 * An administrator of a Free site gets the variation ExPlat assigns.
	 */
	public function test_free_site_admin_gets_the_assigned_variation() {
		$this->stub_site();
		$this->assertSame( 'bring_your_ai_tool', AI_Launchpad_Bring_Your_AI_Tool::get_variation() );
	}

	/**
	 * A paid plan is never assigned.
	 */
	public function test_paid_site_is_not_assigned() {
		$this->stub_site(
			array(
				'purchases' => array(
					(object) array(
						'product_slug' => 'personal-bundle',
						'product_type' => 'bundle',
						'expiry_date'  => '2027-01-01 00:00:00',
					),
				),
			)
		);
		$this->assertNull( AI_Launchpad_Bring_Your_AI_Tool::get_variation() );
	}

	/**
	 * An Atomic site is never assigned.
	 */
	public function test_atomic_site_is_not_assigned() {
		$this->stub_site( array( 'is_simple' => false ) );
		$this->assertNull( AI_Launchpad_Bring_Your_AI_Tool::get_variation() );
	}

	/**
	 * A user who cannot manage the site is never assigned.
	 */
	public function test_non_admin_is_not_assigned() {
		$this->stub_site( array( 'role' => 'author' ) );
		$this->assertNull( AI_Launchpad_Bring_Your_AI_Tool::get_variation() );
	}

	/**
	 * The override filter replaces the assignment for testing.
	 */
	public function test_override_filter_forces_the_variation() {
		$this->stub_site( array( 'variation' => 'control' ) );
		add_filter( 'wpcom_ai_launchpad_bring_your_ai_tool_override_is_treatment', '__return_true' );
		$this->assertSame( 'bring_your_ai_tool', AI_Launchpad_Bring_Your_AI_Tool::get_variation() );
	}
}
