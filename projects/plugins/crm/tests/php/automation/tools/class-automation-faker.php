<?php

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Condition;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Dummy_Step;
use Automattic\Jetpack\CRM\Entities\Company;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Company_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Invoice_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Quote_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Task_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Transaction_Factory;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Entities\Quote;
use Automattic\Jetpack\CRM\Entities\Tag;
use Automattic\Jetpack\CRM\Entities\Task;
use Automattic\Jetpack\CRM\Entities\Transaction;

require_once __DIR__ . '/class-event-emitter.php';

class Automation_Faker {

	private static $instance;

	public static function instance(): Automation_Faker {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Automation_Faker constructor.
	 */
	public function __construct() {
		$this->load_mocks();
	}

	public function reset_all() {

		// Reset the event emitter
		Event_Emitter::instance()->reset();
		// Reset the Automation_Logger
		Automation_Logger::instance( true );
		// Reset the Automation_Engine
		Automation_Engine::instance( true );

		// Remove all WP actions, starting by jpcrm_.
		global $wp_filter;
		foreach ( $wp_filter as $tag => $actions ) {
			if ( str_starts_with( $tag, 'jpcrm_' ) ) {
				remove_all_actions( $tag );
			}
		}
	}

	/**
	 * Return a basic workflow
	 * @return array
	 */
	public function basic_workflow(): array {
		return array(
			'name'         => 'Workflow Test: basic_workflow',
			'description'  => 'Test: the description of the workflow',
			'category'     => 'Test',
			'active'       => true,
			'triggers'     => array(
				Contact_Created_Trigger::get_slug(),
			),
			'initial_step' => 0,
			'steps'        => array(
				// Step 0
				0 => array(
					'slug'           => 'send_email_action',
					'attributes'     => array(
						'to'       => 'admin@example.com',
						'template' => 'send_welcome_email',
					),
					'next_step_true' => null,
				),
			),
		);
	}

	/**
	 * Return a basic workflow with a trigger and without initial step
	 * @return array
	 */
	public function workflow_without_initial_step(): array {
		return array(
			'name'        => 'Workflow Test: without_initial_step',
			'description' => 'Test: the description of the workflow',
			'category'    => 'Test',
			'active'      => true,
			'triggers'    => array(
				Contact_Created_Trigger::get_slug(),
			),
		);
	}

	/**
	 * Return a basic workflow with a customizable trigger and without initial step
	 *
	 * @param string $trigger_name The name of the trigger to be included in the workflow.
	 *
	 * @return array
	 */
	public function workflow_without_initial_step_customize_trigger( $trigger_name ): array {
		return array(
			'name'        => 'Workflow Test: without_initial_step_customize_trigger',
			'description' => 'Test: the description of the workflow',
			'category'    => 'Test',
			'active'      => true,
			'triggers'    => array(
				$trigger_name,
			),
		);
	}

	/**
	 * Return dummy contact triggers name list
	 * @return array
	 */
	public function contact_triggers(): array {
		return array(
			'jpcrm/contact_created',
			'jpcrm/contact_updated',
			'jpcrm/contact_deleted',
		);
	}

	/**
	 * Return dummy quote triggers name list
	 * @return array
	 */
	public function quote_triggers(): array {
		return array(
			'jpcrm/quote_created',
			'jpcrm/quote_accepted',
			'jpcrm/quote_updated',
			'jpcrm/quote_status_updated',
			'jpcrm/quote_deleted',
		);
	}

	/**
	 * Return dummy invoice triggers name list
	 * @return array
	 */
	public function invoice_triggers(): array {
		return array(
			'invoice_created',
			'invoice_updated',
			'invoice_deleted',
		);
	}

	/**
	 * Return dummy task triggers name list
	 *
	 * @return array
	 */
	public function task_triggers(): array {
		return array(
			'jpcrm/task_created',
			'jpcrm/task_deleted',
			'jpcrm/task_updated',
		);
	}

	/**
	 * Return dummy transaction triggers name list
	 *
	 * @return array
	 */
	public function transaction_triggers(): array {
		return array(
			'jpcrm/transaction_created',
			'jpcrm/transaction_updated',
		);
	}

	/**
	 * Return a workflow with a condition and an action
	 * @return array
	 */
	public function workflow_with_condition_action(): array {
		return array(
			'name'         => 'Workflow Test: with_condition_action',
			'description'  => 'Test: the description of the workflow',
			'category'     => 'Test',
			'active'       => true,
			'triggers'     => array(
				Contact_Created_Trigger::get_slug(),
			),
			'initial_step' => 0,
			'steps'        => array(
				// Step 0
				0 => array(
					'slug'            => Contact_Condition::get_slug(),
					'next_step_true'  => 1,
					'next_step_false' => null,
					'attributes'      => array(
						'field'    => 'status',
						'operator' => 'is',
						'value'    => 'lead',
					),
				),
				// Step 1
				1 => array(
					'slug'            => Dummy_Step::get_slug(),
					'next_step_true'  => null,
					'next_step_false' => null,
					'attributes'      => array(),
				),
			),
		);
	}

	/**
	 * Return a workflow with a condition and an action
	 * @return array
	 */
	public function workflow_with_condition_customizable_trigger_action( $trigger_slug, $action_data ): array {
		return array(
			'name'         => 'Workflow Test: with_condition_customizable_trigger_action',
			'description'  => 'Test: the description of the workflow',
			'category'     => 'Test',
			'active'       => true,
			'triggers'     => array(
				$trigger_slug,
			),
			'initial_step' => 0,
			'steps'        => array(
				// Step 0
				0 => array(
					'slug'            => Contact_Field_Changed::get_slug(),
					'attributes'      => array(
						'field'    => 'status',
						'operator' => 'is',
						'value'    => 'Lead',
					),
					'next_step_true'  => 1,
					'next_step_false' => null,
				),
				// Step 1
				1 => $action_data,
			),
		);
	}

	/**
	 * Load all mock classes present in the mocks folder
	 *
	 * @return void
	 */
	private function load_mocks() {

		$mocks_dir = __DIR__ . '/../mocks/';
		$mocks     = scandir( $mocks_dir );

		foreach ( $mocks as $mock ) {
			if ( str_starts_with( $mock, 'mock-class-' ) ) {
				require_once $mocks_dir . $mock;
			}
		}
	}

	/**
	 * Return a dummy Contact.
	 *
	 * @return Contact A Contact object.
	 */
	public function contact(): Contact {
		$data = array(
			'id'               => 1,
			'owner'            => '-1',
			'status'           => 'lead',
			'fname'            => 'John',
			'lname'            => 'Doe',
			'email'            => 'johndoe@example.com',
			'prefix'           => 'Mr',
			'addr1'            => 'My Street 1',
			'addr2'            => '',
			'city'             => 'San Francisco',
			'county'           => 'CA',
			'postcode'         => '94110',
			'country'          => 'US',
			'secaddr_addr1'    => '',
			'secaddr_addr2'    => '',
			'secaddr_city'     => '',
			'secaddr_county'   => '',
			'secaddr_country'  => '',
			'secaddr_postcode' => '',
			'hometel'          => '',
			'worktel'          => '',
			'mobtel'           => '(877) 273-3049',
			'wpid'             => '',
			'avatar'           => '',
			'tw'               => '',
			'li'               => '',
			'fb'               => '',
			'created'          => '1691193339',
			'lastupdated'      => '1691193339',
			'lastcontacted'    => '',
			'lastlog'          => '',
			'lastcontactlog'   => '',
			'tags'             => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Contact_Factory::create( $data );
	}

	/**
	 * Return a dummy Invoice.
	 *
	 * @return Invoice A Invoice object.
	 */
	public function invoice(): Invoice {
		$data = array(
			'id'          => 1,
			'id_override' => '1',
			'parent'      => '',
			'status'      => 'Unpaid',
			'due_date'    => 1690840800,
			'hash'        => 'ISSQndSUjlhJ8feWj2v',
			'lineitems'   => array(
				array(
					'net'      => 3.75,
					'desc'     => 'Dummy product',
					'quantity' => '3',
					'price'    => '1.25',
					'total'    => 3.75,
				),
				'contacts' => array( 1 ),
				'created'  => -1,
				'tags'     => array(
					array(
						'id'          => 1,
						'objtype'     => 1,
						'name'        => 'Name 1',
						'slug'        => 'name-1',
						'created'     => 1692663411,
						'lastupdated' => 1692663411,
					),
					array(
						'id'          => 2,
						'objtype'     => 1,
						'name'        => 'Name 2',
						'slug'        => 'name-2',
						'created'     => 1692663412,
						'lastupdated' => 1692663412,
					),
				),
			),
		);

		return Invoice_Factory::create( $data );
	}

	/**
	 * Return a dummy Quote.
	 *
	 * @return Quote A Quote object.
	 */
	public function quote(): Quote {
		$data = array(
			'id'          => 1,
			'id_override' => '1',
			'title'       => 'Quote title',
			'hash'        => 'V8jAlsi0#$ksm0Plsxp',
			'value'       => 150.00,
			'currency'    => 'USD',
			'template'    => 1676923766,
			'accepted'    => 1676923766,
			'created'     => 1676000000,
			'tags'        => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Quote_Factory::create( $data );
	}

	/**
	 * Return a Company.
	 *
	 * @return Company A Company object.
	 */
	public function company(): Company {
		$data = array(
			'id'     => 1,
			'name'   => 'Dummy Company',
			'email'  => 'johndoe@dummycompany.com',
			'addr1'  => 'Address 1',
			'status' => 'lead',
			'tags'   => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Company_Factory::create( $data );
	}

	/**
	 * Return dummy Task.
	 *
	 * @return Task A Task object.
	 */
	public function task(): Task {
		$data = array(
			'id'             => 1,
			'title'          => 'Some task title',
			'desc'           => 'Some desc',
			'hash'           => 'V8jAlsi0#$ksm0Plsxp',
			'start'          => 1676000000,
			'end'            => 1676923766,
			'complete'       => false,
			'show_in_portal' => true,
			'show_in_cal'    => true,
			'created'        => 1675000000,
			'lastupdated'    => 1675000000,
			'tags'           => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Task_Factory::create( $data );
	}

	/**
	 * Return a dummy Transaction.
	 *
	 * @return Transaction A Transaction object.
	 */
	public function transaction(): Transaction {
		$data = array(
			'id'             => 1,
			'title'          => 'Some transaction title',
			'desc'           => 'Some desc',
			'hash'           => 'mASOpAnf334Pncl1px4',
			'status'         => 'Completed',
			'type'           => 'Sale',
			'ref'            => '123456',
			'currency'       => 'USD',
			'total'          => '150.00',
			'tax'            => '10.00',
			'lineitems'      => array(),
			'date'           => 1676000000,
			'date_completed' => 1676923766,
			'created'        => 1675000000,
			'lastupdated'    => 1675000000,
			'tags'           => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Transaction_Factory::create( $data );
	}

	/**
	 * Return data for a dummy tag.
	 *
	 * @return Tag A sample Tag instance.
	 */
	public function tag(): Tag {
		$tag_data = array(
			'id'          => 1,
			'name'        => 'Some tag name',
			'slug'        => 'tag_slug',
			'objtype'     => 'Contact',
			'created'     => 1675000000,
			'lastupdated' => 1675000000,
		);

		// @todo: Use the factory when it is ready: return Tag_Factory::create( $tag );
		$tag = new Tag();
		foreach ( $tag_data as $key => $value ) {
			$tag->$key = $value;
		}

		return $tag;
	}

	/**
	 * Return data for a dummy tag.
	 *
	 * @param array|null $additional_array An array with additional data to be added to the tag list.
	 *
	 * @return array
	 * @throws Data_Type_Exception
	 */
	public function tag_list( array $additional_array = null ) {
		$data = array(
			array(
				'id'          => 1,
				'objtype'     => 1,
				'name'        => 'Name 1',
				'slug'        => 'name-1',
				'created'     => 1692663411,
				'lastupdated' => 1692663411,
			),
			array(
				'id'          => 2,
				'objtype'     => 1,
				'name'        => 'Name 2',
				'slug'        => 'name-2',
				'created'     => 1692663412,
				'lastupdated' => 1692663412,
			),
		);
		if ( $additional_array !== null ) {
			$data[] = $additional_array;
		}

		return $data;
	}

	/**
	 * Return a empty workflow, without triggers and initial step
	 *
	 * @return array
	 */
	public function empty_workflow(): array {
		return array(
			'name' => 'Empty workflow Test',
		);
	}
}
