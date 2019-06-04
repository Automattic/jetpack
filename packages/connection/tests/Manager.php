<?php

namespace Automattic\Jetpack\Connection;

use phpmock\functions\FunctionProvider;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class ManagerTest extends TestCase {
	public function setUp() {
		parent::setUp();

		$this->mock = $this->getMockBuilder( 'stdClass' )
						   ->setMethods( [ 'get_option', 'update_option', 'get_raw_option' ] )
						   ->getMock();

		$this->generator = $this->getMockBuilder( 'stdClass' )
								->setMethods( [ 'generate' ] )
								->getMock();

		$this->manager = new Manager();

		$this->mock_filters( array(
			array( 'jetpack_connection_option_manager', false, $this->mock ),
			array( 'jetpack_connection_secret_generator', 'wp_generate_password', array( $this->generator, 'generate' ) ),
		) );
	}

	public function tearDown() {
		parent::tearDown();
		$this->clear_mock_filters();
	}

	function test_class_implements_interface() {
		$manager = new Manager();
		$this->assertInstanceOf( 'Automattic\Jetpack\Connection\Manager_Interface', $manager );
	}

	function test_generate_secrets() {
		$this->generator->expects( $this->exactly( 2 ) )
						->method( 'generate' )
						->will( $this->returnValue( 'topsecretstring' ) );

		$this->mock->expects( $this->once() )
				   ->method( 'update_option' )
				   ->with(
					   $this->equalTo( Manager::SECRETS_OPTION_NAME ),
					   $this->equalTo( array(
						   'jetpack_name_1' => array(
							   'secret_1' => 'topsecretstring',
							   'secret_2' => 'topsecretstring',
							   'exp' => time() + 600
						   )
					   ) )
				   );

		$secrets = $this->manager->generate_secrets( 'name', 1, 600 );

		$this->assertEquals( 'topsecretstring', $secrets['secret_1'] );
		$this->assertEquals( 'topsecretstring', $secrets['secret_2'] );
	}

	function test_get_secrets_not_found() {
		$this->mock->expects( $this->once() )
				   ->method( 'get_option' )
				   ->with(
					   $this->equalTo( Manager::SECRETS_OPTION_NAME ),
					   $this->anything()
				   );

		$this->assertEquals(
			Manager::SECRETS_MISSING,
			$this->manager->get_secrets( 'name', 1, 600 )
		);
	}

	/**
	 * @dataProvider secrets_value_provider
	 */
	function test_get_secrets_expired( $name, $user_id, $expires, $values ) {
		$this->mock->expects( $this->exactly( 2 ) )
				   ->method( 'get_option' )
				   ->with(
					   $this->equalTo( Manager::SECRETS_OPTION_NAME ),
					   $this->anything()
				   )
				   ->will(
					   $this->returnValue( array(
						   'jetpack_' . $name . '_' . $user_id => array_merge(
							   $values,

							   // Expired secret, should be removed on access.
							   array( 'exp' => 0 )
						   )
					   ) )
				   );

		$this->mock->expects( $this->once() )
				   ->method( 'update_option' )
				   ->with(
					   $this->equalTo( Manager::SECRETS_OPTION_NAME ),
					   $this->equalTo( array() )
				   );

		$this->assertEquals(
			Manager::SECRETS_EXPIRED,
			$this->manager->get_secrets( $name, $user_id, $expires )
		);
	}

	/**
	 * @dataProvider secrets_value_provider
	 */
	function test_get_secrets( $name, $user_id, $expires, $values ) {
		$this->mock->expects( $this->once() )
				   ->method( 'get_option' )
				   ->with(
					   $this->equalTo( Manager::SECRETS_OPTION_NAME ),
					   $this->anything()
				   )
				   ->will(
					   $this->returnValue( array(
						   'jetpack_' . $name . '_' . $user_id => array_merge(
							   $values,

							   // Making sure the secret is still active.
							   array( 'exp' => $values['exp'] + time() )
						   )
					   ) )
				   );

		$this->assertEquals(
			$values['secret_1'],
			$this->manager->get_secrets( $name, $user_id, $expires )['secret_1']
		);
	}

	/**
	 * Provides values for secrets to test.
	 */
	function secrets_value_provider() {
		return [
			[
				'action_name',
				123,
				3600,
				[
					'secret_1' => 'secret1',
					'secret_2' => 'secret2',
					'exp'      => 600
				]
			],
			[
				'action_name_2',
				1234,
				36000,
				[
					'secret_1' => 'secret1withsomewords',
					'secret_2' => 'secret2mithosemthingelse',
					'exp'      => 36000
				]
			]
		];
	}

	protected function mock_filters( $filters ) {
		$this->mocked_filters = $filters;

		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'apply_filters' )
			->setFunction(
				function () {
					$current_args = func_get_args();
					foreach ( $this->mocked_filters as $filter ) {
						if ( array_slice( $filter, 0, -1 ) === $current_args ) {
							return array_pop( $filter );
						}
					}
				}
			);

		$this->apply_filters_mock = $builder->build();
		$this->apply_filters_mock->enable();
	}

	protected function clear_mock_filters() {
		$this->apply_filters_mock->disable();
		unset( $this->mocked_filters );
	}
}
