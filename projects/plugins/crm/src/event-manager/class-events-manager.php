<?php

namespace Automattic\Jetpack\CRM\Event_Manager; 

class Events_Manager {
	
	/** @var null The Events_Manager instance */
	private static $instance = null;
	
	/** @var bool Whether or not the event manager is active */
	private $active = true;
	
	/**
	 * Get the singleton instance of this class.
	 * 
	 * @return Events_Manager
	 */
	public static function get_instance(): Events_Manager {
		if ( ! self::$instance ) {
			self::$instance = new Events_Manager();
		}
		
		return self::$instance;
	}
	
	/**
	 * Set the Events_Manager instance for testing purposes.
	 * 
	 * @param Events_Manager $instance
	 * @return void
	 */
	public static function set_instance( Events_Manager $instance ) {
		self::$instance = $instance;
	}
	
	/**
	 * Set whether or not the event manager is active.
	 * 
	 * @param bool $active
	 * @return void
	 */
	public function set_active( bool $active ) {
		$this->active = $active;
	}
	
	/**
	 * Get whether or not the event manager is active.
	 * 
	 * @return bool
	 */
	public function is_active(): bool {
		return $this->active;
	}

	public function contact(): Contact_Event {
		return Contact_Event::get_instance();
	}
	
	
}