<?php
/**
 * Classic Search test cases.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Classic Search test cases.
 */
class Classic_Search_Test extends TestCase {

	/**
	 * Restore global query state after each test.
	 *
	 * @var \WP_Query|null
	 */
	private $original_query;

	/**
	 * Classic Search instance under test.
	 *
	 * @var Classic_Search|null
	 */
	private $search;

	/**
	 * Set up test state.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_classic_search_singleton();
		$this->original_query           = $GLOBALS['wp_query'] ?? null;
		$GLOBALS['wp_query']            = new \WP_Query( array( 's' => 'boots' ) );
		$GLOBALS['wp_the_query']        = $GLOBALS['wp_query'];
		$GLOBALS['wp_query']->is_search = true;

		update_option( 'jetpack_active_modules', array( 'search' ) );
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->search = Classic_Search::instance( '999' );
	}

	/**
	 * Tear down test state.
	 */
	public function tearDown(): void {
		wp_dequeue_script( 'jetpack-search-ai-answers' );
		wp_deregister_script( 'jetpack-search-ai-answers' );
		if ( $this->search ) {
			remove_action( 'wp_enqueue_scripts', array( $this->search, 'enqueue_search_suggestions' ) );
			remove_action( 'wp_enqueue_scripts', array( $this->search, 'enqueue_ai_answers' ) );
		}
		$GLOBALS['wp_query']     = $this->original_query;
		$GLOBALS['wp_the_query'] = $this->original_query;
		$this->reset_classic_search_singleton();
		parent::tearDown();
	}

	/**
	 * Theme-mode AI Answers should not enqueue for embedded search pages.
	 */
	public function test_enqueue_ai_answers_does_not_enqueue_when_experience_is_embedded() {
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		$this->search->enqueue_ai_answers();

		$this->assertFalse( wp_script_is( 'jetpack-search-ai-answers', 'enqueued' ) );
	}

	/**
	 * Theme-mode AI Answers should enqueue for the inline/theme experience.
	 */
	public function test_enqueue_ai_answers_enqueues_when_experience_is_inline() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );

		$this->search->enqueue_ai_answers();

		$this->assertTrue( wp_script_is( 'jetpack-search-ai-answers', 'enqueued' ) );
	}

	/**
	 * Reset the Classic Search singleton between tests.
	 */
	private function reset_classic_search_singleton(): void {
		$reflection = new \ReflectionClass( Classic_Search::class );
		$property   = $reflection->getProperty( 'instance' );
		$property->setAccessible( true );
		$property->setValue( null, null );
	}
}
