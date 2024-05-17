<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the partner package.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Class Partner_Test
 *
 * @package Automattic\jetpack-connection
 * @covers Automattic\Jetpack\Partner
 */
class Partner_Test extends TestCase {

	const TEST_CODE = 'abc-123';

	/**
	 * Reset the environment after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		Partner::reset();
	}

	/**
	 * Tests the class returns the instance.
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
	 * @throws \Brain\Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 */
	public function test_partner_code_is_empty_by_default( $code_type, $option_name ) {
		$call_counter  = 0;
		$option_filter = function () use ( &$call_counter ) {
			++$call_counter;
			return '';
		};

		add_filter( 'pre_option_' . $option_name, $option_filter );

		$partner_code = Partner::init()->get_partner_code( $code_type );

		remove_filter( 'pre_option_' . $option_name, $option_filter );

		$this->assertEmpty( $partner_code );
		$this->assertSame( 1, $call_counter, 'The option should be loaded once.' );
	}

	/**
	 * Tests a partner code set by an option.
	 *
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 *
	 * @throws \Brain\Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 */
	public function test_partner_code_is_set_via_option( $code_type, $option_name ) {
		$call_counter  = 0;
		$option_filter = function () use ( &$call_counter ) {
			++$call_counter;
			return self::TEST_CODE;
		};

		add_filter( 'pre_option_' . $option_name, $option_filter );

		$partner_code = Partner::init()->get_partner_code( $code_type );

		remove_filter( 'pre_option_' . $option_name, $option_filter );

		$this->assertEquals( self::TEST_CODE, $partner_code );
		$this->assertSame( 1, $call_counter, 'The option should be loaded once.' );
	}

	/**
	 * Tests a partner code set by a filter.
	 *
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 *
	 * @throws \Brain\Monkey\Expectation\Exception\ExpectationArgsRequired Function requires args.
	 */
	public function test_partner_code_is_set_via_filter( $code_type, $option_name ) {
		$call_counter  = 0;
		$option_filter = function () use ( &$call_counter ) {
			++$call_counter;
			return '';
		};

		$filter_call_counter = 0;
		$filter_filter       = function () use ( &$filter_call_counter ) {
			++$filter_call_counter;
			return self::TEST_CODE;
		};

		add_filter( 'pre_option_' . $option_name, $option_filter );
		add_filter( $option_name, $filter_filter );

		$partner_code = Partner::init()->get_partner_code( $code_type );

		remove_filter( 'pre_option_' . $option_name, $option_filter );
		remove_filter( $option_name, $filter_filter );

		$this->assertEquals( self::TEST_CODE, $partner_code );
		$this->assertSame( 1, $call_counter, 'The option should be loaded once.' );
		$this->assertSame( 1, $filter_call_counter, 'The filter should be called once.' );
	}
}
