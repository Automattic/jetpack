<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Conditions\Object_Tag;
use Automattic\Jetpack\CRM\Automation\Data_Types\Tag_List_Data;
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
	 * @testdox Test tag added condition.
	 */
	public function test_tag_added() {
		$tag_condition = $this->get_tag_condition( 'tag_added', 'Tag Added' );
		$tag_data      = $this->automation_faker->tag_list();

		// Create a previous state of a tag list.
		$previous_tag_data = $tag_data;

		// Testing when the condition has been not been met because the tag list does not have said tag.
		$tag_condition->execute( new Tag_List_Data( $tag_data, $previous_tag_data ) );
		$this->assertFalse( $tag_condition->condition_met() );

		// Testing when the condition has been met.
		$new_tag_data = array(
			'id'          => 3,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Tag Added',
			'slug'        => 'tag-added',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);
		$tag_data     = $this->automation_faker->tag_list( false, $new_tag_data );

		$tag_condition->execute( new Tag_List_Data( $tag_data, $previous_tag_data ) );
		$this->assertTrue( $tag_condition->condition_met() );

		// Testing when the condition has been not been met because the previous tag list already had said tag.

		$previous_tag_data = $tag_data;

		$tag_condition->execute( new Tag_List_Data( $tag_data, $tag_data ) );
		$this->assertFalse( $tag_condition->condition_met() );
	}

	// note - the below tests need refactoring.

	/**
	 * @testdox Test tag removed condition.
	 */
	public function test_tag_removed() {
		$tag_condition = $this->get_tag_condition( 'tag_removed', 'Tag to be removed' );
		$tag_data      = $this->automation_faker->tag_list_data( false );

		// Create a previous state of a tag list.
		$previous_tag_data = $tag_data;

		// Testing when the condition has been not been met because the previous tag list does not have said tag.
		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertFalse( $tag_condition->condition_met() );

		// Testing when the condition has been met.
		$previous_tag_data = array(
			array(
				'id'          => 1,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Tag to be removed',
				'slug'        => 'tag-to-be-removed',
				'created'     => 1692663412,
				'lastupdated' => 1692663412,
			),
			array(
				'id'          => 2,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Tag 2 ',
				'slug'        => 'tag-2',
				'created'     => 1692663412,
				'lastupdated' => 1692663412,
			),
		);

		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertTrue( $tag_condition->condition_met() );

		// Testing when the condition has been not been met because the current tag list still has said tag.
		$tag_data = array(
			array(
				'id'          => 1,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Tag to be removed',
				'slug'        => 'tag-to-be-removed',
				'created'     => 1692663412,
				'lastupdated' => 1692663412,
			),
			array(
				'id'          => 2,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Tag 2 ',
				'slug'        => 'tag-2',
				'created'     => 1692663412,
				'lastupdated' => 1692663412,
			),
		);
		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertFalse( $tag_condition->condition_met() );
	}

	/**
	 * @testdox Test tag list has tag condition.
	 */
	public function test_tag_list_has_tag() {
		$tag_condition = $this->get_tag_condition( 'has_tag', 'Some Tag' );
		$tag_data      = $this->automation_faker->tag_list_data( false );

		// Create a previous state of a tag list.
		$previous_tag_data = $tag_data;

		// Testing when the condition has been not been met because the tag list does not have said tag.
		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertFalse( $tag_condition->condition_met() );

		// Testing when the condition has been met.
		$tag_data = array(
			array(
				'id'          => 1,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Some Tag',
				'slug'        => 'some-tag',
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
		);

		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertTrue( $tag_condition->condition_met() );
	}

	/**
	 * @testdox Test tag list does not have ('not has') tag condition.
	 */
	public function test_tag_list_not_has_tag() {
		$tag_condition = $this->get_tag_condition( 'not_has_tag', 'Some Tag' );
		$tag_data      = $this->automation_faker->tag_list_data( false );

		// Create a previous state of a tag list.
		$previous_tag_data = $tag_data;

		// Testing when the condition has been met because the tag list does not have said tag.
		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertTrue( $tag_condition->condition_met() );

		// Testing when the condition has not been met.
		$tag_data = array(
			array(
				'id'          => 1,
				'objtype'     => ZBS_TYPE_CONTACT,
				'name'        => 'Some Tag',
				'slug'        => 'some-tag',
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
		);

		$tag_condition->execute( $tag_data, $previous_tag_data );
		$this->assertFalse( $tag_condition->condition_met() );
	}
}
