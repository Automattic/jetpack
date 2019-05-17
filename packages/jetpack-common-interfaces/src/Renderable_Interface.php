<?php
/**
 * Renderable Interface
 *
 * @package jetpack-common-interfaces
 */

namespace Jetpack\Assets;

interface Renderable_Interface {

	/**
	 * Returns rendered package output
	 *
	 * @return string
	 */
	public function render();
}
