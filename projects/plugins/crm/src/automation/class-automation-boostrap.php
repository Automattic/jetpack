<?php
/**
 * Bootstrap the Jetpack CRM Automation engine.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Bootstrap the Jetpack CRM Automation engine
 *
 * @package Automattic\Jetpack\CRM\Automation
 */
final class Automation_Boostrap {

	/** @var Automation_Engine */
	private $engine;

	/**
	 * Initialise the automation engine.
	 *
	 * @return void
	 */
	public function init() {
		$this->engine = Automation_Engine::instance();

		$this->register_data_types();
		$this->register_data_transformers();
		$this->register_triggers();
		$this->register_conditions();
		$this->register_actions();
		$this->register_workflows();
	}

	/**
	 * Register data types.
	 *
	 * @return void
	 */
	protected function register_data_types() {
		$data_types = array(
			\Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact::class,
			\Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Invoice::class,
		);

		/**
		 * Filter list of available data types for automations.
		 *
		 * This can be used to add and/or remove data types allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $var A list of data type classes.
		 */
		$data_types = apply_filters( 'jpcrm_automation_data_types', $data_types );

		foreach ( $data_types as $data_type ) {
			try {
				$this->engine->register_data_type( $data_type );
			} catch ( \Exception $e ) {
				$this->engine->get_logger()->log( $e->getMessage() );
			}
		}
	}

	/**
	 * Register data transformers.
	 *
	 * @return void
	 */
	protected function register_data_transformers() {
		$data_transformers = array(
			\Automattic\Jetpack\CRM\Automation\Data_Transformers\Data_Transformer_Invoice_To_Contact::class,
		);

		/**
		 * Filter list of available data transformers for automation steps.
		 *
		 * This can be used to add and/or remove data transformers allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $var A list of data transformer classes.
		 */
		$data_transformers = apply_filters( 'jpcrm_automation_data_types', $data_transformers );

		foreach ( $data_transformers as $data_transformer ) {
			try {
				$this->engine->register_data_transformer( $data_transformer );
			} catch ( \Exception $e ) {
				$this->engine->get_logger()->log( $e->getMessage() );
			}
		}
	}

	/**
	 * Register triggers.
	 *
	 * @return void
	 */
	protected function register_triggers() {
		$triggers = array(
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_New::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Status_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Company_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Before_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Email_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_New::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Status_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Deleted::class,
			\Automattic\Jetpack\CRM\Automation\Triggers\Invoice_New::class,
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
		 * @param string[] $var A list of trigger classes.
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
	 * Register conditions
	 *
	 * @return void
	 */
	protected function register_conditions() {
		$conditions = array();

		/**
		 * Filter list of available conditions for automations.
		 *
		 * This can be used to add and/or remove condition allowed in automations.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $var A list of condition classes.
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
	 * @return void
	 */
	protected function register_actions() {
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
		 * This can be used to add and/or remove actions allowed in CRM.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $var A list of actions class names.
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
	 * @return void
	 */
	protected function register_workflows() {
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
