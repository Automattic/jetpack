<?php
/**
 * Defines Jetpack CRM Automation engine.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Transformers\Data_Transformer_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

/**
 * Automation Engine.
 *
 * @since 6.2.0
 */
class Automation_Engine {

	/**
	 * Instance singleton.
	 *
	 * @since 6.2.0
	 * @var Automation_Engine
	 */
	private static $instance = null;

	/**
	 * The triggers map name => classname.
	 *
	 * @since 6.2.0
	 * @var string[]
	 */
	private $triggers_map = array();

	/**
	 * The steps map name => classname.
	 *
	 * @since 6.2.0
	 * @var string[]
	 */
	private $steps_map = array();

	/**
	 * The Automation logger.
	 *
	 * @since 6.2.0
	 * @var ?Automation_Logger
	 */
	private $automation_logger = null;

	/**
	 * The list of registered workflows.
	 *
	 * @since 6.2.0
	 * @var Automation_Workflow[]
	 */
	private $workflows = array();

	/**
	 * An array of supported data types.
	 *
	 * @since 6.2.0
	 *
	 * @var Data_Type_Base[]
	 */
	private $data_types = array();

	/**
	 * An array of supported data transformers.
	 *
	 * @since 6.2.0
	 *
	 * @var Data_Transformer_Base[]
	 */
	private $data_transformers = array();

	/**
	 * An array of data type that represents support between types.
	 *
	 * @since 6.2.0
	 *
	 * @var string[]
	 */
	public $data_transform_map = array();

	/**
	 * Instance singleton object.
	 *
	 * @since 6.2.0
	 *
	 * @param bool $force Whether to force a new Automation_Engine instance.
	 * @return Automation_Engine The Automation_Engine instance.
	 */
	public static function instance( bool $force = false ): Automation_Engine {
		if ( ! self::$instance || $force ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Set the automation logger.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Logger $logger The automation logger.
	 */
	public function set_automation_logger( Automation_Logger $logger ) {
		$this->automation_logger = $logger;
	}

	/**
	 * Register data transformer.
	 *
	 * @since 6.2.0
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

		if ( isset( $this->data_transformers[ $class_name ] ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Data Transformer slug already exist: %s', $class_name ),
				Data_Transformer_Exception::SLUG_EXISTS
			);
		}

		$this->data_transformers[ $class_name ] = $class_name;

		if ( ! isset( $this->data_transform_map[ $class_name::get_from() ] ) ) {
			$this->data_transform_map[ $class_name::get_from() ] = array();
		}

		$this->data_transform_map[ $class_name::get_from() ][ $class_name::get_to() ] = $class_name;
	}

	/**
	 * Register a trigger.
	 *
	 * @since 6.2.0
	 *
	 * @param string $trigger_classname Trigger classname to add to the mapping.
	 *
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
	 * Register a step in the automation engine.
	 *
	 * @since 6.2.0
	 *
	 * @param string $class_name The name of the class in which the step should belong.
	 *
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function register_step( string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception(
				/* Translators: %s is the name of the step class that does not exist. */
				sprintf( __( 'Step class %s does not exist', 'zero-bs-crm' ), $class_name ),
				Step_Exception::DO_NOT_EXIST
			);
		}

		if ( ! in_array( Step::class, class_implements( $class_name ), true ) ) {
			throw new Automation_Exception(
				sprintf( 'Step class %s does not implement the Base_Step interface', $class_name ),
				Step_Exception::DO_NOT_EXTEND_BASE
			);
		}

