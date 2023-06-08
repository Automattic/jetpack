<?php

namespace Automattic\Jetpack\CRM\Automation;

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

	/** @var Automation_Logger Automation logger */
	private $automation_logger;

	/** @var array */
	private $workflows = array();

	/**
	 *  Instance singleton object
	 *
	 * @param bool $force
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
	 * Register a trigger
	 *
	 * @param string $trigger_classname Trigger classname to add to the mapping
	 * @throws Automation_Exception
	 */
	public function register_trigger(  string $trigger_classname ) {
		
		if ( ! class_exists( $trigger_classname ) ) {
			throw new Automation_Exception(
				sprintf( __( 'Trigger class %s does not exist', 'zero-bs-crm' ), $trigger_classname ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}
		
		// Check if the trigger implements the interface
		if ( ! in_array( Trigger::class, class_implements( $trigger_classname ), true ) ) {
			throw new Automation_Exception(
				sprintf( __( 'Trigger class %s does not implement the Trigger interface', 'zero-bs-crm' ), $trigger_classname ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}
		
		// Check if the trigger has proper slug
		$trigger_slug = $trigger_classname::get_slug();
		
		if ( empty( $trigger_slug ) ) {
			throw new Automation_Exception(
				__( 'The trigger must have a non-empty slug' ),
				Automation_Exception::TRIGGER_SLUG_EMPTY
			);
		}
		
		if ( array_key_exists( $trigger_slug, $this->triggers_map) ) {
			throw new Automation_Exception(
				sprintf( __( 'Trigger slug already exists: %s', 'zero-bs-crm' ), $trigger_slug ),
				Automation_Exception::TRIGGER_SLUG_EXISTS
			);
		}
		
		$this->triggers_map[ $trigger_slug ] = $trigger_classname;
	}

	/**
	 * Register a step in the automation engine
	 * 
	 * @param string $step_name
	 * @param string $class_name
	 * @throws Automation_Exception
	 */
	public function register_step( string $step_name, string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception( sprintf( __( 'Step class %s does not exist', 'zero-bs-crm' ), $class_name ), Automation_Exception::STEP_CLASS_NOT_FOUND );
		}
		$this->steps_map[ $step_name ] = $class_name;
	}

	/**
	 * Get a step class by name
	 *
	 * @param string $step_name
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_step_class( string $step_name ): string {
		if ( ! isset( $this->steps_map[ $step_name ] ) ) {
			throw new Automation_Exception( sprintf( __( 'Step %s does not exist', 'zero-bs-crm' ), $step_name ), Automation_Exception::STEP_CLASS_NOT_FOUND );
		}
		return $this->steps_map[ $step_name ];
	}

	/**
	 * Add a workflow
	 *
	 * @param Automation_Workflow $workflow
	 * @param bool              $init_workflow
	 * @return void
	 * @throws Workflow_Exception
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
	 * @param array $workflow_data
	 * @param bool $init_workflow
	 * @return Automation_Workflow
	 * @throws Workflow_Exception
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
	 * @throws Workflow_Exception
	 */
	public function init_workflows() {
		
		/** @var Automation_Workflow $workflow */
		foreach ( $this->workflows as $workflow ) {
			$workflow->init_triggers();
		}
	}

	/**
	 * Get step instance
	 * 
	 * @param $step_name
	 * @param array $step_data
	 * @return Step
	 * @throws Automation_Exception
	 */
	public function get_registered_step( $step_name, array $step_data = array() ): Step {
		
		$step_class = $this->get_step_class( $step_name );
		
		if ( ! class_exists( $step_class ) ) {
			throw new Automation_Exception( sprintf( __( 'Step class %s does not exist', 'zero-bs-crm' ), $step_class ), Automation_Exception::STEP_CLASS_NOT_FOUND );
		}
		
		return new $step_class( $step_data );
	}

	/**
	 * Get registered steps
	 * 
	 * @return array
	 */
	public function get_registered_steps():array {
		return $this->steps_map;
	}

	/**
	 * Get trigger instance
	 *
	 * @param string $trigger_slug
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_trigger_class( string $trigger_slug ): string {
		
		if ( ! isset( $this->triggers_map[ $trigger_slug ] ) ) {
			throw new Automation_Exception( sprintf( __( 'Trigger %s does not exist', 'zero-bs-crm' ), $trigger_slug ), 
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND );
		}
		
		return $this->triggers_map[ $trigger_slug ];
	}

	/**
	 * Get Automation logger
	 * 
	 * @return Automation_Logger
	 */
	public function get_logger(): ?Automation_Logger {
		return $this->automation_logger;
	}

	/** 
	 * Get the registered triggers 
	 */
	public function get_registered_triggers(): array {
		return $this->triggers_map;
	}
}
