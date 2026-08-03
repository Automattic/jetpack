<?php
/**
 * Tests for Inline_Search_Correction.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use WorDBless\BaseTestCase;

/**
 * Inline_Search_Correction test cases.
 */
class Inline_Search_Correction_Test extends BaseTestCase {
	/**
	 * Correction instance under test.
	 *
	 * @var Inline_Search_Correction
	 */
	private $correction;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->correction = new Inline_Search_Correction();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		global $wp_query;
		$wp_query = null;

		// Inline_Search::instance() is a process-wide singleton; clear it so later
		// tests don't see this fixture's search_result / pre_get_posts hooks.
		$instance_prop = new \ReflectionProperty( Inline_Search::class, 'instance' );
		// setAccessible() became a no-op in PHP 8.1 and was deprecated in 8.5;
		// only call it on older versions where it is still required.
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_prop->setAccessible( true );
		}
		$instance = $instance_prop->getValue();
		if ( $instance ) {
			$correction_prop = new \ReflectionProperty( Inline_Search::class, 'correction' );
			if ( PHP_VERSION_ID < 80100 ) {
				$correction_prop->setAccessible( true );
			}
			$correction = $correction_prop->getValue( $instance );
			if ( $correction ) {
				remove_action( 'pre_get_posts', array( $correction, 'setup_corrected_query_hooks' ) );
			}
		}
		$instance_prop->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Seed Inline_Search's cached API response and the main query's `s` var.
	 *
	 * @param string $original_query Original search string from ?s=.
	 * @param array  $search_result  Mock Instant Search API response.
	 */
	private function seed_search_state( $original_query, $search_result ) {
		global $wp_query;

		$wp_query = new \WP_Query();
		$wp_query->set( 's', $original_query );

		$search     = Inline_Search::instance( 1 );
		$reflection = new \ReflectionProperty( Classic_Search::class, 'search_result' );
		// setAccessible() became a no-op in PHP 8.1 and was deprecated in 8.5;
		// only call it on older versions where it is still required.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( $search, $search_result );
	}

	/**
	 * Corrected-query payload used by the notice.
	 *
	 * @return array
	 */
	private function corrected_result_fixture() {
		return array(
			'corrected_query' => 'hello',
			'results'         => array(
				array(
					'fields' => array( 'post_id' => 1 ),
				),
			),
		);
	}

	/**
	 * Message is plain text and includes the original query literally.
	 */
	public function test_get_corrected_query_message_includes_original_query() {
		$this->seed_search_state( 'typo', $this->corrected_result_fixture() );

		$message = $this->correction->get_corrected_query_message();

		$this->assertSame( 'No results for "typo"', $message );
	}

	/**
	 * XSS payload in ?s= must remain literal text in the localized message —
	 * never HTML-escaped entities that wp_localize_script would decode, and
	 * never pre-built markup for insertAdjacentHTML.
	 */
	public function test_get_corrected_query_message_keeps_xss_payload_as_plain_text() {
		$xss_payload = '<img src=x onerror=alert(1)>';
		$this->seed_search_state( $xss_payload, $this->corrected_result_fixture() );

		$message = $this->correction->get_corrected_query_message();

		$this->assertStringContainsString( $xss_payload, $message );
		$this->assertStringNotContainsString( '&lt;', $message );
		$this->assertStringNotContainsString( '<p', $message );
		$this->assertStringNotContainsString( 'jetpack-search-corrected-query', $message );
	}

	/**
	 * JSON_HEX_TAG encoding must escape angle brackets for safe script embedding.
	 */
	public function test_corrected_query_json_escapes_angle_brackets_for_script_context() {
		$xss_payload = '<img src=x onerror=alert(1)>';
		$this->seed_search_state( $xss_payload, $this->corrected_result_fixture() );

		$message = $this->correction->get_corrected_query_message();
		$json    = wp_json_encode(
			array( 'message' => $message ),
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES
		);

		$this->assertIsString( $json );
		$this->assertStringNotContainsString( '<', $json );
		$this->assertStringContainsString( '\u003C', $json );
	}

	/**
	 * No notice when the API did not return a corrected query.
	 */
	public function test_get_corrected_query_message_empty_without_correction() {
		$this->seed_search_state(
			'hello',
			array(
				'corrected_query' => false,
				'results'         => array(
					array(
						'fields' => array( 'post_id' => 1 ),
					),
				),
			)
		);

		$this->assertSame( '', $this->correction->get_corrected_query_message() );
	}
}
