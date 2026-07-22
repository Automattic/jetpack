<?php

namespace Automattic\Jetpack\Sync;

/**
 * First test implementation of a shared Sync module name.
 */
class First_Duplicate_Name_Module extends Modules\Module {

	/**
	 * {@inheritDoc}
	 */
	public function name() {
		return 'duplicate_name';
	}
}
