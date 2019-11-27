<?php

namespace Automattic\Jetpack;

class Partner_Test extends \WP_UnitTestCase {

	const TEST_CODE = 'abc-123';

	public function tearDown() {
		if ( has_filter( 'jetpack_partner_subsidiary_id', array( $this, 'partner_code_filter' ) ) ) {
			remove_filter( 'jetpack_partner_subsidiary_id', array( $this, 'partner_code_filter' ) );
		}
		parent::tearDown();
	}

	public function setUp() {
		parent::setUp();
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
	 */
	public function test_partner_code_is_empty_by_defalt( $code_type, $option_name, $query_string_name ) {
		$this->assertEmpty( Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 */
	public function test_partner_code_is_set_via_option( $code_type, $option_name, $query_string_name ) {
		add_option( $option_name, self::TEST_CODE );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 */
	public function test_partner_code_is_set_via_filter( $code_type, $option_name, $query_string_name ) {
		add_filter( $option_name, array( $this, 'partner_code_filter' ) );
		$this->assertEquals( self::TEST_CODE, Partner::init()->get_partner_code( $code_type ) );
	}

	/**
	 * @dataProvider code_provider
	 *
	 * @param string $code_type Partner code type.
	 * @param string $option_name Option and filter name.
	 * @param string $query_string_name Query string variable name.
	 */
	public function test_partner_codes_are_added_to_connect_url( $code_type, $option_name, $query_string_name ) {
		Partner::init();
		add_filter( $option_name, array( $this, 'partner_code_filter' ) );
		$jetpack = \Jetpack::init();
		$url     = $jetpack->build_connect_url();

		$parsed_vars = array();
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $parsed_vars );

		$this->assertArrayHasKey( $query_string_name, $parsed_vars );
		$this->assertSame( self::TEST_CODE, $parsed_vars[ $query_string_name ] );
	}

	public function partner_code_filter() {
		return self::TEST_CODE;
	}
}
