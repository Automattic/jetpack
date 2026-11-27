<?php
/**
 * Tests for WPCOM_JSON_API_Endpoint::input() with form-encoded bodies near max_input_vars.
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=Jetpack_Json_Api_Input_Max_Input_Vars_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Form-encoded input parsing around the max_input_vars limit.
 *
 * @covers \WPCOM_JSON_API_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Endpoint::class )]
class Jetpack_Json_Api_Input_Max_Input_Vars_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Original post body of the shared WPCOM_JSON_API instance.
	 *
	 * @var mixed
	 */
	private $original_post_body;

	/**
	 * Original content type of the shared WPCOM_JSON_API instance.
	 *
	 * @var mixed
	 */
	private $original_content_type;

	/**
	 * Save the shared API state the tests change.
	 */
	public function set_up() {
		parent::set_up();
		$api                         = WPCOM_JSON_API::init();
		$this->original_post_body    = $api->post_body;
		$this->original_content_type = $api->content_type;
	}

	/**
	 * Restore the shared API state.
	 */
	public function tear_down() {
		$api               = WPCOM_JSON_API::init();
		$api->post_body    = $this->original_post_body;
		$api->content_type = $this->original_content_type;
		parent::tear_down();
	}

	/**
	 * Parse $body as a form-encoded POST body, without casting, and collect any PHP warnings.
	 *
	 * @param string $body Request body.
	 * @return array { 0: parsed input, 1: list of warning messages }
	 */
	private function parse( $body ) {
		$endpoint                    = new Jetpack_JSON_API_Dummy_Input_Endpoint( array( 'stat' => 'dummy' ) );
		$endpoint->api->post_body    = $body;
		$endpoint->api->content_type = 'application/x-www-form-urlencoded';

		$warnings = array();
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler(
			function ( $errno, $errstr ) use ( &$warnings ) {
				$warnings[] = $errstr;
				return true;
			},
			E_WARNING
		);
		try {
			$input = $endpoint->input( false, false );
		} finally {
			restore_error_handler();
		}

		return array( $input, $warnings );
	}

	/**
	 * A body of $count variables.
	 *
	 * @param int $count Number of key=value pairs.
	 * @return string
	 */
	private function body_with_vars( $count ) {
		$pairs = array();
		for ( $i = 0; $i < $count; $i++ ) {
			$pairs[] = "k{$i}=v";
		}
		return implode( '&', $pairs );
	}

	/**
	 * Normal input parses unchanged.
	 */
	#[Group( 'json-api' )]
	public function test_normal_input_parses_unchanged() {
		list( $input, $warnings ) = $this->parse( 'title=Hello&status=draft' );

		$this->assertSame(
			array(
				'title'  => 'Hello',
				'status' => 'draft',
			),
			$input
		);
		$this->assertSame( array(), $warnings );
	}

	/**
	 * A body with exactly max_input_vars variables still parses in full.
	 */
	#[Group( 'json-api' )]
	public function test_input_at_the_limit_parses() {
		$limit                    = (int) ini_get( 'max_input_vars' );
		list( $input, $warnings ) = $this->parse( $this->body_with_vars( $limit ) );

		$this->assertCount( $limit, $input );
		$this->assertSame( array(), $warnings );
	}

	/**
	 * One variable over the limit is rejected as a whole, without a PHP warning.
	 */
	#[Group( 'json-api' )]
	public function test_input_over_the_limit_is_rejected_without_warning() {
		$limit                    = (int) ini_get( 'max_input_vars' );
		list( $input, $warnings ) = $this->parse( $this->body_with_vars( $limit + 1 ) );

		$this->assertSame( array(), $input );
		$this->assertSame( array(), $warnings );
	}
}

/**
 * Dummy endpoint for testing input().
 */
class Jetpack_JSON_API_Dummy_Input_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * Dummy result.
	 */
	public function result() {
		return 'success';
	}
}
