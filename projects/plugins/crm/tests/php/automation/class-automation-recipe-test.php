<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Automation_Recipe;
use Automattic\Jetpack\CRM\Automation\Trigger;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/tools/class-automation-faker.php';

/**
 * Test Automation Recipe functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Automation_Recipe_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Automation recipe initialization
	 */
	public function test_automation_recipe_init() {

		$recipe_data = $this->automation_faker->basic_recipe();

		$recipe = new Automation_Recipe( $recipe_data );

		$this->assertTrue( $recipe instanceof Automation_Recipe );
	}

	/**
	 * @testdox Automation recipe with no triggers
	 */
	public function test_automation_recipe_no_triggers() {
		$recipe_data = $this->automation_faker->empty_recipe();

		$recipe = new Automation_Recipe( $recipe_data );

		$this->assertCount( 0, $recipe->get_triggers() );
	}

	/**
	 * @testdox Automation recipe with multiple triggers
	 */
	public function test_recipe_triggers() {
		$recipe_data = $this->automation_faker->basic_recipe();

		$recipe = new Automation_Recipe( $recipe_data );

		$recipe->add_trigger( 'contact_updated' );
		$recipe->add_trigger( 'contact_deleted' );

		$this->assertCount( 3, $recipe->get_triggers() );

		// Check if the triggers are added
		$triggers = $recipe->get_triggers();
		$this->assertEquals( 'contact_created', $triggers[0] );
		$this->assertEquals( 'contact_updated', $triggers[1] );
		$this->assertEquals( 'contact_deleted', $triggers[2] );
	}

	/**
	 * @testdox Testing turn on/off the recipe, to activate/deactivate it
	 */
	public function test_recipe_turn_on_off() {
		$recipe_data = Automation_Faker::basic_recipe();

		$recipe = new Automation_Recipe( $recipe_data );

		$recipe->turn_on();
		$this->assertTrue( $recipe->is_active() );

		$recipe->turn_off();
		$this->assertFalse( $recipe->is_active() );
	}

	/**
	 * @testdox Test an automation recipe execution on contact_created event
	 */
	public function test_recipe_execution_on_contact_created() {

		$automation = Automation_Engine::instance();
		$automation->set_automation_logger( Automation_Logger::instance() );
		$automation->register_trigger( 'contact_created', Contact_Created_Trigger::class );

		$recipe_data = $this->automation_faker->recipe_without_initial_step();
		
		// Build a PHPUnit mock Automation_Recipe
		$recipe = $this->getMockBuilder( Automation_Recipe::class )
			->setConstructorArgs( array( $recipe_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();
		
		// Add and init the recipes
		$automation->add_recipe( $recipe );
		$automation->init_recipes();

		// Fake event data
		$contact_data = $this->automation_faker->contact_data();

		// We expect the recipe to be executed on contact_created event with the contact data
		$recipe->expects( $this->once() )
			->method( 'execute' )
			->with(
				$this->logicalAnd(
					$this->isInstanceOf( Trigger::class ),
					$this->callback(
						function ( $trigger ) {
							return $trigger->get_name() === 'contact_created';
						}
					)
				),
				$this->equalTo( $contact_data )
			);

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}
}
