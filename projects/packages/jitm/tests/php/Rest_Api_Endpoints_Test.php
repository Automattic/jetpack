<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\JITMS\Rest_Api_Endpoints;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Rest_Api_Endpoints_Test extends TestCase {
	use MockeryPHPUnitIntegration;

	/**
	 * @var \Mockery\MockInterface
	 */
	private $mock_jitm;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\when( 'urldecode_deep' )->returnArg( 1 );
		$this->mock_jitm = \Mockery::mock( 'overload:' . JITM::class );
		$this->mock_jitm->shouldReceive( 'get_instance' )->andReturnSelf();
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test that get_jitm_message returns empty array when JITMs are disabled.
	 */
	public function test_get_jitm_message_returns_empty_when_disabled() {
		$this->mock_jitm->shouldReceive( 'jitms_enabled' )->once()->andReturn( false );
		$this->mock_jitm->shouldNotReceive( 'get_messages' );

		$request = $this->create_mock_request( 'test_path', '' );

		$result = Rest_Api_Endpoints::get_jitm_message( $request );

		$this->assertSame( array(), $result );
	}

	/**
	 * Test that get_jitm_message passes empty array when query is empty.
	 */
	public function test_get_jitm_message_with_empty_query() {
		$this->mock_jitm->shouldReceive( 'jitms_enabled' )->once()->andReturn( true );
		$this->mock_jitm->shouldReceive( 'get_messages' )
			->once()
			->with( 'test_path', array(), false )
			->andReturn( array( 'test_message' ) );

		$request = $this->create_mock_request( 'test_path', '' );

		$result = Rest_Api_Endpoints::get_jitm_message( $request );

		$this->assertSame( array( 'test_message' ), $result );
	}

	/**
	 * Test that get_jitm_message correctly parses query string into array.
	 */
	public function test_get_jitm_message_parses_query_string() {
		$this->mock_jitm->shouldReceive( 'jitms_enabled' )->once()->andReturn( true );
		$this->mock_jitm->shouldReceive( 'get_messages' )
			->once()
			->with(
				'woomobile:my_store:admin_notices',
				array(
					'platform' => 'ios',
					'device'   => 'phone',
					'version'  => '24.0',
				),
				false
			)
			->andReturn( array( 'pos_jitm' ) );

		$request = $this->create_mock_request(
			'woomobile:my_store:admin_notices',
			'platform=ios&device=phone&version=24.0'
		);

		$result = Rest_Api_Endpoints::get_jitm_message( $request );

		$this->assertSame( array( 'pos_jitm' ), $result );
	}

	/**
	 * Test that get_jitm_message handles URL-encoded query strings.
	 */
	public function test_get_jitm_message_handles_url_encoded_query() {
		$this->mock_jitm->shouldReceive( 'jitms_enabled' )->once()->andReturn( true );
		$this->mock_jitm->shouldReceive( 'get_messages' )
			->once()
			->with(
				'test_path',
				array(
					'key'   => 'value with spaces',
					'other' => 'test',
				),
				false
			)
			->andReturn( array() );

		// URL-encoded: key=value%20with%20spaces&other=test
		$request = $this->create_mock_request( 'test_path', 'key=value%20with%20spaces&other=test' );

		Rest_Api_Endpoints::get_jitm_message( $request );
	}

	/**
	 * Test that full_jp_logo_exists parameter is correctly passed.
	 */
	public function test_get_jitm_message_passes_logo_exists_param() {
		$this->mock_jitm->shouldReceive( 'jitms_enabled' )->once()->andReturn( true );
		$this->mock_jitm->shouldReceive( 'get_messages' )
			->once()
			->with( 'test_path', array(), true )
			->andReturn( array() );

		$request = $this->create_mock_request( 'test_path', '', 'true' );

		Rest_Api_Endpoints::get_jitm_message( $request );
	}

	/**
	 * Create a mock WP_REST_Request with the given parameters.
	 *
	 * @param string $message_path The message path.
	 * @param string $query The query string.
	 * @param string $full_jp_logo_exists Whether the full JP logo exists.
	 * @return \WP_REST_Request Mock request object.
	 */
	private function create_mock_request( $message_path, $query, $full_jp_logo_exists = 'false' ) {
		$request = \Mockery::mock( 'WP_REST_Request, ArrayAccess' );
		$request->shouldReceive( 'offsetGet' )->with( 'message_path' )->andReturn( $message_path );
		$request->shouldReceive( 'offsetGet' )->with( 'query' )->andReturn( $query );
		$request->shouldReceive( 'offsetGet' )->with( 'full_jp_logo_exists' )->andReturn( $full_jp_logo_exists );
		$request->shouldReceive( 'offsetExists' )->andReturn( true );
		// @phan-suppress-next-line PhanTypeMismatchReturn -- Mockery mock satisfies WP_REST_Request interface.
		return $request;
	}
}
