<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * A class that has a setup step that's supposed to be executed only once.
 */
interface Has_Setup {

	/**
	 * This class has a setup method that should be
	 * run only once per the request lifecycle.
	 *
	 * This is a good place to attach hooks
	 * or perform other tasks that need
	 * to be performed once.
	 *
	 * @return mixed
	 */
	public function setup();
}
