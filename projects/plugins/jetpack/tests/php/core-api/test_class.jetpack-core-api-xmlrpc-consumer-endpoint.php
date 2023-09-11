<?php
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';

class WP_Test_Jetpack_Core_Api_Xmlrpc_Consumer_Endpoint extends WP_UnitTestCase {
	/**
	 * @author zinigor
	 * @covers Jetpack_Core_API_XMLRPC_Consumer_Endpoint
	 * @dataProvider true_false_provider
	 */
	public function test_Jetpack_Core_API_XMLRPC_Consumer_Endpoint_privacy_check( $query_success, $result ) {
		$xmlrpc_mock = $this->getMockBuilder( 'Jetpack_IXR_Client' )
					->setMethods( array( 'query', 'getResponse' ) )
					->getMock();

		$endpoint = new WP_Test_Dummy_Xmlrpc_Consumer_Endpoint( $xmlrpc_mock );

		$xmlrpc_mock->expects( $this->once() )
			->method( 'query' )
			->with( 'jetpack.isSitePubliclyAccessible', home_url() )
			->willReturn( $query_success );

		if ( $query_success ) {
			$xmlrpc_mock->expects( $this->once() )
				->method( 'getResponse' )
				->willReturn( $result );
		} else {
			$xmlrpc_mock->expects( $this->never() )
				->method( 'getResponse' );
		}

		$this->assertEquals( $result, $endpoint->process( null ) );
	}

	public function true_false_provider() {
		return array(
			array( true, true ),
			array( true, false ),
			array( false, false ),
		);
	}

}

/**
 * Dummy testing class that will extend the testable endpoint and try to execute a privacy check
 * phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class WP_Test_Dummy_Xmlrpc_Consumer_Endpoint extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	public function __construct( $xmlrpc ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found
		parent::__construct( $xmlrpc );
	}

	public function process( $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// Running a protected method in order to test that it's doing what it needs to do
		return $this->is_site_public();
	}
}
