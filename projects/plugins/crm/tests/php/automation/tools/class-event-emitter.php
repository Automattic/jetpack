<?php

namespace Automattic\Jetpack\CRM\Automation\Tests;

class Event_Emitter {

	private $listeners = array();

	private static $instance = null;

	public static function instance(): Event_Emitter {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public static function on( $event, $listener ) {
		self::instance()->add_listener( $event, $listener );
	}

	// Add a listener for an event
	public function add_listener( $event, $listener ) {
		if ( ! isset( $this->listeners[ $event ] ) ) {
			$this->listeners[ $event ] = array();
		}
		$this->listeners[ $event ][] = $listener;
	}

	// emit an event
	public static function emit( $event, $data = null ) {
		self::instance()->emit_event( $event, $data );
	}

	public function emit_event( $event, $data = null ) {
		if ( isset( $this->listeners[ $event ] ) ) {
			foreach ( $this->listeners[ $event ] as $listener ) {
				$listener( $data );
			}
		}
	}

	/**
	 * Reset the event emitter
	 */
	public function reset() {
		$this->listeners = array();
	}
}
