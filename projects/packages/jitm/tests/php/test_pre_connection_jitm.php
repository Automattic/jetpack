<?php  // phpcs:disable

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITMS\Pre_Connection_JITM;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

class Test_Pre_Connection_JITM extends TestCase {
	use MockeryPHPUnitIntegration;

	/**
	 * An array containing a test pre-connection JITM.
	 *
	 * @var array
	 */
	private $test_jitms;

	/**
	 * The Pre_Connection_JITM instance.
	 *
	 * @var Pre_Connection_JITM
	 */
	private $jitm_instance;

	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\when( 'get_current_screen' )->justReturn( new \stdClass() );
		Functions\when( 'site_url' )->justReturn( 'unit-test' );
		Functions\when( 'wp_get_environment_type' )->justReturn( '' );
		Functions\when( 'get_option' )->justReturn( '' );
		Functions\when( '__' )->returnArg();

		$this->test_jitms = array(
			array(
				'id'             => 'test-jitm',
				'message_path'   => '/wp:plugins:admin_notices/',
				'message'        => __( 'A test message.', 'jetpack' ),
				'description'    => __( 'A test description.', 'jetpack' ),
				'button_link'    => 'a/test/url',
				'button_caption' => __( 'Test button text', 'jetpack' ),
			),
		);

		$this->jitm_instance = new Pre_Connection_JITM();
	}

	/**
	 * Tear down.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * The pre-connection JITMs are disabled when the current user does not have the 'install_plugins' capability.
	 */
	public function test_get_messages_user_cannot_install_plugins() {
		Functions\expect( 'current_user_can' )
			->once()
			->andReturn( false );

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->atMost()
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$this->assertEmpty( $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false ) );
	}

	/**
	 * The pre-connection JITMs are empty by default. The default value of the 'jetpack_pre_connection_jitms' filter is
	 * an empty array.
	 */
	public function test_get_messages_jitms_filter_default() {
		Functions\expect( 'current_user_can' )
			->atMost()
			->once()
			->andReturn( true );

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() );

		$this->assertEmpty( $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false ) );
	}

	/**
	 * The Pre_Connection_JITM::get_messages method returns an empty array when the the 'jetpack_pre_connection_jitms' filter
	 * returns anything other than an array.
	 */
	public function test_get_messages_filter_returns_string() {
		Functions\expect( 'current_user_can' )
			->atMost()
			->once()
			->andReturn( true );

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( 'a string intead of an array' );

		$this->assertEmpty( $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false ) );
	}

	/**
	 * The pre-connection JITMs are added using the `jetpack_pre_connection_jitms` filter.
	 */
	public function test_get_messages_return_message() {
		$this->set_user_cap_conditions();

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$messages = $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false );
		$this->assertSame( $this->test_jitms[0]['id'], $messages[0]->id );
	}

	/**
	 * A pre-connection JITM is only displayed if its message_path value matches the message path
	 * passed to Pre_Connection_JITM::get_messages. In this test, the test JITM's path does not match the
	 * tested path.
	 */
	public function test_get_messages_unmatched_message_path() {
		$this->set_user_cap_conditions();

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$this->assertEmpty( $this->jitm_instance->get_messages( '/wp:edit-comments:admin_notices/', '', false ) );
	}

	/**
	 * The pre-connection JITM is not displayed if the message array is missing a required key. In this test, the JITM is
	 * missing the message_path key.
	 */
	public function test_get_messages_missing_key() {
		$this->set_user_cap_conditions();

		unset( $this->test_jitms[0]['message_path'] );

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$this->assertEmpty( $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false ) );
	}

	/**
	 * A pre-connection JITM is displayed if it has unexpected keys.
	 */
	public function test_get_messages_extra_key() {
		$this->set_user_cap_conditions();

		$this->test_jitms[0]['extra_key'] = 'extra jitm key';

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$messages = $this->jitm_instance->get_messages( '/wp:plugins:admin_notices/', '', false );
		$this->assertSame( $this->test_jitms[0]['id'], $messages[0]->id );
	}

	/**
	 * Test the pre-connection JITM icon values.
	 *
	 * @param string|null $message_icon_value The message's icon value or null if it's doesn't have one.
	 * @param string      $expected_icon      The expected icon value input for the generate_icon method.
	 *
	 * @dataProvider data_provider_test_message_icon_values
	 */
	public function test_message_icon_values( $message_icon_value, $expected_icon ) {
		$this->set_user_cap_conditions();

		if ( null !== $message_icon_value ) {
			$this->test_jitms[0]['icon'] = $message_icon_value;
		}

		Filters\expectApplied( 'jetpack_pre_connection_jitms' )
			->once()
			->with( array() )
			->andReturn( $this->test_jitms );

		$jitm = \Mockery::mock( Pre_Connection_JITM::class )->makePartial();
		$jitm
			->expects( 'generate_icon' )
			->once()
			->with( $expected_icon, false );

		$jitm->get_messages( '/wp:plugins:admin_notices/', '', false );
	}

	/**
	 * Data provider for the test_message_icon_values method.
	 *
	 * @return array The test data. The structure of each test data element is:
	 *     { test data name } =>
	 *         array(
	 *             { the message's icon value, null if it doesn't have one },
	 *             { the expected icon value input for the generate_icon method },
	 *         )
	 */
	public function data_provider_test_message_icon_values() {
		return array(
			'default icon' => array(
				null,
				'jetpack',
			),
			'supported icon' => array(
				'woocommerce',
				'woocommerce',
			),
			'empty string' => array(
				'',
				'',
			),
			'unsupported icon' => array(
				'not_supported',
				'jetpack',
			),
		);
	}

	private function set_user_cap_conditions() {
		Functions\expect( 'current_user_can' )
			->once()
			->andReturn( true );
	}
}
