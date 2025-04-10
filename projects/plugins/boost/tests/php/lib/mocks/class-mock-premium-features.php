<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Mocks;

class Mock_Premium_Features {
	const CORNERSTONE_TEN_PAGES = 'cornerstone_ten_pages';

	/**
	 * Mock the premium feature check when it's true.
	 *
	 * @var bool
	 */
	private static $mock_return = false;

	public static function has_feature( $feature ) {
		if ( $feature === self::CORNERSTONE_TEN_PAGES ) {
			return self::$mock_return;
		}
		return false;
	}

	public static function set_mock_return( $value ) {
		self::$mock_return = (bool) $value;
	}
}

class_alias(
	'Automattic\Jetpack_Boost\Tests\Lib\Mocks\Mock_Premium_Features',
	'Automattic\Jetpack_Boost\Lib\Premium_Features'
);
