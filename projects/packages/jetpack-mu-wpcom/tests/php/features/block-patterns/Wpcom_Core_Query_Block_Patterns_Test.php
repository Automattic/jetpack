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
	 * Guards the hardcoded allowlist against drifting from core.
	 *
	 * Derives the expected set from this WordPress copy itself: the `query-*`
	 * slugs core lists in wp-includes/block-patterns.php, narrowed to the ones
	 * with a `core/query` root block. Fails when a WordPress update adds,
	 * renames, delists, or removes a bundled query pattern, so a human can
	 * update (or deliberately not update) the allowlist.
	 */
	public function test_allowlist_stays_in_sync_with_core() {
		$core_registration_source = file_get_contents( ABSPATH . WPINC . '/block-patterns.php' );
		preg_match_all( "/'(query-[\w-]+)'/", $core_registration_source, $matches );

		$expected = array();
		foreach ( array_unique( $matches[1] ) as $slug ) {
			$file = ABSPATH . WPINC . '/block-patterns/' . $slug . '.php';
			if ( ! file_exists( $file ) ) {
				continue;
			}
			$pattern = require $file;
			if ( is_array( $pattern ) && str_starts_with( trim( $pattern['content'] ?? '' ), '<!-- wp:query ' ) ) {
				$expected[] = 'core/' . $slug;
			}
		}
		sort( $expected );

		wpcom_register_core_query_block_patterns();
		$registered = $this->get_registered_core_query_pattern_names();
		sort( $registered );

		$this->assertSame(
			$expected,
			$registered,
			'The query patterns bundled and registered by core changed. Update the allowlist in wpcom_register_core_query_block_patterns(), or exclude the new pattern here if it should not be offered.'
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
