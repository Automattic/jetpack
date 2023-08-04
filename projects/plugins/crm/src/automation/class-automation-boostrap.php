<?php
/**
 * Bootstrap the Jetpack CRM Automation engine.
 *
 * @package Automattic\Jetpack\CRM
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Bootstrap the Jetpack CRM Automation engine.
 *
 * @since $$next-version$$
 */
final class Automation_Boostrap {

	/**
	 * The automation engine we want to bootstrap.
	 *
	 * @since $$next-version$$
	 *
	 * @var Automation_Engine
	 */
	private $engine;

	/**
	 * Initialise the automation engine.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function init(): void {
		$this->engine = Automation_Engine::instance();

		$this->register_triggers();
		$this->register_conditions();
		$this->register_actions();
		$this->register_workflows();
	}

	/**
	 * Register triggers.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	protected function register_triggers(): void {
		$triggers = array(
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Created::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Status_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Before_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Email_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Status_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Created::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Status_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Updated::class,
		);

		/**
		 * Filter list of available triggers for automations.
		 *
		 * This can be used to add and/or remove triggers allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $triggers A list of triggers classes.
		 */
		$triggers = apply_filters( 'jpcrm_automation_triggers', $triggers );

		foreach ( $triggers as $trigger ) {
			try {
				$this->engine->register_trigger( $trigger );
			} catch ( \Exception $e ) {
				$this->engine->get_logger()->log( $e->getMessage() );
			}
		}
	}

	/**
	 * Register conditions.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	protected function register_conditions(): void {
		$conditions = array();

		/**
		 * Filter list of available conditions for automations.
		 *
		 * This can be used to add and/or remove condition allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $conditions A list of condition classes.
		 */
		$conditions = apply_filters( 'jpcrm_automation_conditions', $conditions );

		foreach ( $conditions as $condition ) {
			try {
				$this->engine->register_step( $condition::get_slug(), $condition );
			} catch ( \Exception $e ) {
				$this->engine->get_logger()->log( $e->getMessage() );
			}
		}
	}

	/**
	 * Register actions.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	protected function register_actions(): void {
		$actions = array(
			\Automattic\Jetpack\CRM\Automation\Actions\Add_Contact_Log::class,
			\Automattic\Jetpack\CRM\Automation\Actions\Add_Remove_Contact_Tag::class,
			\Automattic\Jetpack\CRM\Automation\Actions\Delete_Contact::class,
			\Automattic\Jetpack\CRM\Automation\Actions\New_Contact::class,
			\Automattic\Jetpack\CRM\Automation\Actions\Update_Contact::class,
			\Automattic\Jetpack\CRM\Automation\Actions\Update_Contact_Status::class,
		);

		/**
		 * Filter list of available actions for automations.
		 *
		 * This can be used to add and/or remove actions allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $actions A list of actions class names.
		 */
		$actions = apply_filters( 'jpcrm_automation_actions', $actions );

		foreach ( $actions as $action ) {
			try {
				$this->engine->register_step( $action::get_slug(), $action );
			} catch ( \Exception $e ) {
				$this->engine->get_logger()->log( $e->getMessage() );
			}
		}
	}

	/**
	 * Register workflows.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	protected function register_workflows(): void {
		/**
		 * Filter list of available workflows.
		 *
		 * This can be used to add and/or remove actions allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param Automation_Workflow[] $workflows A collection of registered workflows.
		 */
		$workflows = apply_filters( 'jpcrm_automation_workflows', array() );

		foreach ( $workflows as $workflow ) {
			if ( $workflow instanceof Automation_Workflow ) {
				try {
					$workflow->set_engine( $this->engine );
					$this->engine->add_workflow( $workflow, true );
				} catch ( \Exception $e ) {
					$this->engine->get_logger()->log( $e->getMessage() );
				}
			}
		}
	}

}
