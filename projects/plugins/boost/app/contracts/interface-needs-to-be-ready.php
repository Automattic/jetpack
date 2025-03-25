<?php

namespace Automattic\Jetpack_Boost\Contracts;

interface Needs_To_Be_Ready {
	/**
	 * Check if the module is ready and already optimizing.
	 * This is useful for modules that need preparation before they can start serving the optimized output. E.g. Critical CSS.
	 */
	public function is_ready();
}
