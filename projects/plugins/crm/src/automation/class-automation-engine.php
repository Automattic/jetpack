<?php
/**
 * Defines Jetpack CRM Automation engine.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Transformers\Data_Transformer_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

/**
 * Automation Engine
 *
 * @package Automattic\Jetpack\CRM\Automation
 */
class Automation_Engine {

	/** @var Automation_Engine Instance singleton */
	private static $instance = null;

	/** @var array triggers map name => classname */
	private $triggers_map = array();

	/** @var array steps map name => classname */
	private $steps_map = array();

	/** @var ?Automation_Logger Automation logger */
	private $automation_logger;

	/** @var array */
	private $workflows = array();

	/**
	 * @var array An array of supported data types.
	 */
	private $data_types = array();

	/**
	 * @var array An array of supported data transformers.
	 */
	private $data_transformers = array();

	/**
	 * @var array[] An array of data type that represents support between types.
	 */
	public $data_transform_map = array();

	/**
	 *  Instance singleton object
	 *
	 * @param bool $force Whether to force a new Automation_Engine instance.
	 * @return Automation_Engine
	 */
	public static function instance( bool $force = false ): Automation_Engine {
		if ( ! self::$instance || $force ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Set the automation logger
	 *
	 * @param Automation_Logger $logger The automation logger.
	 */
	public function set_automation_logger( Automation_Logger $logger ) {
		$this->automation_logger = $logger;
	}

	/**
	 * Register data type
	 *
	 * @param string $class_name The fully qualified class name for the data type.
	 * @return void
	 *
	 * @throws Data_Type_Exception Throws an exception if the data type class do not look valid.
	 */
	public function register_data_type( string $class_name ): void {
		if ( ! class_exists( $class_name ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Data Type class do not exist: %s', $class_name ),
				Data_Type_Exception::CLASS_NOT_FOUND
			);
		}

		// Make sure that the class implements the Data_Type base class,
		// so we're certain that required logic exists to use the object.
		if ( ! is_subclass_of( $class_name, Data_Type_Base::class ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Data Type class do not extend base class: %s', $class_name ),
				Data_Type_Exception::DO_NOT_EXTEND_BASE
			);
		}

		if ( isset( $this->data_types[ $class_name::get_slug() ] ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Data Type slug already exist: %s', $class_name ),
				Data_Type_Exception::SLUG_EXISTS
			);
		}

		$this->data_types[ $class_name::get_slug() ] = $class_name;
	}

	/**
	 * Get data type instance
	 *
	 * This method will convert trigger/step raw data to a Data_type instance
	 * and return the instance.
	 * We need this to ensure the data looks valid and to ensure we have expected
	 * methods to work with as an adapter to the entity.
	 *
	 * @param string $data_type_slug The slug of the data type to be instantiated.
	 * @param mixed  $entity The entity data to be used to instantiate the data type.
	 * @return Data_Type_Base Returns an instance of the data type.
	 *
	 * @throws Data_Type_Exception Throws an exception if the data type slug does not exist.
	 */
	public function get_data_type_instance( string $data_type_slug, $entity ): Data_Type_Base {
		if ( ! isset( $this->data_types[ $data_type_slug ] ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Data Type slug do not exist: %s', $data_type_slug ),
				Data_Type_Exception::SLUG_DO_NOT_EXIST
			);
		}

		return new $this->data_types[ $data_type_slug ]( $entity );
	}

	/**
	 * Register data transformer
	 *
	 * @param string $class_name The fully qualified class name for the data transformer.
	 * @return void
	 *
	 * @throws Data_Transformer_Exception Throws an exception if the data transformer class do not look valid.
	 */
	public function register_data_transformer( string $class_name ): void {
		if ( ! class_exists( $class_name ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Data Transformer class do not exist: %s', $class_name ),
				Data_Transformer_Exception::CLASS_NOT_FOUND
			);
		}

		// Make sure that the class implements the Data_Transformer base class,
		// so we're certain that required logic exists to use the object.
		if ( ! is_subclass_of( $class_name, Data_Transformer_Base::class ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Data Transformer class do not extend base class: %s', $class_name ),
				Data_Transformer_Exception::DO_NOT_EXTEND_BASE
			);
		}

		if ( isset( $this->data_transformers[ $class_name::get_slug() ] ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Data Transformer slug already exist: %s', $class_name ),
				Data_Transformer_Exception::SLUG_EXISTS
			);
		}

		$this->data_transformers[ $class_name::get_slug() ] = $class_name;

		if ( ! isset( $this->data_transform_map[ $class_name::get_from() ] ) ) {
			$this->data_transform_map[ $class_name::get_from() ] = array();
		}

		$this->data_transform_map[ $class_name::get_from() ][ $class_name::get_to() ] = $class_name;
	}

	/**
	 * Register a trigger
	 *
	 * @param string $trigger_classname Trigger classname to add to the mapping.
	 * @throws Automation_Exception Throws an exception if the trigger class does not match the expected conditions.
	 */
	public function register_trigger( string $trigger_classname ) {

		if ( ! class_exists( $trigger_classname ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the trigger class that does not exist. */
				sprintf( __( 'Trigger class %s does not exist', 'zero-bs-crm' ), $trigger_classname ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}

		// Check if the trigger implements the interface
		if ( ! in_array( Trigger::class, class_implements( $trigger_classname ), true ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the trigger class that does not implement the Trigger interface. */
				sprintf( __( 'Trigger class %s does not implement the Trigger interface', 'zero-bs-crm' ), $trigger_classname ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}

		// Check if the trigger has proper slug
		$trigger_slug = $trigger_classname::get_slug();

		if ( empty( $trigger_slug ) ) {
			throw new Automation_Exception(
				__( 'The trigger must have a non-empty slug', 'zero-bs-crm' ),
				Automation_Exception::TRIGGER_SLUG_EMPTY
			);
		}

		if ( array_key_exists( $trigger_slug, $this->triggers_map ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the trigger slug that already exists. */
				sprintf( __( 'Trigger slug already exists: %s', 'zero-bs-crm' ), $trigger_slug ),
				Automation_Exception::TRIGGER_SLUG_EXISTS
			);
		}

		$this->triggers_map[ $trigger_slug ] = $trigger_classname;
	}

	/**
	 * Register a step in the automation engine
	 *
	 * @param string $step_name The name of the step to be registered.
	 * @param string $class_name The name of the class in which the step should belong.
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function register_step( string $step_name, string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the step class that does not exist. */
				sprintf( __( 'Step class %s does not exist', 'zero-bs-crm' ), $class_name ),
				Automation_Exception::STEP_CLASS_NOT_FOUND
			);
		}
		$this->steps_map[ $step_name ] = $class_name;
	}

	/**
	 * Get a step class by name
	 *
	 * @param string $step_name The name of the step whose class we will be retrieving.
	 * @return string
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function get_step_class( string $step_name ): string {
		if ( ! isset( $this->steps_map[ $step_name ] ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the step class that does not exist. */
				sprintf( __( 'Step %s does not exist', 'zero-bs-crm' ), $step_name ),
				Automation_Exception::STEP_CLASS_NOT_FOUND
			);
		}
		return $this->steps_map[ $step_name ];
	}

