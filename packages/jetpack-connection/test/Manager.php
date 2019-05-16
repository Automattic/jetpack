<?php

use PHPUnit\Framework\TestCase;
use Jetpack\V7\Connection\Manager;

class ManagerTest extends TestCase {
	function test_class_implements_interface() {
		$manager = new Manager();
		$this->assertInstanceOf( 'Jetpack\V7\Connection\Manager_Interface', $manager );
	}

	function setUp() {
		$this->mock = $this->getMockBuilder( 'stdClass' )
					->setMethods( [ 'get_option', 'update_option' ] )
					->getMock();

		$this->manager = new Manager();
		$this->manager->set_option_backend( $this->mock );
	}

	function test_generate_secrets() {
		$generator = $this->getMockBuilder( 'stdClass' )
				   ->setMethods( [ 'generate' ] )
				   ->getMock();

		$generator->expects( $this->exactly( 2 ) )
			->method( 'generate' )
			->will( $this->returnValue( 'topsecretstring' ) );

		$this->mock->expects( $this->once() )
			->method( 'update_option' )
			->with(
				$this->equalTo( 'jetpack_secrets' ),
				$this->equalTo( array(
					'jetpack_name_1' => array(
						'secret_1' => 'topsecretstring',
						'secret_2' => 'topsecretstring',
						'exp' => time() + 600
					)
				) )
			);

		$this->manager->set_secret_callable( array( $generator, 'generate' ) );

		$secrets = $this->manager->generate_secrets( 'name', 1, 600 );

		$this->assertEquals( 'topsecretstring', $secrets['secret_1'] );
		$this->assertEquals( 'topsecretstring', $secrets['secret_2'] );
	}

	function test_get_secrets_not_found() {
		$this->mock->expects( $this->once() )
			->method( 'get_option' )
			->with(
				$this->equalTo( 'jetpack_secrets' ),
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
				$this->equalTo( 'jetpack_secrets' ),
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
				$this->equalTo( 'jetpack_secrets' ),
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
				$this->equalTo( 'jetpack_secrets' ),
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
}