		$step_slug                     = $class_name::get_slug();
		$this->steps_map[ $step_slug ] = $class_name;
	}

	/**
	 * Get a step class by name.
	 *
	 * @since 6.2.0
	 *
	 * @param string $step_name The name of the step whose class we will be retrieving.
	 * @return string The name of the step class.
	 *
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
	 * Add a workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow class instance to be added.
	 * @param bool                $init_workflow Whether or not to initialize the workflow.
	 *
	 * @throws Workflow_Exception Throws an exception if the workflow is not valid.
	 */
	public function add_workflow( Automation_Workflow $workflow, bool $init_workflow = false ) {
		$workflow->set_engine( $this );

		$this->workflows[] = $workflow;

		if ( $init_workflow ) {
			$workflow->init_triggers();
		}
	}

	/**
	 * Build and add a workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param array $workflow_data The workflow data to be added.
	 * @param bool  $init_workflow Whether or not to initialize the workflow.
	 * @return Automation_Workflow The workflow class instance to be added.
	 *
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
	 * @since 6.2.0
	 *
	 * @throws Workflow_Exception Throws an exception if the workflow is not valid.
	 */
	public function init_workflows() {

		/** @var Automation_Workflow $workflow */
		foreach ( $this->workflows as $workflow ) {
			$workflow->init_triggers();
		}
	}

	/**
	 * Execute workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow to be executed.
	 * @param Trigger             $trigger The trigger that started the execution process.
	 * @param Data_Type           $trigger_data_type The data that was passed along by the trigger.
	 * @return bool
	 *
	 * @throws Automation_Exception Throws exception if an error executing the workflow.
	 * @throws Data_Transformer_Exception Throws exception if an error transforming the data.
	 */
	public function execute_workflow( Automation_Workflow $workflow, Trigger $trigger, Data_Type $trigger_data_type ): bool {
		$this->get_logger()->log( sprintf( 'Trigger activated: %s', $trigger->get_slug() ) );
		$this->get_logger()->log( sprintf( 'Executing workflow: %s', $workflow->name ) );

		$step_data = $workflow->get_initial_step();

		while ( $step_data ) {
			try {
				$step_class = $step_data['class_name'] ?? $this->get_step_class( $step_data['slug'] );

				if ( ! class_exists( $step_class ) ) {
					throw new Automation_Exception(
					/* Translators: %s is the name of the step class that does not exist. */
						sprintf( __( 'The step class %s does not exist.', 'zero-bs-crm' ), $step_class ),
						Automation_Exception::STEP_CLASS_NOT_FOUND
					);
				}

				/** @var Step $step */
				$step = new $step_class( $step_data );

				$step_slug = $step->get_slug();

				$this->get_logger()->log( '[' . $step->get_slug() . '] Executing step. Type: ' . $step::get_data_type() );

				$data_type = $this->maybe_transform_data_type( $trigger_data_type, $step::get_data_type() );

				$step->validate_and_execute( $data_type );

				//todo: return Step instance instead of array
				$step_id   = $step->get_next_step_id();
				$step_data = $workflow->get_step( $step_id );

				$this->get_logger()->log( '[' . $step->get_slug() . '] Step executed!' );

				if ( ! $step_data ) {
					$this->get_logger()->log( 'Workflow execution finished: No more steps found.' );
					return true;
				}
			} catch ( Automation_Exception $automation_exception ) {

				$this->get_logger()->log( 'Error executing the workflow on step: ' . $step_slug . ' - ' . $automation_exception->getMessage() );

				throw $automation_exception;
			} catch ( Data_Transformer_Exception $transformer_exception ) {
				$this->get_logger()->log( 'Error executing the workflow on step ' . $step_slug . '. Transformer error: ' . $transformer_exception->getMessage() );

				throw $transformer_exception;
			}
		}

		return false;
	}

	/**
	 * Maybe transform data type.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data_type The current data type.
	 * @param string    $new_data_type_class The new data type to transform the data to.
	 * @return Data_Type The transformed data type.
	 *
	 * @throws Data_Transformer_Exception Throws an exception if the data type cannot be transformed.
	 */
	protected function maybe_transform_data_type( Data_Type $data_type, string $new_data_type_class ): Data_Type_Base {

		// Bail early if we do not have to transform the data.
		if ( $data_type instanceof $new_data_type_class ) {
			return $data_type;
		}

		$data_type_class = get_class( $data_type );

		if ( ! isset( $this->data_transform_map[ $data_type_class ][ $new_data_type_class ] ) ) {
			throw new Data_Transformer_Exception(
				sprintf( 'Transforming from "%s" to "%s" is not supported', $data_type_class, $new_data_type_class ),
				Data_Transformer_Exception::TRANSFORM_IS_NOT_SUPPORTED
			);
		}

		$transformer = new $this->data_transform_map[ $data_type_class ][ $new_data_type_class ]();

		return $transformer->transform( $data_type );
	}

	/**
	 * Get a step instance.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data hydrate the step with.
	 * @return Step A step class instance.
	 *
	 * @throws Automation_Exception Throws an exception if the step class does not exist.
	 */
	public function get_registered_step( array $step_data ): Step {

		$step_class = $this->get_step_class( $step_data['slug'] );

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
	 * Get registered steps.
	 *
	 * @since 6.2.0
	 *
	 * @return string[] The registered steps.
	 */
	public function get_registered_steps(): array {
		return $this->steps_map;
	}

	/**
	 * Get trigger instance.
	 *
	 * @since 6.2.0
	 *
	 * @param string $trigger_slug The name of the trigger slug with which to retrieve the trigger class.
	 * @return string The name of the trigger class.
	 *
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
	 * Get Automation logger.
	 *
	 * @since 6.2.0
	 *
	 * @return Automation_Logger Return an instance of the Automation_Logger class.
	 */
	public function get_logger(): Automation_Logger {
		return $this->automation_logger ?? Automation_Logger::instance();
	}

	/**
	 * Get the registered triggers.
	 *
	 * @since 6.2.0
	 *
	 * @return string[] The registered triggers.
	 */
	public function get_registered_triggers(): array {
		return $this->triggers_map;
	}
}
