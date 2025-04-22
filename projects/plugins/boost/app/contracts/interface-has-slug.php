<?php
namespace Automattic\Jetpack_Boost\Contracts;

interface Has_Slug {
	/**
	 * Get the module slug.
	 *
	 * Returns a unique identifier for this module within Jetpack Boost.
	 */
	public static function get_slug();
}
