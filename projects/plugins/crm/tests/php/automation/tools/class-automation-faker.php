<?php

namespace Automattic\Jetpack\CRM\Automation\Tests;

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

	/**
	 * Return a basic recipe
	 * @return array
	 */
	public function basic_recipe(): array {
		return array(
			'name'         => 'Recipe Test',
			'description'  => 'Test: the description of the recipe',
			'category'     => 'Test',
			'is_active'    => true,
			'triggers'     => array(
				'contact_created',
			),
			'initial_step' => array(
				'type'        => 'action',
				'name'        => 'send_email_action',
				'title'       => 'Send welcome email',
				'description' => 'Send welcome email to new contact',
				'attributes'  => array(
					'to'       => 'admin@example.com',
					'template' => 'send_welcome_email',
				),
				'next_step'   => null,
			),
		);
	}

	/**
	 * Return a basic recipe with a trigger and without initial step
	 * @return array
	 */
	public function recipe_without_initial_step(): array {
		return array(
			'name'         => 'Recipe Test',
			'description'  => 'Test: the description of the recipe',
			'category'     => 'Test',
			'is_active'    => true,
			'triggers'     => array(
				'contact_created',
			),
			'initial_step' => null,
		);
	}

	/**
	 * Return dummy contact triggers name list
	 * @return array
	 */
	public function contact_triggers(): array {
		return array(
			'contact_created',
			'contact_updated',
			'contact_deleted',
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
	 * Return a recipe with a condition and an action
	 * @return array
	 */
	public function recipe_with_condition_action(): array {
		return array(
			'name'         => 'Recipe Test',
			'description'  => 'Test: the description of the recipe',
			'category'     => 'Test',
			'is_active'    => true,
			'triggers'     => array(
				'contact_created',
			),
			'initial_step' => array(
				'type'        => 'condition',
				'name'        => 'contact_status_is',
				'title'       => 'Check the contact status',
				'description' => 'Check if the contact has a specific status',
				'data'        => array(
					'field' => 'status',
					'is'    => array( 'customer' ),
				),
				'next_step'   => array(
					'type'        => 'action',
					'name'        => 'send_welcome_email',
					'title'       => 'Send welcome email',
					'description' => 'Send welcome email to new contact',
					'data'        => array(
						'from'     => 'hello@example.com',
						'template' => 'welcome_email',
					),
					'next_step'   => null,
				),
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
			'id'    => 1,
			'name'  => 'John Doe',
			'email' => 'johndoe@example.com',
		);
	}

	/**
	 * Return a empty recipe, without triggers and initial step
	 * @return array
	 */
	public function empty_recipe(): array {
		return array(
			'name'         => 'Empty recipe Test',
			'description'  => 'Test: the description of the empty recipe, without triggers and initial step',
			'category'     => 'Test',
			'triggers'     => array(),
			'initial_step' => null,
		);
	}
}
