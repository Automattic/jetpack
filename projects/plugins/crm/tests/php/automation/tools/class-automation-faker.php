<?php

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Condition;

require_once __DIR__ . '/class-event-emitter.php';

class Automation_Faker {

	private static $instance;

	public static function instance(): Automation_Faker {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->load_mocks();
		}

		return self::$instance;
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
			'jpcrm/quote_new',
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
					'slug' => 'dummy_action',
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

	public function contact_data() {
		return array(
			'id'   => 1,
			'data' => array(
				'status' => 'lead',
				'name'   => 'John Doe',
				'email'  => 'johndoe@example.com',
			),
		);
	}

	public function invoice_data() {
		return array(
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
	}

	/**
	 * Return data for a dummy quote
	 * @return array
	 */
	public function quote_data() {
		return array(
			'id'   => 1,
			'data' => array(
				'id_override' => '1',
				'title'       => '',
				'hash'        => 'V8jAlsi0#$ksm0Plsxp',
				'accepted'    => 1676923766,
				'created'     => 1676000000,
			),
		);
	}

	/**
	 * Return data for a dummy company
	 * @return array
	 */
	public function company_data() {
		return array(
			'id'     => 1,
			'name'   => 'Dummy Company',
			'email'  => 'johndoe@dummycompany.com',
			'status' => 'lead',
		);
	}

	/**
	 * Return a empty workflow, without triggers and initial step
	 * @return array
	 */
	public function empty_workflow(): array {
		return array(
			'name' => 'Empty workflow Test',
		);
	}
}
