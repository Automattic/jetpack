<?php
/**
 * Activation tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Waf_Initializer;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;
use Automattic\Jetpack\Waf\Waf_Standalone_Bootstrap;

/**
 * Integration tests for the firewall activation process.
 */
final class WafActivationTest extends WorDBless\BaseTestCase {

	/**
	 * Test setup.
	 */
	protected function set_up() {
		// Set a blog token and id so the site is connected.
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );

		// Set the WPCOM JSON API base URL so the site will attempt to make requests.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Return a sample wpcom rules response.
	 *
	 * @return array
	 */
	public function return_sample_response() {
		$sample_response = (object) array(
			'data' => "<?php\n", // empty rules file
		);

		return array(
			'body'     => wp_json_encode( $sample_response ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Test WAF activation.
	 */
	public function testActivation() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Initialize the firewall.
		$activated = Waf_Initializer::on_activation();

		// Ensure the WAF was activated successfully.
		$this->assertTrue( $activated );

		// Ensure default options were set.
		$this->assertSame( get_option( Waf_Runner::SHARE_DATA_OPTION_NAME ), true );
		$this->assertSame( get_option( Waf_Runner::MODE_OPTION_NAME ), 'normal' );
		$this->assertSame( get_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME ), false );

		// Ensure the rule files were generated.
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::AUTOMATIC_RULES_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::IP_ALLOW_RULES_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::IP_BLOCK_RULES_FILE ) );

		// Ensure the bootstrap file was generated.
		$this->assertFileExists( ( new Waf_Standalone_Bootstrap() )->get_bootstrap_file_path() );

		// Clean up
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
	}

}