	/**
	 * Add a workflow
	 *
	 * @param Automation_Workflow $workflow The workflow class instance to be added.
	 * @param bool                $init_workflow Whether or not to initialize the workflow.
	 * @return void
	 * @throws Workflow_Exception Throws an exception if the workflow is not valid.
	 */
	public function add_workflow( Automation_Workflow $workflow, bool $init_workflow = false ) {
		$this->workflows[] = $workflow;

		if ( $init_workflow ) {
			$workflow->init_triggers();
		}
	}

	/**
	 * Build and add a workflow
	 *
	 * @param array $workflow_data The workflow data to be added.
	 * @param bool  $init_workflow Whether or not to initialize the workflow.
	 * @return Automation_Workflow
	 * @throws Workflow_Exception Throws an exception if the workflow is not valid.
	 */
	public function build_add_workflow( array $workflow_data, bool $init_workflow = false ): Automation_Workflow {
		$workflow = new Automation_Workflow( $workflow_data );
		$this->add_workflow( $workflow, $init_workflow );

		return $workflow;
	}

	/**
	 * Init automation workflows.
	 *
	 * @return void
	 * @throws Workflow_Exception Throws an exception if the workflow is not valid.
	 */
	public function init_workflows() {

		/** @var Automation_Workflow $workflow */
		foreach ( $this->workflows as $workflow ) {
			$workflow->init_triggers();
		}
	}

