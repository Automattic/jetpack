<?php
/**
 * Defines the Jetpack CRM Automation workflow base.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Workflow class.
 */
class Automation_Workflow {

	/** @var int|string */
	private $id;

	/** @var string */
	public $name;

	/** @var string */
	public $description;

	/** @var string */
	public $category;

	/** @var array */
	public $triggers;

	/** @var array */
	public $initial_step;

	/** @var bool */
	public $active;

	/** @var Automation_Engine */
	private $automation_engine;

	/** @var Automation_Logger */
	private $logger;

	/**
	 * Automation_Workflow constructor.
	 *
	 * @param array $workflow_data The workflow data to be constructed.
	 */
	public function __construct( array $workflow_data ) {
		$this->id           = $workflow_data['id'] ?? null;
		$this->triggers     = $workflow_data['triggers'] ?? array();
		$this->initial_step = $workflow_data['initial_step'] ?? array();
		$this->name         = $workflow_data['name'];
		$this->description  = $workflow_data['description'] ?? '';
		$this->category     = $workflow_data['category'] ?? '';
		$this->active       = $workflow_data['is_active'] ?? true;
	}

	/**
	 * Get the id of this workflow
	 *
	 * This will either be a string if the workflow is registered in the codebase,
	 * or an integer if it is a custom workflow stored in the database.
	 *
	 * @return int|string
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Set the triggers within the workflow given an array of triggers.
	 *
	 * @param array $triggers An array of triggers to be set.
	 */
	public function set_triggers( array $triggers ) {
		$this->triggers = $triggers;
	}

	/**
	 * Get the trigger names of this workflow
	 *
	 * @return array
	 */
	public function get_triggers(): array {
		return $this->triggers;
	}

	/**
	 * Instance the triggers of this workflow
	 * @throws Workflow_Exception Throws an exception if there is an issue initializing the trigger.
	 */
	public function init_triggers() {

		if ( ! $this->is_active() ) {
			return;
		}

		foreach ( $this->get_triggers() as $trigger_slug ) {
			try {
				$trigger_class = $this->get_engine()->get_trigger_class( $trigger_slug );

				/** @var Base_Trigger $trigger */
				$trigger = new $trigger_class();
				$trigger->init( $this );

			} catch ( Automation_Exception $e ) {
				throw new Workflow_Exception(
					/* Translators: %s is the error message to be included in the exception string. */
					sprintf( __( 'An error happened initializing the trigger. %s', 'zero-bs-crm' ), $e->getMessage() ),
					Workflow_Exception::ERROR_INITIALIZING_TRIGGER
				);
			}
		}
	}

	/**
	 * Set initial step of this workflow
	 * @param array $step_data The data for the step to be set as the initial step.
	 */
	public function set_initial_step( array $step_data ) {
		$this->initial_step = $step_data;
	}

	/**
	 * Get the workflow as an array
	 * @return array
	 */
	public function get_workflow_array() {

		$workflow = array(
			'name'         => $this->name,
			'description'  => $this->description,
			'category'     => $this->category,
			'is_active'    => $this->active,
			'triggers'     => $this->triggers,
			'initial_step' => $this->initial_step,
		);

		return $workflow;
	}

	/**
	 * Get the initial step of this workflow
	 *
	 * @return array
	 */
	public function get_initial_step(): array {
		return $this->initial_step;
	}

	/**
	 * Start the workflow execution once a trigger is activated
	 *
	 * @param Trigger $trigger An instance of the Trigger class.
	 * @param array   $data All relevant object data to be passed through the workflow.
	 * @return bool
	 * @throws Automation_Exception Throws an exception if the step class does not exist, or there is an error executing the workflow.
	 */
	public function execute( Trigger $trigger, array $data ): bool {
		$this->get_logger()->log( 'Trigger activated: ' . $trigger->get_slug() );
		$this->get_logger()->log( 'Executing workflow: ' . $this->name );

		$step_data = $this->initial_step;

		while ( $step_data ) {
			try {
				$step_slug = $step_data['slug'];

				$step_class = $step_data['class_name'] ?? $this->get_engine()->get_step_class( $step_slug );

				if ( ! class_exists( $step_class ) ) {
					throw new Automation_Exception(
						/* Translators: %s is the name of the step class that does not exist. */
						sprintf( __( 'The step class %s does not exist.', 'zero-bs-crm' ), $step_class ),
						Automation_Exception::STEP_CLASS_NOT_FOUND
					);
				}

				/** @var Step $step */
				$step = new $step_class( $step_data );

				if ( isset( $step_data['attributes'] ) && is_array( $step_data['attributes'] ) ) {
					$step->set_attributes( $step_data['attributes'] );
				}

				$this->get_logger()->log( '[' . $step->get_slug() . '] Executing step. Type: ' . $step->get_type() );

				$step->execute( $data );
				$step_data = $step->get_next_step();

				$this->get_logger()->log( '[' . $step->get_slug() . '] Step executed!' );

				if ( ! $step_data ) {
					$this->get_logger()->log( 'Workflow execution finished: No more steps found.' );
					return true;
				}
			} catch ( Automation_Exception $automation_exception ) {

				$this->get_logger()->log( 'Error executing the workflow on step: ' . $step_slug . ' - ' . $automation_exception->getMessage() );

				throw $automation_exception;
			}
		}

		return false;
	}

	/**
	 * Get the step classname based on the step type
	 * @param array $step_data The step data with which to check the step type.
	 * @return string
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	private function get_step_class( array $step_data ): string {
		$step_type = $step_data['type'];

		return $this->get_engine()->get_step_class( $step_type );
	}

	/**
	 * Turn on the workflow
	 */
	public function turn_on() {
		$this->active = true;
	}

	/**
	 * Turn off the workflow
	 */
	public function turn_off() {
		$this->active = false;
	}

	/**
	 * Check if the workflow is active
	 * @return bool
	 */
	public function is_active(): bool {
		return $this->active;
	}

	/**
	 * Add a trigger to this workflow
	 * @param string $string The name of the trigger to add.
	 */
	public function add_trigger( string $string ) {
		$this->triggers[] = $string;
	}

	/**
	 * Set the automation engine.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Engine $engine An instance of the Automation_Engine class.
	 * @return void
	 */
	public function set_engine( Automation_Engine $engine ): void {
		$this->automation_engine = $engine;
	}

	/**
	 * Get the automation engine.
	 *
	 * @since $$next-version$$
	 *
	 * @return Automation_Engine Return an instance of the Automation_Engine class.
	 *
	 * @throws Workflow_Exception Throws an exception if there is no engine instance.
	 */
	protected function get_engine(): Automation_Engine {
		if ( ! $this->automation_engine instanceof Automation_Engine ) {
			throw new Workflow_Exception(
				/* Translators: %s The ID of the workflow. */
				sprintf( '[%s] Cannot run workflow logic without an engine instance', $this->get_id() ),
				Workflow_Exception::MISSING_ENGINE_INSTANCE
			);
		}

		return $this->automation_engine;
	}

	/**
	 * Set Logger.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Logger $logger An instance of the Automation_Logger class.
	 * @return void
	 */
	public function set_logger( Automation_Logger $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Get Logger.
	 *
	 * @since $$next-version$$
	 *
	 * @return Automation_Logger Return an instance of the Automation_Logger class.
	 */
	public function get_logger(): Automation_Logger {
		return $this->logger ?? Automation_Logger::instance();
	}

}
