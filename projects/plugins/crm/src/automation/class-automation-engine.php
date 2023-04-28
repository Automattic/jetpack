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

	/** @var array Triggers map name => classname */
	private $triggers_map = array();

	/** @var array Actions map name => classname */
	private $actions_map = array();

	/** @var array Conditions map name => classname */
	private $conditions_map = array();

	/** @var Automation_Logger Automation logger */
	private $automation_logger;
	
	/** @var array */
	private $recipes = array();

	/**
	 *  Instance singleton object
	 *
	 * @return Automation_Engine
	 */
	public static function instance(): Automation_Engine {
		if ( ! self::$instance ) {
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
	 * @param string Trigger $trigger_name
	 * @param string         $class_name
	 * @throws Automation_Exception
	 */
	public function register_trigger( string $trigger_name, string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception(
				sprintf( __( 'Trigger class %s does not exist', 'zero-bs-crm' ), $class_name ),
				Automation_Exception::TRIGGER_CLASS_NOT_FOUND
			);
		}
		$this->triggers_map[ $trigger_name ] = $class_name;
	}

	/**
	 * Register an action
	 *
	 * @param string $action_name
	 * @param string $class_name
	 * @throws Automation_Exception
	 */
	public function register_action( string $action_name, string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception( sprintf( __( 'Action class %s does not exist', 'zero-bs-crm' ), $class_name ) );
		}
		$this->actions_map[ $action_name ] = $class_name;
	}

	/**
	 * Register a condition
	 *
	 * @param string $condition_name
	 * @param string $class_name
	 * @throws Automation_Exception
	 */
	public function register_condition( string $condition_name, string $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			throw new Automation_Exception( sprintf( __( 'Condition class %s does not exist', 'zero-bs-crm' ), $class_name ) );
		}
		$this->conditions_map[ $condition_name ] = $class_name;
	}

	/**
	 * Get a trigger class by name
	 *
	 * @param string $trigger_name
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_trigger_class( string $trigger_name ): string {
		if ( ! isset( $this->triggers_map[ $trigger_name ] ) ) {
			throw new Automation_Exception( sprintf( __( 'Trigger %s does not exist', 'zero-bs-crm' ), $trigger_name ) );
		}
		return $this->triggers_map[ $trigger_name ];
	}

	/**
	 * Get an action class by name
	 *
	 * @param string $action_name
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_action_class( string $action_name ): string {
		if ( ! isset( $this->actions_map[ $action_name ] ) ) {
			throw new Automation_Exception( sprintf( __( 'Action %s does not exist', 'zero-bs-crm' ), $action_name ) );
		}
		return $this->actions_map[ $action_name ];
	}

	/**
	 * Get a condition class by name
	 *
	 * @param string $condition_name
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_condition_class( string $condition_name ): string {
		if ( ! isset( $this->conditions_map[ $condition_name ] ) ) {
			throw new Automation_Exception( sprintf( __( 'Condition %s does not exist', 'zero-bs-crm' ), $condition_name ) );
		}
		return $this->conditions_map[ $condition_name ];
	}

	/**
	 * Get a step class by name
	 *
	 * @param string $step_name
	 * @param string $step_type
	 * @return string
	 * @throws Automation_Exception
	 */
	public function get_step_class( string $step_name, string $step_type ): string {
		switch ( $step_type ) {
			case 'action':
				return $this->get_action_class( $step_name );
			case 'condition':
				return $this->get_condition_class( $step_name );
			default:
				throw new Automation_Exception( sprintf( __( 'Step type %s does not exist', 'zero-bs-crm' ), $step_type ) );
		}
	}

	/**
	 * Get registered triggers
	 *
	 * @return array
	 */
	public function get_registered_triggers(): array {
		return $this->triggers_map;
	}
}