	/**
	 * Execute workflow
	 *
	 * @param Automation_Workflow $workflow The workflow to be executed.
	 * @param Trigger             $trigger The trigger that started the execution process.
	 * @param array               $trigger_data The data that was passed along by the trigger.
	 * @return bool
	 *
	 * @throws Automation_Exception Throws exception if the step does not exist, or there is an error executing the workflow.
	 */
	public function execute_workflow( Automation_Workflow $workflow, Trigger $trigger, array $trigger_data ): bool {
		$this->get_logger()->log( sprintf( 'Trigger activated: %s', $trigger->get_slug() ) );
		$this->get_logger()->log( sprintf( 'Executing workflow: %s', $workflow->name ) );

		$step_data = $workflow->get_initial_step();
		// Convert the trigger data into a data type instance.
		// This might change while running steps if we have to transform the data
		// to e.g. allow invoice triggers to work together with contact actions.
		$hook_data = $this->get_data_type_instance( $trigger::get_data_type(), $trigger_data );

		while ( $step_data ) {
			try {
				$step_slug = $step_data['slug'];

				$step_class = $step_data['class_name'] ?? $this->get_step_class( $step_slug );

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

				$this->get_logger()->log( '[' . $step->get_slug() . '] Executing step. Type: ' . $step->get_data_type() );

				$hook_data = $this->maybe_transform_data_type( $hook_data, $step::get_data_type() );
				$step->execute( $hook_data );
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
	 * Maybe transform data type.
	 *
	 * @param Data_Type_Base $data_type The current data type.
	 * @param string         $new_data_type The new data type to transform the data to.
	 * @return Data_Type_Base The transformed data type.
	 *
	 * @throws Data_Transformer_Exception Throws an exception if the data type cannot be transformed.
	 */
	protected function maybe_transform_data_type( Data_Type_Base $data_type, string $new_data_type ): Data_Type_Base {
		$current_data_type = $data_type::get_slug();

		// Bail early if we do not have to transform the data.
		if ( $current_data_type === $new_data_type ) {
			return $data_type;
		}

		if ( ! isset( $this->data_transform_map[ $current_data_type ][ $new_data_type ] ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Transforming from "%s" to "%s" is not supported', $current_data_type, $new_data_type ),
				Data_Transformer_Exception
			);
		}

		$transformer = new $this->data_transform_map[ $current_data_type ][ $new_data_type ]();
		return $transformer->transform( $data_type );
	}

	/**
	 * Get step instance
	 *
	 * @param string $step_name The name of the step to be registered.
	 * @param array  $step_data The step data to be registered.
	 * @return Step
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function get_registered_step( $step_name, array $step_data = array() ): Step {

		$step_class = $this->get_step_class( $step_name );

		if ( ! class_exists( $step_class ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the step class that does not exist. */
				sprintf( __( 'Step class %s does not exist', 'zero-bs-crm' ), $step_class ),
				Automation_Exception::STEP_CLASS_NOT_FOUND
			);
		}

		return new $step_class( $step_data );
	}

	/**
	 * Get registered steps
	 *
	 * @return array
	 */
	public function get_registered_steps(): array {
		return $this->steps_map;
	}

	/**
	 * Get trigger instance
	 *
	 * @param string $trigger_slug The name of the trigger slug with which to retrieve the trigger class.
	 * @return string
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function get_trigger_class( string $trigger_slug ): string {

		if ( ! isset( $this->triggers_map[ $trigger_slug ] ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the step class that does not exist. */
				sprintf( __( 'Trigger %s does not exist', 'zero-bs-crm' ), $trigger_slug ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}

		return $this->triggers_map[ $trigger_slug ];
	}

	/**
	 * Get Automation logger
	 *
	 * @return Automation_Logger Return an instance of the Automation_Logger class.
	 */
	public function get_logger(): Automation_Logger {
		return $this->automation_logger ?? Automation_Logger::instance();
	}

	/**
	 * Get the registered triggers
	 */
	public function get_registered_triggers(): array {
		return $this->triggers_map;
	}
}
