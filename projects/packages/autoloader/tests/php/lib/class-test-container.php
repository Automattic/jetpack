<?php
/**
 * Class file for container to be used in tests to override dependencies.
 *
 * @package automattic/jetpack-autoloader
 */

/**
 * Class Test_Container
 */
class Test_Container extends Container {

	/**
	 * Replaces a dependency in the container.
	 *
	 * @param string $class_name The class name to replace.
	 * @param mixed  $instance The instance to replace.
	 */
	public function replace( $class_name, $instance ) {
		$this->dependencies[ $class_name ] = $instance;
	}
}
