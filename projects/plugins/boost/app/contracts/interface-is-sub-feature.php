<?php

namespace Automattic\Jetpack_Boost\Contracts;

interface Is_Sub_Feature {

	/**
	 * Get the parent features that are required for this feature to work.
	 *
	 * At least one parent feature must be enabled for this feature to work.
	 *
	 * @return class-string<Pluggable>[] The parent features.
	 */
	public static function get_parent_features(): array;
}
