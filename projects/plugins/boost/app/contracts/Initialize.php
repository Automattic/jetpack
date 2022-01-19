<?php

namespace Automattic\Jetpack_Boost\Contracts;


/**
 * Objects marked with Initialize are run
 * when WordPress `init` hook is fired
 */
interface Initialize {

	/**
	 * Initialize method is going to be run only once
	 * @return bool
	 */
	public function initialize();

}