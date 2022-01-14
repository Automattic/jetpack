<?php
namespace Automattic\Jetpack_Boost\Modules;


/**
 * Initializable has a method that's run on WordPress `init` hook
 *
 * @return bool
 */
interface Initializable {

	public function initialize();
}