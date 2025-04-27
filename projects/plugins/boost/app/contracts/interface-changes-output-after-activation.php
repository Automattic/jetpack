<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * Modules can implement this interface to indicate that they change the HTML output for the site visitor and they may do it after activation.
 * E.g. Critical CSS needs to be generated first.
 */
interface Changes_Output_After_Activation {

	/**
	 * Get the action name(s) that should be used to indicate that the module is ready and changing the page output.
	 *
	 * @return string[] The names of action hooks which will be triggered to indicate when the module changes the page output.
	 */
	public static function get_change_output_action_names();
}
