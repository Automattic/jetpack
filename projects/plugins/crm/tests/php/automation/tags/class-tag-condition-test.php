<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Conditions\Object_Tag;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Object_Tag
 */
class Tag_Condition_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	private function get_tag_condition( $operator, $tag ) {

		$condition_data = array(
			'slug'       => 'jpcrm/condition/object_tag',
			'attributes' => array(
				'tag'      => $tag,
				'operator' => $operator,
			),
		);

		return new Object_Tag( $condition_data );
	}

	/**
	 * @testdox Test the update contact field condition for the is operator.
	 */
	public function test_tag_matches_condition() {

		$tag_condition    = $this->get_tag_condition( 'Contact_Field_Changed', 'contact_change' );
		$generic_tag_data = $this->automation_faker->tag_list_data( false );

		$tag_data_new = array(
			'id'   => 1,
			'tags' => array(
				array(
					'id'          => 1,
					'objtype'     => ZBS_TYPE_CONTACT,
					'name'        => 'contact_change',
					'slug'        => 'tag-to-be-matched',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
				array(
					'id'          => 2,
					'objtype'     => ZBS_TYPE_CONTACT,
					'name'        => 'Tag 2 will not be matched',
					'slug'        => 'tag-2-will-not-be-matched',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		$tag_condition->execute( $tag_data_new, $generic_tag_data );
		$this->assertTrue( $tag_condition->condition_met() );

		// Testing when the condition has not been met.
		$tag_data_new = array();
		$tag_condition->execute( $tag_data_new );
		$this->assertFalse( $tag_condition->condition_met() );
	}
}
