<?php
/**
 * Test class for wpcom_register_core_query_block_patterns().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\TestCase;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/block-patterns/block-patterns.php';

/**
 * Class Wpcom_Core_Query_Block_Patterns_Test
 */
class Wpcom_Core_Query_Block_Patterns_Test extends TestCase {
	/**
	 * Unregister any core query patterns registered during a test.
	 *
	 * @after
	 */
	#[After]
	public function unregister_core_query_patterns() {
		foreach ( $this->get_registered_core_query_pattern_names() as $name ) {
			unregister_block_pattern( $name );
		}
	}

	/**
	 * Tests that the bundled core Query Loop patterns get registered.
	 */
	public function test_registers_bundled_query_patterns() {
		if ( ! file_exists( ABSPATH . WPINC . '/block-patterns/query-standard-posts.php' ) ) {
			$this->markTestSkipped( 'This WordPress copy does not bundle the core query patterns.' );
		}

		wpcom_register_core_query_block_patterns();

		$this->assertContains( 'core/query-standard-posts', $this->get_registered_core_query_pattern_names() );
	}

	/**
	 * Tests that every registered core query pattern has a `core/query` root block.
	 */
	public function test_registered_patterns_have_query_root_block() {
		wpcom_register_core_query_block_patterns();

		$registry = WP_Block_Patterns_Registry::get_instance();
		foreach ( $this->get_registered_core_query_pattern_names() as $name ) {
			$pattern = $registry->get_registered( $name );
			$blocks  = parse_blocks( trim( $pattern['content'] ) );
			$this->assertSame( 'core/query', $blocks[0]['blockName'], "Pattern $name does not have a core/query root block." );
		}
	}

	/**
	 * Tests that bundled patterns merely containing a query inside a wrapper are not registered.
	 */
	public function test_skips_group_wrapped_bundled_patterns() {
		if ( ! file_exists( ABSPATH . WPINC . '/block-patterns/query-offset-posts.php' ) ) {
			$this->markTestSkipped( 'This WordPress copy does not bundle the group-wrapped Offset query pattern.' );
		}

		wpcom_register_core_query_block_patterns();

		$this->assertNotContains( 'core/query-offset-posts', $this->get_registered_core_query_pattern_names() );
	}

	/**
	 * Tests that an already registered pattern is left untouched.
	 */
	public function test_does_not_overwrite_existing_registration() {
		register_block_pattern(
			'core/query-standard-posts',
			array(
				'title'   => 'Pre-existing',
				'content' => '<!-- wp:paragraph --><p>Pre-existing</p><!-- /wp:paragraph -->',
			)
		);

		wpcom_register_core_query_block_patterns();

		$pattern = WP_Block_Patterns_Registry::get_instance()->get_registered( 'core/query-standard-posts' );
		$this->assertSame( 'Pre-existing', $pattern['title'] );
	}

	/**
	 * Guards the hardcoded allowlist against drifting from core: if a
	 * WordPress update renames or removes the bundled query patterns to the
	 * point that none of the allowlisted files exist anymore, this fails
	 * instead of the Query Loop pattern picker silently going empty.
	 */
	public function test_registers_at_least_one_core_query_pattern() {
		wpcom_register_core_query_block_patterns();

		$this->assertNotEmpty(
			$this->get_registered_core_query_pattern_names(),
			'No core query pattern was registered. The bundled patterns likely changed; update the allowlist in wpcom_register_core_query_block_patterns().'
		);
	}

	/**
	 * Returns the names of all registered `core/query-*` patterns.
	 *
	 * @return string[]
	 */
	private function get_registered_core_query_pattern_names() {
		$names = array_column( WP_Block_Patterns_Registry::get_instance()->get_all_registered(), 'name' );
		return array_values(
			array_filter(
				$names,
				function ( $name ) {
					return str_starts_with( $name, 'core/query-' );
				}
			)
		);
	}
}
