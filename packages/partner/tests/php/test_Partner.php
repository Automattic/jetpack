<?php

namespace Automattic\Jetpack;
use PHPUnit\Framework\TestCase;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

class Partner_Test extends TestCase {

	const TEST_CODE = 'abc-123';

	public function tearDown() {
		parent::tearDown();
	}

	public function setUp() {
		parent::setUp();
		Monkey\setUp();
		Partner::reset();
	}

	public function test_init_returns_instance() {
		$this->assertInstanceOf( Partner::class, Partner::init() );
	}

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
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired
	 */
	public function test_partner_code_is_empty_by_defalt( $code_type, $option_name, $query_string_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name )->andReturn( '' );
		$this->assertEmpty( Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired
	 */
	public function test_partner_code_is_set_via_option( $code_type, $option_name, $query_string_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name, '' )->andReturn( self::TEST_CODE );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 *
	 * @throws Monkey\Expectation\Exception\ExpectationArgsRequired
	 */
	public function test_partner_code_is_set_via_filter( $code_type, $option_name, $query_string_name ) {
		Functions\expect( 'get_option' )->once()->with( $option_name)->andReturn( '' );
		Filters\expectApplied( $option_name )->once()->with('')->with( self::TEST_CODE );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}
}
