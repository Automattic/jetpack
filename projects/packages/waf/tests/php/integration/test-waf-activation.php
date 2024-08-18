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
	 * Return a 503 wpcom rules response.
	 *
	 * @return array
	 */
	public function return_503_response() {
		return array(
			'body'     => '',
			'response' => array(
				'code'    => 503,
				'message' => '',
			),
		);
	}

	/**
	 * Return an invalid filesystem method.
	 *
	 * @return string
	 */
	public function return_invalid_filesystem_method() {
		return 'Code is poetry.';
	}

	/**
	 * Test WAF activation.
	 */
	public function testActivation() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Initialize the firewall.
		$activated = Waf_Initializer::on_waf_activation();

		// Ensure the WAF was activated successfully.
		$this->assertTrue( $activated );

		// Ensure default options were set.
		$this->assertSame( true, get_option( Waf_Runner::SHARE_DATA_OPTION_NAME ) );
		$this->assertSame( 'normal', get_option( Waf_Runner::MODE_OPTION_NAME ) );
		$this->assertSame( false, get_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME ) );

		// Ensure the rule files were generated.
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Runner::ENTRYPOINT_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::AUTOMATIC_RULES_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::IP_ALLOW_RULES_FILE ) );
		$this->assertFileExists( Waf_Runner::get_waf_file_path( Waf_Rules_Manager::IP_BLOCK_RULES_FILE ) );

		// Ensure the bootstrap file was generated.
		$this->assertFileExists( ( new Waf_Standalone_Bootstrap() )->get_bootstrap_file_path() );

		// Clean up
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
	}

	/**
	 * Test WAF deactivation.
	 */
	public function testDeactivation() {
		$deactivated = Waf_Initializer::on_waf_deactivation();

		// Ensure the WAF was deactivated successfully.
		$this->assertTrue( $deactivated );

		// Ensure the options were deleted.
		$this->assertSame( false, get_option( Waf_Runner::SHARE_DATA_OPTION_NAME ) );
		$this->assertSame( false, get_option( Waf_Runner::MODE_OPTION_NAME ) );

		// Ensure the rules entrypoint file was emptied.
		$this->assertSame( "<?php\n", file_get_contents( Waf_Runner::get_waf_file_path( Waf_Runner::ENTRYPOINT_FILE ) ) );
	}

	/**
	 * Test WAF activation when the filesystem is unavailable.
	 */
	public function testActivationReturnsWpErrorWhenFilesystemUnavailable() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		// Break the filesystem.
		add_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );

		// Initialize the firewall.
		$activated = Waf_Initializer::on_waf_activation();

		// Validate the error.
		$this->assertTrue( is_wp_error( $activated ) );
		$this->assertSame( 'file_system_error', $activated->get_error_code() );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );
	}

	/**
	 * Test WAF deactivation when the filesystem is unavailable.
	 */
	public function testDeactivationWhenFilesystemUnavailable() {
		// Break the filesystem.
		add_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );

		// Deactivate the firewall.
		$deactivated = Waf_Initializer::on_waf_deactivation();

		// Validate the error.
		$this->assertTrue( is_wp_error( $deactivated ) );
		$this->assertSame( 'file_system_error', $deactivated->get_error_code() );

		// Clean up.
		remove_filter( 'filesystem_method', array( $this, 'return_invalid_filesystem_method' ) );
	}

	/**
	 * Test WAF activation when the rules API request fails.
	 */
	public function testActivationReturnsWpErrorWhenRulesApiRequestFails() {
		// Mock the WPCOM request for retrieving the automatic rules.
		add_filter( 'pre_http_request', array( $this, 'return_503_response' ) );

		// Initialize the firewall.
		$activated = Waf_Initializer::on_waf_activation();

		// Validate the error.
		$this->assertTrue( is_wp_error( $activated ) );
		$this->assertSame( 'rules_api_error', $activated->get_error_code() );

		// Clean up.
		remove_filter( 'pre_http_request', array( $this, 'return_503_response' ) );
	}
}
