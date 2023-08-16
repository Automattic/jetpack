<?php

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Company;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Event;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Invoice;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Quote;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Transaction;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Condition;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/class-event-emitter.php';

class Automation_Faker {

	private static $instance;

	public static function instance( BaseTestCase $base_test_case ): Automation_Faker {
		if ( ! self::$instance ) {
			self::$instance = new self( $base_test_case );
		}

		return self::$instance;
	}

	/**
	 * An instance of test base case.
	 *
	 * This can be used to mock classes and methods.
	 *
	 * @var BaseTestCase
	 */
	protected $test_base_case;

	/**
	 * Automation_Faker constructor.
	 *
	 * @param BaseTestCase $test_base_case
	 */
	public function __construct( BaseTestCase $test_base_case ) {
		$this->test_base_case = $test_base_case;
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
			if ( 0 === strpos( $tag, 'jpcrm_' ) ) {
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
			'is_active'    => true,
			'triggers'     => array(
				'jpcrm/contact_created',
			),
			'initial_step' => array(
				'slug'       => 'send_email_action',
				'attributes' => array(
					'to'       => 'admin@example.com',
					'template' => 'send_welcome_email',
				),
				'next_step'  => null,
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
			'is_active'   => true,
			'triggers'    => array(
				'jpcrm/contact_created',
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
			'is_active'   => true,
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
	 * Return dummy event triggers name list
	 *
	 * @return array
	 */
	public function event_triggers(): array {
		return array(
			'jpcrm/event_created',
			'jpcrm/event_deleted',
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
			'is_active'    => true,
			'triggers'     => array(
				'jpcrm/contact_created',
			),
			'initial_step' => array(
				'slug'            => 'contact_status_condition',
				'class_name'      => Contact_Condition::class,
				'attributes'      => array(
					'field'    => 'status',
					'operator' => 'is',
					'value'    => 'lead',
				),
				'next_step_true'  => array(
					'slug' => 'dummy_step',
				),
				'next_step_false' => null,
			),
		);
	}

	/**
	 * Return a workflow with a condition and an action
	 * @return array
	 */
	public function workflow_with_condition_customizable_trigger_action( $trigger_name, $action_data ): array {
		return array(
			'name'         => 'Workflow Test: with_condition_customizable_trigger_action',
			'description'  => 'Test: the description of the workflow',
			'category'     => 'Test',
			'is_active'    => true,
			'triggers'     => array(
				$trigger_name,
			),
			'initial_step' => array(
				'slug'            => 'contact_status_condition',
				'class_name'      => Contact_Condition::class,
				'attributes'      => array(
					'field'    => 'status',
					'operator' => 'is',
					'value'    => 'lead',
				),
				'next_step_true'  => $action_data,
				'next_step_false' => null,
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
			if ( strpos( $mock, 'mock-class-' ) === 0 ) {
				require_once $mocks_dir . $mock;
			}
		}
	}

	/**
	 * Return data for a dummy contact.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Contact object.
	 * @return array|Data_Type_Contact
	 */
	public function contact_data( $get_as_data_type = false ) {
		$data = array(
			'id'           => 1,
			'customerMeta' => array(
				'zbs_owner'          => '-1',
				'zbsc_status'        => 'lead',
				'zbsc_fname'         => 'John',
				'zbsc_lname'         => 'Doe',
				'zbsc_email'         => 'johndoe@example.com',
				'zbsc_prefix'        => 'Mr',
				'zbsc_addr1'         => 'My Street 1',
				'zbsc_addr2'         => '',
				'zbsc_city'          => 'San Francisco',
				'zbsc_county'        => 'CA',
				'zbsc_postcode'      => '94110',
				'zbsc_country'       => 'US',
				'zbsc_secaddr1'      => '',
				'zbsc_secaddr2'      => '',
				'zbsc_seccity'       => '',
				'zbsc_seccounty'     => '',
				'zbsc_seccountry'    => '',
				'zbsc_secpostcode'   => '',
				'zbsc_hometel'       => '',
				'zbsc_worktel'       => '',
				'zbsc_mobtel'        => '(877) 273-3049',
				'zbsc_wpid'          => '',
				'zbsc_avatar'        => '',
				'zbsc_tw'            => '',
				'zbsc_li'            => '',
				'zbsc_fb'            => '',
				'zbsc_created'       => '1691193339',
				'zbsc_lastupdated'   => '1691193339',
				'zbsc_lastcontacted' => '',
				'lastlog'            => '',
				'lastcontactlog'     => '',
			),
		);

		// We have to mock settings to be able to format contacts due to global dependencies.
		// Specifically: zbsDAL_contacts::tidy_contact() needs "showprefix" when formatting the full name.
		jpcrm_mock_settings( $this->test_base_case, array( array( 'showprefix', false, false ) ) );

		if ( $get_as_data_type ) {
			return new Data_Type_Contact( $data );
		}

		return $data;
	}

	/**
	 * Return data for a dummy invoice.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Invoice object.
	 * @return array|Data_Type_Invoice
	 */
	public function invoice_data( $get_as_data_type = false ) {
		$data = array(
			'id'   => 1,
			'data' => array(
				'id_override' => '1',
				'parent'      => '',
				'status'      => 'Unpaid',
				'hash'        => 'ISSQndSUjlhJ8feWj2v',
				'lineitems'   => array(
					array(
						'net'      => 3.75,
						'desc'     => 'Dummy product',
						'quantity' => '3',
						'price'    => '1.25',
						'total'    => 3.75,
					),
				),
				'contacts'    => array( 1 ),
				'created'     => -1,
			),
		);

		if ( $get_as_data_type ) {
			return new Data_Type_Invoice( $data );
		}

		return $data;
	}

	/**
	 * Return data for a dummy quote.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Quote object.
	 * @return array|Data_Type_Quote
	 */
	public function quote_data( $get_as_data_type = false ) {
		$data = array(
			'id'   => 1,
			'data' => array(
				'id_override' => '1',
				'title'       => '',
				'hash'        => 'V8jAlsi0#$ksm0Plsxp',
				'accepted'    => 1676923766,
				'created'     => 1676000000,
			),
		);

		if ( $get_as_data_type ) {
			return new Data_Type_Quote( $data );
		}

		return $data;
	}

	/**
	 * Return data for a dummy company.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Company object.
	 * @return array|Data_Type_Company
	 */
	public function company_data( $get_as_data_type = false ) {
		$data = array(
			'id'     => 1,
			'name'   => 'Dummy Company',
			'email'  => 'johndoe@dummycompany.com',
			'status' => 'lead',
		);

		if ( $get_as_data_type ) {
			return new Data_Type_Company( $data );
		}

		return $data;
	}

	/**
	 * Return data for a dummy event.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Event object.
	 * @return array
	 */
	public function event_data( $get_as_data_type = false ) {
		$data = array(
			'id'   => 1,
			'data' => array(
				'title'          => 'Some event title',
				'desc'           => 'Some desc',
				'hash'           => 'V8jAlsi0#$ksm0Plsxp',
				'start'          => 1676000000,
				'end'            => 1676923766,
				'complete'       => false,
				'show_on_portal' => true,
				'show_on_cal'    => true,
				'created'        => 1675000000,
				'lastupdated'    => 1675000000,
			),
		);

		if ( $get_as_data_type ) {
			return new Data_Type_Event( $data );
		}

		return $data;
	}

	/**
	 * Return data for a dummy transaction.
	 *
	 * @param bool $get_as_data_type If true, return the data as a Data_Type_Transaction object.
	 * @return array
	 */
	public function transaction_data( $get_as_data_type = false ) {
		$data = array(
			'id'   => 1,
			'data' => array(
				'title'          => 'Some transaction title',
				'desc'           => 'Some desc',
				'hash'           => 'mASOpAnf334Pncl1px4',
				'status'         => 'Completed',
				'type'           => 'Sale',
				'date'           => 1676000000,
				'date_completed' => 1676923766,
				'created'        => 1675000000,
				'lastupdated'    => 1675000000,
			),
		);

		if ( $get_as_data_type ) {
			return new Data_Type_Transaction( $data );
		}

		return $data;
	}

	/**
	 * Returns the data for a dummy contact transitional status.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $old_status The value of the old status.
	 * @return array An array containing a dummy contact and the value of the old status that was passed as a parameter.
	 */
	public function contact_transitional_status_data( $old_status ) {
		return array(
			'contact'          => $this->contact_data(),
			'old_status_value' => $old_status,
		);
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
