<?php
/* HEADER */ // phpcs:ignore

/**
 * Allows the latest autoloader to register hooks that can be removed when the autoloader is reset.
 */
class Hook_Manager {

	/**
	 * An array containing all of the hooks that we've registered.
	 *
	 * @var array
	 */
	private $registered_hooks;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->registered_hooks = array();
	}

	/**
	 * Adds an action to WordPress and registers it internally.
	 *
	 * @param string   $tag           The name of the action which is hooked.
	 * @param callable $callable      The function to call.
	 * @param int      $priority      Used to specify the priority of the action.
	 * @param int      $accepted_args Used to specify the number of arguments the callable accepts.
	 */
	public function add_action( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		$this->registered_hooks[ $tag ][] = array(
			'priority' => $priority,
			'callable' => $callable,
		);

		add_action( $tag, $callable, $priority, $accepted_args );
	}

	/**
	 * Adds a filter to WordPress and registers it internally.
	 *
	 * @param string   $tag           The name of the filter which is hooked.
	 * @param callable $callable      The function to call.
	 * @param int      $priority      Used to specify the priority of the filter.
	 * @param int      $accepted_args Used to specify the number of arguments the callable accepts.
	 */
	public function add_filter( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		$this->registered_hooks[ $tag ][] = array(
			'priority' => $priority,
			'callable' => $callable,
		);

		add_filter( $tag, $callable, $priority, $accepted_args );
	}

	/**
	 * Removes all of the registered hooks.
	 */
	public function reset() {
		foreach ( $this->registered_hooks as $tag => $hooks ) {
			foreach ( $hooks as $hook ) {
				remove_filter( $tag, $hook['callable'], $hook['priority'] );
			}
		}
		$this->registered_hooks = array();
	}
}
