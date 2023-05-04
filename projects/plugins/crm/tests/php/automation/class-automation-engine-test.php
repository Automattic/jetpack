<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/tools/class-automation-faker.php';

/**
 * Test Automation Engine
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Automation_Engine_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Automation Engine get singleton instance
	 */
	public function test_automation_engine_instance() {
		$automation_1 = Automation_Engine::instance();

		$this->assertTrue( ( $automation_1 && $automation_1 instanceof Automation_Engine ) );

		// Test a second instance should be the same as the first one
		$automation_2 = Automation_Engine::instance();
		$this->assertEquals( $automation_1, $automation_2 );
	}

	/**
	 * @testdox Register a trigger to the automation engine
	 * @throws Automation_Exception
	 */
	public function test_automation_register_trigger() {
		$automation = Automation_Engine::instance();

		$automation->register_step( 'contact_created', Contact_Created_Trigger::class );

		// Get the map of registered step_name => step_class
		$steps = $automation->get_registered_steps();

		$this->assertCount( 1, $steps );
		$this->assertEquals( Contact_Created_Trigger::class, $steps['contact_created'] );
	}

	/**
	 * @testdox Register an invalid step class to the automation engine
	 */
	public function test_automation_register_invalid_step() {
		$automation = Automation_Engine::instance();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::STEP_CLASS_NOT_FOUND );

		$automation->register_step( 'contact_created', 'Invalid_Trigger_Class' );
	}
}
