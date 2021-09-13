<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the partner package.
 *
 * @package automattic/jetpack-partner
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Class Partner_Test
 *
 * @package Automattic\Jetpack
 */
class Partner_Test extends TestCase {

	const TEST_CODE = 'abc-123';

	/**
	 * Set ups the tests.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
		Partner::reset();
	}

	/**
	 * Tests the class returns the instance.
	 *
	 * @covers Automattic\Jetpack\Partner
	 */
	public function test_init_returns_instance() {
		$this->assertInstanceOf( Partner::class, Partner::init() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function code_provider() {
		return array(
			'subsidiary_code' =>
				array(
					Partner::SUBSIDIARY_CODE,            // Code type.
					'jetpack_partner_subsidiary_id',     // filter/option key.
					'subsidiaryId',                      // Query string parameter.
				),
			'affiliate_code'  =>
				array(
					Partner::AFFILIATE_CODE,
					'jetpack_affiliate_code',
					'aff',
				),
		);
	}

	/**
	 * Tests that the partner code is empty by default.
	 *
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 *
	 * @covers Automattic\Partner
	 */
	public function test_partner_code_is_empty_by_default( $code_type, $option_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name )->andReturn( '' );
		$this->assertEmpty( Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * Tests a partner code set by an option.
	 *
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 *
	 * @covers Automattic\Partner
	 */
	public function test_partner_code_is_set_via_option( $code_type, $option_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name, '' )->andReturn( self::TEST_CODE );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * Tests a partner code set by a filter.
	 *
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 *
	 * @covers Automattic\Partner
	 */
	public function test_partner_code_is_set_via_filter( $code_type, $option_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name )->andReturn( '' );
		Filters\expectApplied( $option_name )->once()->with( '' )->with( self::TEST_CODE );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}
}
