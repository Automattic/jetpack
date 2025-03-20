<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * Modules can implement this interface to indicate that they change the HTML output for the site visitor and they may do it after activation.
 * E.g. Critical CSS needs to be generated first.
 */
interface Changes_Output_After_Activation {
	/**
	 * Check if the module is ready and already changing the page output.
	 * This is useful for modules that need preparation before they can start serving the optimized output. E.g. Critical CSS.
	 */
	public function is_ready();

	/**
	 * Get the action name(s) that should be used to indicate that the module is ready and changing the page output.
	 *
	 * @return string[] The names of action hooks which will be triggered to indication that the module has changed the page output.
	 */
	public static function get_change_output_action_names();
}
