<?php
/**
 * Title optimization ability tests.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredClassInCallable, PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- WP_Ability class from Abilities API (WP 6.9+).

use Automattic\Jetpack\Extensions\AIAssistant\Title_Optimization_Ability;

require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/ai-assistant/class-title-optimization-ability.php';

/**
 * Tests the title optimization ability.
 */
class Title_Optimization_Ability_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test ability registration.
	 */
	public function test_registers_title_optimization_ability() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'WordPress Abilities API is not available.' );
		}

		Title_Optimization_Ability::init();
		do_action( 'wp_abilities_api_categories_init' );
		do_action( 'wp_abilities_api_init' );

		$abilities = wp_get_abilities();
		$found     = false;
		foreach ( $abilities as $ability ) {
			$name = method_exists( $ability, 'get_name' ) ? call_user_func( array( $ability, 'get_name' ) ) : '';
			if ( $name === Title_Optimization_Ability::ABILITY_NAME ) {
				$found = true;
				break;
			}
		}

		$this->assertTrue( $found, 'The title optimization ability should be registered.' );
	}

	/**
	 * Test that execute returns structured message data (not an orchestrator response).
	 */
	public function test_execute_returns_structured_message() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content'  => 'Example post body content.',
				'keywords' => 'seo, title',
				'post_id'  => 10,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'jetpack-ai', $result['role'] );
		$this->assertSame( 'title-optimization', $result['context']['type'] );
		$this->assertSame( 'Example post body content.', $result['context']['content'] );
		$this->assertSame( 'seo, title', $result['context']['keywords'] );
		$this->assertSame( 10, $result['context']['post_id'] );
	}

	/**
	 * Test that execute does NOT make any HTTP request (no orchestrator call).
	 */
	public function test_execute_does_not_make_http_request() {
		$http_called = false;

		add_filter(
			'pre_http_request',
			function () use ( &$http_called ) {
				$http_called = true;
				return new WP_Error( 'unexpected', 'No HTTP request expected.' );
			}
		);

		$result = Title_Optimization_Ability::execute(
			array(
				'content' => 'Some content.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertFalse( $http_called, 'execute() should not make any HTTP request.' );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test execution validation for empty content.
	 */
	public function test_execute_requires_content() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content' => '',
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'jetpack_ai_title_optimization_invalid_content', $result->get_error_code() );
	}

	/**
	 * Test execution validation when content key is missing entirely.
	 */
	public function test_execute_requires_content_key() {
		$result = Title_Optimization_Ability::execute( array() );

		$this->assertWPError( $result );
		$this->assertSame( 'jetpack_ai_title_optimization_invalid_content', $result->get_error_code() );
	}

	/**
	 * Test that post_id is omitted from result when not provided.
	 */
	public function test_execute_omits_post_id_when_zero() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content' => 'Some post content.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertArrayNotHasKey( 'post_id', $result['context'] );
	}

	/**
	 * Test that post_id is included in result when provided.
	 */
	public function test_execute_includes_post_id_when_provided() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content' => 'Some post content.',
				'post_id' => 42,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 42, $result['context']['post_id'] );
	}

	/**
	 * Test that keywords default to empty string when not provided.
	 */
	public function test_execute_defaults_keywords_to_empty() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content' => 'Some post content.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( '', $result['context']['keywords'] );
	}

	/**
	 * Test that content is sanitised.
	 */
	public function test_execute_sanitises_content() {
		$result = Title_Optimization_Ability::execute(
			array(
				'content' => '<script>alert("xss")</script>Some content.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertStringNotContainsString( '<script>', $result['context']['content'] );
	}

	/**
	 * Test constants match the orchestrator contract.
	 */
	public function test_constants_match_orchestrator_contract() {
		$this->assertSame( 'wpcom/optimize-title', Title_Optimization_Ability::ABILITY_NAME );
		$this->assertSame( 'jetpack-ai-title-optimization', Title_Optimization_Ability::FEATURE_NAME );
		$this->assertSame( 'jetpack-ai', Title_Optimization_Ability::CATEGORY_SLUG );
	}
}
