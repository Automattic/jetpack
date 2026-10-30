<?php
/**
 * WP-CLI command tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\CLI;
use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Initializer;
use Automattic\Jetpack\Waf\Waf_Runner;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once __DIR__ . '/stubs/wp-cli.php';

/**
 * Integration tests for the jetpack-waf WP-CLI command.
 */
final class WafCliTest extends WorDBless\BaseTestCase {

	/**
	 * Connect the site, mock the rules API, and make "waf" available as the plugins do.
	 */
	protected function set_up() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_modules' ) );
		Waf_Initializer::init();
		Waf_Constants::define_entrypoint();
	}

	/**
	 * Remove the test filters.
	 */
	protected function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_modules' ) );
		remove_filter( 'jetpack_active_modules', array( $this, 'add_waf_to_modules' ) );
	}

	/**
	 * Return an empty rules file from the rules API.
	 *
	 * @return array
	 */
	public function return_sample_response() {
		return array(
			'body'     => wp_json_encode( array( 'data' => "<?php\n" ), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Add "waf" to a list of modules.
	 *
	 * @param array $modules Module slugs.
	 * @return array Module slugs, including "waf".
	 */
	public function add_waf_to_modules( $modules ) {
		$modules[] = Waf_Runner::WAF_MODULE_NAME;
		return array_unique( $modules );
	}

	/**
	 * Teardown must turn the module off, not only empty the rules.
	 */
	public function testTeardownDeactivatesTheModule() {
		Waf_Runner::enable();
		$this->assertTrue( Waf_Runner::is_enabled() );

		( new CLI() )->teardown();

		$this->assertFalse( Waf_Runner::is_enabled() );
		$this->assertFalse( get_option( Waf_Runner::MODE_OPTION_NAME ) );
	}

	/**
	 * Teardown must not stay silent when something keeps the module on.
	 */
	public function testTeardownWarnsWhenTheModuleStaysActive() {
		add_filter( 'jetpack_active_modules', array( $this, 'add_waf_to_modules' ) );
		$this->expectOutputRegex( '/^Warning: The firewall module is still active/' );

		( new CLI() )->teardown();
	}

	/**
	 * Setup with a bad mode must fail before it turns anything on.
	 */
	public function testSetupWithAnInvalidModeChangesNothing() {
		try {
			( new CLI() )->setup( array( 'bogus' ) );
			$this->fail( 'Expected setup to error.' );
		} catch ( RuntimeException $e ) {
			$this->assertFalse( Waf_Runner::is_enabled() );
		}
	}

	/**
	 * Setup must say so when the module cannot be turned on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function testSetupWarnsWhenTheModuleCannotBeTurnedOn() {
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_modules' ) );
		$this->expectOutputRegex( '/Warning: The firewall module could not be turned on/' );

		( new CLI() )->setup( array( 'normal' ) );
	}

	/**
	 * Setup after teardown must turn the module back on and keep the requested mode.
	 * Separate process: setup() defines WAF_CLI_MODE, which would leak into later tests.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function testSetupAfterTeardownTurnsTheModuleBackOn() {
		Waf_Runner::enable();
		( new CLI() )->teardown();

		( new CLI() )->setup( array( 'silent' ) );

		$this->assertTrue( Waf_Runner::is_enabled() );
		$this->assertSame( 'silent', get_option( Waf_Runner::MODE_OPTION_NAME ) );
	}
}
