<?php

namespace Automattic\Jetpack\Sync;

/**
 * Second test implementation of a shared Sync module name.
 */
class Second_Duplicate_Name_Module extends Modules\Module {

	/**
	 * {@inheritDoc}
	 */
	public function name() {
		return 'duplicate_name';
	}
}
