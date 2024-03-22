<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * Modules can implement this interface to indicate that they change the HTML output for the site visitor.
 */
interface Changes_Page_Output {
	/**
	 * Check if the module is ready and already changing the page output.
	 * This is for modules that need preparation before they can start serving the optimized output. E.g. Critical CSS.
	 */
	public function is_working();
}
