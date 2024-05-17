<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Empty_Slug_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '/tools/class-automation-faker.php';

/**
 * Test Automation Engine
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Automation_Engine_Test extends JPCRM_Base_Test_Case {

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
		$automation = new Automation_Engine();

		$automation->register_trigger( Contact_Created::class );

		// Get the map of registered trigger_slug => trigger_classname
		$triggers = $automation->get_registered_triggers();

		$this->assertCount( 1, $triggers );
		$this->assertEquals( Contact_Created::class, $triggers['jpcrm/contact_created'] );

		$expected_class = $automation->get_trigger_class( 'jpcrm/contact_created' );

		$this->assertEquals( Contact_Created::class, $expected_class );
	}

	/**
	 * @testdox Register an empty trigger slug to the automation engine
	 */
	public function test_automation_register_empty_trigger_slug() {
		$automation = new Automation_Engine();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::TRIGGER_SLUG_EMPTY );

		$automation->register_trigger( Empty_Slug_Trigger::class );
	}

	/**
	 * @testdox Register a duplicated trigger class to the automation engine
	 */
	public function test_automation_register_duplicated_trigger() {
		$automation = new Automation_Engine();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::TRIGGER_SLUG_EXISTS );

		$automation->register_trigger( Contact_Created::class );
		$automation->register_trigger( Contact_Created::class );
	}

	/**
	 * @testdox Register an invalid trigger class to the automation engine
	 */
	public function test_automation_register_invalid_trigger() {
		$automation = new Automation_Engine();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::TRIGGER_CLASS_NOT_FOUND );

		$automation->register_trigger( 'Invalid_Trigger_Class' );
	}
}
