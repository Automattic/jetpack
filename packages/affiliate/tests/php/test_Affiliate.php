<?php
namespace Automattic\Jetpack\Partners;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class Test_Affiliate extends TestCase {

	/**
	 * Mock affiliate code.
	 *
	 * @var string
	 */
	private $aff_code = 'abc123';

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		Mock::disableAll();
	}

	function test_affiliate_code_missing() {
		$this->mock_function_with_args( 'get_option', [
			[
				'jetpack_affiliate_code',
				'',
				''
			]
		] );

		$this->mock_function_with_args( 'apply_filters', [
			[
				'jetpack_affiliate_code',
				get_option( 'jetpack_affiliate_code', '' ),
				get_option( 'jetpack_affiliate_code', '' )
			]
		] );

		$this->assertEmpty( Affiliate::init()->get_affiliate_code() );
	}

	function test_affiliate_code_exists() {
		$this->mock_function_with_args( 'get_option', [
			[
				'jetpack_affiliate_code',
				'',
				$this->aff_code
			]
		] );

		$this->mock_function_with_args( 'apply_filters', [
			[
				'jetpack_affiliate_code',
				get_option( 'jetpack_affiliate_code', '' ),
				get_option( 'jetpack_affiliate_code', '' )
			]
		] );

		$this->assertEquals( 'abc123', Affiliate::init()->get_affiliate_code() );
	}

	/**
	 * Mock a global function with particular arguments and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param array  $args          Array of argument sets, last value of each set is used as a return value.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_function_with_args( $function_name, $args = array() ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
		        ->setName( $function_name )
		        ->setFunction(
			        function() use ( &$args ) {
				        $current_args = func_get_args();

				        foreach ( $args as $arg ) {
					        if ( array_slice( $arg, 0, -1 ) === $current_args ) {
						        return array_pop( $arg );
					        }
				        }
			        }
		        );

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

}
