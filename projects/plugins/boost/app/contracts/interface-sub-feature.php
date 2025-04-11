<?php

namespace Automattic\Jetpack_Boost\Contracts;

interface Sub_Feature extends Feature {

	/**
	 * Get the parent features that are required for this feature to work.
	 *
	 * At least one parent feature must be enabled for this feature to work.
	 *
	 * @return class-string<Feature>[] The parent features.
	 */
	public static function get_parent_features(): array;
}
